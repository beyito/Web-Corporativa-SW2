"""Chat del sitio: el agente IA atiende y, a pedido, una persona del equipo toma la conversación."""
from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import correo
from app.agente.agente import RESPUESTAS_FIJAS, responder
from app.config import settings
from app.db import get_db
from app.models import ChatMensaje, ChatSesion, ahora
from app.schemas import ChatDatosIn, ChatEstadoOut, ChatInicioIn, ChatMensajeIn, ChatSesionOut
from app.seguridad import LimitePeticiones

router = APIRouter(prefix="/api/chat", tags=["chat"])
limite_chat = LimitePeticiones(maximo=30, segundos=60)
limite_sesiones = LimitePeticiones(maximo=10, segundos=600)


def _sesion(sesion_id: str, token: str | None, db: Session) -> ChatSesion:
    s = db.get(ChatSesion, sesion_id)
    if not s or not token or s.token != token:
        raise HTTPException(404, "Conversación no encontrada")
    return s


def _nuevos(db: Session, sesion_id: str, desde: int) -> list[ChatMensaje]:
    return list(db.scalars(select(ChatMensaje).where(ChatMensaje.sesion_id == sesion_id, ChatMensaje.id > desde)
                           .order_by(ChatMensaje.id)))


def _avisar_equipo(sesion_id: str) -> None:
    if settings.correo_equipo:
        correo.enviar([settings.correo_equipo], "[Chat] Un visitante pide hablar con una persona",
                      f"Conversación {sesion_id}: atiéndela desde el panel.\n{settings.sitio_url}/panel/chats")


def pasar_a_persona(s: ChatSesion, db: Session, tareas: BackgroundTasks) -> None:
    if s.estado == "AGENTE":
        s.estado = "ESPERANDO"
        db.add(ChatMensaje(sesion_id=s.id, autor="SISTEMA", texto=RESPUESTAS_FIJAS["humano"][s.idioma], origen="traspaso"))
        tareas.add_task(_avisar_equipo, s.id)


@router.post("", response_model=ChatSesionOut, status_code=201, dependencies=[Depends(limite_sesiones)])
def iniciar(datos: ChatInicioIn, db: Session = Depends(get_db)):
    s = ChatSesion(idioma=datos.idioma)
    db.add(s)
    db.flush()
    db.add(ChatMensaje(sesion_id=s.id, autor="AGENTE", texto=RESPUESTAS_FIJAS["saludo"][datos.idioma],
                       origen="base_conocimiento"))
    db.commit()
    return ChatSesionOut(id=s.id, token=s.token, estado=s.estado, mensajes=_nuevos(db, s.id, 0))


@router.get("/{sesion_id}", response_model=ChatEstadoOut)
def consultar(sesion_id: str, desde: int = Query(0, ge=0), x_chat_token: str | None = Header(None),
              db: Session = Depends(get_db)):
    s = _sesion(sesion_id, x_chat_token, db)
    return ChatEstadoOut(estado=s.estado, atendida_por=s.atendida_por, mensajes=_nuevos(db, s.id, desde))


@router.post("/{sesion_id}/mensajes", response_model=ChatEstadoOut, dependencies=[Depends(limite_chat)])
def enviar(sesion_id: str, datos: ChatMensajeIn, tareas: BackgroundTasks, x_chat_token: str | None = Header(None),
           db: Session = Depends(get_db)):
    s = _sesion(sesion_id, x_chat_token, db)
    if s.estado == "CERRADA":
        raise HTTPException(409, "La conversación está cerrada")
    texto = datos.texto.strip()
    visitante = ChatMensaje(sesion_id=s.id, autor="VISITANTE", texto=texto)
    db.add(visitante)
    db.flush()
    if s.estado == "AGENTE":
        historial = [(m.autor, m.texto) for m in s.mensajes if m.autor in ("VISITANTE", "AGENTE") and m.id != visitante.id]
        r = responder(texto, s.idioma, historial)
        if r.pide_humano:
            pasar_a_persona(s, db, tareas)
        else:
            db.add(ChatMensaje(sesion_id=s.id, autor="AGENTE", texto=r.texto, origen=r.origen))
    s.actualizado = ahora()
    db.commit()
    return ChatEstadoOut(estado=s.estado, atendida_por=s.atendida_por, mensajes=_nuevos(db, s.id, visitante.id - 1))


@router.post("/{sesion_id}/persona", response_model=ChatEstadoOut)
def pedir_persona(sesion_id: str, tareas: BackgroundTasks, desde: int = Query(0, ge=0),
                  x_chat_token: str | None = Header(None), db: Session = Depends(get_db)):
    s = _sesion(sesion_id, x_chat_token, db)
    pasar_a_persona(s, db, tareas)
    db.commit()
    return ChatEstadoOut(estado=s.estado, atendida_por=s.atendida_por, mensajes=_nuevos(db, s.id, desde))


@router.post("/{sesion_id}/datos")
def dejar_datos(sesion_id: str, datos: ChatDatosIn, x_chat_token: str | None = Header(None), db: Session = Depends(get_db)):
    s = _sesion(sesion_id, x_chat_token, db)
    s.nombre = datos.nombre or s.nombre
    s.email = str(datos.email) if datos.email else s.email
    db.commit()
    return {"ok": True}

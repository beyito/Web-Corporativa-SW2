"""Canal de WhatsApp del chat: el mismo agente del sitio (base de conocimiento → modelo → persona) atiende por WhatsApp.

Meta llama al webhook: GET para verificarlo una sola vez y POST con cada mensaje entrante. Se responde 200 de
inmediato y el mensaje se procesa en segundo plano (el modelo puede tardar unos segundos).
"""
import json
import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy import select

from app import whatsapp
from app.agente.agente import RESPUESTAS_FIJAS, responder
from app.config import settings
from app.db import SessionLocal
from app.models import ChatMensaje, ChatSesion, WhatsappContacto, WhatsappMensajeRecibido, ahora
from app.rutas import chat as chat_web

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])

SOLO_TEXTO = "Por ahora solo puedo leer mensajes de texto. ¿En qué te ayudo?"


@router.get("/contacto")
def contacto():
    """Número público del bot para el botón del sitio (sin datos sensibles). Si el canal está apagado, no se muestra."""
    numero = whatsapp.numero_publico()
    return {"disponible": bool(numero), "numero": numero}


@router.get("/webhook", response_class=PlainTextResponse)
def verificar(modo: str = Query("", alias="hub.mode"), token: str = Query("", alias="hub.verify_token"),
              desafio: str = Query("", alias="hub.challenge")):
    if settings.whatsapp_verify_token and modo == "subscribe" and token == settings.whatsapp_verify_token:
        return desafio
    raise HTTPException(403, "Verificación rechazada")


@router.post("/webhook")
async def recibir(request: Request, tareas: BackgroundTasks):
    cuerpo = await request.body()
    if not whatsapp.firma_valida(cuerpo, request.headers.get("X-Hub-Signature-256")):
        raise HTTPException(403, "Firma inválida")
    try:
        datos = json.loads(cuerpo or b"{}")
    except ValueError:
        raise HTTPException(400, "Cuerpo inválido")
    for entrada in datos.get("entry", []):
        for cambio in entrada.get("changes", []):
            valor = cambio.get("value", {})
            perfiles = {c.get("wa_id"): c.get("profile", {}).get("name") for c in valor.get("contacts", [])}
            for m in valor.get("messages", []):  # los «statuses» (enviado, leído) se ignoran
                tareas.add_task(atender_mensaje, m, perfiles.get(m.get("from")))
    return {"ok": True}


class _Inmediato:
    """Sustituye a BackgroundTasks dentro de la tarea: ejecuta el aviso al equipo en el momento."""
    def add_task(self, funcion, *args, **kwargs):
        funcion(*args, **kwargs)


def _sesion_de(db, numero: str, perfil: str | None) -> ChatSesion:
    contacto = db.get(WhatsappContacto, numero)
    s = db.get(ChatSesion, contacto.sesion_id) if contacto else None
    if s is None or s.estado == "CERRADA":   # conversación nueva si no hay o si el equipo la cerró
        s = ChatSesion(idioma="es", nombre=f"{perfil or 'Cliente'} · WhatsApp +{numero}")
        db.add(s)
        db.flush()
        if contacto:
            contacto.sesion_id = s.id
        else:
            contacto = WhatsappContacto(numero=numero, sesion_id=s.id)
            db.add(contacto)
    contacto.perfil, contacto.actualizado = perfil or contacto.perfil, ahora()
    return s


def atender_mensaje(m: dict, perfil: str | None) -> None:
    numero, mid = m.get("from", ""), m.get("id", "")
    if not numero or not mid:
        return
    with SessionLocal() as db:
        if db.get(WhatsappMensajeRecibido, mid):   # reenvío de Meta: ya se atendió
            return
        db.add(WhatsappMensajeRecibido(id=mid))
        s = _sesion_de(db, numero, perfil)
        texto = (m.get("text") or {}).get("body", "").strip() if m.get("type") == "text" else ""
        visitante = ChatMensaje(sesion_id=s.id, autor="VISITANTE", texto=texto or f"[{m.get('type', 'mensaje')} de WhatsApp]")
        db.add(visitante)
        db.flush()
        respuesta = None
        if not texto:
            respuesta = SOLO_TEXTO
        elif s.estado == "AGENTE":
            historial = [(x.autor, x.texto) for x in s.mensajes
                         if x.autor in ("VISITANTE", "AGENTE") and x.id != visitante.id][-10:]
            r = responder(texto, s.idioma, historial)
            if r.pide_humano:
                chat_web.pasar_a_persona(s, db, _Inmediato())
                respuesta = RESPUESTAS_FIJAS["humano"][s.idioma]
                _avisar_admin(numero, perfil, texto)
            else:
                respuesta = r.texto
                db.add(ChatMensaje(sesion_id=s.id, autor="AGENTE", texto=r.texto, origen=f"whatsapp:{r.origen}"))
        # ESPERANDO / HUMANO: no responde el agente; la persona del equipo contesta desde el panel
        s.actualizado = ahora()
        db.commit()
    if respuesta:
        whatsapp.enviar_texto(numero, respuesta)


def _avisar_admin(numero: str, perfil: str | None, texto: str) -> None:
    """Aviso por WhatsApp a la persona del equipo. Meta solo lo entrega si esa persona escribió al bot en las
    últimas 24 h (o es un número de prueba verificado); el aviso por correo del chat se envía igual."""
    if settings.whatsapp_admin_phone:
        whatsapp.enviar_texto(settings.whatsapp_admin_phone,
                              f"Kallpa · {perfil or 'Un cliente'} (+{numero}) pide hablar con una persona:\n«{texto[:300]}»\n"
                              f"Respóndele desde el panel: {settings.sitio_url}/panel/chats")


def enviar_respuesta_del_equipo(sesion_id: str, texto: str) -> None:
    """Si la conversación vino por WhatsApp, la respuesta escrita en el panel se le envía al cliente."""
    with SessionLocal() as db:
        contacto = db.scalar(select(WhatsappContacto).where(WhatsappContacto.sesion_id == sesion_id))
        numero = contacto.numero if contacto else None
    if numero:
        whatsapp.enviar_texto(numero, texto)

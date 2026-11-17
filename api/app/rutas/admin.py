"""Panel del equipo: mensajes de contacto, chats en vivo, novedades y suscriptores."""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import correo
from app.config import settings
from app.db import SessionLocal, get_db
from app.models import ChatMensaje, ChatSesion, MensajeContacto, Novedad, Suscriptor, Usuario, ahora
from app.schemas import ChatMensajeIn, ChatMensajeOut, LoginIn, NovedadAdminOut, NovedadIn
from app.seguridad import LimitePeticiones, crear_token, usuario_actual, verificar_password

router = APIRouter(prefix="/api/admin", tags=["panel"])
protegido = APIRouter(prefix="/api/admin", tags=["panel"], dependencies=[Depends(usuario_actual)])
limite_login = LimitePeticiones(maximo=10, segundos=300)


@router.post("/login", dependencies=[Depends(limite_login)])
def login(datos: LoginIn, db: Session = Depends(get_db)):
    u = db.scalar(select(Usuario).where(Usuario.email == datos.email.lower()))
    if not u or not u.activo or not verificar_password(datos.password, u.password_hash):
        raise HTTPException(401, "Correo o contraseña incorrectos")
    return {"token": crear_token(u), "nombre": u.nombre}


@protegido.get("/resumen")
def resumen(db: Session = Depends(get_db)):
    return {
        "mensajes_sin_leer": db.scalar(select(func.count()).where(MensajeContacto.leido.is_(False))),
        "chats_esperando": db.scalar(select(func.count()).where(ChatSesion.estado == "ESPERANDO")),
        "chats_abiertos": db.scalar(select(func.count()).where(ChatSesion.estado.in_(["AGENTE", "ESPERANDO", "HUMANO"]))),
        "suscriptores": db.scalar(select(func.count()).where(Suscriptor.activo.is_(True))),
        "novedades_publicadas": db.scalar(select(func.count()).where(Novedad.publicada.is_(True))),
        "correo_configurado": correo.configurado(),
    }


# ── Mensajes de contacto ────────────────────────────────────────────────
@protegido.get("/mensajes")
def mensajes(db: Session = Depends(get_db)):
    filas = db.scalars(select(MensajeContacto).order_by(MensajeContacto.creado.desc()).limit(200))
    return [{c: getattr(m, c) for c in ("id", "nombre", "email", "empresa", "asunto", "mensaje", "idioma",
                                         "leido", "correo_enviado", "creado")} for m in filas]


@protegido.patch("/mensajes/{mid}/leido")
def marcar_leido(mid: int, db: Session = Depends(get_db)):
    m = db.get(MensajeContacto, mid)
    if not m:
        raise HTTPException(404, "Mensaje no encontrado")
    m.leido = True
    db.commit()
    return {"ok": True}


# ── Chats ───────────────────────────────────────────────────────────────
@protegido.get("/chats")
def chats(estado: str | None = Query(None, pattern="^(AGENTE|ESPERANDO|HUMANO|CERRADA)$"), db: Session = Depends(get_db)):
    q = select(ChatSesion).order_by(ChatSesion.actualizado.desc()).limit(100)
    if estado:
        q = q.where(ChatSesion.estado == estado)
    salida = []
    for s in db.scalars(q):
        ultimo = s.mensajes[-1] if s.mensajes else None
        salida.append({"id": s.id, "estado": s.estado, "idioma": s.idioma, "nombre": s.nombre, "email": s.email,
                       "atendida_por": s.atendida_por, "actualizado": s.actualizado, "total": len(s.mensajes),
                       "ultimo": ultimo.texto[:120] if ultimo else ""})
    return salida


@protegido.get("/chats/{sid}")
def chat(sid: str, desde: int = Query(0, ge=0), db: Session = Depends(get_db)):
    s = db.get(ChatSesion, sid)
    if not s:
        raise HTTPException(404, "Conversación no encontrada")
    return {"id": s.id, "estado": s.estado, "idioma": s.idioma, "nombre": s.nombre, "email": s.email,
            "atendida_por": s.atendida_por,
            "mensajes": [ChatMensajeOut.model_validate(m) for m in s.mensajes if m.id > desde]}


@protegido.post("/chats/{sid}/responder", response_model=ChatMensajeOut)
def responder_chat(sid: str, datos: ChatMensajeIn, usuario: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    s = db.get(ChatSesion, sid)
    if not s:
        raise HTTPException(404, "Conversación no encontrada")
    if s.estado == "CERRADA":
        raise HTTPException(409, "La conversación está cerrada")
    s.estado, s.atendida_por, s.actualizado = "HUMANO", usuario.nombre, ahora()
    m = ChatMensaje(sesion_id=s.id, autor="EQUIPO", texto=datos.texto.strip(), origen=usuario.nombre)
    db.add(m)
    db.commit()
    return m


@protegido.post("/chats/{sid}/cerrar")
def cerrar_chat(sid: str, db: Session = Depends(get_db)):
    s = db.get(ChatSesion, sid)
    if not s:
        raise HTTPException(404, "Conversación no encontrada")
    if s.estado != "CERRADA":
        texto = "La conversación fue cerrada. ¡Gracias por escribirnos!" if s.idioma == "es" else \
            "The conversation was closed. Thank you for writing to us!"
        db.add(ChatMensaje(sesion_id=s.id, autor="SISTEMA", texto=texto))
        s.estado, s.actualizado = "CERRADA", ahora()
        db.commit()
    return {"ok": True}


@protegido.post("/chats/{sid}/devolver-al-agente")
def devolver_al_agente(sid: str, db: Session = Depends(get_db)):
    s = db.get(ChatSesion, sid)
    if not s or s.estado == "CERRADA":
        raise HTTPException(409, "No se puede devolver esta conversación")
    s.estado, s.atendida_por = "AGENTE", None
    db.commit()
    return {"ok": True}


# ── Novedades (actualizaciones) ─────────────────────────────────────────
def _notificar_novedad(novedad_id: int) -> None:
    db = SessionLocal()
    try:
        n = db.get(Novedad, novedad_id)
        for idioma in ("es", "en"):
            destinos = list(db.scalars(select(Suscriptor.email).where(Suscriptor.activo.is_(True), Suscriptor.idioma == idioma)))
            if not destinos:
                continue
            titulo = n.titulo_en if idioma == "en" else n.titulo_es
            resumen = n.resumen_en if idioma == "en" else n.resumen_es
            leer = "Read more" if idioma == "en" else "Leer más"
            baja = "Unsubscribe: use the link in your confirmation email." if idioma == "en" else \
                "Para darte de baja usa el enlace de tu correo de confirmación."
            for i in range(0, len(destinos), 50):
                correo.enviar(destinos[i:i + 50], f"Kallpa Software · {titulo}",
                              f"{resumen}\n\n{leer}: {settings.sitio_url}/novedades/{n.slug}\n\n{baja}", ocultos=True)
    finally:
        db.close()


@protegido.get("/novedades", response_model=list[NovedadAdminOut])
def novedades(db: Session = Depends(get_db)):
    return list(db.scalars(select(Novedad).order_by(Novedad.creado.desc())))


def _guardar(n: Novedad, datos: NovedadIn, tareas: BackgroundTasks, db: Session) -> Novedad:
    for k, v in datos.model_dump().items():
        setattr(n, k, v)
    if n.publicada and not n.fecha_publicacion:
        n.fecha_publicacion = ahora()
    db.commit()
    if n.publicada and not n.notificada:
        n.notificada = True
        db.commit()
        tareas.add_task(_notificar_novedad, n.id)
    return n


@protegido.post("/novedades", response_model=NovedadAdminOut, status_code=201)
def crear_novedad(datos: NovedadIn, tareas: BackgroundTasks, db: Session = Depends(get_db)):
    if db.scalar(select(Novedad).where(Novedad.slug == datos.slug)):
        raise HTTPException(409, "Ya existe una novedad con ese identificador")
    n = Novedad()
    db.add(n)
    return _guardar(n, datos, tareas, db)


@protegido.put("/novedades/{nid}", response_model=NovedadAdminOut)
def editar_novedad(nid: int, datos: NovedadIn, tareas: BackgroundTasks, db: Session = Depends(get_db)):
    n = db.get(Novedad, nid)
    if not n:
        raise HTTPException(404, "Novedad no encontrada")
    otro = db.scalar(select(Novedad).where(Novedad.slug == datos.slug, Novedad.id != nid))
    if otro:
        raise HTTPException(409, "Ya existe una novedad con ese identificador")
    return _guardar(n, datos, tareas, db)


@protegido.delete("/novedades/{nid}", status_code=204)
def borrar_novedad(nid: int, db: Session = Depends(get_db)):
    n = db.get(Novedad, nid)
    if n:
        db.delete(n)
        db.commit()


@protegido.get("/suscriptores")
def suscriptores(db: Session = Depends(get_db)):
    return [{"email": s.email, "idioma": s.idioma, "activo": s.activo, "creado": s.creado}
            for s in db.scalars(select(Suscriptor).order_by(Suscriptor.creado.desc()))]

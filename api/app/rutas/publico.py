"""Rutas públicas: contacto (correo), boletín de actualizaciones y novedades."""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import correo
from app.config import settings
from app.db import SessionLocal, get_db
from app.models import MensajeContacto, Novedad, Suscriptor
from app.schemas import ContactoIn, NovedadOut, SuscripcionIn
from app.seguridad import LimitePeticiones

router = APIRouter(prefix="/api", tags=["público"])
limite_formularios = LimitePeticiones(maximo=5, segundos=600)

ASUNTOS = {
    "COTIZACION": ("Cotización", "Quote"), "SOPORTE": ("Soporte", "Support"),
    "ALIANZA": ("Alianza", "Partnership"), "EMPLEO": ("Empleo", "Jobs"), "OTRO": ("Otro", "Other"),
}


def _avisar_contacto(mensaje_id: int) -> None:
    """Aviso al equipo y acuse al visitante; marca si el correo salió."""
    db = SessionLocal()
    try:
        m = db.get(MensajeContacto, mensaje_id)
        asunto = ASUNTOS[m.asunto][0]
        enviado = correo.enviar(
            [settings.correo_equipo] if settings.correo_equipo else [],
            f"[Contacto · {asunto}] {m.nombre}",
            f"Nombre: {m.nombre}\nCorreo: {m.email}\nEmpresa: {m.empresa or '-'}\nAsunto: {asunto}\n\n{m.mensaje}",
            responder_a=m.email,
        )
        if m.idioma == "en":
            acuse = (f"Hi {m.nombre},\n\nWe received your message ({ASUNTOS[m.asunto][1]}). Our team will reply "
                     "within one business day.\n\nYour message:\n" + m.mensaje)
            titulo = "We received your message"
        else:
            acuse = (f"Hola {m.nombre}:\n\nRecibimos tu mensaje ({asunto}). El equipo te responderá en un día "
                     "hábil.\n\nTu mensaje:\n" + m.mensaje)
            titulo = "Recibimos tu mensaje"
        correo.enviar([m.email], f"Kallpa Software · {titulo}", acuse)
        m.correo_enviado = enviado
        db.commit()
    finally:
        db.close()


@router.post("/contacto", status_code=201, dependencies=[Depends(limite_formularios)])
def enviar_contacto(datos: ContactoIn, tareas: BackgroundTasks, db: Session = Depends(get_db)):
    if datos.sitio_web:  # bot: se responde igual para no darle pistas
        return {"ok": True}
    m = MensajeContacto(**datos.model_dump(exclude={"sitio_web"}))
    db.add(m)
    db.commit()
    tareas.add_task(_avisar_contacto, m.id)
    return {"ok": True}


@router.post("/suscripcion", status_code=201, dependencies=[Depends(limite_formularios)])
def suscribirse(datos: SuscripcionIn, tareas: BackgroundTasks, db: Session = Depends(get_db)):
    email = datos.email.lower()
    s = db.scalar(select(Suscriptor).where(Suscriptor.email == email))
    if s and s.activo:
        return {"ok": True}
    if s:
        s.activo, s.idioma = True, datos.idioma
    else:
        s = Suscriptor(email=email, idioma=datos.idioma)
        db.add(s)
    db.commit()
    baja = f"{settings.sitio_url}/baja/{s.token_baja}"
    if s.idioma == "en":
        texto = f"You are now subscribed to Kallpa Software updates.\n\nTo unsubscribe: {baja}"
        asunto = "Subscription confirmed"
    else:
        texto = f"Te suscribiste a las actualizaciones de Kallpa Software.\n\nPara darte de baja: {baja}"
        asunto = "Suscripción confirmada"
    tareas.add_task(correo.enviar, [s.email], f"Kallpa Software · {asunto}", texto)
    return {"ok": True}


@router.post("/suscripcion/baja/{token}")
def darse_de_baja(token: str, db: Session = Depends(get_db)):
    s = db.scalar(select(Suscriptor).where(Suscriptor.token_baja == token))
    if not s:
        raise HTTPException(404, "Enlace de baja no válido")
    s.activo = False
    db.commit()
    return {"ok": True}


def _a_salida(n: Novedad, idioma: str, con_contenido: bool) -> NovedadOut:
    en = idioma == "en"
    return NovedadOut(
        slug=n.slug, tipo=n.tipo, producto=n.producto, version=n.version,
        titulo=n.titulo_en if en else n.titulo_es, resumen=n.resumen_en if en else n.resumen_es,
        contenido=(n.contenido_en if en else n.contenido_es) if con_contenido else None,
        fecha_publicacion=n.fecha_publicacion,
    )


@router.get("/novedades", response_model=list[NovedadOut])
def listar_novedades(idioma: str = Query("es", pattern="^(es|en)$"), tipo: str | None = Query(None, pattern="^(NOTICIA|VERSION)$"),
                     limite: int = Query(20, ge=1, le=50), db: Session = Depends(get_db)):
    q = select(Novedad).where(Novedad.publicada.is_(True))
    if tipo:
        q = q.where(Novedad.tipo == tipo)
    q = q.order_by(Novedad.fecha_publicacion.desc()).limit(limite)
    return [_a_salida(n, idioma, False) for n in db.scalars(q)]


@router.get("/novedades/{slug}", response_model=NovedadOut)
def ver_novedad(slug: str, idioma: str = Query("es", pattern="^(es|en)$"), db: Session = Depends(get_db)):
    n = db.scalar(select(Novedad).where(Novedad.slug == slug, Novedad.publicada.is_(True)))
    if not n:
        raise HTTPException(404, "Novedad no encontrada")
    return _a_salida(n, idioma, True)

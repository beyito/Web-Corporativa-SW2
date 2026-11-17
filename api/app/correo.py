"""Correo saliente por SMTP (p. ej. Gmail con contraseña de aplicación).

Sin servidor configurado no se envía nada: los mensajes quedan guardados en el panel.
"""
import logging
import smtplib
from email.message import EmailMessage
from email.utils import formataddr

from app.config import settings

log = logging.getLogger(__name__)


def configurado() -> bool:
    return bool(settings.smtp_host and settings.smtp_usuario and settings.smtp_password)


def enviar(destinos: list[str], asunto: str, texto: str, responder_a: str | None = None, ocultos: bool = False) -> bool:
    """Envía un correo de texto. Con `ocultos`, los destinos van en copia oculta (boletín)."""
    if not configurado() or not destinos:
        log.info("Correo no enviado (SMTP sin configurar): %s", asunto)
        return False
    remitente = settings.smtp_remitente or settings.smtp_usuario
    msg = EmailMessage()
    msg["Subject"] = asunto
    msg["From"] = formataddr(("Kallpa Software", remitente))
    if ocultos:
        msg["To"] = remitente
        msg["Bcc"] = ", ".join(destinos)
    else:
        msg["To"] = ", ".join(destinos)
    if responder_a:
        msg["Reply-To"] = responder_a
    msg.set_content(texto + "\n\n--\nKallpa Software · Empresa ficticia con fines académicos\n" + settings.sitio_url)
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as s:
            s.starttls()
            s.login(settings.smtp_usuario, settings.smtp_password)
            s.send_message(msg)
        return True
    except Exception as exc:
        log.warning("No se pudo enviar el correo «%s»: %s", asunto, exc)
        return False

"""Cliente mínimo de la WhatsApp Cloud API (Meta): enviar texto, número público y firma de las notificaciones."""
import hashlib
import hmac
import logging
import re
import time

import httpx

from app.config import settings

log = logging.getLogger(__name__)
LIMITE_TEXTO = 4096   # máximo de caracteres de un mensaje de texto de WhatsApp
_cache_numero: dict = {"valor": None, "hasta": 0.0}


def _url(ruta: str) -> str:
    return f"{settings.whatsapp_api_url.rstrip('/')}/{ruta}"


def _cabeceras() -> dict:
    return {"Authorization": f"Bearer {settings.whatsapp_token}"}


def enviar_texto(destino: str, texto: str) -> bool:
    """Envía un mensaje de texto. Devuelve False (y lo registra) si Meta lo rechaza; nunca lanza excepción."""
    if not settings.whatsapp_activo or not destino or not texto:
        return False
    cuerpo = {"messaging_product": "whatsapp", "recipient_type": "individual", "to": destino, "type": "text",
              "text": {"preview_url": False, "body": texto[:LIMITE_TEXTO]}}
    try:
        r = httpx.post(_url(f"{settings.whatsapp_phone_number_id}/messages"), json=cuerpo, headers=_cabeceras(), timeout=15)
        if r.status_code >= 400:
            # Sin el token ni datos del cliente en el registro: solo el código y el mensaje de error de Meta
            log.warning("WhatsApp rechazó el envío (%s): %s", r.status_code, r.json().get("error", {}).get("message", "")[:200])
            return False
        return True
    except (httpx.HTTPError, ValueError) as exc:
        log.warning("No se pudo enviar por WhatsApp: %s", type(exc).__name__)
        return False


def numero_publico() -> str | None:
    """Número visible del bot (solo dígitos), consultado a Meta con el PHONE_NUMBER_ID y guardado 1 hora."""
    if not settings.whatsapp_activo:
        return None
    if _cache_numero["valor"] and time.time() < _cache_numero["hasta"]:
        return _cache_numero["valor"]
    try:
        r = httpx.get(_url(settings.whatsapp_phone_number_id), params={"fields": "display_phone_number"},
                      headers=_cabeceras(), timeout=10)
        r.raise_for_status()
        numero = re.sub(r"\D", "", r.json().get("display_phone_number", "")) or None
    except (httpx.HTTPError, ValueError) as exc:
        log.warning("No se pudo consultar el número de WhatsApp: %s", type(exc).__name__)
        return _cache_numero["valor"]
    _cache_numero.update(valor=numero, hasta=time.time() + 3600)
    return numero


def firma_valida(cuerpo: bytes, cabecera: str | None) -> bool:
    """Comprueba X-Hub-Signature-256 = sha256=HMAC(app_secret, cuerpo). Sin APP_SECRET configurado no se exige."""
    if not settings.whatsapp_app_secret:
        return True
    if not cabecera or not cabecera.startswith("sha256="):
        return False
    esperada = hmac.new(settings.whatsapp_app_secret.encode(), cuerpo, hashlib.sha256).hexdigest()
    return hmac.compare_digest(esperada, cabecera.removeprefix("sha256="))

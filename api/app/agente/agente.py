"""Agente IA del chat: base de conocimiento primero, modelo local después, persona a pedido.

Orden de decisión (determinista antes que el modelo):
1. Pide hablar con una persona  -> traspaso al equipo (estado ESPERANDO).
2. Solo un saludo               -> respuesta fija.
3. Coincide con un tema         -> respuesta de la base de conocimiento (instantánea).
4. Resto                        -> modelo local con la base como único contexto; si falla, respuesta de respaldo.
"""
import logging
from dataclasses import dataclass

import httpx

from app.agente.conocimiento import PIDE_HUMANO, RESPUESTAS_FIJAS, SALUDOS, TEMAS, contexto_para_modelo, normalizar
from app.config import settings

log = logging.getLogger(__name__)


@dataclass
class Respuesta:
    texto: str
    origen: str  # base_conocimiento | modelo | respaldo | traspaso
    pide_humano: bool = False


def pide_humano(texto: str) -> bool:
    palabras = normalizar(texto)
    if palabras & PIDE_HUMANO:
        return True
    t = texto.lower()
    return "hablar con" in t and ("equipo" in t or "alguien" in t) or "talk to" in t and "team" in t


def tema_de(texto: str) -> dict | None:
    """Tema con más palabras clave en común; None si ninguno coincide."""
    palabras = normalizar(texto)
    mejor, puntos = None, 0
    for tema in TEMAS:
        n = len(palabras & tema["claves"])
        if n > puntos:
            mejor, puntos = tema, n
    return mejor


def es_solo_saludo(texto: str) -> bool:
    palabras = normalizar(texto)
    return bool(palabras) and palabras <= (SALUDOS | {"que", "tal", "dias", "tardes", "noches", "there"})


def _instrucciones(idioma: str) -> str:
    lengua = "español" if idioma == "es" else "English"
    return (
        f"Eres el asistente virtual de Kallpa Software, una empresa de desarrollo de software. Responde en {lengua}, "
        "en 1 a 3 oraciones, con tono cordial. Usa SOLO los datos de la lista; no inventes precios, nombres, "
        "teléfonos, clientes ni fechas. Si la pregunta no se responde con la lista o no trata sobre la empresa, "
        "di que no tienes esa información y ofrece hablar con una persona del equipo o usar el formulario de "
        f"Contacto.\n\nDatos de la empresa:\n{contexto_para_modelo(idioma)}"
    )


def preguntar_al_modelo(texto: str, historial: list[tuple[str, str]], idioma: str) -> str | None:
    if not settings.ollama_url:
        return None
    mensajes = [{"role": "system", "content": _instrucciones(idioma)}]
    for autor, contenido in historial[-6:]:
        mensajes.append({"role": "user" if autor == "VISITANTE" else "assistant", "content": contenido})
    mensajes.append({"role": "user", "content": texto})
    try:
        r = httpx.post(
            f"{settings.ollama_url.rstrip('/')}/api/chat",
            json={"model": settings.ollama_model, "messages": mensajes, "stream": False,
                  "options": {"temperature": 0.2, "num_predict": 160}},
            timeout=settings.ollama_timeout,
        )
        r.raise_for_status()
        contenido = (r.json().get("message") or {}).get("content", "").strip()
        return contenido or None
    except Exception as exc:  # el chat nunca se cae por el modelo
        log.warning("Modelo no disponible: %s", exc)
        return None


def responder(texto: str, idioma: str = "es", historial: list[tuple[str, str]] | None = None) -> Respuesta:
    idioma = idioma if idioma in ("es", "en") else "es"
    if pide_humano(texto):
        return Respuesta(RESPUESTAS_FIJAS["humano"][idioma], "traspaso", pide_humano=True)
    if es_solo_saludo(texto):
        return Respuesta(RESPUESTAS_FIJAS["saludo"][idioma], "base_conocimiento")
    tema = tema_de(texto)
    if tema:
        return Respuesta(tema[idioma], "base_conocimiento")
    del_modelo = preguntar_al_modelo(texto, historial or [], idioma)
    if del_modelo:
        return Respuesta(del_modelo, "modelo")
    return Respuesta(RESPUESTAS_FIJAS["respaldo"][idioma], "respaldo")

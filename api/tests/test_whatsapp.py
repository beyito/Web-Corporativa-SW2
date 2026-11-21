"""Canal de WhatsApp: verificación del webhook, firma, respuesta del agente, traspaso a persona y respuesta del panel."""
import hashlib
import hmac
import json

import pytest

from app import whatsapp
from app.config import settings
from app.models import WhatsappContacto


@pytest.fixture
def wsp(monkeypatch):
    """Canal activo con datos ficticios; los envíos a Meta se capturan en una lista en lugar de salir a internet."""
    for campo, valor in {"whatsapp_token": "token-prueba", "whatsapp_phone_number_id": "123", "whatsapp_verify_token": "palabra",
                         "whatsapp_app_secret": "secreto", "whatsapp_admin_phone": "59170000000"}.items():
        monkeypatch.setattr(settings, campo, valor)
    enviados = []
    monkeypatch.setattr(whatsapp, "enviar_texto", lambda destino, texto: enviados.append((destino, texto)) or True)
    return enviados


def _notificar(cliente, texto, mid, numero="59171111111", tipo="text"):
    mensaje = {"from": numero, "id": mid, "type": tipo}
    if tipo == "text":
        mensaje["text"] = {"body": texto}
    cuerpo = json.dumps({"entry": [{"changes": [{"value": {"contacts": [{"wa_id": numero, "profile": {"name": "Ana"}}],
                                                             "messages": [mensaje]}}]}]}).encode()
    firma = "sha256=" + hmac.new(b"secreto", cuerpo, hashlib.sha256).hexdigest()
    return cliente.post("/api/whatsapp/webhook", content=cuerpo,
                        headers={"Content-Type": "application/json", "X-Hub-Signature-256": firma})


def test_verificacion_del_webhook(cliente, wsp):
    ok = cliente.get("/api/whatsapp/webhook", params={"hub.mode": "subscribe", "hub.verify_token": "palabra", "hub.challenge": "777"})
    assert ok.status_code == 200 and ok.text == "777"
    malo = cliente.get("/api/whatsapp/webhook", params={"hub.mode": "subscribe", "hub.verify_token": "otra", "hub.challenge": "1"})
    assert malo.status_code == 403


def test_rechaza_firma_invalida(cliente, wsp):
    r = cliente.post("/api/whatsapp/webhook", content=b'{"entry": []}',
                     headers={"Content-Type": "application/json", "X-Hub-Signature-256": "sha256=falsa"})
    assert r.status_code == 403 and wsp == []


def test_agente_responde_y_no_repite_reenvios(cliente, wsp):
    assert _notificar(cliente, "¿Cuánto cuesta la plataforma?", "wamid.1").status_code == 200
    assert len(wsp) == 1 and wsp[0][0] == "59171111111" and wsp[0][1]
    _notificar(cliente, "¿Cuánto cuesta la plataforma?", "wamid.1")   # Meta reenvía la misma notificación
    assert len(wsp) == 1


def test_solo_texto(cliente, wsp):
    _notificar(cliente, "", "wamid.audio", numero="59173333333", tipo="audio")
    assert wsp == [("59173333333", "Por ahora solo puedo leer mensajes de texto. ¿En qué te ayudo?")]


def test_persona_del_equipo_por_whatsapp(cliente, auth, wsp):
    _notificar(cliente, "quiero hablar con una persona", "wamid.2", numero="59172222222")
    destinos = [d for d, _ in wsp]
    assert "59172222222" in destinos and "59170000000" in destinos   # respuesta al cliente y aviso al admin
    from app.db import SessionLocal
    with SessionLocal() as db:
        sid = db.get(WhatsappContacto, "59172222222").sesion_id
    chats = cliente.get("/api/admin/chats", params={"estado": "ESPERANDO"}, headers=auth).json()
    assert any(c["id"] == sid and "WhatsApp" in (c["nombre"] or "") for c in chats)
    wsp.clear()
    r = cliente.post(f"/api/admin/chats/{sid}/responder", json={"texto": "Hola Ana, te ayudo yo"}, headers=auth)
    assert r.status_code == 200
    assert wsp and wsp[0][0] == "59172222222" and "Hola Ana, te ayudo yo" in wsp[0][1]
    wsp.clear()
    _notificar(cliente, "gracias", "wamid.3", numero="59172222222")   # la atiende una persona: el agente no responde
    assert wsp == []


def test_contacto_publico_apagado_sin_configuracion(cliente, monkeypatch):
    monkeypatch.setattr(settings, "whatsapp_token", "")
    assert cliente.get("/api/whatsapp/contacto").json() == {"disponible": False, "numero": None}

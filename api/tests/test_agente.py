"""Decisiones del agente: persona > saludo > base de conocimiento > modelo > respaldo."""
from app.agente import agente


def test_pedir_persona_pasa_al_equipo():
    r = agente.responder("Quiero hablar con una persona", "es")
    assert r.pide_humano and r.origen == "traspaso"
    assert agente.responder("Can I talk to someone?", "en").pide_humano


def test_saludo_responde_fijo():
    r = agente.responder("Hola, buenas tardes", "es")
    assert r.origen == "base_conocimiento" and "asistente virtual" in r.texto


def test_tema_de_la_base_responde_al_instante(monkeypatch):
    monkeypatch.setattr(agente, "preguntar_al_modelo", lambda *a: (_ for _ in ()).throw(AssertionError("no debe llamar")))
    r = agente.responder("¿Cuánto cuesta un proyecto?", "es")
    assert r.origen == "base_conocimiento" and "cotiza" in r.texto
    assert "Santa Cruz" in agente.responder("Where are you located?", "en").texto


def test_sin_tema_usa_el_modelo(monkeypatch):
    monkeypatch.setattr(agente, "preguntar_al_modelo", lambda texto, hist, idioma: "Respuesta del modelo.")
    r = agente.responder("¿Recomiendan microservicios para una tienda pequeña?", "es")
    assert r.origen == "modelo" and r.texto == "Respuesta del modelo."


def test_modelo_caido_da_respaldo(monkeypatch):
    monkeypatch.setattr(agente, "preguntar_al_modelo", lambda *a: None)
    r = agente.responder("¿Qué opinan del clima?", "en")
    assert r.origen == "respaldo" and "person" in r.texto


def test_el_modelo_recibe_solo_la_base_y_el_historial(monkeypatch):
    enviado = {}

    class Resp:
        def raise_for_status(self):
            pass

        def json(self):
            return {"message": {"content": " Hola. "}}

    def falso_post(url, json, timeout):
        enviado.update(url=url, cuerpo=json)
        return Resp()

    monkeypatch.setattr(agente.settings, "ollama_url", "http://ollama:11434")
    monkeypatch.setattr(agente.httpx, "post", falso_post)
    assert agente.preguntar_al_modelo("¿Y en Cochabamba?", [("VISITANTE", "hola"), ("AGENTE", "¡Hola!")], "es") == "Hola."
    mensajes = enviado["cuerpo"]["messages"]
    assert enviado["url"].endswith("/api/chat") and mensajes[0]["role"] == "system"
    assert "Kallpa Software" in mensajes[0]["content"] and [m["role"] for m in mensajes[1:]] == ["user", "assistant", "user"]


def test_contexto_recortado_a_los_temas_relevantes():
    from app.agente.conocimiento import TEMAS, contexto_para_modelo
    ctx = contexto_para_modelo("es", "¿Trabajan con Flutter y dónde están?")
    lineas = ctx.splitlines()
    assert len(lineas) == 5 < len(TEMAS)
    assert "Flutter" in lineas[0] or "Flutter" in lineas[1]  # tecnologías primero
    assert any("Santa Cruz" in x for x in lineas[:2])         # ubicación también
    assert len(contexto_para_modelo("en", "hello?").splitlines()) == 5  # sin coincidencias: los básicos

"""API pública, chat con traspaso a persona y panel del equipo."""


def test_novedades_en_dos_idiomas(cliente):
    es = cliente.get("/api/novedades?idioma=es").json()
    en = cliente.get("/api/novedades?idioma=en").json()
    assert len(es) == len(en) >= 4 and es[0]["titulo"] != en[0]["titulo"]
    detalle = cliente.get(f"/api/novedades/{es[0]['slug']}?idioma=en").json()
    assert detalle["contenido"]
    assert cliente.get("/api/novedades?tipo=VERSION").json()[0]["tipo"] == "VERSION"
    assert cliente.get("/api/novedades/no-existe").status_code == 404


def test_contacto_guarda_y_trampa_para_bots(cliente, auth):
    datos = {"nombre": "Ana Pérez", "email": "ana@example.com", "asunto": "COTIZACION",
             "mensaje": "Necesitamos una aplicación para nuestra clínica.", "idioma": "es"}
    assert cliente.post("/api/contacto", json=datos).status_code == 201
    assert cliente.post("/api/contacto", json=datos | {"sitio_web": "spam.example", "nombre": "Bot"}).status_code == 201
    nombres = [m["nombre"] for m in cliente.get("/api/admin/mensajes", headers=auth).json()]
    assert "Ana Pérez" in nombres and "Bot" not in nombres
    assert cliente.post("/api/contacto", json=datos | {"email": "no-es-correo"}).status_code == 422


def test_suscripcion_y_baja(cliente, auth):
    assert cliente.post("/api/suscripcion", json={"email": "Lector@Example.com", "idioma": "en"}).status_code == 201
    subs = cliente.get("/api/admin/suscriptores", headers=auth).json()
    assert subs[0]["email"] == "lector@example.com"
    assert cliente.post("/api/suscripcion/baja/token-falso").status_code == 404


def test_chat_agente_luego_persona_del_equipo(cliente, auth):
    s = cliente.post("/api/chat", json={"idioma": "es"}).json()
    h = {"X-Chat-Token": s["token"]}
    assert s["estado"] == "AGENTE" and s["mensajes"][0]["autor"] == "AGENTE"

    r = cliente.post(f"/api/chat/{s['id']}/mensajes", json={"texto": "¿Qué servicios ofrecen?"}, headers=h).json()
    assert [m["autor"] for m in r["mensajes"]] == ["VISITANTE", "AGENTE"]
    assert r["mensajes"][1]["origen"] == "base_conocimiento"

    r = cliente.post(f"/api/chat/{s['id']}/mensajes", json={"texto": "Quiero hablar con una persona"}, headers=h).json()
    assert r["estado"] == "ESPERANDO" and r["mensajes"][-1]["autor"] == "SISTEMA"
    assert any(c["id"] == s["id"] for c in cliente.get("/api/admin/chats?estado=ESPERANDO", headers=auth).json())

    # mientras espera, el agente ya no responde
    r = cliente.post(f"/api/chat/{s['id']}/mensajes", json={"texto": "¿Hola?"}, headers=h).json()
    assert [m["autor"] for m in r["mensajes"]] == ["VISITANTE"]

    cliente.post(f"/api/admin/chats/{s['id']}/responder", json={"texto": "Hola, soy del equipo."}, headers=auth)
    ultimo = r["mensajes"][-1]["id"]
    r = cliente.get(f"/api/chat/{s['id']}?desde={ultimo}", headers=h).json()
    assert r["estado"] == "HUMANO" and r["atendida_por"] == "Administrador" and r["mensajes"][0]["autor"] == "EQUIPO"

    cliente.post(f"/api/admin/chats/{s['id']}/cerrar", headers=auth)
    assert cliente.post(f"/api/chat/{s['id']}/mensajes", json={"texto": "x"}, headers=h).status_code == 409


def test_chat_exige_su_token(cliente):
    s = cliente.post("/api/chat", json={"idioma": "en"}).json()
    assert cliente.get(f"/api/chat/{s['id']}").status_code == 404
    assert cliente.get(f"/api/chat/{s['id']}", headers={"X-Chat-Token": "otro"}).status_code == 404
    assert "virtual assistant" in s["mensajes"][0]["texto"]


def test_panel_protegido(cliente, auth):
    assert cliente.get("/api/admin/resumen").status_code == 401
    assert cliente.get("/api/admin/resumen", headers={"Authorization": "Bearer falso"}).status_code == 401
    assert cliente.post("/api/admin/login", json={"email": "equipo@example.com", "password": "mala"}).status_code == 401
    assert cliente.get("/api/admin/resumen", headers=auth).json()["correo_configurado"] is False


def test_publicar_novedad(cliente, auth):
    nueva = {"slug": "nueva-version", "tipo": "VERSION", "producto": "X", "version": "1.1",
             "titulo_es": "Título", "titulo_en": "Title", "resumen_es": "Resumen", "resumen_en": "Summary",
             "contenido_es": "Contenido", "contenido_en": "Content", "publicada": False}
    n = cliente.post("/api/admin/novedades", json=nueva, headers=auth).json()
    assert cliente.get("/api/novedades/nueva-version").status_code == 404  # borrador no es público
    n = cliente.put(f"/api/admin/novedades/{n['id']}", json=nueva | {"publicada": True}, headers=auth).json()
    assert n["notificada"] and n["fecha_publicacion"]
    assert cliente.get("/api/novedades/nueva-version").status_code == 200
    assert cliente.post("/api/admin/novedades", json=nueva, headers=auth).status_code == 409
    assert cliente.post("/api/admin/novedades", json=nueva | {"slug": "Con Espacios"}, headers=auth).status_code == 422

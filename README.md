# Kallpa Software · Sitio web corporativo

Sitio de una empresa ficticia de desarrollo de software (Ingeniería del Software II, UAGRM). Publicado en `https://kallpa-software.duckdns.org`.

## Funciones

| Pedido | Cómo se cumple |
| :--- | :--- |
| Empresa que desarrolla software | Inicio, Servicios, Proyectos (caso real: Plataforma de Becas D.U.B.S.S.), Nosotros |
| Emails | Formulario de contacto con aviso al equipo y acuse al visitante; boletín de actualizaciones con alta, confirmación y baja por enlace (SMTP) |
| Chats | Chat flotante en todas las páginas; el visitante puede pasar a una persona del equipo, que responde desde el panel |
| Agentes | Agente IA del chat: base de conocimiento verificada primero, modelo local (Ollama) solo para lo demás, persona a pedido |
| Actualizaciones | Novedades y notas de versión bilingües, publicadas desde el panel; al publicar se avisa por correo a los suscriptores |

Factores de calidad: diseño adaptable (escritorio y celular, sin desplazamiento horizontal), dos idiomas (español e inglés), accesibilidad (etiquetas, foco visible, «saltar al contenido», `prefers-reduced-motion`), seguridad (cabeceras CSP/HSTS/COOP, límite de peticiones, trampa para bots, contraseñas bcrypt, JWT, contenedores sin root), SEO (título y descripción por página, Open Graph, `robots.txt`, `sitemap.xml`) y rendimiento (panel cargado bajo demanda, recursos con caché inmutable, gzip).

## Estructura

```
api/   FastAPI + SQLAlchemy (SQLite en volumen)
  app/agente/      conocimiento.py (datos de la empresa) y agente.py (decisión del chat)
  app/rutas/       publico.py (contacto, boletín, novedades), chat.py, admin.py (panel)
  tests/           13 pruebas (pytest)
web/   React 19 + Vite + Tailwind CSS
  src/i18n/        textos en español e inglés (textos.js) y selector de idioma
  src/paginas/     Inicio, Servicios, Proyectos, Novedades, Nosotros, Contacto, Privacidad
  src/componentes/ Cabecera, Pie, Chat, Boletin
  src/panel/       panel del equipo (/panel): chats en vivo, mensajes, novedades, suscriptores
```

## Desarrollo local

```bash
cd api && python -m venv venv && venv/Scripts/python -m pip install -r requirements.txt pytest
ADMIN_PASSWORD=demo1234 venv/Scripts/python -m uvicorn app.main:app --port 8010
venv/Scripts/python -m pytest -q
cd web && npm install && npm run dev        # http://localhost:5173 (proxy /api → 8010)
```

## Despliegue (VM de la plataforma de becas)

1. Copiar `.env.example` a `.env` y completarlo.
2. `docker compose up -d --build` (el Compose fija `name: kallpa-sitio`; no quitarlo).
3. El Caddy compartido de la VM atiende el dominio y reenvía a `kallpa-web:80` por la red `becas-perimetro`.

"""Base de conocimiento de Kallpa Software (empresa ficticia con fines académicos).

Es la única fuente de datos del agente: las respuestas rápidas salen de aquí y el modelo
solo la reformula. Cambiar un dato de la empresa = cambiarlo en este archivo.
"""
import re
import unicodedata

EMPRESA = "Kallpa Software"

# Cada tema: palabras clave (sin tildes, en minúsculas) y respuesta en español e inglés.
TEMAS: list[dict] = [
    {
        "id": "servicios",
        "claves": {"servicio", "servicios", "hacen", "ofrecen", "desarrollan", "services", "offer"},
        "es": ("Desarrollamos software a medida: aplicaciones web, aplicaciones móviles (Flutter), "
               "agentes de inteligencia artificial, trazabilidad con blockchain, inteligencia de negocios "
               "(BI) y aseguramiento de la calidad y seguridad. Puedes ver el detalle en la página Servicios."),
        "en": ("We build custom software: web applications, mobile apps (Flutter), AI agents, blockchain "
               "traceability, business intelligence (BI) and quality and security assurance. See the "
               "Services page for details."),
    },
    {
        "id": "precios",
        "claves": {"precio", "precios", "costo", "cuesta", "cotizacion", "cotizar", "presupuesto", "tarifa",
                   "price", "pricing", "cost", "quote", "budget"},
        "es": ("Cada proyecto se cotiza a medida según su alcance. La primera reunión de análisis es "
               "gratuita: escríbenos desde el formulario de Contacto eligiendo «Cotización» y te respondemos "
               "en un día hábil."),
        "en": ("Every project is quoted according to its scope. The first analysis meeting is free: write "
               "to us from the Contact form choosing «Quote» and we will reply within one business day."),
    },
    {
        "id": "plazos",
        "claves": {"plazo", "plazos", "tiempo", "tarda", "demora", "cuanto", "semanas", "entrega",
                   "timeline", "long", "weeks", "delivery"},
        "es": ("Trabajamos con el Proceso Unificado, en iteraciones cortas con entregas funcionales. Un "
               "producto mínimo viable suele tomar entre 6 y 10 semanas; el plazo exacto se define en la "
               "cotización."),
        "en": ("We follow the Unified Process, in short iterations with working deliveries. A minimum "
               "viable product usually takes 6 to 10 weeks; the exact timeline is set in the quote."),
    },
    {
        "id": "productos",
        "claves": {"producto", "productos", "proyecto", "proyectos", "becas", "dubss", "caso", "clientes",
                   "portafolio", "product", "products", "project", "projects", "portfolio", "scholarship"},
        "es": ("Nuestro caso principal es la Plataforma de Becas D.U.B.S.S., desarrollada como proyecto "
               "académico para la gestión de becas universitarias: postulación web y móvil, evaluación "
               "socioeconómica, adjudicación por cupos, trazabilidad en blockchain, tablero BI y dos agentes "
               "de IA (auditor de expedientes y simulador presupuestario). Está en la página Proyectos."),
        "en": ("Our main case is the D.U.B.S.S. Scholarship Platform, built as an academic project to manage "
               "university scholarships: web and mobile applications, socioeconomic evaluation, quota-based "
               "awarding, blockchain traceability, a BI dashboard and two AI agents (file auditor and budget "
               "simulator). It is on the Projects page."),
    },
    {
        "id": "ia",
        "claves": {"ia", "inteligencia", "artificial", "agente", "agentes", "chatbot", "llm", "modelo",
                   "ai", "agent", "agents", "model"},
        "es": ("Construimos agentes de IA con grafos de estados (LangGraph) y herramientas deterministas: las "
               "reglas del negocio deciden y el modelo de lenguaje redacta. Usamos modelos locales para que "
               "los datos no salgan de tu servidor, y una persona siempre toma la decisión final."),
        "en": ("We build AI agents with state graphs (LangGraph) and deterministic tools: business rules "
               "decide and the language model writes. We use local models so your data never leaves your "
               "server, and a person always makes the final decision."),
    },
    {
        "id": "tecnologias",
        "claves": {"tecnologia", "tecnologias", "stack", "lenguaje", "lenguajes", "framework", "react",
                   "python", "flutter", "fastapi", "technology", "technologies", "language"},
        "es": ("Trabajamos con React, FastAPI (Python), PostgreSQL, Flutter, Docker, LangGraph con Ollama, "
               "Solidity/Ethereum y herramientas de BI. Desplegamos con contenedores y HTTPS."),
        "en": ("We work with React, FastAPI (Python), PostgreSQL, Flutter, Docker, LangGraph with Ollama, "
               "Solidity/Ethereum and BI tools. We deploy with containers and HTTPS."),
    },
    {
        "id": "contacto",
        "claves": {"contacto", "contactar", "correo", "email", "mail", "telefono", "escribir", "comunicar",
                   "contact", "phone", "reach"},
        "es": ("Puedes escribirnos desde el formulario de la página Contacto; te respondemos por correo en un "
               "día hábil. También puedes seguir en este chat y pedir hablar con una persona del equipo."),
        "en": ("You can write to us from the Contact page form; we reply by email within one business day. "
               "You can also stay in this chat and ask to talk to a person from our team."),
    },
    {
        "id": "horario",
        "claves": {"horario", "hora", "horas", "atienden", "abierto", "dias", "hours", "open", "schedule"},
        "es": ("El equipo atiende de lunes a viernes, de 8:30 a 18:30 (hora de Bolivia). Este asistente "
               "responde a cualquier hora."),
        "en": ("Our team works Monday to Friday, 8:30 to 18:30 (Bolivia time). This assistant answers at "
               "any time."),
    },
    {
        "id": "ubicacion",
        "claves": {"donde", "ubicacion", "ubicados", "direccion", "oficina", "ciudad", "pais",
                   "where", "location", "located", "office", "city", "country"},
        "es": "Estamos en Santa Cruz de la Sierra, Bolivia, y trabajamos de forma remota con clientes de todo el país.",
        "en": "We are based in Santa Cruz de la Sierra, Bolivia, and work remotely with clients across the country.",
    },
    {
        "id": "soporte",
        "claves": {"soporte", "falla", "error", "problema", "ayuda", "mantenimiento", "garantia",
                   "support", "bug", "issue", "maintenance", "warranty"},
        "es": ("Todos nuestros proyectos incluyen un periodo de garantía y planes de mantenimiento. Si ya "
               "eres cliente, usa el formulario de Contacto con el asunto «Soporte» o pide aquí hablar con "
               "una persona."),
        "en": ("All our projects include a warranty period and maintenance plans. If you are already a "
               "client, use the Contact form with the «Support» subject or ask here to talk to a person."),
    },
    {
        "id": "empleo",
        "claves": {"empleo", "trabajo", "trabajar", "vacante", "vacantes", "pasantia", "cv", "curriculum",
                   "job", "jobs", "career", "careers", "internship", "hiring"},
        "es": ("¡Gracias por tu interés! Envíanos tu CV desde el formulario de Contacto con el asunto "
               "«Empleo» y cuéntanos en qué área te gustaría trabajar."),
        "en": ("Thanks for your interest! Send us your résumé from the Contact form with the «Jobs» subject "
               "and tell us which area you would like to work in."),
    },
    {
        "id": "empresa",
        "claves": {"quienes", "empresa", "kallpa", "nosotros", "historia", "mision", "vision",
                   "who", "company", "about", "mission"},
        "es": ("Kallpa Software es una empresa de desarrollo de software de Santa Cruz, Bolivia («kallpa» "
               "significa fuerza en quechua). Nuestra misión es construir software confiable, trazable y "
               "seguro para instituciones y empresas. Nota: es una empresa ficticia creada para la materia "
               "Ingeniería del Software II."),
        "en": ("Kallpa Software is a software development company from Santa Cruz, Bolivia («kallpa» means "
               "strength in Quechua). Our mission is to build reliable, traceable and secure software for "
               "institutions and businesses. Note: it is a fictional company created for the Software "
               "Engineering II course."),
    },
]

SALUDOS = {"hola", "buenas", "buenos", "saludos", "hi", "hello", "hey"}
PIDE_HUMANO = {"humano", "persona", "asesor", "asesora", "operador", "alguien", "representante",
               "personas", "human", "person", "someone", "representative"}

RESPUESTAS_FIJAS = {
    "saludo": {
        "es": ("¡Hola! Soy el asistente virtual de Kallpa Software. Puedo contarte sobre nuestros servicios, "
               "proyectos, plazos o cómo cotizar. Si prefieres, escribe «hablar con una persona»."),
        "en": ("Hi! I am Kallpa Software's virtual assistant. I can tell you about our services, projects, "
               "timelines or how to get a quote. If you prefer, type «talk to a person»."),
    },
    "humano": {
        "es": ("Te comunico con una persona del equipo. Si no hay nadie disponible en este momento, déjanos tu "
               "correo y te escribimos; esta conversación queda guardada."),
        "en": ("I am connecting you with a person from our team. If nobody is available right now, leave us "
               "your email and we will write to you; this conversation is saved."),
    },
    "respaldo": {
        "es": ("No tengo esa información. Puedo comunicarte con una persona del equipo (escribe «hablar con una "
               "persona») o puedes usar el formulario de Contacto."),
        "en": ("I do not have that information. I can connect you with a person from our team (type «talk to "
               "a person») or you can use the Contact form."),
    },
}


def normalizar(texto: str) -> set[str]:
    sin_tildes = unicodedata.normalize("NFKD", texto.lower()).encode("ascii", "ignore").decode()
    return set(re.findall(r"[a-z0-9]+", sin_tildes))


def contexto_para_modelo(idioma: str) -> str:
    """Todo el conocimiento en un texto, para el mensaje de sistema del modelo."""
    return "\n".join(f"- {t[idioma]}" for t in TEMAS)

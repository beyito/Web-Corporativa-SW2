"""Datos iniciales: primer usuario del panel y novedades de ejemplo (solo si la tabla está vacía)."""
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Novedad, Usuario
from app.seguridad import hash_password

NOVEDADES = [
    dict(slug="becas-dubss-agentes-ia", tipo="VERSION", producto="Plataforma de Becas D.U.B.S.S.", version="2.0",
         fecha=datetime(2026, 11, 16, tzinfo=timezone.utc),
         titulo_es="Becas D.U.B.S.S. 2.0: dos agentes de inteligencia artificial",
         titulo_en="D.U.B.S.S. Scholarships 2.0: two artificial intelligence agents",
         resumen_es="El Agente Auditor revisa la consistencia de los expedientes y el Simulador What-If proyecta escenarios de presupuesto.",
         resumen_en="The Auditor Agent checks file consistency and the What-If Simulator projects budget scenarios.",
         contenido_es=("La versión 2.0 de la plataforma incorpora dos agentes construidos con grafos de estados (LangGraph) "
                       "y herramientas deterministas.\n\nEl Agente Auditor (CU-32) lee los documentos del expediente, detecta "
                       "montos discrepantes, documentos vencidos, ingresos no respaldados y declaraciones contradictorias, y "
                       "propone un borrador de observación que la Trabajadora Social puede editar.\n\nEl Simulador What-If (CU-33) "
                       "responde preguntas como «¿qué pasa si aumentamos 10 % el presupuesto?» replicando la adjudicación en "
                       "memoria, sin modificar datos.\n\nAmbos usan un modelo local: los datos de los estudiantes no salen del "
                       "servidor y el modelo nunca recibe nombres ni documentos de identidad."),
         contenido_en=("Version 2.0 of the platform adds two agents built with state graphs (LangGraph) and deterministic "
                       "tools.\n\nThe Auditor Agent (UC-32) reads the file documents, detects mismatched amounts, expired "
                       "documents, unsupported income and contradictory statements, and proposes an editable draft note for "
                       "the social worker.\n\nThe What-If Simulator (UC-33) answers questions such as «what if we increase the "
                       "budget by 10%?» by replaying the awarding process in memory, without changing any data.\n\nBoth use a "
                       "local model: student data never leaves the server and the model never receives names or ID numbers.")),
    dict(slug="becas-dubss-app-movil", tipo="VERSION", producto="Plataforma de Becas D.U.B.S.S.", version="1.5",
         fecha=datetime(2026, 11, 10, tzinfo=timezone.utc),
         titulo_es="Aplicación móvil para estudiantes", titulo_en="Mobile app for students",
         resumen_es="Postulación en 4 pasos, seguimiento del trámite, informes mensuales y avisos push desde Android.",
         resumen_en="4-step application, status tracking, monthly reports and push notifications on Android.",
         contenido_es=("Los estudiantes ya pueden postular, subsanar observaciones y entregar sus informes mensuales desde "
                       "una aplicación Flutter, con inicio de sesión por huella y avisos push.\n\nLa aplicación se probó con "
                       "pruebas automatizadas y se analizó con MobSF y la guía OWASP MASVS."),
         contenido_en=("Students can now apply, fix observations and submit their monthly reports from a Flutter app, with "
                       "fingerprint sign-in and push notifications.\n\nThe app was covered by automated tests and analysed "
                       "with MobSF and the OWASP MASVS guide.")),
    dict(slug="trazabilidad-blockchain", tipo="VERSION", producto="Plataforma de Becas D.U.B.S.S.", version="1.0",
         fecha=datetime(2026, 10, 20, tzinfo=timezone.utc),
         titulo_es="Trazabilidad de becas en blockchain", titulo_en="Scholarship traceability on blockchain",
         resumen_es="Cada hito del trámite queda anclado en Ethereum (Sepolia) sin datos personales.",
         resumen_en="Every milestone is anchored on Ethereum (Sepolia) without personal data.",
         contenido_es=("El envío de la postulación, la evaluación, la resolución y los informes mensuales quedan registrados "
                       "con su huella SHA-256 en un contrato inteligente. Las resoluciones se anclan por lotes con una raíz "
                       "de Merkle: una sola transacción por convocatoria."),
         contenido_en=("Application submission, evaluation, resolution and monthly reports are recorded with their SHA-256 "
                       "fingerprint in a smart contract. Resolutions are anchored in batches with a Merkle root: a single "
                       "transaction per call.")),
    dict(slug="lanzamos-nuestro-sitio", tipo="NOTICIA", producto=None, version=None,
         fecha=datetime(2026, 11, 17, tzinfo=timezone.utc),
         titulo_es="Lanzamos nuestro sitio con asistente virtual", titulo_en="We launched our website with a virtual assistant",
         resumen_es="Ahora puedes escribirnos, chatear con nuestro agente de IA o con el equipo y suscribirte a las novedades.",
         resumen_en="You can now write to us, chat with our AI agent or our team, and subscribe to our updates.",
         contenido_es=("El nuevo sitio reúne nuestros servicios y proyectos. El asistente virtual responde al instante con "
                       "información verificada de la empresa y, si lo prefieres, te comunica con una persona del equipo.\n\n"
                       "Suscríbete para recibir cada nueva versión por correo."),
         contenido_en=("The new site brings together our services and projects. The virtual assistant answers instantly with "
                       "verified company information and, if you prefer, connects you with a person from our team.\n\n"
                       "Subscribe to receive every new release by email.")),
]


def sembrar(db: Session) -> None:
    if settings.admin_password and not db.scalar(select(func.count()).select_from(Usuario)):
        db.add(Usuario(nombre=settings.admin_nombre, email=settings.admin_email.lower(),
                       password_hash=hash_password(settings.admin_password)))
    if not db.scalar(select(func.count()).select_from(Novedad)):
        for d in NOVEDADES:
            d = dict(d)
            fecha = d.pop("fecha")
            db.add(Novedad(**d, publicada=True, fecha_publicacion=fecha, notificada=True))
    db.commit()

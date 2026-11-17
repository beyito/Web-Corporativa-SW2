import secrets
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def ahora() -> datetime:
    return datetime.now(timezone.utc)


class Usuario(Base):
    """Integrante del equipo con acceso al panel."""
    __tablename__ = "usuarios"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(200))
    activo: Mapped[bool] = mapped_column(Boolean, default=True)


class MensajeContacto(Base):
    __tablename__ = "mensajes_contacto"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(160))
    empresa: Mapped[str | None] = mapped_column(String(160), nullable=True)
    asunto: Mapped[str] = mapped_column(String(40))  # COTIZACION | SOPORTE | ALIANZA | EMPLEO | OTRO
    mensaje: Mapped[str] = mapped_column(Text)
    idioma: Mapped[str] = mapped_column(String(2), default="es")
    leido: Mapped[bool] = mapped_column(Boolean, default=False)
    correo_enviado: Mapped[bool] = mapped_column(Boolean, default=False)
    creado: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora)


class Suscriptor(Base):
    """Suscripción al boletín de actualizaciones."""
    __tablename__ = "suscriptores"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    idioma: Mapped[str] = mapped_column(String(2), default="es")
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    token_baja: Mapped[str] = mapped_column(String(64), default=lambda: secrets.token_urlsafe(24), unique=True)
    creado: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora)


class Novedad(Base):
    """Noticia de la empresa o nota de versión de un producto."""
    __tablename__ = "novedades"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    tipo: Mapped[str] = mapped_column(String(20), default="NOTICIA")  # NOTICIA | VERSION
    producto: Mapped[str | None] = mapped_column(String(80), nullable=True)
    version: Mapped[str | None] = mapped_column(String(20), nullable=True)
    titulo_es: Mapped[str] = mapped_column(String(200))
    titulo_en: Mapped[str] = mapped_column(String(200))
    resumen_es: Mapped[str] = mapped_column(String(400))
    resumen_en: Mapped[str] = mapped_column(String(400))
    contenido_es: Mapped[str] = mapped_column(Text)
    contenido_en: Mapped[str] = mapped_column(Text)
    publicada: Mapped[bool] = mapped_column(Boolean, default=False)
    fecha_publicacion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notificada: Mapped[bool] = mapped_column(Boolean, default=False)
    creado: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora)


class ChatSesion(Base):
    """Conversación del chat: la atiende el agente IA hasta que el visitante pide a una persona."""
    __tablename__ = "chat_sesiones"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    token: Mapped[str] = mapped_column(String(64), default=lambda: secrets.token_urlsafe(32))
    idioma: Mapped[str] = mapped_column(String(2), default="es")
    estado: Mapped[str] = mapped_column(String(20), default="AGENTE")  # AGENTE | ESPERANDO | HUMANO | CERRADA
    nombre: Mapped[str | None] = mapped_column(String(120), nullable=True)
    email: Mapped[str | None] = mapped_column(String(160), nullable=True)
    atendida_por: Mapped[str | None] = mapped_column(String(120), nullable=True)
    creado: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora)
    actualizado: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora)
    mensajes: Mapped[list["ChatMensaje"]] = relationship(
        back_populates="sesion", order_by="ChatMensaje.id", cascade="all, delete-orphan")


class ChatMensaje(Base):
    __tablename__ = "chat_mensajes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sesion_id: Mapped[str] = mapped_column(ForeignKey("chat_sesiones.id"), index=True)
    autor: Mapped[str] = mapped_column(String(20))  # VISITANTE | AGENTE | EQUIPO | SISTEMA
    texto: Mapped[str] = mapped_column(Text)
    origen: Mapped[str | None] = mapped_column(String(30), nullable=True)  # base_conocimiento | modelo | respaldo
    creado: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora)
    sesion: Mapped[ChatSesion] = relationship(back_populates="mensajes")

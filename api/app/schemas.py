from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Idioma = Literal["es", "en"]


class ContactoIn(BaseModel):
    nombre: str = Field(min_length=2, max_length=120)
    email: EmailStr
    empresa: str | None = Field(default=None, max_length=160)
    asunto: Literal["COTIZACION", "SOPORTE", "ALIANZA", "EMPLEO", "OTRO"]
    mensaje: str = Field(min_length=10, max_length=3000)
    idioma: Idioma = "es"
    sitio_web: str | None = None  # trampa para bots: un humano lo deja vacío


class SuscripcionIn(BaseModel):
    email: EmailStr
    idioma: Idioma = "es"


class NovedadOut(BaseModel):
    slug: str
    tipo: str
    producto: str | None
    version: str | None
    titulo: str
    resumen: str
    contenido: str | None = None
    fecha_publicacion: datetime | None


class NovedadIn(BaseModel):
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=160)
    tipo: Literal["NOTICIA", "VERSION"] = "NOTICIA"
    producto: str | None = Field(default=None, max_length=80)
    version: str | None = Field(default=None, max_length=20)
    titulo_es: str = Field(min_length=3, max_length=200)
    titulo_en: str = Field(min_length=3, max_length=200)
    resumen_es: str = Field(min_length=3, max_length=400)
    resumen_en: str = Field(min_length=3, max_length=400)
    contenido_es: str = Field(min_length=3)
    contenido_en: str = Field(min_length=3)
    publicada: bool = False


class NovedadAdminOut(NovedadIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    fecha_publicacion: datetime | None
    notificada: bool


class ChatInicioIn(BaseModel):
    idioma: Idioma = "es"


class ChatMensajeIn(BaseModel):
    texto: str = Field(min_length=1, max_length=1000)


class ChatDatosIn(BaseModel):
    nombre: str | None = Field(default=None, max_length=120)
    email: EmailStr | None = None


class ChatMensajeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    autor: str
    texto: str
    origen: str | None
    creado: datetime


class ChatSesionOut(BaseModel):
    id: str
    token: str
    estado: str
    mensajes: list[ChatMensajeOut]


class ChatEstadoOut(BaseModel):
    estado: str
    atendida_por: str | None
    mensajes: list[ChatMensajeOut]


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)

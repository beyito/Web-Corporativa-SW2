"""Configuración del sitio corporativo (variables de entorno o .env)."""
from pydantic import AliasChoices, Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", populate_by_name=True)

    database_url: str = "sqlite:///./sitio.db"
    secret_key: str = "cambiar-en-produccion"
    token_minutos: int = 480

    # Primer usuario del panel (se crea si no hay ninguno)
    admin_nombre: str = "Administrador"
    admin_email: str = "admin@example.com"
    admin_password: str = ""

    # Agente IA (Ollama local). Vacío = solo base de conocimiento
    ollama_url: str = ""
    ollama_model: str = "qwen2.5:3b"
    ollama_timeout: float = 90.0

    # Correo saliente (SMTP). Sin servidor = los mensajes se guardan, no se envían.
    # Admite los nombres del autor: CORREO (cuenta Gmail) y APLICACION_PASSWORD (contraseña de aplicación).
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_usuario: str = Field("", validation_alias=AliasChoices("SMTP_USUARIO", "CORREO"))
    smtp_password: str = Field("", validation_alias=AliasChoices("SMTP_PASSWORD", "APLICACION_PASSWORD"))
    smtp_remitente: str = ""
    correo_equipo: str = ""  # destino de los avisos de contacto y chat

    # WhatsApp Cloud API (Meta). Sin token ni número = el canal de WhatsApp queda apagado.
    whatsapp_token: str = ""
    whatsapp_phone_number_id: str = ""
    whatsapp_admin_phone: str = ""      # a quién avisar cuando un cliente pide hablar con una persona
    whatsapp_verify_token: str = ""     # palabra que Meta envía al registrar el webhook
    whatsapp_api_url: str = "https://graph.facebook.com/v21.0"
    whatsapp_app_secret: str = ""       # firma X-Hub-Signature-256 de cada notificación

    @property
    def whatsapp_activo(self) -> bool:
        return bool(self.whatsapp_token and self.whatsapp_phone_number_id)

    sitio_url: str = "http://localhost:5173"
    cors_origenes: str = "http://localhost:5173"

    @field_validator("smtp_password")
    @classmethod
    def _sin_espacios(cls, v: str) -> str:
        return v.replace(" ", "").strip()  # Gmail muestra la contraseña de aplicación en bloques de 4

    @model_validator(mode="after")
    def _correo_por_defecto(self):
        if self.smtp_usuario and not self.smtp_host:
            self.smtp_host = "smtp.gmail.com"
        self.smtp_remitente = self.smtp_remitente or self.smtp_usuario
        self.correo_equipo = self.correo_equipo or self.smtp_usuario
        return self


settings = Settings()

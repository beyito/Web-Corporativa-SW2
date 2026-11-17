import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.models import Usuario

_bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verificar_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except ValueError:
        return False


def crear_token(usuario: Usuario) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.token_minutos)
    return jwt.encode({"sub": str(usuario.id), "exp": exp}, settings.secret_key, algorithm="HS256")


def usuario_actual(cred: HTTPAuthorizationCredentials | None = Depends(_bearer),
                   db: Session = Depends(get_db)) -> Usuario:
    if not cred:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sesión requerida")
    try:
        datos = jwt.decode(cred.credentials, settings.secret_key, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sesión inválida o vencida")
    usuario = db.get(Usuario, int(datos["sub"]))
    if not usuario or not usuario.activo:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario inactivo")
    return usuario


class LimitePeticiones:
    """Límite simple por IP (ventana deslizante en memoria) contra spam en formularios y chat."""

    def __init__(self, maximo: int, segundos: int):
        self.maximo, self.segundos = maximo, segundos
        self._registro: dict[str, deque] = defaultdict(deque)

    def __call__(self, request: Request) -> None:
        ip = (request.headers.get("x-forwarded-for") or (request.client.host if request.client else "?")).split(",")[0].strip()
        ahora = time.monotonic()
        cola = self._registro[ip]
        while cola and ahora - cola[0] > self.segundos:
            cola.popleft()
        if len(cola) >= self.maximo:
            raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Demasiadas solicitudes; intenta en un momento.")
        cola.append(ahora)

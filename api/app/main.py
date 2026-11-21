import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import Base, SessionLocal, engine
from app.rutas import admin, chat, publico, whatsapp
from app.semilla import sembrar

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def ciclo_de_vida(_: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        sembrar(db)
    yield


app = FastAPI(title="Kallpa Software · API del sitio", version="1.0.0", lifespan=ciclo_de_vida,
              docs_url="/api/docs", openapi_url="/api/openapi.json", redoc_url=None)
app.add_middleware(CORSMiddleware, allow_origins=[o.strip() for o in settings.cors_origenes.split(",") if o.strip()],
                   allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"], allow_headers=["*"])

for r in (publico.router, chat.router, admin.router, admin.protegido, whatsapp.router):
    app.include_router(r)


@app.get("/api/salud")
def salud():
    return {"estado": "ok", "agente_modelo": bool(settings.ollama_url)}

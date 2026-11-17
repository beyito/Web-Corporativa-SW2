import os
import sys
import tempfile
from pathlib import Path

_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{Path(_tmp) / 'prueba.db'}"
os.environ["ADMIN_EMAIL"] = "equipo@example.com"
os.environ["ADMIN_PASSWORD"] = "clave-de-prueba"
os.environ["OLLAMA_URL"] = ""
os.environ["SMTP_HOST"] = ""
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def cliente():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def auth(cliente):
    r = cliente.post("/api/admin/login", json={"email": "equipo@example.com", "password": "clave-de-prueba"})
    return {"Authorization": f"Bearer {r.json()['token']}"}

FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
# Sin privilegios de root; la base SQLite vive en el volumen /data
RUN useradd --system --no-create-home kallpa && mkdir -p /data && chown kallpa /data
USER kallpa

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]

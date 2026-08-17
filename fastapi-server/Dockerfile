FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Optional build-arg: set TF_VARIANT="tensorflow-cpu==2.10.0" when building if you need a CPU-compatible TF wheel.
ARG TF_VARIANT=""
RUN pip install --no-cache-dir -r requirements.txt && \
    if [ -n "$TF_VARIANT" ]; then pip install --no-cache-dir "$TF_VARIANT"; fi

COPY . .

ENV PYTHONUNBUFFERED=1 \
    SERVICE_MODULE=genre \
    PORT=8001

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD python -c "import os, requests; requests.get(f\"http://127.0.0.1:{os.environ['PORT']}/health\", timeout=5).raise_for_status()"

CMD ["sh", "-c", "uvicorn ${SERVICE_MODULE}:app --host 0.0.0.0 --port ${PORT}"]

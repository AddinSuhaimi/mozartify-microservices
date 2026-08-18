FROM python:3.11-slim

WORKDIR /app

# Install native libraries required by the audio processing dependencies.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    ffmpeg \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

ARG TENSORFLOW_WHEEL_URL="https://github.com/AddinSuhaimi/mozartify-microservices/releases/download/tf_whl_v1/tensorflow-2.16.1-cp311-cp311-linux_x86_64.whl"

RUN curl -fL --retry 3 --retry-delay 5 \
      -o /tmp/tensorflow.whl "$TENSORFLOW_WHEEL_URL" && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir /tmp/tensorflow.whl && \
    rm /tmp/tensorflow.whl

COPY . .

ENV PYTHONUNBUFFERED=1 \
    SERVICE_MODULE=genre \
    PORT=8001

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD python -c "import os, requests; requests.get(f\"http://127.0.0.1:{os.environ['PORT']}/health\", timeout=5).raise_for_status()"

CMD ["sh", "-c", "uvicorn ${SERVICE_MODULE}:app --host 0.0.0.0 --port ${PORT}"]
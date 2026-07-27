FROM node:20-bookworm-slim

ARG AUDIVERIS_VERSION=5.6.1
ARG AUDIVERIS_DEB_URL=https://github.com/Audiveris/audiveris/releases/download/${AUDIVERIS_VERSION}/Audiveris-${AUDIVERIS_VERSION}-ubuntu22.04-x86_64.deb

ENV JAVA_TOOL_OPTIONS="-Djava.awt.headless=true"

RUN apt-get update && \
		apt-get install -y --no-install-recommends \
			ca-certificates \
			curl \
			openjdk-17-jre-headless \
			tesseract-ocr \
			libxext6 \
			libxrender1 \
			libxtst6 \
			libxi6 \
			libfreetype6 \
			libfontconfig1 && \
		rm -rf /var/lib/apt/lists/*

RUN set -eux; \
		apt-get update; \
		curl -fsSL "${AUDIVERIS_DEB_URL}" -o /tmp/audiveris.deb; \
	dpkg-deb -x /tmp/audiveris.deb /; \
		rm -f /tmp/audiveris.deb; \
	if [ -x /usr/bin/audiveris ]; then ln -sf /usr/bin/audiveris /usr/local/bin/audiveris; fi; \
	if [ -x /opt/audiveris/bin/Audiveris ]; then ln -sf /opt/audiveris/bin/Audiveris /usr/local/bin/audiveris; fi; \
		rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 8080

CMD ["npm", "start"]

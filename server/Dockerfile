FROM node:20

# Install Python for xml2abc support + other dependencies
RUN apt-get update && \
    apt-get install -y python3 python3-pip curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose backend port (using 10000 from mainserver.js)
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://127.0.0.1:10000/api/health || exit 1

# Start application
CMD ["node", "mainserver.js"]

# Dockerization Implementation Plan - Module-Based Approach

## 📋 Overview
This plan dockerizes the monolith in **Phase 1** while structuring it to enable clean **microservice extraction** in Phase 2-3. The approach respects your 10 existing modules and gradually transitions them to independent services.

## 🎯 Your 10 Modules → Microservice Mapping

| Module | Current Role | Phase 2 Service | Port | Database |
|--------|-------------|-----------------|------|----------|
| **auth** | Authentication | Auth Service | 3001 | mozartify_auth |
| **user** | User management | User Service | 3005 | mozartify_user |
| **music** | Music catalog | Music Service | 3002 | mozartify_music |
| **arts** | Artwork catalog | Arts Service | 3003 | mozartify_arts |
| **payment** | Payments/orders | Payment Service | 3004 | mozartify_payment |
| **notification** | Email/events | Notification Service | 3006 | mozartify_notifications |
| **inbox** | User messages | User Service (grouped) | 3005 | mozartify_user |
| **recommendation** | ML recommendations | Music/Arts Services | 3002/3003 | Shared |
| **analytics** | Admin stats | Payment Service (grouped) | 3004 | mozartify_payment |
| **ai** | ML orchestration | Separate AI Gateway | 5000 | N/A |

---

## 📍 Phase 1: Containerize the Monolith (Week 1)

### Goal
Run entire application in Docker **without code changes**. Prepare for modular extraction.

### Steps

#### Step 1.1 — Create Backend Dockerfile
```dockerfile
# server/Dockerfile
FROM node:20

# Install Python for xml2abc support + other dependencies
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose backend port
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:10000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "mainserver.js"]
```

#### Step 1.2 — Create server/.dockerignore
```
node_modules
npm-debug.log
.env
.git
uploads
.DS_Store
```

#### Step 1.3 — Create root docker-compose.yml
```yaml
version: '3.9'

services:
  # ===== INFRASTRUCTURE =====
  mongo:
    image: mongo:7
    container_name: mozartify-mongo
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: mozartify
    volumes:
      - mongo_data:/data/db
    networks:
      - mozartify-network
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: mozartify-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - mozartify-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ===== BACKEND MONOLITH =====
  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: mozartify-backend
    restart: always
    ports:
      - "10000:10000"
    env_file:
      - ./server/.env.docker
    depends_on:
      mongo:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./server:/app
      - /app/node_modules
      - ./server/uploads:/app/uploads
    networks:
      - mozartify-network
    environment:
      - NODE_ENV=development
      - MONGO_URI=mongodb://mongo:27017/mozartify
      - REDIS_URI=redis://redis:6379
      - PYTHONUNBUFFERED=1

  # ===== FASTAPI AI SERVICES =====
  ai-service:
    build:
      context: ./fastapi-server
      dockerfile: Dockerfile
    container_name: mozartify-ai
    restart: always
    ports:
      - "5000:5000"
    volumes:
      - ./fastapi-server:/app
      - ./fastapi-server/model:/app/model
    networks:
      - mozartify-network
    environment:
      - FLASK_ENV=development

networks:
  mozartify-network:
    driver: bridge

volumes:
  mongo_data:
  redis_data:
```

#### Step 1.4 — Create server/.env.docker
```env
# Docker Environment Variables
NODE_ENV=development
PORT=10000

# MongoDB (Docker DNS)
MONGO_URI=mongodb://mongo:27017/mozartify

# Redis (Docker DNS)
REDIS_URI=redis://redis:6379

# Frontend URLs
FRONTEND_DEV_URL=http://localhost:5173
FRONTEND_PROD_URL=https://yourdomain.com

# Backend URLs
BACKEND_DEV_URL=http://localhost:10000
BACKEND_PROD_URL=https://api.yourdomain.com

# Firebase Config
FIREBASE_API_KEY=your_key
FIREBASE_AUTH_DOMAIN=your_domain
FIREBASE_PROJECT_ID=your_project
FIREBASE_STORAGE_BUCKET=your_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Stripe
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_PUBLIC_KEY=your_stripe_public_key

# Email/Services
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

# AI Services
AI_SERVICE_URL=http://ai-service:5000

# JWT Secret
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
```

#### Step 1.5 — Create fastapi-server/Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "main.py"]
```

#### Step 1.6 — Create .dockerignore at root
```
.git
.gitignore
README.md
node_modules
npm-debug.log
.env
.DS_Store
venv
__pycache__
*.pyc
.pytest_cache
fastapi-server/model/
uploads/
```

---

## 🚀 Phase 1 Execution

### Commands to Run

```bash
# From project root
cd c:\dev\mozartify

# Build and start containers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f mongo

# Test backend connectivity
curl http://localhost:10000/health

# Stop all containers
docker-compose down

# Stop and remove volumes (CAREFUL!)
docker-compose down -v
```

### Phase 1 Validation Checklist

- [ ] Backend container builds successfully
- [ ] MongoDB starts and is accessible
- [ ] Backend connects to MongoDB
- [ ] Redis starts successfully
- [ ] All ports are available
- [ ] Test API endpoints (auth, music, payment)
- [ ] Uploads directory works
- [ ] Environment variables load correctly
- [ ] AI service starts (fastapi-server)
- [ ] Logs show no errors

---

## 📦 Phase 2: Prepare Modules for Extraction (Week 2)

### Goal
Refactor modules to be service-ready without extracting yet.

### For Each Module (auth, music, arts, user, etc.):

#### Step 2.1 — Create Module Service Export
```javascript
// server/modules/{module}/service.js
module.exports = {
  router: require('./routes'),
  models: require('./models'),
  controllers: require('./controllers'),
  middleware: require('./middleware'),
};
```

#### Step 2.2 — Add Module Health Endpoint
```javascript
// In each module's routes
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    module: 'auth', // or appropriate module name
    timestamp: new Date()
  });
});
```

#### Step 2.3 — Environment Variables per Module
Each module should respect `.env` for service URLs:
```env
# Auth Service will check for these (once extracted)
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3005
PAYMENT_SERVICE_URL=http://localhost:3004
```

---

## 🏗️ Phase 3: Extract First Microservice (Week 3)

### Recommended First Service: **Auth Service**

**Why Auth First?**
- Least dependent on other modules
- Most business-critical
- Easiest to validate
- Can be tested in isolation

#### Step 3.1 — Create services/auth directory structure
```
services/
├── auth/
│   ├── src/
│   │   ├── routes.js
│   │   ├── models/
│   │   ├── controllers/
│   │   └── middleware/
│   ├── Dockerfile
│   ├── package.json
│   └── index.js (express app + startup)
├── music/  (future)
└── payment/ (future)
```

#### Step 3.2 — Create services/auth/Dockerfile
```dockerfile
FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "index.js"]
```

#### Step 3.3 — Update docker-compose.yml
```yaml
services:
  auth-service:
    build:
      context: ./services/auth
      dockerfile: Dockerfile
    container_name: mozartify-auth
    ports:
      - "3001:3001"
    env_file:
      - ./services/auth/.env
    depends_on:
      mongo:
        condition: service_healthy
    environment:
      - NODE_ENV=development
      - MONGO_URI=mongodb://mongo:27017/mozartify_auth
      - AUTH_SERVICE_PORT=3001
    networks:
      - mozartify-network
    volumes:
      - ./services/auth:/app
      - /app/node_modules

  # Keep backend for remaining modules temporarily
  backend:
    # ... existing config
    # Mark as deprecated, will be removed once all services extracted
```

---

## 📊 Phase 4-5: Sequential Service Extraction

**Order of Extraction:**
1. **Auth Service** (Week 3) — Independent, critical
2. **User Service** (Week 3) — Depends on Auth
3. **Music Service** (Week 4) — Heavy lifting
4. **Notification Service** (Week 4) — Event-driven
5. **Payment Service** (Week 5) — Complex business logic
6. **Arts Service** (Week 5) — Similar to Music
7. **Others** — As needed

Each follows same pattern as Auth Service extraction.

---

## 🔄 Inter-Service Communication (Phase 3+)

### Once Services Are Extracted

**Option A: Direct HTTP Calls**
```javascript
// From music-service calling user-service
const userResponse = await fetch('http://user-service:3005/api/user/profile');
```

**Option B: API Gateway Pattern** (Recommended)
```javascript
// gateway/routes.js
app.use('/api/auth', proxy('http://auth-service:3001'));
app.use('/api/music', proxy('http://music-service:3002'));
app.use('/api/payment', proxy('http://payment-service:3004'));
```

**Option C: Event-Driven (Redis Pub/Sub)**
```javascript
// Publish event when music purchased
redis.publish('purchase.completed', JSON.stringify({
  userId: '123',
  musicId: '456'
}));

// Notification service listens
redis.subscribe('purchase.completed', (message) => {
  // Send email
});
```

---

## ⚠️ Critical Points

### Database Strategy
- **Phase 1:** All modules → single `mozartify` database
- **Phase 2-3:** When extracting service → separate database per service
  - Auth: `mozartify_auth`
  - Music: `mozartify_music`
  - Payment: `mozartify_payment`
  - etc.

### Volume Management
```yaml
# Phase 1: Shared volume
volumes:
  - ./server:/app
  - /app/node_modules

# Phase 3: Per-service volumes
volumes:
  - ./services/auth:/app
  - /app/node_modules
```

### Networking
All containers in same `mozartify-network` — enables DNS-based communication:
- `mongo:27017`
- `redis:6379`
- `auth-service:3001`
- etc.

---

## 🎯 Success Criteria per Phase

### Phase 1 Complete When:
- ✅ All containers start without errors
- ✅ Backend connects to MongoDB and Redis
- ✅ All API endpoints respond
- ✅ Uploads work
- ✅ Firebase/Stripe initialization succeeds
- ✅ AI service accessible from backend

### Phase 2 Complete When:
- ✅ Each module exports `service.js`
- ✅ Health endpoints implemented
- ✅ Environment variables prepared
- ✅ No code logic changed (still monolith)

### Phase 3 Complete When:
- ✅ Auth service runs in separate container
- ✅ Auth service has own database
- ✅ Backend makes HTTP calls to auth-service
- ✅ Authentication still works end-to-end
- ✅ All tests pass

---

## 📝 Files to Create Now (Phase 1)

1. ✅ `server/Dockerfile`
2. ✅ `server/.dockerignore`
3. ✅ `docker-compose.yml` (root)
4. ✅ `server/.env.docker`
5. ✅ `fastapi-server/Dockerfile`
6. ✅ `.dockerignore` (root)

## 🚀 Next Steps

1. Create files listed above
2. Update `server/.env` with Docker settings
3. Run `docker-compose up -d`
4. Validate all containers healthy
5. Test API endpoints
6. Commit to git with phase marker

---

## 📚 Module Reference

```
server/modules/
├── auth/           → Auth Service (Phase 3)
├── user/           → User Service (Phase 3)
├── music/          → Music Service (Phase 4)
├── arts/           → Arts Service (Phase 5)
├── payment/        → Payment Service (Phase 5)
├── notification/   → Notification Service (Phase 4)
├── inbox/          → Part of User Service
├── recommendation/ → Part of Music/Arts Services
├── analytics/      → Part of Payment Service
└── ai/             → Already separate (FastAPI)
```

Each will eventually become:
```
services/{module}/
├── src/
├── Dockerfile
├── package.json
└── .env
```

# Phase 3: First Microservice Extraction - Auth Service

## 🎯 Phase 3 Goal
Extract the Auth module into a standalone microservice running in its own container. Set the pattern for extracting remaining modules.

**Expected Duration:** 3-4 days

---

## ✅ Prerequisites (Phase 2 Complete)

Before starting Phase 3, verify Phase 2 is done:
- [ ] Auth module has `service.js`
- [ ] Auth module has `.env.example`
- [ ] Auth module has `MODULE_INFO.json`
- [ ] Health endpoint: `GET /api/auth/health` works
- [ ] All tests pass in monolith mode

---

## 🚀 Phase 3 Step-by-Step

### Step 1: Create Service Directory Structure

```bash
# From project root
mkdir -p services/auth/src
mkdir -p services/auth/src/routes
mkdir -p services/auth/src/models
mkdir -p services/auth/src/controllers
mkdir -p services/auth/src/middleware
```

### Step 2: Copy Auth Module to Service

```bash
# Copy auth module code to service directory
cd c:\dev\mozartify

# Copy main files
copy server\modules\auth\routes services\auth\src\routes\
copy server\modules\auth\models services\auth\src\models\
copy server\modules\auth\controllers services\auth\src\controllers\
copy server\modules\auth\middleware services\auth\src\middleware\

# Copy service exports
copy server\modules\auth\service.js services\auth\src\service.js
copy server\modules\auth\MODULE_INFO.json services\auth\src\MODULE_INFO.json
```

### Step 3: Create Auth Service package.json

```json
{
  "name": "mozartify-auth-service",
  "version": "1.0.0",
  "description": "Auth microservice for Mozartify",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest",
    "lint": "eslint ."
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "jwt-simple": "^0.5.6",
    "bcryptjs": "^2.4.3",
    "firebase-admin": "^11.0.0",
    "dotenv": "^16.0.3",
    "cors": "^2.8.5",
    "express-session": "^1.17.3",
    "redis": "^4.6.5"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Location:** `services/auth/package.json`

### Step 4: Create Auth Service index.js (Entrypoint)

```javascript
// services/auth/index.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 3001;

// ============== MIDDLEWARE ==============
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

// Session configuration
const sessionOptions = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  }
};

app.use(session(sessionOptions));

// ============== DATABASE CONNECTION ==============
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log("✅ Auth Service: Connected to MongoDB"))
.catch((err) => {
  console.error("❌ Auth Service: MongoDB connection failed:", err);
  process.exit(1);
});

// ============== HEALTH CHECK ==============
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    module: "auth",
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// ============== API ROUTES ==============
const authRoutes = require("./src/routes");
app.use("/api/auth", authRoutes);

// ============== ERROR HANDLING ==============
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    timestamp: new Date()
  });
});

// ============== START SERVER ==============
app.listen(PORT, () => {
  console.log(`🚀 Auth Service running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.MONGO_URI}`);
});

module.exports = app;
```

**Location:** `services/auth/index.js`

### Step 5: Create Auth Service Dockerfile

```dockerfile
# services/auth/Dockerfile
FROM node:20

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port 3001
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start service
CMD ["node", "index.js"]
```

**Location:** `services/auth/Dockerfile`

### Step 6: Create Auth Service .env

```env
# services/auth/.env
NODE_ENV=development
AUTH_SERVICE_PORT=3001
AUTH_SERVICE_NAME=auth-service

# Database (separate DB for auth service)
MONGO_URI=mongodb://mongo:27017/mozartify_auth

# JWT
JWT_SECRET=your_super_secret_jwt_key_12345
JWT_EXPIRY=7d

# Session
SESSION_SECRET=your_super_secret_session_key_12345

# Firebase
FIREBASE_API_KEY=your_firebase_key
FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
FIREBASE_PROJECT_ID=your_project
FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com

# Frontend
FRONTEND_URL=http://localhost:5173

# Service discovery (Docker DNS)
USER_SERVICE_URL=http://user-service:3005
NOTIFICATION_SERVICE_URL=http://notification-service:3006
```

**Location:** `services/auth/.env`

### Step 7: Create .dockerignore for Service

```
node_modules
npm-debug.log
.env
.git
.DS_Store
.vscode
dist
build
```

**Location:** `services/auth/.dockerignore`

### Step 8: Update docker-compose.yml

Add auth-service and comment out backend (or keep for now):

```yaml
version: '3.9'

services:
  # ... existing mongo, redis services ...

  # ===== PHASE 3: EXTRACTED SERVICES =====
  auth-service:
    build:
      context: ./services/auth
      dockerfile: Dockerfile
    container_name: mozartify-auth
    restart: always
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
    networks:
      - mozartify-network
    volumes:
      - ./services/auth:/app
      - /app/node_modules
    labels:
      - "com.mozartify.service=auth"
      - "com.mozartify.phase=3"

  # ===== PHASE 1: MONOLITH (Temporarily kept) =====
  backend:
    # ... existing backend config ...
    # Mark as deprecated, will be removed once all services extracted
    # For now, other modules still run here
    environment:
      - NODE_ENV=development
      - MONGO_URI=mongodb://mongo:27017/mozartify
      # Auth service is now external - backend calls it
      - AUTH_SERVICE_URL=http://auth-service:3001
    labels:
      - "com.mozartify.service=backend-monolith"
      - "com.mozartify.phase=3"
      - "com.mozartify.note=Temporary - other modules still here"

networks:
  mozartify-network:
    driver: bridge

volumes:
  mongo_data:
  redis_data:
```

### Step 9: Update Backend to Call Auth Service

**In mainserver.js**, replace direct auth imports with HTTP calls:

**Before (tightly coupled):**
```javascript
const authRoutes = require('./modules/auth/routes');
app.use('/api/auth', authRoutes);
```

**After (loosely coupled):**
```javascript
// Auth service is now external
// Forward requests to it
const { createProxyMiddleware } = require('http-proxy-middleware');

app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  onError: (err, req, res) => {
    console.error('Auth service error:', err);
    res.status(503).json({ error: 'Auth service unavailable' });
  }
}));
```

**Update server/package.json** to include proxy middleware:
```json
{
  "dependencies": {
    "http-proxy-middleware": "^2.0.6"
  }
}
```

### Step 10: Verify Auth Service Works

```bash
# Build the new service
docker-compose build

# Start all containers
docker-compose up -d

# Check containers
docker-compose ps
# Should show: auth-service, backend, mongo, redis, ai-service

# Test auth service health
curl http://localhost:3001/health
# Expected: { "status": "healthy", "module": "auth" }

# Test auth endpoint through backend proxy
curl http://localhost:10000/api/auth/health
# Should also return healthy

# Check auth service logs
docker-compose logs -f auth-service
```

---

## 🧪 Phase 3 Testing Checklist

### Container Health
- [ ] Auth service container starts
- [ ] Auth service connects to MongoDB
- [ ] Health endpoint responds: `curl http://localhost:3001/health`
- [ ] All containers show "healthy" status: `docker-compose ps`

### Connectivity
- [ ] Backend can reach auth service: check logs for successful proxy
- [ ] Backend health endpoint works: `curl http://localhost:10000/health`
- [ ] Auth endpoints accessible through backend: `curl http://localhost:10000/api/auth/login`

### Functionality
- [ ] User can register: POST `/api/auth/register`
- [ ] User can login: POST `/api/auth/login`
- [ ] User can logout: POST `/api/auth/logout`
- [ ] JWT tokens work correctly
- [ ] Sessions created properly
- [ ] Firebase integration works

### Data
- [ ] Auth data in separate MongoDB (`mozartify_auth` database)
- [ ] User data separate from auth service
- [ ] No data loss from previous monolith setup

### Logs
- [ ] Auth service logs show successful database connection
- [ ] Backend logs show successful auth-service connection
- [ ] No error messages in logs

---

## ⚠️ Common Issues & Solutions

### Issue: "Auth service fails to start"
```bash
# Check logs
docker-compose logs auth-service

# Common causes:
# 1. Port 3001 already in use
# 2. Database connection string wrong
# 3. Environment variables not set

# Solution: Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Issue: "Backend can't reach auth-service"
```bash
# Verify DNS resolution
docker-compose exec backend curl http://auth-service:3001/health

# If fails: services not on same network
# Check docker-compose.yml has both in 'mozartify-network'

# Restart network
docker network rm mozartify_mozartify-network
docker-compose up -d
```

### Issue: "Data not found in auth-service"
```bash
# Verify database names are different
# Old data in: mozartify (monolith)
# New data in: mozartify_auth (service)

# To migrate old auth data:
docker-compose exec mongo mongosh
# > use mozartify
# > db.users.find().pretty()  // Check data exists
# > db.copyDatabase("mozartify", "mozartify_auth")
# Exit mongosh: exit
```

---

## 🔄 Next Services (Phase 3 Continued)

Once auth-service works, repeat this pattern for:

### Phase 3 (Weeks 3-4):
1. **User Service** (depends on auth)
2. **Notification Service** (event-driven)

### Phase 4 (Weeks 4-5):
3. **Music Service** (content)
4. **Arts Service** (content)
5. **Payment Service** (complex)

Each follows same pattern:
- Create `services/{module}/` directory
- Copy from `server/modules/{module}/`
- Create Dockerfile
- Create index.js
- Update docker-compose.yml
- Backend proxies to it

---

## 📊 Phase 3 Success Criteria

After completing Phase 3:
- ✅ Auth service runs in separate container
- ✅ Auth service has own database (`mozartify_auth`)
- ✅ Backend proxies auth requests to service
- ✅ All auth functionality still works
- ✅ Health checks pass
- ✅ Logs show no errors
- ✅ Pattern established for other services

---

## 🎁 Pattern Summary

This pattern repeats for all 10 modules:

1. **Create** `services/{module}/` structure
2. **Copy** module code from `server/modules/{module}/`
3. **Create** Dockerfile, index.js, package.json
4. **Update** docker-compose.yml
5. **Update** backend to proxy requests
6. **Test** end-to-end
7. **Verify** data integrity

---

## 📚 Files Created in Phase 3

```
services/auth/
├── src/
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   ├── middleware/
│   └── service.js
├── index.js                ← NEW: Service entrypoint
├── package.json            ← NEW: Service dependencies
├── .env                    ← NEW: Service config
├── Dockerfile              ← NEW: Container definition
└── .dockerignore           ← NEW: Ignore patterns

Updated:
├── docker-compose.yml      ← MODIFIED: Added auth-service
├── server/mainserver.js    ← MODIFIED: Proxy to auth-service
└── server/package.json     ← MODIFIED: Added http-proxy-middleware
```

---

## 📖 Architecture After Phase 3

```
┌──────────────────────────────────────────────────────────┐
│                      Frontend (5173)                      │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│          Backend Monolith (10000) - Phase 1              │
│                                                          │
│  Routes:                                                 │
│  /api/auth    → Proxies to auth-service:3001 (Phase 3)  │
│  /api/music   → Local module (until Phase 4)            │
│  /api/user    → Local module (until Phase 3)            │
│  /api/payment → Local module (until Phase 5)            │
│  /api/...     → Other local modules                      │
└──────────────┬───────────────────────────────────────────┘
               │
      ┌────────┴──────────┬────────────┐
      ▼                   ▼            ▼
  Auth Service        MongoDB        Redis
  (3001)              (27017)        (6379)
  
  DB: mozartify_auth
  Connection: healthy
  Status: ✅ Running separately
```

---

## 🚀 Next: Phase 4

→ Repeat this pattern for **User Service** and **Notification Service**
→ See `PHASE_4_MICROSERVICES_ROLLOUT.md` (coming next)

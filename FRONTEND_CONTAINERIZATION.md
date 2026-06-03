# Frontend Containerization Guide

## 🎯 Overview

The frontend (Vite React application) is now containerized and runs in a separate container alongside the backend.

**Architecture:**
```
Frontend Container (Nginx) ← Port 5173
├── Serves compiled SPA
├── Proxies `/api` calls to backend:10000
└── Handles SPA routing (all routes → index.html)

Backend Container (Node.js) ← Port 10000
├── Handles API requests
├── Connects to MongoDB & Redis
└── Communicates with frontend
```

---

## 📦 Files Created

### 1. **Dockerfile** (Root Directory)
Multi-stage build:
- **Stage 1:** Build Vite app with Node 20
- **Stage 2:** Serve built app with Nginx Alpine

### 2. **nginx.conf** (Root Directory)
Nginx configuration for:
- SPA routing (all requests → index.html)
- Static asset caching
- Gzip compression
- Security headers
- Health check endpoint

### 3. **.env.example** (Root Directory)
Template for frontend environment variables:
- `VITE_API_URL` - Backend API endpoint

### 4. Updated **docker-compose.yml**
Added `frontend` service:
- Builds from root Dockerfile
- Exposes port 5173
- Depends on backend
- Sets `VITE_API_URL=http://backend:10000`

---

## 🚀 Running Frontend + Backend

### Quick Start

```bash
cd c:\dev\mozartify

# Start all containers (backend, frontend, mongo, redis)
docker-compose up -d

# Check status
docker-compose ps

# Expected output:
# NAME                STATUS         PORTS
# mozartify-mongo     Up (healthy)   27017->27017/tcp
# mozartify-redis     Up (healthy)   6379->6379/tcp
# mozartify-backend   Up             10000->10000/tcp
# mozartify-frontend  Up             5173->5173/tcp
```

### Test Both Services

```bash
# Test frontend
curl http://localhost:5173
# Should return HTML (index.html)

# Test backend
curl http://localhost:10000/health
# Should return JSON response

# Test API call through frontend container
# From browser: http://localhost:5173
# Frontend will proxy API calls to backend:10000
```

---

## 🧪 Phase: Frontend + Backend Monolith

This is **Pre-Phase 3** setup:

```
┌─────────────────────────────────────┐
│  Frontend Container                  │
│  (Nginx + Built Vite App)           │
│  Port: 5173                         │
│  ├── Static files cached            │
│  ├── SPA routing enabled            │
│  └── Proxies to backend             │
└──────────────┬──────────────────────┘
               │ (API calls)
               ▼
┌─────────────────────────────────────┐
│  Backend Container (Monolith)        │
│  (Node.js + All Modules)            │
│  Port: 10000                        │
│  ├── Auth Module                    │
│  ├── User Module                    │
│  ├── Music Module                   │
│  ├── Arts Module                    │
│  ├── Payment Module                 │
│  ├── Notification Module            │
│  └── ... (all 10 modules)           │
└──────────────┬──────────────────────┘
               │
      ┌────────┼────────┐
      ▼        ▼        ▼
  MongoDB   Redis    AI Service
```

**Status: Full application ready to run in Docker! ✅**

---

## 🛠️ Development Workflow

### Making Frontend Changes

For development, you can edit the Dockerfile to use Vite dev server for hot reload:

```dockerfile
# Option: Dev mode with hot reload (instead of Nginx)
CMD ["npm", "run", "dev"]
```

Then update docker-compose.yml:
```yaml
frontend:
  build: .
  ports:
    - "5173:5173"
  volumes:
    - .:/app
    - /app/node_modules
  environment:
    - VITE_API_URL=http://backend:10000
```

### Rebuild Frontend After Changes

```bash
# Rebuild frontend container
docker-compose build frontend

# Restart frontend service
docker-compose restart frontend

# Or recreate with latest build
docker-compose up -d frontend
```

---

## 🔗 Environment Variables

### During Build (docker-compose)
```yaml
environment:
  - VITE_API_URL=http://backend:10000
```

### At Runtime (Browser)
The built app at `dist/index.html` includes the API URL configured during build.

### Changing API URL
```yaml
# In docker-compose.yml
frontend:
  environment:
    - VITE_API_URL=http://your-backend-url:10000
```

Then rebuild:
```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

---

## 📊 Dockerfile Breakdown

### Stage 1: Build
```dockerfile
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
```
- Installs dependencies
- Copies all source files
- Runs `npm run build` → creates `dist/` folder

### Stage 2: Serve
```dockerfile
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 5173
```
- Only copies built `dist/` (small image)
- Uses Nginx for serving (production-ready)
- Final image size: ~50MB (vs 500MB+ with Node)

---

## 🔐 Security Notes

The Nginx configuration includes:
- ✅ Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- ✅ Gzip compression (reduces bandwidth)
- ✅ Proper CORS headers
- ✅ Cache control (static assets cached 1 year, index.html not cached)
- ✅ SPA fallback routing

---

## ❌ Troubleshooting

### Issue: Frontend container won't build

```bash
# Check build logs
docker-compose build --no-cache frontend

# Common causes:
# 1. Missing dependencies in package.json
# 2. Syntax errors in src code
# 3. Missing .env file (if required by build)

# Solution: Check npm run build works locally
npm run build
```

### Issue: Frontend shows 502 Bad Gateway

```bash
# Check nginx logs
docker-compose logs frontend

# Common cause: Backend not running or not on same network
docker-compose ps
# Verify backend and frontend both show "Up"

# Solution: Restart both
docker-compose restart backend frontend
```

### Issue: API calls from frontend fail

```bash
# From browser console, check:
# 1. Network tab shows requests to http://localhost:5173/api/*
# 2. Backend responds on port 10000

# Test manually:
curl http://localhost:10000/api/auth/health

# If it fails, backend isn't running:
docker-compose logs backend
```

### Issue: Vite proxy not working inside Docker

The Dockerfile uses production build (Nginx), so Vite proxy doesn't apply.
Instead, frontend calls backend via DNS name during Docker build:
```dockerfile
# Set at docker-compose level:
environment:
  - VITE_API_URL=http://backend:10000
```

---

## 📈 Performance Considerations

### Image Sizes
- **Frontend (Nginx):** ~50-100 MB
- **Backend (Node):** ~500-800 MB
- **MongoDB:** 500 MB (downloaded first time)
- **Redis:** 50 MB

### Build Time
- **Frontend:** 3-5 minutes (npm install + build)
- **Backend:** 2-3 minutes (npm install)
- Total first run: 5-10 minutes

### Startup Time
- All containers ready: ~15-30 seconds
- Frontend: ~2-5 seconds (Nginx)
- Backend: ~5-10 seconds (Node + DB connection)

---

## 🎯 Next Steps (Phase 2-3)

### Before Service Extraction:
1. ✅ Containerize frontend (Done!)
2. ✅ Containerize backend (Done!)
3. ⏭️ **Next:** Add health endpoints to all 10 modules
4. ⏭️ **Then:** Create module service exports

### During Service Extraction (Phase 3):
Once individual microservices are extracted, the frontend will:
- Continue calling backend on port 10000
- Backend forwards to individual services (3001, 3002, 3003, etc.)
- No frontend changes needed!

---

## 📝 Docker Commands

```bash
# View frontend logs
docker-compose logs -f frontend

# Access frontend container shell
docker-compose exec frontend sh

# Rebuild and restart
docker-compose up -d --build frontend

# Stop only frontend
docker-compose stop frontend

# Remove frontend container (data safe)
docker-compose rm -f frontend
```

---

## ✅ Verification Checklist

After running `docker-compose up -d`:

- [ ] `docker-compose ps` shows 4 running containers
- [ ] Frontend container shows "Up" status
- [ ] `curl http://localhost:5173` returns HTML
- [ ] `curl http://localhost:5173/health` returns "healthy"
- [ ] `curl http://localhost:10000/health` returns JSON
- [ ] Can access http://localhost:5173 in browser
- [ ] Frontend loads without errors
- [ ] API calls from frontend to backend work
- [ ] No CORS errors in browser console
- [ ] MongoDB and Redis are accessible

---

## 🚀 You're Ready!

```bash
cd c:\dev\mozartify
docker-compose up -d

# Access application
# Frontend: http://localhost:5173
# Backend API: http://localhost:10000
# MongoDB: localhost:27017
# Redis: localhost:6379
```

**Your application is now fully containerized! 🎉**

Next: Phase 2 module preparation → PHASE_2_MODULE_PREPARATION.md

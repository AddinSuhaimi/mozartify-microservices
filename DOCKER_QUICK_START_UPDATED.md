# 🐳 Docker Quick Start Guide - Mozartify Phase 1

## ✅ Phase 1 Goal
Run entire application (frontend + backend) in Docker without code changes. Prepare for microservice extraction.

---

## 📋 Prerequisites

- Docker installed: https://www.docker.com/products/docker-desktop
- Docker running (check: `docker --version`)
- Port 5173 available (Frontend Nginx)
- Port 10000 available (Backend Node)
- Port 27017 available (MongoDB)
- Port 6379 available (Redis)

---

## 🚀 Quick Start

### 1. Prepare Environment Variables

```bash
# Backend environment
cd c:\dev\mozartify\server
copy .env.docker.example .env.docker
# Fill in your secrets in .env.docker

# Frontend environment (optional)
cd ..
copy .env.example .env
# Defaults should work, but customize if needed
```

### 2. Start All Containers

```bash
# From project root: c:\dev\mozartify
cd c:\dev\mozartify

# Build and start all services (first run takes 5-10 minutes)
docker-compose up -d

# Expected output:
# ✓ Creating mozartify-mongo ... done
# ✓ Creating mozartify-redis ... done
# ✓ Creating mozartify-backend ... done
# ✓ Creating mozartify-frontend ... done
```

### 3. Verify Containers Are Running

```bash
# Check status
docker-compose ps

# Expected output (all should show "Up"):
# NAME                STATUS              PORTS
# mozartify-mongo     Up                  0.0.0.0:27017->27017/tcp
# mozartify-redis     Up                  0.0.0.0:6379->6379/tcp
# mozartify-backend   Up (starting...)    0.0.0.0:10000->10000/tcp
# mozartify-frontend  Up                  0.0.0.0:5173->5173/tcp
```

### 4. Access the Application

```bash
# 🌐 Open in browser:
http://localhost:5173          # Frontend (Vite React App)
http://localhost:10000         # Backend API

# 📊 Or use curl:
curl http://localhost:5173     # Frontend HTML
curl http://localhost:10000/health  # Backend health
```

### 5. Monitor Logs (Important!)

```bash
# Watch all services starting up
docker-compose logs -f

# Watch specific services
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f mongo

# Exit: Ctrl+C
```

---

## ✅ Phase 1 Validation Checklist

Run these tests in order:

```bash
# 1. Frontend responds with HTML
curl http://localhost:5173
# ✓ Should return HTML (index.html)

# 2. Backend health endpoint works
curl http://localhost:10000/health
# ✓ Should return JSON response

# 3. Frontend health endpoint works
curl http://localhost:5173/health
# ✓ Should return "healthy"

# 4. MongoDB is running
docker-compose exec mongo mongosh --eval "db.runCommand('ping')"
# ✓ { ok: 1 }

# 5. Redis is running
docker-compose exec redis redis-cli ping
# ✓ PONG

# 6. All containers show "healthy" or "Up"
docker-compose ps
# ✓ No containers exiting/restarting

# 7. Test frontend can call backend
# In browser console (http://localhost:5173):
# await fetch('/api/auth/health').then(r => r.json())
# ✓ Should return response from backend
```

---

## 📝 Common Issues & Solutions

### Issue: Frontend container exits immediately

```bash
# Check build logs
docker-compose logs frontend

# Common causes:
# 1. npm run build fails (syntax errors in code)
# 2. .env file has invalid syntax
# 3. Missing dependencies

# Solution: Check build locally first
npm run build

# If that works, rebuild container
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Issue: Backend takes long to start (10-15 seconds)

This is normal - Node.js is connecting to MongoDB and initializing modules.

```bash
# Watch progress
docker-compose logs -f backend

# Should see:
# "✅ Connected to MongoDB"
# "🚀 Starting Mozartify Backend Services"
```

### Issue: "Port 5173 already in use"

```bash
# Option 1: Stop service using port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Option 2: Use different port
# In docker-compose.yml, change:
# "5173:5173" to "5174:5173"
# Then access: http://localhost:5174
```

### Issue: "Port 10000 already in use"

```bash
# Kill process using port 10000
netstat -ano | findstr :10000
taskkill /PID <PID> /F

# Or change in docker-compose.yml:
# "10000:10000" to "10001:10000"
```

### Issue: API calls from frontend fail (CORS error)

```bash
# This means frontend can't reach backend
# Verify backend is running:
docker-compose ps | grep backend

# Check backend logs:
docker-compose logs backend

# Verify connectivity inside frontend container:
docker-compose exec frontend curl http://backend:10000/health

# If that fails: restart both services
docker-compose restart backend frontend
```

### Issue: "Cannot find module" errors in backend

```bash
# Backend dependencies not installed
# Inside container, reinstall:
docker-compose exec backend npm install

# Or rebuild:
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Issue: MongoDB connection refused

```bash
# Wait longer for MongoDB to start (can take 15+ seconds)
docker-compose logs mongo

# Should see "Server started" message

# If still failing: restart MongoDB
docker-compose restart mongo
```

---

## 🛑 Stopping & Cleanup

```bash
# Stop all containers (keeps data)
docker-compose down

# Stop and remove all containers + volumes (⚠️ DELETES DB DATA)
docker-compose down -v

# Stop specific container
docker-compose stop backend

# Stop and remove container
docker-compose rm -f backend

# Restart specific container
docker-compose restart backend
```

---

## 📊 Docker Debugging

### Access Container Shells

```bash
# Frontend shell (Nginx running in Alpine Linux)
docker-compose exec frontend sh

# Backend shell (Node.js)
docker-compose exec backend bash

# MongoDB shell
docker-compose exec mongo mongosh
# Inside: use mozartify; db.users.findOne();

# Redis shell
docker-compose exec redis redis-cli
# Inside: KEYS *; GET key_name;
```

### View Resource Usage

```bash
# See CPU/Memory/Network
docker stats

# Expected for this setup:
# frontend: ~20-30 MB (Nginx)
# backend: ~250-350 MB (Node.js)
# mongo: ~400-600 MB (Database)
# redis: ~10-50 MB (Cache)
```

### View Container Network

```bash
# See how containers communicate
docker network inspect mozartify_mozartify-network

# Should show all 4 containers connected
```

---

## 🔄 Development Workflow

### When You Change Frontend Code

1. **Make changes** to files in `src/`
2. **Rebuild** the frontend container:
   ```bash
   docker-compose build frontend
   docker-compose restart frontend
   ```
3. **Access** at http://localhost:5173

**Note:** Changes take 30-60 seconds (rebuild required)

For **instant reload** during development:
- Skip Docker for now
- Run locally: `npm run dev` (will serve on http://localhost:5173)
- Docker stays running on different port
- Later: use Vite dev server inside container

### When You Change Backend Code

1. **Make changes** to files in `server/`
2. **Changes apply live** (volume mount syncs automatically)
3. **Restart** if you changed `package.json`:
   ```bash
   docker-compose exec backend npm install
   docker-compose restart backend
   ```

### When You Change package.json

**Frontend:**
```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

**Backend:**
```bash
docker-compose exec backend npm install
# or rebuild
docker-compose build --no-cache backend
docker-compose up -d backend
```

---

## 📈 Build & Startup Times

### First Run (~5-10 minutes)
- `docker-compose build` ← First time downloads Node images
- `docker-compose up -d` ← Starts all services

### Subsequent Runs (~10-30 seconds)
- `docker-compose up -d` ← Containers already built
- Mongo startup: ~5-10 seconds
- Backend startup: ~5-15 seconds
- Frontend: ~2-5 seconds

---

## 🎯 Containers & Ports

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| Frontend | mozartify-frontend | 5173 | React SPA (Nginx) |
| Backend | mozartify-backend | 10000 | Node.js API |
| MongoDB | mozartify-mongo | 27017 | Database |
| Redis | mozartify-redis | 6379 | Cache & Queue |

---

## 🆘 Emergency Fixes

### Complete reset (everything)
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### View all images & containers
```bash
docker images | grep mozartify
docker ps -a | grep mozartify
```

### Remove everything and start fresh
```bash
# Remove all stopped containers
docker container prune

# Remove all unused images
docker image prune

# Remove networks
docker network prune

# Now restart
docker-compose up -d
```

---

## 📚 Useful Commands

| Command | Purpose |
|---------|---------|
| `docker-compose up -d` | Start in background |
| `docker-compose down` | Stop all |
| `docker-compose logs -f service` | Live logs |
| `docker-compose ps` | List running |
| `docker-compose build --no-cache` | Rebuild without cache |
| `docker-compose exec service cmd` | Run command in service |
| `docker-compose restart service` | Restart one service |
| `docker stats` | CPU/Memory usage |

---

## ✨ You're Ready!

```bash
cd c:\dev\mozartify
docker-compose up -d

# Wait 15-20 seconds for everything to start
sleep 20

# Test
curl http://localhost:5173        # ← Should return HTML
curl http://localhost:10000/health # ← Should return JSON

# Access
# Browser: http://localhost:5173
# API: http://localhost:10000

echo "✅ Your application is running!"
```

---

## 📖 Next Steps

1. ✅ **Phase 1 Complete** - Full application running in Docker
2. ⏭️ **Phase 2** - Add health endpoints to modules
   - See: [PHASE_2_MODULE_PREPARATION.md](PHASE_2_MODULE_PREPARATION.md)
3. ⏭️ **Phase 3** - Extract first microservice (Auth)
   - See: [PHASE_3_AUTH_EXTRACTION.md](PHASE_3_AUTH_EXTRACTION.md)

---

**Documentation:**
- Frontend: [FRONTEND_CONTAINERIZATION.md](FRONTEND_CONTAINERIZATION.md)
- Backend: [DOCKERIZATION_IMPLEMENTATION_PLAN.md](DOCKERIZATION_IMPLEMENTATION_PLAN.md)
- Reference: [DOCKERIZATION_QUICK_REFERENCE.md](DOCKERIZATION_QUICK_REFERENCE.md)

# 🐳 Docker Quick Start Guide - Mozartify Phase 1

## ✅ Phase 1 Goal
Run entire monolith application in Docker without code changes. Prepare for microservice extraction.

---

## 📋 Prerequisites

- Docker installed: https://www.docker.com/products/docker-desktop
- Docker running (check: `docker --version`)
- Port 10000 available (or configure in docker-compose.yml)
- Port 27017 available (MongoDB)
- Port 6379 available (Redis)
- Port 5000 available (FastAPI AI)

---

## 🚀 Quick Start

### 1. Prepare Environment Variables

```bash
# Copy .env.docker settings to .env for local development
cd c:\dev\mozartify\server
copy .env.docker .env
```

### 2. Start All Containers

```bash
# From project root: c:\dev\mozartify
cd c:\dev\mozartify

# Build and start all services
docker-compose up -d

# Expected output:
# ✓ Creating mozartify-mongo ... done
# ✓ Creating mozartify-redis ... done
# ✓ Creating mozartify-backend ... done
# ✓ Creating mozartify-ai ... done
```

### 3. Verify Containers Are Running

```bash
# Check status
docker-compose ps

# Expected output:
# NAME              STATUS              PORTS
# mozartify-mongo   Up 2 minutes        0.0.0.0:27017->27017/tcp
# mozartify-redis   Up 2 minutes        0.0.0.0:6379->6379/tcp
# mozartify-backend Up 2 minutes        0.0.0.0:10000->10000/tcp
# mozartify-ai      Up 2 minutes        0.0.0.0:5000->5000/tcp
```

### 4. Monitor Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f mongo
docker-compose logs -f ai-service

# Exit logs: Press Ctrl+C
```

### 5. Test Backend Connectivity

```bash
# Test backend health
curl http://localhost:10000/health

# Expected response:
# {"status":"healthy"} or similar

# Test auth endpoint
curl http://localhost:10000/api/auth/login

# Test MongoDB is accessible
# (Should return auth error, but connection works)
```

---

## 🧪 Phase 1 Validation Checklist

Run these tests in order:

```bash
# 1. Backend responds
curl http://localhost:10000/health
# ✓ Status 200 or 500 (either is fine, connection works)

# 2. MongoDB is running
docker-compose exec mongo mongosh --eval "db.runCommand('ping')"
# ✓ { ok: 1 }

# 3. Redis is running
docker-compose exec redis redis-cli ping
# ✓ PONG

# 4. Test all modules are loaded (check backend logs)
docker-compose logs backend | grep -i "module"
# ✓ Should see auth, music, arts, payment, user, notification modules

# 5. Frontend access (if running)
# Should be able to reach http://localhost:5173 and communicate with backend
```

---

## 📝 Common Issues & Solutions

### Issue: "Port 10000 already in use"
```bash
# Option 1: Stop the service using port 10000
netstat -ano | findstr :10000
taskkill /PID <PID> /F

# Option 2: Change port in docker-compose.yml
# Change: "10000:10000" to "10001:10000"
# Backend runs on 10000 inside container, exposed as 10001 outside
```

### Issue: "MongoDB connection failed"
```bash
# Wait for MongoDB to start (can take 10-15 seconds)
docker-compose logs mongo

# Restart MongoDB
docker-compose restart mongo

# Check MongoDB is healthy
docker-compose ps | grep mongo
# Should show "healthy" status
```

### Issue: "Backend container exits immediately"
```bash
# Check logs for errors
docker-compose logs backend

# Common causes:
# 1. Port 10000 in use
# 2. .env.docker has syntax errors
# 3. mainserver.js has startup issues

# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### Issue: "Redis not connecting"
```bash
# Restart Redis
docker-compose restart redis

# Check Redis is healthy
docker redis-cli ping
# Should respond: PONG
```

### Issue: "AI service (FastAPI) won't start"
```bash
# Check if requirements.txt exists
ls fastapi-server/requirements.txt

# Check Python dependencies
docker-compose logs ai-service

# Rebuild AI service
docker-compose build --no-cache ai-service
docker-compose up -d ai-service
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

# Restart specific container
docker-compose restart backend

# View container images
docker images | grep mozartify

# Remove unused images (free space)
docker image prune
```

---

## 📊 Docker Debugging

```bash
# Access backend container shell
docker-compose exec backend bash

# Inside container:
# - Check logs: tail -f /app/logs/*.log
# - Check env vars: env | grep MONGO
# - Test DB: node -e "require('mongoose').connect(process.env.MONGO_URI)"

# Access MongoDB shell
docker-compose exec mongo mongosh

# Inside mongosh:
# - Show databases: show dbs
# - Use mozartify database: use mozartify
# - Show collections: show collections
# - Test query: db.users.findOne()

# Access Redis CLI
docker-compose exec redis redis-cli

# Inside redis-cli:
# - Check keys: KEYS *
# - Get value: GET key_name
# - Flush database: FLUSHDB
```

---

## 📈 Monitoring & Performance

```bash
# View resource usage
docker stats

# Expected for Phase 1:
# backend: ~200-300MB RAM
# mongo: ~400-500MB RAM
# redis: ~50-100MB RAM

# View network communication
docker network inspect mozartify-network

# View volumes
docker volume ls | grep mozartify
docker volume inspect mozartify_mongo_data
```

---

## 🔄 Workflow for Phase 1 Development

### During Development:

```bash
# 1. Start everything
docker-compose up -d

# 2. Make changes to server code
# Changes are reflected live (volume mount)

# 3. If you change package.json:
docker-compose exec backend npm install

# 4. View logs in real-time
docker-compose logs -f backend

# 5. When done, stop containers
docker-compose down
```

### After Code Changes:

```bash
# Backend code changes (same directory): Live reload
# No action needed

# Backend package.json changes:
docker-compose exec backend npm install

# mainserver.js changes:
docker-compose restart backend

# module imports changed:
docker-compose restart backend

# For major changes:
docker-compose down
docker-compose up -d
```

---

## 🎯 Phase 1 Success Criteria

After running `docker-compose up -d`, you should see:

✅ All 4 containers running (backend, mongo, redis, ai-service)
✅ Backend connects to MongoDB successfully
✅ Backend connects to Redis successfully
✅ All module routes loaded without errors
✅ Health endpoints respond
✅ Uploads directory accessible
✅ Logs show no fatal errors
✅ Can make API calls to `/api/auth/*`, `/api/music/*`, etc.
✅ Database queries work
✅ File uploads work
✅ AI service accessible from backend

---

## 📚 Next Steps (Phase 2)

Once Phase 1 is verified:

1. Create health endpoints in each module
2. Extract module exports to `service.js` format
3. Add environment variables for service URLs
4. Document module boundaries
5. Prepare for microservice extraction

See: `DOCKERIZATION_IMPLEMENTATION_PLAN.md` → Phase 2 section

---

## 🆘 Need Help?

```bash
# Get detailed error information
docker-compose logs --tail=100 backend

# Get all services status
docker-compose ps -a

# Rebuild everything from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# Check if ports are available
netstat -ano | findstr :10000
netstat -ano | findstr :27017
netstat -ano | findstr :6379
netstat -ano | findstr :5000
```

---

## 📖 Docker Command Reference

| Command | Purpose |
|---------|---------|
| `docker-compose up -d` | Start all containers in background |
| `docker-compose down` | Stop all containers |
| `docker-compose logs -f service` | View logs (follow mode) |
| `docker-compose ps` | List running containers |
| `docker-compose exec service bash` | Access container shell |
| `docker-compose restart service` | Restart specific container |
| `docker-compose build --no-cache` | Rebuild images without cache |
| `docker-compose stop` | Stop without removing |
| `docker-compose rm` | Remove stopped containers |

---

## 🔐 Security Notes for Phase 1 (Development Only)

⚠️ This setup is for **LOCAL DEVELOPMENT ONLY**

For production (Phase 4+):
- [ ] Move secrets to AWS Secrets Manager / Vault
- [ ] Remove exposed ports (use reverse proxy)
- [ ] Add authentication to Redis
- [ ] Set MongoDB password
- [ ] Use HTTPS
- [ ] Configure firewall
- [ ] Set resource limits
- [ ] Add logging aggregation
- [ ] Enable container scanning

See: `DOCKER_IMPLEMENTATION_CHECKLIST.md` for production setup

---

## ✨ You're Ready!

```bash
cd c:\dev\mozartify
docker-compose up -d
docker-compose ps  # Verify all running
curl http://localhost:10000/health
# Success! 🎉
```

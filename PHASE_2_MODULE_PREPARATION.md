# Module Preparation for Microservice Extraction - Phase 2

## 🎯 Phase 2 Goal
Prepare each of the 10 modules for extraction without changing business logic. Create service boundaries and health checks.

---

## 📦 Your 10 Modules

```
server/modules/
├── auth/           ← Most independent, extract first (Phase 3)
├── user/           ← Depends on auth (Phase 3)
├── music/          ← Heavy features (Phase 4)
├── arts/           ← Similar to music (Phase 4)
├── payment/        ← Complex, depends on many (Phase 5)
├── notification/   ← Event-driven (Phase 4)
├── inbox/          ← Grouped with user service
├── recommendation/ ← Grouped with music/arts
├── analytics/      ← Grouped with payment
└── ai/             ← Already separate (FastAPI)
```

---

## ✅ Phase 2 Checklist - For Each Module

### 1. Create Module Service Export

For each module, create `server/modules/{module}/service.js`:

```javascript
// Example: server/modules/auth/service.js
module.exports = {
  // Export router for mounting
  router: require('./routes'),
  
  // Export models for reference
  models: require('./models'),
  
  // Export controllers for testing
  controllers: require('./controllers'),
  
  // Export middleware
  middleware: require('./middleware'),
  
  // Add health check
  health: async () => {
    // Test database connectivity
    // Test any external services
    return {
      status: 'healthy',
      module: 'auth',
      timestamp: new Date()
    };
  }
};
```

### 2. Add Health Endpoint to Each Module

In the main router for each module:

```javascript
// Example: server/modules/auth/routes/index.js
const express = require('express');
const router = express.Router();

// Add health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Test database connectivity
    await User.findOne().limit(1);
    
    res.json({
      status: 'healthy',
      module: 'auth',
      timestamp: new Date(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      module: 'auth',
      error: error.message
    });
  }
});

// ... rest of routes
module.exports = router;
```

### 3. Create Module.env Template

For each module that will be extracted, create `server/modules/{module}/.env.example`:

```env
# server/modules/auth/.env.example
# Use this to bootstrap .env when service is extracted

# Service Configuration
AUTH_SERVICE_PORT=3001
AUTH_SERVICE_NAME=auth-service

# Database
MONGO_URI=mongodb://mongo:27017/mozartify_auth

# JWT
JWT_SECRET=your_secret_here
JWT_EXPIRY=7d

# External Services (for cross-service communication)
USER_SERVICE_URL=http://user-service:3005
NOTIFICATION_SERVICE_URL=http://notification-service:3006

# Development
NODE_ENV=development
DEBUG=false
```

### 4. Prepare Module Independence

Each module should be able to:
- ✅ Work in isolation
- ✅ Connect to its own database (future)
- ✅ Call other services via HTTP (future)
- ✅ Publish/subscribe to Redis events (future)

### 5. Document Module Dependencies

For each module, document its dependencies:

```javascript
// server/modules/payment/MODULE_INFO.json
{
  "name": "payment",
  "port": 3004,
  "database": "mozartify_payment",
  "dependencies": {
    "internal": ["user", "music", "notification"],
    "external": ["stripe", "firebase"],
    "messaging": ["redis"]
  },
  "health_check": "/api/payment/health",
  "models": ["Order", "Payment", "Cart"],
  "routes": [
    "/api/payment/create",
    "/api/payment/complete",
    "/api/payment/history"
  ]
}
```

---

## 🔄 Phase 2 Implementation Steps

### Step 1: Add Health Endpoints (Day 1)

For each of the 10 modules:

```bash
# 1. server/modules/auth/routes/index.js
# 2. server/modules/user/routes/index.js
# 3. server/modules/music/routes/index.js
# ... etc for all 10 modules
```

Test health endpoints:
```bash
curl http://localhost:10000/api/auth/health
curl http://localhost:10000/api/user/health
curl http://localhost:10000/api/music/health
# etc...
```

### Step 2: Create Service Exports (Day 2)

For each module, create `service.js`:

```javascript
// server/modules/music/service.js
const router = require('./routes');
const models = require('./models');
const controllers = require('./controllers');

module.exports = {
  router,
  models,
  controllers,
  health: async () => {
    try {
      await models.Music.findOne().limit(1);
      return { status: 'healthy', module: 'music' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
};
```

### Step 3: Environment Variable Preparation (Day 3)

Create `.env.example` for each module:

```bash
# For each module:
server/modules/{module}/.env.example
```

Include:
- Module-specific config
- Database connection string
- External service URLs
- Feature flags

### Step 4: Document Dependencies (Day 3-4)

Create `MODULE_INFO.json` for each module showing:
- Internal dependencies (other modules)
- External dependencies (services, APIs)
- Data models
- API routes

### Step 5: Refactor for Service Communication (Day 5)

Where modules currently import from each other:

```javascript
// ❌ Current (tightly coupled)
const { getUser } = require('../user/controllers');

// ✅ Future (loosely coupled)
// Will be replaced with HTTP call:
// const response = await fetch('http://user-service:3005/api/user/getUser');
```

---

## 📋 Phase 2 Task Breakdown

### Auth Module (most independent)

```
Auth Module Preparation:
- [ ] Add GET /api/auth/health endpoint
- [ ] Create server/modules/auth/service.js
- [ ] Export: router, models, controllers, middleware, health
- [ ] Create server/modules/auth/.env.example
- [ ] Create server/modules/auth/MODULE_INFO.json
- [ ] Dependencies:
      - Internal: None (independent!)
      - External: Firebase, JWT
- [ ] Verify health check works
- [ ] Document all routes
```

### User Module

```
User Module Preparation:
- [ ] Add GET /api/user/health endpoint
- [ ] Create server/modules/user/service.js
- [ ] Export: router, models, controllers, middleware, health
- [ ] Create server/modules/user/.env.example
- [ ] Create server/modules/user/MODULE_INFO.json
- [ ] Dependencies:
      - Internal: auth (depends on auth service)
      - External: Firebase
- [ ] Replace auth imports with HTTP calls (future)
- [ ] Verify health check works
```

### Music Module

```
Music Module Preparation:
- [ ] Add GET /api/music/health endpoint
- [ ] Create server/modules/music/service.js
- [ ] Export: router, models, controllers, middleware, health
- [ ] Create server/modules/music/.env.example
- [ ] Create server/modules/music/MODULE_INFO.json
- [ ] Dependencies:
      - Internal: recommendation, user
      - External: AI service, file storage
- [ ] Replace cross-module imports with HTTP calls (future)
- [ ] Verify health check works
```

### Payment Module

```
Payment Module Preparation:
- [ ] Add GET /api/payment/health endpoint
- [ ] Create server/modules/payment/service.js
- [ ] Export: router, models, controllers, middleware, health
- [ ] Create server/modules/payment/.env.example
- [ ] Create server/modules/payment/MODULE_INFO.json
- [ ] Includes: analytics module grouping
- [ ] Dependencies:
      - Internal: user, music, arts, notification
      - External: Stripe, PayPal
- [ ] Replace cross-module imports with HTTP calls (future)
- [ ] Verify health check works
```

### Arts Module

```
Arts Module Preparation:
- [ ] Add GET /api/arts/health endpoint
- [ ] Create server/modules/arts/service.js
- [ ] Export: router, models, controllers, middleware, health
- [ ] Create server/modules/arts/.env.example
- [ ] Create server/modules/arts/MODULE_INFO.json
- [ ] Dependencies:
      - Internal: recommendation, user
      - External: AI service, file storage
- [ ] Replace cross-module imports with HTTP calls (future)
- [ ] Verify health check works
```

### Notification Module

```
Notification Module Preparation:
- [ ] Add GET /api/notification/health endpoint
- [ ] Create server/modules/notification/service.js
- [ ] Export: router, models, controllers, middleware, health
- [ ] Create server/modules/notification/.env.example
- [ ] Create server/modules/notification/MODULE_INFO.json
- [ ] Dependencies:
      - Internal: None (consumes events)
      - External: SMTP, Firebase
- [ ] Set up Redis event listening (future)
- [ ] Verify health check works
```

### Recommendation Module

```
Recommendation Module Preparation:
- [ ] Add GET /api/recommendation/health endpoint (or group with music/arts)
- [ ] Determine: Extract separate or group with Music/Arts?
- [ ] Create MODULE_INFO.json with rationale
- [ ] Document ML model paths
- [ ] Dependencies:
      - Internal: music, arts, user
      - External: AI service
```

### Inbox Module

```
Inbox Module Preparation:
- [ ] Add GET /api/inbox/health endpoint (or group with user)
- [ ] Determine: Extract separate or group with User?
- [ ] Create MODULE_INFO.json with rationale
- [ ] Document messaging model
- [ ] Dependencies:
      - Internal: user, notification
      - External: None
```

### Analytics Module

```
Analytics Module Preparation:
- [ ] Determine: Extract separate or group with Payment?
- [ ] Create MODULE_INFO.json with rationale
- [ ] Document dashboard endpoints
- [ ] Dependencies:
      - Internal: user, music, arts, payment
      - External: None
```

### AI Module (already separate)

```
AI Module (FastAPI - already containerized):
- [ ] Verify Dockerfile works
- [ ] Verify health check endpoint
- [ ] Document all ML models
- [ ] Document API endpoints
- [ ] Already extraction-ready!
```

---

## 🧪 Phase 2 Testing

### Health Check Validation

```bash
# Start containers
docker-compose up -d

# Test all module health endpoints
curl http://localhost:10000/api/auth/health
curl http://localhost:10000/api/user/health
curl http://localhost:10000/api/music/health
curl http://localhost:10000/api/arts/health
curl http://localhost:10000/api/payment/health
curl http://localhost:10000/api/notification/health
curl http://localhost:10000/api/recommendation/health
curl http://localhost:10000/api/inbox/health
curl http://localhost:10000/api/analytics/health

# All should return 200 with { status: 'healthy' }
```

### Database Connectivity

Each health endpoint should verify database connection:

```javascript
// Example health implementation
router.get('/health', async (req, res) => {
  try {
    // This verifies DB connection works
    await Model.findOne().limit(1);
    res.json({ status: 'healthy', module: 'auth' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});
```

---

## 🎯 Phase 2 Success Criteria

After Phase 2:
- ✅ All 10 modules have health endpoints
- ✅ All modules export `service.js` format
- ✅ Each module has `.env.example`
- ✅ Each module has `MODULE_INFO.json` documenting dependencies
- ✅ All health checks pass
- ✅ No code logic changed (still one monolith)
- ✅ Ready for Phase 3 (microservice extraction)

---

## 🚀 Phase 3 Teaser

Once Phase 2 is complete, Phase 3 will:
1. Create `services/auth/` directory with its own Dockerfile
2. Move auth module code to `services/auth/src/`
3. Create `services/auth/Dockerfile` (separate Node service)
4. Update `docker-compose.yml` to run auth as separate container
5. Backend makes HTTP calls to `http://auth-service:3001`
6. Repeat for user, music, payment, etc.

Each service becomes:
```
services/{module}/
├── src/                 ← Copied from modules/{module}
├── Dockerfile
├── package.json
├── .env
└── index.js            ← Express app + startup
```

---

## 📚 Files Created in Phase 2

Per module (example for auth):
```
server/modules/auth/
├── service.js          ← NEW: Service exports
├── .env.example        ← NEW: Configuration template
└── MODULE_INFO.json    ← NEW: Dependency documentation

Endpoints added:
├── /api/auth/health    ← NEW: Health check
```

---

## ⏱️ Phase 2 Timeline

- **Day 1:** Add health endpoints to all 10 modules
- **Day 2:** Create service.js for all modules
- **Day 3:** Create .env.example for all modules
- **Day 4:** Create MODULE_INFO.json documenting dependencies
- **Day 5:** Verify everything, prepare for Phase 3

**Total: 1 week** (without code changes to business logic)

---

## 🔗 Next Document

→ See `PHASE_3_AUTH_EXTRACTION.md` (coming in Phase 3)
→ For orchestration, see `MICROSERVICES_ORCHESTRATION.md` (Phase 3+)

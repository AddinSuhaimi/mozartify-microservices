# Mozartify - Runtime Communication Topology
## Microservices Deployment Readiness Analysis

**Created:** May 19, 2026  
**System:** Mozartify Music & Artwork Platform  
**Scope:** Architecture analysis for microservices migration

---

## Executive Summary

**Current Architecture:** Monolithic Backend + Separate FastAPI AI Services  
**Deployment Status:** **PARTIALLY MICROSERVICES-READY**

### Key Findings:
- ✅ AI services already decoupled (FastAPI separate processes)
- ⚠️ Frontend + Backend still tightly coupled (monolithic Express server)
- ✅ Database layer abstracted (Mongoose ODM)
- ❌ NO real-time communication (WebSockets/Message Queues)
- ⚠️ Synchronous blocking calls create bottlenecks

---

## 1. SERVICE ARCHITECTURE

### 1.1 Current Services

```
┌─────────────────────────────────────────────────────────┐
│                   MOZARTIFY ECOSYSTEM                    │
└─────────────────────────────────────────────────────────┘

1. FRONTEND SERVICE
   - React 18.3.1 + Vite
   - Status: Single SPA (can be split by roles)
   - Deployment: Static hosting (Render, Vercel, etc.)

2. BACKEND SERVICE (MONOLITHIC - NEEDS REFACTORING)
   - Express.js + Node.js
   - 10 sub-modules (Auth, User, Music, Arts, Payment, AI, etc.)
   - Status: Monolithic (can be split into 8-10 microservices)
   - Deployment: Railway, Render, EC2

3. AI SERVICES (ALREADY MICROSERVICES)
   - FastAPI + Python
   - 4 independent services:
     - 🔹 Emotion Predictor (Port 8002)
     - 🔹 Gender Predictor (Port 8003)
     - 🔹 Genre Predictor (Port 8001)
     - 🔹 Instrument Detector (Port 8000)
   - Status: Already decoupled ✅
   - Deployment: Docker containers

4. DATABASES
   - MongoDB Atlas (Production)
   - Session Store (MongoDB collections)
   - Status: Shared database (needs per-service DB strategy)

5. EXTERNAL SERVICES
   - Firebase Storage
   - Stripe Payment Gateway
   - Nodemailer (Email)
```

---

## 2. SYNCHRONOUS COMMUNICATION MAP

### Definition
**Synchronous:** Caller waits for response; blocking operations; real-time request/response.

```
┌─────────────────────────────────────────────────────────────┐
│            SYNCHRONOUS COMMUNICATION FLOWS                  │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Frontend ↔ Backend (REST API)

| Flow | Endpoint | Method | Payload | Response Time | Blocking |
|------|----------|--------|---------|---|---|
| **Authentication** | `/api/login` | POST | credentials | ~200ms | ✅ Blocks |
| **User Context** | `/api/current-user` | GET | - | ~50ms | ✅ Blocks |
| **Music Search** | `/api/search-music` | GET | query params | ~500ms | ✅ Blocks |
| **Add to Cart** | `/api/add-to-cart-music` | POST | itemId | ~100ms | ✅ Blocks |
| **Checkout** | `/api/create-checkout-session-music` | POST | cart items | ~1000ms | ✅ Blocks |
| **Upload File** | `/api/upload` | POST | file data | ~2000ms | ✅ Blocks |
| **Recommendations** | `/api/recommendations-music` | GET | - | ~800ms | ✅ Blocks |
| **User Library** | `/api/user-library` | GET | - | ~300ms | ✅ Blocks |

**Protocol:** HTTP/REST with Axios  
**Frequency:** Per user action (high volume during peak)  
**Risk:** Frontend waits for all responses; slow backend = frozen UI

---

### 2.2 Backend → FastAPI AI Services

| Service | Endpoint | Method | Input | Latency | Impact |
|---------|----------|--------|-------|---------|--------|
| **Emotion Predictor** | `http://fastapi:8002/predictEmotion` | POST | `{fileUrl}` | 2-5s | User waits during composition |
| **Gender Predictor** | `http://fastapi:8003/predictGender` | POST | `{fileUrl}` | 1-3s | User waits during analysis |
| **Genre Predictor** | `http://fastapi:8001/predictGenre` | POST | `{fileUrl}` | 1-3s | User waits during analysis |
| **Instrument Detector** | `http://fastapi:8000/predictInstrument` | POST | `{fileUrl}` | 3-8s | SLOWEST - User waits |

**Code Location:** `server/modules/ai/ai.service.js`  
**Request Pattern:**
```javascript
const predictEmotion = async (fileUrl) => {
  const response = await axios.post(fastApiEndpoints.emotion, { fileUrl });
  return response.data; // Blocking wait
};
```

**Problem:** 
- ⚠️ Blocks entire request handler
- ⚠️ No timeout management
- ⚠️ No retry logic
- ⚠️ Bottleneck for audio processing

---

### 2.3 Backend → Firebase Storage

| Operation | Method | Latency | Blocking |
|-----------|--------|---------|----------|
| **Upload File** | PUT (multipart form) | 1-3s | ✅ Blocks |
| **Download File** | GET (signed URL) | 500ms-2s | ✅ Blocks |
| **Delete File** | DELETE | 500ms | ✅ Blocks |

**Code Location:** `server/shared/upload.middleware.js`  
**Implementation:** Firebase Admin SDK (sync)

---

### 2.4 Backend → Stripe Payment Gateway

| Operation | Method | Latency | Blocking |
|-----------|--------|---------|----------|
| **Create Session** | REST POST | 500-1000ms | ✅ Blocks |
| **Retrieve Session** | REST GET | 200-500ms | ✅ Blocks |
| **Create Payment Intent** | REST POST | 500ms | ✅ Blocks |

**Code Location:** `server/modules/payment/payment.service.js`

---

### 2.5 Backend → MongoDB

| Operation | Type | Latency | Blocking |
|-----------|------|---------|----------|
| **Query User** | Mongoose.findById() | 50-200ms | ✅ Blocks |
| **Update Cart** | Mongoose.updateOne() | 100-300ms | ✅ Blocks |
| **Aggregate Stats** | Mongoose.aggregate() | 300-2000ms | ✅ Blocks (for admin) |
| **Session Lookup** | Collection.findOne() | 50-100ms | ✅ Blocks |

**Connection Model:** Single shared connection pool  
**Scaling Issue:** All traffic through single database instance

---

### 2.6 Backend → Nodemailer (Email)

| Operation | Latency | Blocking |
|-----------|---------|----------|
| **Send Verification Email** | 2-5s | ✅ Blocks signup |
| **Send Approval Email** | 2-5s | ✅ Blocks upload completion |
| **Send Feedback Reply** | 2-5s | ✅ Blocks message send |

**Code Location:** `server/modules/notification/`  
**Problem:** Email delivery blocks user action; should be async

---

## 3. ASYNCHRONOUS COMMUNICATION MAP

### Definition
**Asynchronous:** Caller doesn't wait for response; non-blocking; fire-and-forget or callback-based.

```
┌─────────────────────────────────────────────────────────────┐
│          ASYNCHRONOUS COMMUNICATION FLOWS                   │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Stripe Webhooks (Event-Driven) ⭐

**Type:** Incoming webhook from Stripe  
**Endpoint:** `POST /api/webhook`  
**Trigger:** Payment completion, charge refunded, invoice created  
**Code Location:** `server/modules/payment/payment.controller.js`

```
Stripe Payment System
    ↓ (async event notification)
Backend Webhook Handler (/api/webhook)
    ↓ (process event)
Update Purchase Record
    ↓ (async)
Send Confirmation Email
    ↓ (async)
```

**Currently:** Uses `await` pattern (blocking within webhook handler)  
**Improvement Needed:** Move to queue-based processing

---

### 3.2 File Upload Background Processing ⭐

**Type:** Fire-and-forget (no actual implementation detected)  
**Current Pattern:**

```javascript
// SYNCHRONOUS (BLOCKS USER)
const uploadFile = async (file) => {
  const url = await firebase.upload(file); // 1-3s wait
  return { success: true, url };
};
```

**Needed Pattern:**
```javascript
// ASYNCHRONOUS (SHOULD BE)
const uploadFile = async (file) => {
  const jobId = await queue.add('processAudio', { file });
  return { jobId }; // Return immediately
};
```

---

### 3.3 AI Model Inference Processing ⭐

**Current Status:** NOT ASYNC  
**Should Be:** Background processing

```
Frontend uploads audio
    ↓ (sync wait - PROBLEM)
Backend queues AI job
    ↓ (sync HTTP call - PROBLEM)
FastAPI processes
    ↓ (slow - blocks user)
Results stored
    ↓ (sync response)
User sees result
```

**Issues:**
- ⚠️ User blocked during 5-8s processing
- ⚠️ No timeout handling
- ⚠️ No retry mechanism
- ⚠️ No job status tracking

---

### 3.4 Email Notifications

**Current Implementation:** Synchronous (blocking)

```
Email Event Triggered
    ↓ (sync nodemailer.send)
SMTP Server
    ↓ (2-5s wait)
Email Sent (or timeout)
    ↓ (blocks user action)
User can proceed
```

**Issues:**
- ⚠️ Email failures block user workflows
- ⚠️ No retry on SMTP failures
- ⚠️ Should be async with job queue

---

### 3.5 Session Persistence

**Type:** Pseudo-async (handled by MongoDB session store)

```
User Action
    ↓
Express-Session Middleware
    ↓ (async write)
MongoDB Session Store
    ↓ (fire-and-forget, but awaited)
Next Handler
```

**Current:** Awaited but relatively fast (50-100ms)

---

### 3.6 Missing: Real-Time Systems ❌

**NOT IMPLEMENTED:**
- WebSockets (no Socket.io)
- Live notifications
- Real-time chat
- Live collaboration
- Server Sent Events (SSE)

**Implication:** Cannot deploy with multiple backend instances without sticky sessions

---

## 4. EXTERNAL SYSTEM DEPENDENCIES

### 4.1 Critical External Services

```
┌─────────────────────────────────────────────────────────────┐
│           EXTERNAL DEPENDENCIES & INTEGRATIONS              │
└─────────────────────────────────────────────────────────────┘
```

| Service | Purpose | Dependency Type | Failure Impact | Code Location |
|---------|---------|-----------------|-----------------|---|
| **Firebase Storage** | Cloud file hosting (music, images) | Critical | Users cannot upload/download files | `server/config/firebaseAdmin.js` |
| **Firebase SDK (Client)** | Client-side file uploads | Critical | Frontend cannot upload directly | `src/firebase.js` |
| **MongoDB Atlas** | Primary data store | Critical | Complete system outage | `.env: DB_URI` |
| **Stripe API** | Payment processing | Critical | No purchases possible | `server/config/stripe.js` |
| **Nodemailer** | Email delivery | Medium | Users don't receive verification emails | `server/config/mailer.js` |
| **FastAPI Services** | AI predictions | High | Audio analysis fails | `fastApiEndpoints.*` |
| **TensorFlow/Keras** | ML model inference | High | AI services unavailable | `fastapi-server/model/` |
| **Librosa** | Audio feature extraction | Medium | Genre/emotion detection fails | `fastapi-server/*.py` |
| **Spleeter** | Audio source separation | Medium | Instrument detection fails | `fastapi-server/instrument.py` |

---

### 4.2 Firebase Storage Architecture

**Type:** Synchronous REST calls  
**Authentication:** Service account (Admin SDK)

```
Backend Server
    ↓ (Firebase Admin SDK)
Firebase Storage API (us-central1)
    ↓ (sync upload/download)
GCS Bucket: mozartify-msa.firebasestorage.app
```

**Operations:**
- Upload: `admin.storage().bucket().upload(file)`
- Download: Signed URLs with expiry
- Delete: `admin.storage().bucket().file(path).delete()`

**Latency:** 1-3s typical  
**Retry Policy:** Built into SDK  
**Failure Mode:** Request timeout → user sees error

---

### 4.3 MongoDB Atlas Connection

**Type:** Persistent connection pool  
**Configuration:** Mongoose connection pooling

```
Backend (Pool Size: default 100)
    ↓
MongoDB Atlas (Cluster: shared/dedicated)
    ↓
Replica Set (3 nodes)
```

**Connection Points:**
- Main data operations: `mongoose.connection`
- Session store: Separate MongoDBStore connection
- Problem: SINGLE connection pool for all requests (bottleneck)

---

### 4.4 Stripe Payment Processing

**Type:** Synchronous REST API calls + Async Webhooks

```
                    SYNCHRONOUS
Frontend ---Stripe UI---> Stripe Dashboard
    ↓ (user completes payment)
Stripe Redirect ---sessionId---> Backend /complete-purchase
    ↓ (sync REST call)
Backend calls Stripe API to verify payment
    ↓ (sync response)
Update Purchase Record

                    ASYNCHRONOUS
Stripe ---Webhook Event---> Backend /api/webhook
    ↓
Process payment event
    ↓
Update records
```

**Webhook Events:** charge.completed, charge.failed, charge.refunded  
**Current Issue:** Webhook handler is synchronous (blocks webhook thread)

---

### 4.5 Email Delivery (Nodemailer)

**Type:** SMTP connection via Mailer config

```
Backend Application
    ↓ (nodemailer.transporter.sendMail)
SMTP Server (Gmail/SendGrid/Custom)
    ↓
Email Queue (ESP)
    ↓
Recipient Inbox
```

**Latency:** 2-5s per email  
**Problem:** Synchronous (blocks user action)  
**Solution Needed:** Move to async job queue

---

## 5. COMMUNICATION TOPOLOGY DIAGRAM

```
┌──────────────────────────────────────────────────────────────────┐
│                  RUNTIME TOPOLOGY - MOZARTIFY                     │
└──────────────────────────────────────────────────────────────────┘

                        FRONTEND (React)
                   :8080 (Development) / Render
                              │
                              │ HTTP/REST (Axios)
                              │ [SYNCHRONOUS] ⏱️ 200ms-2s
                              ▼
                ┌─────────────────────────────┐
                │   BACKEND (Express.js)      │
                │   :10000 / Railway          │
                │                             │
                │  ┌─────────────────────┐   │
                │  │ Auth Module         │   │
                │  │ User Module         │   │
                │  │ Music Module        │   │
                │  │ Arts Module         │   │
                │  │ Payment Module      │   │
                │  │ AI Orchestrator     │   │
                │  │ Recommendation      │   │
                │  │ Inbox Module        │   │
                │  │ Analytics Module    │   │
                │  │ Notification Module │   │
                │  └─────────────────────┘   │
                └─────────────────────────────┘
                    │        │        │        │
        ┌───────────┴────────┼────────┼────────┴──────────┐
        │                    │        │                   │
        ▼                    ▼        ▼                   ▼
    FASTAPI          MongoDB       Firebase          Stripe API
   AI Services        Atlas       Storage            Payment
   (:8000-8003)    [SYNC]         [SYNC]             [SYNC/WEBHOOK]
   
   ├─ Emotion      [SYNC]         [SYNC]          Webhook ↑
   │  Predictor    ⏱️50-200ms      ⏱️1-3s          [ASYNC]
   │
   ├─ Gender       [SYNC]
   │  Predictor    ⏱️1-3s
   │
   ├─ Genre        [SYNC]
   │  Predictor    ⏱️1-3s
   │
   └─ Instrument   [SYNC]
      Detector     ⏱️3-8s

        ▼
    Nodemailer
    (SMTP)
    [SYNC - PROBLEM]
    ⏱️2-5s blocks user


LEGEND:
════════════
[SYNC]      = Synchronous (caller waits)
[ASYNC]     = Asynchronous (fire-and-forget)
[WEBHOOK]   = Event-driven (external service initiates)
⏱️           = Typical latency
```

---

## 6. COMMUNICATION SUMMARY TABLE

### 6.1 All Communication Paths

| # | From | To | Type | Protocol | Latency | Blocking | Risk |
|---|------|----|----|----------|---------|----------|------|
| 1 | Frontend | Backend | **SYNC** | HTTP/REST | 200ms-2s | ✅ Yes | UI freeze |
| 2 | Backend | FastAPI (Emotion) | **SYNC** | HTTP/POST | 2-5s | ✅ Yes | 🔴 HIGH |
| 3 | Backend | FastAPI (Gender) | **SYNC** | HTTP/POST | 1-3s | ✅ Yes | 🟡 MEDIUM |
| 4 | Backend | FastAPI (Genre) | **SYNC** | HTTP/POST | 1-3s | ✅ Yes | 🟡 MEDIUM |
| 5 | Backend | FastAPI (Instrument) | **SYNC** | HTTP/POST | 3-8s | ✅ Yes | 🔴 HIGH |
| 6 | Backend | Firebase Storage | **SYNC** | REST API | 1-3s | ✅ Yes | 🟡 MEDIUM |
| 7 | Backend | MongoDB | **SYNC** | Mongoose/Driver | 50-300ms | ✅ Yes | 🟡 MEDIUM |
| 8 | Backend | Stripe API | **SYNC** | REST API | 500-1000ms | ✅ Yes | 🔴 HIGH |
| 9 | Backend | Nodemailer | **SYNC** | SMTP | 2-5s | ✅ Yes | 🔴 HIGH |
| 10 | Stripe | Backend | **ASYNC** | Webhook | Event-driven | ❌ No | 🟡 MEDIUM |
| 11 | Browser Session | MongoDB Store | **SYNC** | Driver | 50-100ms | ✅ Yes | 🟢 LOW |

### 6.2 Synchronous vs Asynchronous Summary

**SYNCHRONOUS (10/11 paths):** 🔴 90% of communication is blocking  
**ASYNCHRONOUS (1/11 paths):** ✅ Only Stripe webhooks  
**REAL-TIME:** ❌ Not implemented

---

## 7. BOTTLENECKS & RISKS FOR MICROSERVICES

### 7.1 Critical Bottlenecks

```
BOTTLENECK 1: AI Service Latency
─────────────────────────────────
User uploads audio
    ↓ (sync wait 3-8s)
Instrument detection blocks entire request
    ↓
User sees spinner/loading (bad UX)
    ↓
Backend thread blocked (limited concurrency)
    ↓ Multiple users = thread pool exhaustion

SOLUTION: Async job queue + polling

─────────────────────────────────────────

BOTTLENECK 2: Synchronous Email Blocking
──────────────────────────────────────────
User signs up
    ↓ (sync wait 2-5s)
Verification email sent
    ↓
User can proceed (delayed registration)
    ↓ SMTP timeouts = signup fails

SOLUTION: Async email queue

─────────────────────────────────────────

BOTTLENECK 3: Single MongoDB Connection Pool
──────────────────────────────────────────────
All traffic (100+ concurrent users)
    ↓
Single MongoDB replica set
    ↓
Connection pool: ~100 max
    ↓
Lock contention on shared DB

SOLUTION: Database per microservice + eventual consistency

─────────────────────────────────────────

BOTTLENECK 4: Monolithic Backend
─────────────────────────────────
Frontend → All requests to single /api endpoint
    ↓
Auth + Music + Payment + AI orchestration = single thread
    ↓
One slow module affects entire system

SOLUTION: Split into separate microservices
```

---

## 8. MICROSERVICES DEPLOYMENT STRATEGY

### 8.1 Recommended Service Decomposition

```
BEFORE (MONOLITHIC):
┌───────────────────────────────────────────┐
│       Backend Express Monolith            │
│ (Auth + Music + Payment + AI + etc.)      │
│       Single Port :10000                  │
└───────────────────────────────────────────┘

AFTER (MICROSERVICES):
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Auth Service │ Music Service│ Payment Svc. │   AI Svc.    │
│   :3001      │    :3002     │    :3003     │   :3004      │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ User Service │  Arts Service│ Notification │  Recommend.  │
│   :3005      │    :3006     │    :3007     │   :3008      │
└──────────────┴──────────────┴──────────────┴──────────────┘

API GATEWAY
   :8000
(Routes all requests to services)
```

### 8.2 Service Boundaries

| Service | Port | Responsibility | Database | Dependencies |
|---------|------|-----------------|----------|---|
| **Auth Service** | 3001 | Login, signup, JWT, session | users, sessions | - |
| **User Service** | 3005 | Profiles, preferences, library | users, preferences | Auth |
| **Music Service** | 3002 | Music CRUD, search, uploads | music, abc_files | User, Storage |
| **Arts Service** | 3006 | Artwork CRUD, search, uploads | artwork, arts_metadata | User, Storage |
| **AI Orchestrator** | 3004 | Route to FastAPI services | ai_results | FastAPI, Storage |
| **Payment Service** | 3003 | Stripe integration, purchases | purchases, transactions | User, Music, Arts |
| **Recommendation** | 3008 | Content-based recommendations | recommendations | Music, Arts, User |
| **Notification Service** | 3007 | Email, feedback, messages | feedback, messages | User, Music, Arts |
| **Analytics Service** | 3009 | Admin stats & reporting | analytics | All services (read-only) |

### 8.3 Communication Pattern Changes

```
CURRENT (Monolithic):
Frontend → /api/predictEmotion → FastAPI (SYNC, BLOCKS)

AFTER (Microservices + Async):
Frontend → API Gateway → AI Service
    ↓
AI Service → Redis Queue
    ↓ (returns job ID)
Frontend polls /api/jobs/{jobId} for status
    ↓
FastAPI processes in background
    ↓
Result available: Frontend retrieves

NEW: Fully asynchronous AI processing
```

---

## 9. IMPLEMENTATION ROADMAP

### Phase 1: Prepare Infrastructure (Week 1-2)
- [ ] Set up Docker containers for each service
- [ ] Deploy Redis for job queue
- [ ] Configure API Gateway (Kong, Express Gateway, or custom)
- [ ] Implement service discovery (Consul or Kubernetes)

### Phase 2: Refactor Synchronous to Asynchronous (Week 3-4)
- [ ] Move AI predictions to job queue
- [ ] Move email notifications to async processing
- [ ] Implement polling/webhook endpoints for job status
- [ ] Add retry logic with exponential backoff

### Phase 3: Split Monolithic Backend (Week 5-8)
- [ ] Extract Auth Service
- [ ] Extract User Service
- [ ] Extract Music Service
- [ ] Extract Payment Service
- [ ] ... (continue with other services)

### Phase 4: Implement Service Communication (Week 8-10)
- [ ] gRPC for inter-service communication (faster than HTTP)
- [ ] Service mesh (Istio) for traffic management
- [ ] Implement circuit breakers

### Phase 5: Data Strategy (Week 10-12)
- [ ] Implement database per microservice pattern
- [ ] Event sourcing for cross-service consistency
- [ ] Saga pattern for distributed transactions

---

## 10. READINESS ASSESSMENT

### Current State: ⚠️ 4/10 READY FOR MICROSERVICES

```
✅ READY:
  ✓ AI services already independent (FastAPI)
  ✓ Database abstracted with Mongoose
  ✓ Clear service boundaries identified (10 modules)
  ✓ External dependencies well-managed

⚠️ PARTIALLY READY:
  ⚠️ Backend monolithic (needs splitting)
  ⚠️ No API Gateway
  ⚠️ All communication synchronous
  ⚠️ No service discovery
  ⚠️ Shared database (needs per-service DB strategy)

❌ NOT READY:
  ❌ No job queue system (Redis/RabbitMQ)
  ❌ No async message processing
  ❌ No service-to-service communication layer
  ❌ No circuit breakers or resilience patterns
  ❌ No distributed tracing/monitoring
  ❌ No containerization strategy (Docker, K8s)
```

### Estimated Effort: **12-16 weeks** (full team)

---

## 11. DEPLOYMENT CONSIDERATIONS

### 11.1 Load Balancing

**Current:** Single Express server  
**After Migration:** Kubernetes load balancing

```
Load Balancer (Ingress)
    ↓
Service Mesh (Istio/Linkerd)
    ↓
├─ Auth Service Pod 1, Pod 2, Pod 3
├─ Music Service Pod 1, Pod 2
├─ Payment Service Pod 1
└─ ... (auto-scaled based on load)
```

### 11.2 Database Strategy

**Current:** Shared MongoDB instance (bottleneck)

```
OPTION A: Database per Service (Recommended)
─────────────────────────────────────
Auth Service → MongoDB (auth_db)
Music Service → MongoDB (music_db)
Payment Service → MongoDB (payment_db)
... (Event sourcing for consistency)

OPTION B: Shared Database with Row-Level Security
──────────────────────────────────────────────────
Single MongoDB with strict access control
    ↓ Good for quick migration
    ↓ Still bottleneck at database level

OPTION C: Polyglot Persistence
───────────────────────────────
Auth → PostgreSQL (relational)
Music → MongoDB (document)
Cache → Redis (in-memory)
Search → Elasticsearch (full-text)
```

### 11.3 Caching Strategy

**Recommended:** Redis cluster

```
Frontend Request
    ↓
API Gateway → Check Redis Cache
    ↓ (cache hit)
Return cached response (10ms)
    ↓ (cache miss)
Route to service
    ↓
Service → Update cache
    ↓
Return response
```

**Cache Keys:**
- `user:{userId}:preferences` (1 hour TTL)
- `music:search:{query}` (30 min TTL)
- `recommendations:{userId}` (24 hours TTL)

---

## 12. MONITORING & OBSERVABILITY

### Required Instrumentation

```
Distributed Tracing (Jaeger / Zipkin)
────────────────────────────────────
Frontend Request
    ↓ trace_id: abc123
Backend Receives
    ↓ span: auth_check
Music Service
    ↓ span: search_music
FastAPI
    ↓ span: ai_prediction
All spans linked by trace_id
    ↓
Complete request journey visible

Metrics Collection (Prometheus)
───────────────────────────────
- Request latency per service
- Database query latency
- Cache hit ratio
- AI service response times
- Error rates
- Thread pool saturation
- Database connection pool usage

Logging Aggregation (ELK Stack / Loki)
──────────────────────────────────────
All service logs → Central store
    ↓
Search logs by trace_id
    ↓
Correlate issues across services
```

---

## 13. SUMMARY & RECOMMENDATIONS

### Key Findings

1. **Frontend-Backend:** Monolithic Express server (needs splitting)
2. **AI Services:** Already microservices-ready ✅
3. **Communication:** 90% synchronous (needs refactoring)
4. **External Services:** Well-managed but create bottlenecks
5. **Real-Time:** Not implemented (no urgent blocker)

### Top 3 Priority Actions

```
🔴 PRIORITY 1: Implement Async Job Queue
   Impact: Reduce AI latency from blocking to 100ms (return jobId)
   Effort: 1-2 weeks
   Tools: Redis + Bull.js

🔴 PRIORITY 2: Extract Auth & Payment Services
   Impact: Isolate critical services, enable independent scaling
   Effort: 3-4 weeks
   Pattern: API Gateway → microservices

🟡 PRIORITY 3: Implement API Gateway + Service Discovery
   Impact: Enable service communication, routing, load balancing
   Effort: 2-3 weeks
   Tools: Kong + Consul (or Kubernetes)
```

### Success Metrics

- ✅ Reduce AI prediction latency from 3-8s to 100ms (async)
- ✅ Reduce signup failures from email timeout (async queue)
- ✅ Scale services independently (microservices separation)
- ✅ Reduce p99 latency for searches (caching + optimization)
- ✅ 99.9% uptime with service redundancy

---

**Document Version:** 1.0  
**Last Updated:** May 19, 2026  
**Status:** DRAFT - Ready for Architecture Review

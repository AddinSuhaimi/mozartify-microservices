# Mozartify - Communication Matrix & Flow Analysis

## Communication Path Details

### 1️⃣ FRONTEND ↔ BACKEND (REST API)

**Type:** SYNCHRONOUS HTTP/REST  
**Protocol:** HTTP 1.1 with Axios  
**Base URL:** `http://localhost:10000/api` (dev) | `https://mozartify-production.up.railway.app/api` (prod)

#### Authentication Endpoints
```
POST /api/signup
├─ Input: { email, password, name }
├─ Process: User creation + email verification
├─ Response Time: 500-1000ms ⏱️
├─ Blocking: ✅ YES (user waits for signup)
└─ Issue: 🔴 Email may timeout → signup fails

POST /api/login
├─ Input: { email, password }
├─ Process: Credential validation + session creation
├─ Response Time: 200-300ms
├─ Blocking: ✅ YES (user cannot proceed without login)
└─ Endpoint: server/modules/auth/auth.controller.js

POST /api/logout
├─ Response Time: 50-100ms
└─ Blocking: ✅ YES
```

#### User Management
```
GET /api/current-user
├─ Process: Retrieve session user data
├─ Response Time: 50-100ms
├─ Blocking: ✅ YES (on every page load)
├─ Query: MongoDB session lookup
└─ Called from: All components (Header.jsx, etc.)

GET /api/user-library
├─ Process: Retrieve user's music collection
├─ Response Time: 300-500ms
├─ Blocking: ✅ YES (user waits for library)
├─ Database: Query user.music_library[] array
└─ Called from: CustomerLibrary.jsx

POST /api/preferences
├─ Process: Update user preferences
├─ Response Time: 100-200ms
├─ Blocking: ✅ YES
└─ Database: Update user document
```

#### Music Catalog Operations
```
GET /api/search-music?query=&filters=
├─ Process: Full-text search + filtering
├─ Response Time: 500ms-2s ⏱️ (depends on query)
├─ Blocking: ✅ YES (user waits for results)
├─ Database: Mongoose aggregate + text search
└─ Called from: CustomerSearch.jsx, AdminSearch.jsx

POST /api/add-to-cart-music
├─ Input: { musicId, quantity }
├─ Response Time: 100-200ms
├─ Blocking: ✅ YES
└─ Database: Update cart document

GET /api/music-score/:id
├─ Process: Retrieve single music score
├─ Response Time: 100-200ms
├─ Blocking: ✅ YES
└─ Called from: CustomerMusicScoreView.jsx
```

#### Artwork Operations
```
GET /api/search-artwork?query=&filters=
├─ Response Time: 500ms-2s
├─ Blocking: ✅ YES
└─ Database: Mongoose query on artwork collection

POST /api/add-to-cart-artwork
├─ Response Time: 100-200ms
├─ Blocking: ✅ YES
└─ Database: Update cart2 document
```

#### Upload Operations
```
POST /api/upload
├─ Input: Multipart form (file + metadata)
├─ Process:
│  ├─ Validate file format
│  ├─ Upload to Firebase Storage
│  └─ Save ABC file metadata
├─ Response Time: 2-4s ⏱️ (I/O bound)
├─ Blocking: ✅ YES (user waits, UI shows spinner)
├─ Max File Size: Typically 100MB
└─ Code: server/shared/upload.middleware.js

POST /api/predictEmotion
├─ Input: { fileUrl }
├─ Process: Call FastAPI emotion detector
├─ Response Time: 2-5s ⏱️ (ML inference)
├─ Blocking: ✅ YES (user waits)
└─ Issue: 🔴 BOTTLENECK - Can process ~2 concurrent uploads

POST /api/predictGender
├─ Response Time: 1-3s
├─ Blocking: ✅ YES
└─ Similar to emotion endpoint

POST /api/predictGenre
├─ Response Time: 1-3s
├─ Blocking: ✅ YES
└─ Similar to emotion endpoint
```

#### Payment Operations
```
POST /api/create-checkout-session-music
├─ Input: { cartItems }
├─ Process:
│  ├─ Validate cart
│  └─ Create Stripe session
├─ Response Time: 1000-1500ms ⏱️
├─ Blocking: ✅ YES (user waits for payment link)
├─ External Call: stripe.checkout.sessions.create()
└─ Issue: 🔴 Stripe API delays block checkout

POST /api/complete-purchase-music
├─ Input: { sessionId }
├─ Process:
│  ├─ Verify Stripe session
│  ├─ Create purchase record
│  └─ Send confirmation email
├─ Response Time: 2-3s
├─ Blocking: ✅ YES
├─ External Calls: Stripe API + Nodemailer
└─ Issue: 🔴 Email failure = incomplete transaction

GET /api/user-purchases
├─ Process: Retrieve purchase history
├─ Response Time: 200-300ms
└─ Blocking: ✅ YES
```

#### Recommendation System
```
GET /api/recommendations-music
├─ Process:
│  ├─ Load user preferences
│  ├─ Query similar music
│  └─ Score and rank
├─ Response Time: 800ms-2s
├─ Blocking: ✅ YES (user waits for recommendations)
├─ Database: Multiple queries + aggregation
└─ Called from: CustomerHomepage.jsx
```

#### Admin Analytics
```
GET /api/admin/stats
├─ Process: Aggregate statistics
├─ Response Time: 1-3s (complex aggregation)
├─ Blocking: ✅ YES (admin waits)
├─ Database: Mongoose aggregate on multiple collections
└─ Aggregations: User counts, revenue, trending content
```

#### Feedback & Messaging
```
POST /api/music-feedback
├─ Input: { scoreId, feedbackText, rating }
├─ Response Time: 200-300ms
├─ Blocking: ✅ YES
└─ Database: Create Feedback document

POST /api/feedback/reply/:id
├─ Response Time: 200-300ms + Email (2-5s)
├─ Blocking: ✅ YES
└─ Issue: Email sending delays user feedback confirmation
```

---

### 2️⃣ BACKEND → FASTAPI AI SERVICES

**Type:** SYNCHRONOUS HTTP POST  
**Location:** `server/modules/ai/ai.service.js`

#### All AI Endpoints Pattern
```javascript
const makeAIPrediction = async (serviceType, fileUrl) => {
  const aiEndpoints = {
    emotion: 'http://fastapi:8002/predictEmotion',
    gender: 'http://fastapi:8003/predictGender',
    genre: 'http://fastapi:8001/predictGenre',
    instrument: 'http://fastapi:8000/predictInstrument'
  };
  
  const response = await axios.post(aiEndpoints[serviceType], { fileUrl });
  return response.data; // ⏱️ BLOCKING WAIT
};
```

#### Emotion Predictor
```
Endpoint: POST http://fastapi:8002/predictEmotion
Input: { fileUrl: "https://firebase.../audio.mp3" }
Process:
  ├─ Download file from Firebase
  ├─ Extract MFCC/Spectrogram features
  ├─ Run CNN model (keras)
  └─ Return emotion class + confidence
Response: { emotion: "happy", confidence: 0.95 }
Latency: 2-5 seconds ⏱️
Backend Blocking: ✅ YES
Code: fastapi-server/emotion.py
Issue: 🔴 User blocked during analysis
```

#### Gender Predictor
```
Endpoint: POST http://fastapi:8003/predictGender
Input: { fileUrl }
Response: { gender: "male|female|other", confidence }
Latency: 1-3 seconds
Backend Blocking: ✅ YES
Code: fastapi-server/gender.py
```

#### Genre Predictor
```
Endpoint: POST http://fastapi:8001/predictGenre
Input: { fileUrl }
Response: { genre: "classical|jazz|pop|...", confidence }
Latency: 1-3 seconds
Backend Blocking: ✅ YES
Code: fastapi-server/genre.py
```

#### Instrument Detector (SLOWEST)
```
Endpoint: POST http://fastapi:8000/predictInstrument
Input: { fileUrl }
Process:
  ├─ Download audio
  ├─ Run Spleeter source separation
  ├─ Analyze each stem
  └─ Identify instruments
Response: { instruments: ["piano", "violin", "flute"] }
Latency: 3-8 seconds ⏱️⏱️ SLOWEST
Backend Blocking: ✅ YES
Code: fastapi-server/instrument.py
Issue: 🔴🔴 CRITICAL BOTTLENECK
Maximum Concurrency: ~1-2 requests (GPU/CPU limited)
```

#### Characteristics of All AI Calls
- **Authentication:** None (internal network)
- **Timeout:** 30 seconds (should be lower: 10s)
- **Retry:** None
- **Error Handling:** Basic try-catch
- **Queue:** No queue system
- **Rate Limit:** None

---

### 3️⃣ BACKEND → MONGODB

**Type:** SYNCHRONOUS Database Calls  
**Driver:** Mongoose ODM  
**Connection:** Single pool (~100 max connections)

#### Query Patterns
```
GET User Profile
├─ Query: User.findById(userId)
├─ Latency: 50-100ms
├─ Blocking: ✅ YES
└─ Frequency: Per page load

Search Music
├─ Query: Music.find({ $text: { $search: query } })
├─ Latency: 200-500ms
├─ Blocking: ✅ YES
├─ Frequency: Per search
└─ Issue: Complex queries slow down during high load

Update Cart
├─ Query: Cart.findByIdAndUpdate(cartId, updates)
├─ Latency: 100-200ms
├─ Blocking: ✅ YES
└─ Frequency: Per cart action

Create Purchase
├─ Query: Purchase.create(purchaseData)
├─ Latency: 150-300ms
├─ Blocking: ✅ YES
└─ Frequency: Per transaction

Aggregate Statistics
├─ Query: Analytics.aggregate([...])
├─ Latency: 500-2000ms ⏱️ (complex)
├─ Blocking: ✅ YES
├─ Frequency: Per admin dashboard load
└─ Issue: Blocks entire admin operation

Session Lookup
├─ Query: SessionStore.findOne({ _id: sessionId })
├─ Latency: 50-100ms
├─ Blocking: ✅ YES
├─ Frequency: On every request (middleware)
└─ Critical: Session middleware blocks all routes
```

#### Connection Pooling Issue
```
Current State:
  Shared MongoDB connection pool (size: ~100)
  ↓
  100+ concurrent users
  ↓
  Connection pool exhaustion
  ↓
  WAIT timeouts → Users see "Connection refused"

Problem: Single pool for:
  - Session lookups (every request)
  - User queries
  - Music searches
  - Cart operations
  - Purchase creation
  - All other data access
```

#### Session Persistence Pattern
```
User Request
  ↓
Express-Session Middleware
  ├─ Lookup session: SessionStore.findOne(sessionId)
  ├─ Latency: 50-100ms
  └─ Blocking: ✅ YES (blocks route handler)
  ↓
Route Handler runs
  ├─ Query: User.findById(session.userId)
  ├─ Query: Cart.findOne({ userId })
  ├─ Total: 150-300ms
  └─ Blocking: ✅ YES
  ↓
Update Session (write)
  └─ Latency: 50-100ms (async but awaited)
```

---

### 4️⃣ BACKEND → FIREBASE STORAGE

**Type:** SYNCHRONOUS REST API  
**Authentication:** Firebase Admin SDK  
**Bucket:** `mozartify-msa.firebasestorage.app`

#### Upload Flow
```
Frontend uploads file (multipart form)
  ↓
Backend receives file
  ↓
server/shared/upload.middleware.js
  ├─ Validate file type
  ├─ Create read stream from buffer
  └─ Upload to Firebase
      ├─ URL generation
      ├─ Network transfer
      └─ Storage write
  ↓ Latency: 1-3 seconds ⏱️
Response: { fileUrl: "https://storage.googleapis.com/..." }
Blocking: ✅ YES (user waits)
```

#### Download Flow
```
Request: GET /api/download/:fileId
  ↓
Backend queries Music/Artwork model for fileUrl
  ├─ Latency: 50-100ms
  ├─ Blocking: ✅ YES
  └─ Database query
  ↓
Generate signed URL
  ├─ firebase-admin.storage().bucket().file(path).getSignedUrl()
  ├─ Latency: 100-200ms
  └─ API call
  ↓
Redirect to Firebase URL
  └─ Total Latency: 200-400ms
```

#### Delete Flow
```
Request: DELETE /api/file/:fileId
  ↓
Backend queries to get file path
  ├─ Latency: 50-100ms
  └─ Blocking: ✅ YES
  ↓
Delete from Firebase
  ├─ admin.storage().bucket().file(path).delete()
  ├─ Latency: 300-500ms
  └─ Network I/O
  ↓
Update Database (remove fileUrl reference)
  ├─ Latency: 100-150ms
  └─ Blocking: ✅ YES
  ↓
Total: 500-750ms
```

#### Characteristics
- **File Size Limits:** Typically 100MB per file
- **Concurrent Uploads:** Handled by Firebase (no limit on server side)
- **Network:** Single backend → Firebase (can be optimized)
- **Error Handling:** Retry on timeout (built into SDK)
- **Security:** Service account (backend-only access)

---

### 5️⃣ BACKEND → STRIPE API

**Type:** SYNCHRONOUS REST API (with async webhooks)

#### Checkout Session Creation (Sync)
```
Request: POST /api/create-checkout-session-music
Input: { cartItems: [{musicId, quantity}, ...] }
  ↓
Backend:
  ├─ Validate cart items in DB
  ├─ Calculate total + tax
  └─ Query user email
  ↓ Latency: 150-300ms
  ↓
Call Stripe REST API:
  stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [...],
    success_url: '...',
    cancel_url: '...'
  })
  ↓ Latency: 500-1000ms ⏱️
Response: { sessionId: "cs_...", url: "https://checkout.stripe.com/..." }
Total Latency: 700-1300ms
Blocking: ✅ YES (user waits to proceed to payment)
Issue: 🔴 Stripe delays block checkout flow
```

#### Payment Completion (Async Webhook)
```
User completes payment on Stripe
  ↓
Stripe sends webhook event
  ├─ charge.completed
  ├─ payment_intent.succeeded
  └─ invoice.created
  ↓
Webhook endpoint: POST /api/webhook
  ├─ Verify webhook signature
  ├─ Parse event data
  └─ Handle payment event
  ↓
Backend:
  ├─ Query Stripe to verify payment
  ├─ Create Purchase record
  ├─ Update Music ownership
  └─ Send confirmation email
  ↓ Process Latency: 2-5s
Response: { received: true }
Blocking: ✅ YES (webhook thread blocked during processing)
Issue: 🔴 Email sending during webhook may timeout
```

#### Webhook Characteristics
- **Events:** charge.completed, charge.failed, charge.refunded
- **Timeout:** 30 seconds for webhook handler
- **Retry:** Stripe retries if non-200 response
- **Current Implementation:** Synchronous processing
- **Issue:** Email sending inside webhook handler blocks webhook

---

### 6️⃣ BACKEND → NODEMAILER (EMAIL)

**Type:** SYNCHRONOUS SMTP  
**Configuration:** `server/config/mailer.js`  
**Provider:** Gmail SMTP or custom SMTP server

#### Email Sending Pattern
```javascript
const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,
    auth: { user, pass }
  });
  
  await transporter.sendMail({ to, subject, html });
  // ⏱️ BLOCKS 2-5 seconds
};
```

#### Verification Email (Signup)
```
POST /api/signup
  ├─ Create user record
  ├─ Generate token
  └─ Send verification email
      ├─ SMTP connection: 200-500ms
      ├─ Message queue: 100-200ms
      └─ Delivery: 1-5s
  ↓ Total: 2-5s
Response: { success: true, message: "Email sent" }
Blocking: ✅ YES
Issue: 🔴 Email timeout → signup fails (no retry)
```

#### Admin Approval Email (Upload)
```
POST /api/upload
  ├─ Upload to Firebase (2-3s)
  ├─ Create Music record
  └─ Send admin notification email
      ├─ Latency: 2-5s ⏱️
      └─ Blocking: ✅ YES
Response: User sees spinner for entire duration
Issue: 🔴 Email failure → incomplete upload
```

#### Feedback Reply Email
```
POST /api/feedback/reply/:id
  ├─ Create reply record
  └─ Send email to user
      ├─ Latency: 2-5s
      └─ Blocking: ✅ YES
Response: User waits
Issue: 🔴 SMTP failures break workflow
```

#### SMTP Characteristics
- **Provider:** Gmail (typical), SendGrid, or custom
- **Rate Limit:** ~100 emails/second (Gmail)
- **Timeout:** 30 seconds per email
- **Retry:** No built-in retry (custom code needed)
- **Failure Mode:** Exception thrown → request fails

---

### 🔄 INCOMING: STRIPE WEBHOOK (ASYNC)

**Type:** ASYNCHRONOUS Event from External System  
**Endpoint:** `POST /api/webhook`  
**Origin:** Stripe servers

#### Webhook Characteristics
```
Stripe Webhook
  ├─ Initiated by: Stripe (not backend)
  ├─ Trigger: Payment event completion
  ├─ Delivery: Best-effort (retries for 3 days)
  ├─ Timeout: 30 seconds
  └─ Verification: HMAC signature validation

Current Implementation: Synchronous handler
  ├─ Verify signature
  ├─ Process event
  ├─ Send email (BLOCKS 2-5s)
  └─ Update database
  ↓
Issue: 🔴 Email failures during webhook = lost retry

Recommended: Async handler
  ├─ Verify signature
  ├─ Queue event
  ├─ Respond immediately (200 OK)
  └─ Process async (with retries)
```

---

## Summary Table: All Communication Paths

| Path | Type | Protocol | Latency | Blocking | Retry | Queue | Risk |
|------|------|----------|---------|----------|-------|-------|------|
| Frontend ↔ Backend | SYNC | HTTP/REST | 200ms-2s | ✅ | No | No | 🟡 |
| Backend → AI (Emotion) | SYNC | HTTP | 2-5s | ✅ | No | No | 🔴 |
| Backend → AI (Gender) | SYNC | HTTP | 1-3s | ✅ | No | No | 🟡 |
| Backend → AI (Genre) | SYNC | HTTP | 1-3s | ✅ | No | No | 🟡 |
| Backend → AI (Instrument) | SYNC | HTTP | 3-8s | ✅ | No | No | 🔴 |
| Backend → MongoDB | SYNC | Driver | 50-300ms | ✅ | No | No | 🟡 |
| Backend → Firebase | SYNC | REST | 1-3s | ✅ | SDK | No | 🟡 |
| Backend → Stripe | SYNC | REST | 500-1000ms | ✅ | No | No | 🔴 |
| Backend → Nodemailer | SYNC | SMTP | 2-5s | ✅ | No | No | 🔴 |
| Stripe → Backend | ASYNC | Webhook | Event | ❌ | Yes | No | 🟡 |

---

## Synchronous vs Asynchronous Summary

**Total Paths:** 10  
**Synchronous:** 9 (90%) 🔴  
**Asynchronous:** 1 (10%) 🟢  

**Result:** 90% of communication is blocking (user waits)

---

**Document:** Communication Matrix & Flow Analysis  
**Created:** May 19, 2026  
**Status:** Detailed Reference Document

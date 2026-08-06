# AgroRent AI Roadmap (Recommended)

```
v0.1  Initial Architecture
        │
        ▼
v0.2  Authentication
        │
        ▼
v0.3  Equipment Module
        │
        ▼
v0.4  Booking Module
        │
        ▼
v0.5  Analytics + Notifications
        │
        ▼
v0.5.1 Core Regression
        │
        ▼
v0.6  Production Authentication
        │
        ▼
v0.7  AI Advisor
        │
        ▼
v0.7.1 AI Regression
        │
        ▼
v0.8  Razorpay Payments
        │
        ▼
v0.8.1 Payment Regression
        │
        ▼
v0.9  Security Hardening
        │
        ▼
v0.95 Cloud Deployment
        │
        ▼
v0.96 Production Regression
        │
        ▼
v1.0  Production Release
```

---

# v0.7.1 — AI Regression (Mandatory)

Freeze development and verify:

## Authentication

* Register
* Verify OTP
* Resend OTP
* Forgot Password
* Login
* Logout
* JWT
* Session Persistence

## AI

* Chat
* Equipment Recommendation
* Crop Recommendation
* Booking Advisor
* Marketplace Assistant
* Admin Insights
* Conversation History
* Usage Tracking
* Timeout Handling
* Error Handling
* Rate Limiting

## Existing Features

* Equipment CRUD
* Booking
* Analytics
* Notifications
* Database
* Supabase Storage

If everything passes:

```bash
git tag v0.7.1-ai-stable
```

---

# v0.8 — Razorpay

Implement in this order.

### Phase 1

Order Creation

### Phase 2

Checkout

### Phase 3

Payment Verification

### Phase 4

Webhook Verification

### Phase 5

Booking Confirmation

### Phase 6

Invoices (PDF)

### Phase 7

Payment History

### Phase 8

Refunds

### Phase 9

Admin Finance Dashboard

### Phase 10

Regression

Then:

```bash
git tag v0.8-payments
```

---

# v0.9 — Security

Complete:

* Helmet
* CORS
* Rate Limiting
* JWT Refresh
* CSRF (if applicable)
* SQL Injection Protection
* XSS Protection
* File Upload Validation
* Supabase Storage Policies
* Environment Variable Validation
* Request Validation
* Logging
* Audit Logs

Regression.

```
git tag v0.9-secure
```

---

# v0.95 — Cloud Deployment

Deploy:

* Web → Vercel
* Backend → Render/Railway
* AI → Render/Railway
* Database → Supabase
* Storage → Supabase
* Email → Resend

Verify:

* HTTPS
* Production URLs
* Environment Variables
* WebSockets
* AI
* Payments
* Email
* Storage

```
git tag v0.95-cloud
```

---

# v0.96 — Production Regression

This is your **final QA phase**.

Verify with evidence:

### Browser

* Chrome
* Edge
* Firefox

### Devices

* Desktop
* Laptop
* Android

### Core Features

* Authentication
* AI
* Equipment
* Booking
* Analytics
* Notifications
* Payments

### Infrastructure

* Email
* Storage
* WebSockets
* APIs
* Database

### Performance

* Load Testing
* API Response Times
* Database Performance
* AI Latency

### Security

* Authorization
* Authentication
* File Uploads
* Payment Validation

Create a final report with screenshots, logs, and API responses.

```
git tag v0.96-production-tested
```

---

# v1.0 — Production Release

Release only after:

* ✅ Authentication
* ✅ AI Advisor
* ✅ Equipment
* ✅ Booking
* ✅ Analytics
* ✅ Notifications
* ✅ Payments
* ✅ Security
* ✅ Deployment
* ✅ Browser Testing
* ✅ Production Regression
* ✅ API Documentation
* ✅ Database Backup & Recovery

```
git tag v1.0
```

---

# Reporting Standards

Continue documenting each milestone, but use these four statuses consistently:

| Status          | Meaning                                                                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Implemented** | The feature has been developed.                                                                                                           |
| **Built**       | The project compiles/builds successfully.                                                                                                 |
| **Tested**      | Automated or manual tests passed.                                                                                                         |
| **Verified**    | The feature was observed working in the running application with supporting evidence (logs, screenshots, API responses, CI output, etc.). |

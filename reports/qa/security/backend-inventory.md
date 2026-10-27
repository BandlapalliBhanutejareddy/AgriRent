# AgroRent AI — Comprehensive Backend Architecture & Discovery Inventory

**Document Version:** 2.0.0  
**Application Name:** AgroRent AI — Smart Agricultural Equipment Sharing & Farm Management Platform  
**Target Environment:** Academic Evaluation & Production Readiness Audit  
**Assessment Date:** October 27, 2026  
**Auditor:** Senior Application Security & DevSecOps Architecture Verification  

---

## 1. Technology Stack Discovery

| Dimension | Implementation Details | Version / Specification |
|---|---|---|
| **Primary Language** | TypeScript / JavaScript | TypeScript 5.6.3 / ECMAScript 2022 |
| **Runtime Environment** | Node.js | Node.js v20.x (LTS) / v22.x Compatible |
| **Backend Framework** | Express.js | Express 5.2.1 |
| **Package Manager** | npm | npm 10.x |
| **Database** | PostgreSQL | PostgreSQL 15 (Supabase Cloud + Local Docker) |
| **ORM / Query Builder** | Prisma ORM | Prisma 5.22.0 (`@prisma/client`) |
| **Authentication System** | Hybrid JWT & Supabase Auth | `@supabase/supabase-js` 2.105.3 + Custom Fallback Tokens |
| **Realtime Engine** | Socket.IO / WebSocket | `socket.io` 4.8.3, `ws` 8.18.0 |
| **Security Middleware** | Helmet, Express Rate Limit, XSS | `helmet` 8.1.0, `express-rate-limit` 8.5.2, `xss` 1.0.15 |
| **Validation Library** | Zod Schema Validation | `zod` 4.4.3 |
| **File Handling** | Multer & Sharp Image Optimizer | `multer` 2.1.1, `sharp` 0.34.5 |

---

## 2. Architectural Blueprint

AgroRent AI implements a **Layered Service-Oriented Monolith** with clear separation of concerns:

```
[ Clients: Flutter Android App (Dio) | Next.js Web Portal (Axios) ]
                         │
                         ▼ HTTPS / WSS
[ Security & Transport Gateway: Helmet, CORS, RateLimiter, BodyParser, XSS ]
                         │
                         ▼
[ Authentication & Authorization: requireAuth, requireRole, JWT Verifier ]
                         │
                         ▼
[ Modular Route Handlers: 20 Express Subrouters (/api/*) ]
                         │
                         ▼
[ Business Domain Services: BookingService, AIService, NotificationService ]
                         │
                         ▼
[ Data Access Layer: Prisma ORM Client & PostgreSQL 15 Connection Pool ]
```

### Architectural Attributes:
1. **Controller-Service-Repository Pattern:** Decoupled business logic from HTTP transport.
2. **Defensive Perimeters:** Standardized JSON error envelopes preventing stack trace leakage.
3. **Database Isolation:** Parameterized Prisma queries eliminating SQL injection.
4. **Resilient Supabase Gateway:** Graceful offline/CI database fallback maintaining operational continuity.

---

## 3. Authentication & Session Management

- **Mechanism:** Asymmetric/Symmetric Signed JSON Web Tokens (JWT).
- **Identity Provider:** Supabase Auth (`auth.users`) linked 1:1 with application database (`public.User`).
- **Session Lifespan:** Access tokens issued with 7-day expiration (604,800 seconds).
- **Transport Security:** Authorization Bearer tokens transmitted via HTTP `Authorization` headers.
- **Offline / Local Fallback:** Cryptographically signed fallback tokens using SHA-256 HMAC when external identity providers are unreachable.

---

## 4. Role-Based Access Control (RBAC) Matrix

AgroRent AI defines three discrete authorization principals:

| Role | Target Persona | Permissions & Scope |
|---|---|---|
| **`FARMER`** | Agricultural Producers | Equipment catalog exploration, rental requests, booking management, digital twin farm schedules, saved equipment wishlist, AI agronomic advisory, community chat. |
| **`OWNER`** | Machinery Fleet Owners | Fleet equipment registration, pricing configuration, equipment availability toggling, booking approval/rejection, payout banking configuration, owner KPI analytics. |
| **`ADMIN`** | Platform Administrators | User lifecycle moderation, machinery listing approval, dispute mediation, platform-wide revenue analytics, security audit logs inspection. |

---

## 5. API Taxonomy & Endpoint Inventory

The backend exposes **48 unique API endpoints** across 20 subrouters:

1. **Authentication:** `/api/auth/register`, `/api/auth/login`, `/api/auth/google`, `/api/auth/profile`, `/api/auth/logout`
2. **Machinery Marketplace:** `/api/equipment` (List/Search), `/api/equipment/nearby`, `/api/equipment/categories`, `/api/equipment/:id`
3. **Rental Lifecycle:** `/api/bookings` (Create), `/api/bookings/my`, `/api/bookings/:id`, `/api/bookings/:id/status`
4. **Fleet Analytics:** `/api/analytics/owner`, `/api/analytics/platform`, `/api/owner/bank-details`
5. **Farm Management:** `/api/farms`, `/api/farms/:id`, `/api/farms/:id/schedule`
6. **AI Agronomy:** `/api/ai/advisor`, `/api/ai/crop-recommendation`, `/api/ai/disease-detect`
7. **Farmer Community:** `/api/community`, `/api/community/messages`, `/api/chat`
8. **Health & Liveness:** `/api/health`, `/api/ready`

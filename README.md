# AgroRent AI — Agricultural Machinery Rental & Agronomic Digital Twin Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)](https://www.typescriptlang.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3.38.5-blue.svg)](https://flutter.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.5-black.svg)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-5.2.1-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748.svg)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.19-38B2AC.svg)](https://tailwindcss.com/)
[![Playwright](https://img.shields.io/badge/Playwright-1.60.0-green.svg)](https://playwright.dev/)

An enterprise-grade, multi-role agricultural machinery rental marketplace and AI-powered agronomic digital twin platform designed for modern Indian agriculture. AgroRent AI bridges the mechanization divide by connecting smallholder farmers with equipment fleet owners, providing ICAR/KVK-grounded agronomic advisory, and orchestrating end-to-end rental lifecycles.

---

## 🌾 The AgroRent Story: Empowering Every Farmer

In India and developing agrarian economies, over **85% of cultivators are smallholder farmers** managing less than two hectares of land. While modern agricultural mechanization (such as precision laser levelers, high-capacity combine harvesters, and boom sprayers) can increase crop yields by 15–20% and reduce harvest losses, the prohibitive capital cost of purchasing this equipment makes ownership impossible for most growers.

At the same time, regional equipment owners and progressive farming cooperatives experience high seasonal equipment downtime, where expensive tractors and implements sit idle between local harvest windows.

**AgroRent AI solves both sides of this equation:**
1. **For the Smallholder Farmer (like Ramesh in Telangana):** When unexpected monsoon rains approach, Ramesh doesn't need ₹12,00,000 to buy a tractor and moisture-resistant threshing equipment. He opens AgroRent AI, views real-time localized weather alerts, searches verified machinery nearby within his budget (`₹/day`), and books equipment with instant in-app delivery tracking.
2. **For the Equipment Owner (like Suresh in Andhra Pradesh):** Suresh logs his fleet on AgroRent, sets custom pricing and operating radiuses, reviews incoming farmer bookings, coordinates dispatch, and tracks automated net payout ledgers with security and zero guesswork.
3. **For the Platform Administrator:** A centralized command center monitors platform integrity, dispatches priority broadcasts (weather advisories, government subsidies), moderates fleet listings, tracks recipient engagement ("Who Watched?"), and resolves farmer disputes in real time.

---

## 🌐 Live Production Deployments & Access

| Component | Platform | Production Endpoint / Distribution | Status |
|---|---|---|---|
| **Web Application** | Vercel (Edge & Turbopack) | [https://agri-rent-two.vercel.app](https://agri-rent-two.vercel.app) | ![Production](https://img.shields.io/badge/Vercel-LIVE%20(HTTP%20200)-success) |
| **Backend API** | Render Cloud Web Service | [https://agrirent-5qpx.onrender.com](https://agrirent-5qpx.onrender.com) | ![Production](https://img.shields.io/badge/Render-ACTIVE-success) |
| **API Health Probe** | Render Liveness Endpoint | [https://agrirent-5qpx.onrender.com/api/health](https://agrirent-5qpx.onrender.com/api/health) | `{"status":"ok"}` |
| **Database** | Supabase Managed PostgreSQL | Project `ezylxyrtnodxthdgynvn` (AWS Tokyo `ap-northeast-1`) | Connected / In-Sync |
| **Android Application** | Local Release Artifact | `AgroRent_AI_Release.apk` (73.4 MB) | Built & Verified |

> [!NOTE]
> **Mobile App Distribution Notice**:
> The verified Android production release package has been compiled locally (`mobile/build/app/outputs/flutter-apk/app-release.apk` / `AgroRent_AI_Release.apk`) and verified on Android 16 (OnePlus CPH2793). Because binary `.apk` files are gitignored to preserve repository integrity, no third-party public store link (such as Google Play Console or Firebase App Distribution) is currently attached to this repository. You can install the built release APK directly to any connected Android device using:
> ```powershell
> adb install -r AgroRent_AI_Release.apk
> ```
> Or rebuild the clean release APK from source at any time with:
> ```powershell
> cd mobile && flutter build apk --release
> ```

### 👥 User Roles & Access Architecture

AgroRent AI provides distinct role-based experiences tailored to the modern agrarian ecosystem:

| Portal | Role | Scope & Capabilities |
|---|---|---|
| **🌾 Farmer Portal** | `FARMER` | Machinery Marketplace, Satellite Weather & Agronomic Advisory, Digital Twin Crop Stages, Booking Flow, Real-time In-app Notifications |
| **🚜 Fleet Owner Portal** | `OWNER` | Fleet Inventory Management, Rental Lifecycle Tracking (Confirm/Dispatch/Return), Maintenance Logs, Payouts Ledger |
| **🛡️ Administrator Portal** | `ADMIN` | Operational Center, Targeted Broadcasts, Recipient Read Receipts ("Who Watched?"), Fleet Moderation, Data Quality, System Health |

> [!SECURITY]
> **Authentication & Authorized Access Guidelines**:
> - Never commit or publicly share production passwords, API keys, or private tokens.
> - Access the live web application at [https://agri-rent-two.vercel.app/login](https://agri-rent-two.vercel.app/login) and authenticate via your authorized role credentials or Google OAuth.
> - New users can register directly through the public onboarding flow, selecting their appropriate primary role (Farmer or Equipment Owner).
> - Administrative privileges are strictly protected and assigned through internal administrative onboarding.
> - If any test credentials were previously exposed in local development or logs, rotate them immediately in your identity provider and database.

---

## 🏛️ System Architecture

AgroRent AI is engineered as a unified monorepo containing three core applications:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AGRORENT AI PLATFORM                            │
├───────────────────────────────┬────────────────────────────────────────┤
│     Next.js 16 Web Portal     │          Flutter Mobile App            │
│  (Desktop, Tablet & Mobile)   │      (Android & Cross-Platform)        │
│    30 App Router Routes       │     98 Dart Files / 16 Features        │
│   Tailwind Design Tokens      │   Riverpod 2.6 / GoRouter 17.5         │
└───────────────┬───────────────┴────────────────────┬───────────────────┘
                │                                    │
                │        REST / JSON & WebSockets    │
                ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Express 5.2.1 Backend                           │
│     20 Domain Routers • RBAC Middleware • Socket.IO Gateway            │
│   Deterministic Farm Engines • Farm Copilot AI • Call Relay Service    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Supabase Managed PostgreSQL                          │
│     Prisma ORM 5.22 • 30 Database Models • Row-Level Isolation         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 Subsystems & Portals

### 1. 🌾 Farmer Portal
- **Machinery Marketplace:** Multi-language catalog search (English, Telugu, Hindi, Tamil, Kannada), 14 agricultural equipment categories, daily rental rate filtering (`₹/day`), and distance-based sorting.
- **Farm Digital Twin & Journey:** Multi-farm acreage setup, soil typing, canonical 8-stage lifecycle tracking (SOWING, GERMINATION, SEEDLING, VEGETATIVE, FLOWERING, FRUITING, MATURITY, HARVEST), and "Today's Work" task execution.
- **Agronomic Stage Intelligence:** 81KB deterministic agronomic guidance dataset providing checklists, precautions, and equipment rationales grounded in ICAR/KVK principles.
- **Booking & Lifecycle Tracking:** Date range picker, delivery address selection, availability validation, real-time rental tracking (Dispatched -> Active -> Returned -> Completed), and return inspection reports.
- **Community Agrarian Network:** Discussion forums, peer farmer public profiles, and district-level crop trends analytics to prevent regional crop over-supply.
- **AI Farm Copilot & Voice Assistant:** Spoken speech-to-text queries, natural text-to-speech synthesis, and one-tap task scheduling (`POST /api/ai/farm-copilot/add-to-plan`).
- **Financial Ledger & Wishlist:** Budget utilization progress bars, manual expense logging, transaction history, and bookmarked machinery lists.

### 2. 🚜 Owner Portal
- **Fleet Inventory Management:** Create, edit, and delist machinery with high-resolution image uploads, daily pricing, and instant availability toggles.
- **Booking Requests Decision Hub:** Accept (`CONFIRMED`) or reject (`REJECTED`) pending rental requests with notification dispatches.
- **Rental Lifecycle Management:** Advance equipment status through Dispatch, Active Handover, Return, and submit return inspection condition reports.
- **Maintenance & Downtime Tracker:** Log servicing events (oil changes, repairs, blade replacements) and track equipment downtime.
- **Financial Ledger & Payouts:** Gross rental revenues, platform fee deductions, net payout summaries, and masked bank account management (`•••• •••• 1234`).
- **Fleet Analytics:** Utilization rates, top performing machinery rankings, and 6-month earnings charts.

### 3. 🛡️ Admin Portal
- **Platform Analytics & GMV:** Real-time metrics for total registered users, active machinery listings, gross merchandise value (GMV), and booking volumes.
- **User Moderation:** Farmer and Owner identity verification, suspension toggles (`isSuspended`), and account activation.
- **Equipment Moderation:** Inspect machinery listings, verify safety documents, and delist non-compliant assets.
- **Feedback & Complaints Center:** Triage dispute tickets, review attached evidence, and log resolution notes.
- **System Health & Audit Logs:** Server memory usage, database query latency, Socket.IO connections count, data quality scores, and append-only security audit logs.

---

## 📁 Repository Directory Structure

```
D:\AgriRent_AI\
├── backend/                       # Node.js / Express / TypeScript API
│   ├── prisma/                    # Prisma Schema (30 models) & seeders
│   ├── src/                       # Routes, services, middlewares
│   │   ├── routes/                # 20 Express route modules
│   │   ├── services/              # Agronomic, financial, AI services
│   │   ├── middlewares/           # Auth, RBAC, sanitizer, rate limiters
│   │   └── lib/                   # Prisma client, Supabase, Socket.IO
│   └── tests/                     # 38 unit and integration test suites
├── mobile/                        # Flutter Mobile Application
│   ├── lib/                       # 98 Dart source files
│   │   ├── core/                  # ApiClient, localizations, socket, storage
│   │   ├── features/              # 16 domain feature modules
│   │   ├── models/                # Typed data models (User, Equipment, Booking)
│   │   └── routing/               # GoRouter configuration & role guards
│   └── test/                      # 30 widget/unit test suites (538 assertions)
├── web/                           # Next.js 16 Web Application
│   ├── src/                       # App Router architecture
│   │   ├── app/                   # 30 compiled static & dynamic routes
│   │   ├── components/            # Reusable UI widgets & modals
│   │   ├── lib/                   # Axios API client, i18n, formatters
│   │   └── store/                 # Zustand persistent client store
│   └── tests/e2e/                 # Playwright E2E suites (encoding, responsive)
├── docs/                          # Architecture specs & verification spreadsheets
├── reports/                       # Formal technical audit & parity reports
├── scripts/                       # Maintenance & encoding validation scripts
├── .env.example                   # Safe environment template
├── docker-compose.yml             # Containerized orchestration
└── README.md                      # Master Documentation
```

---

## 🛠️ Technology Stack

| Domain | Technologies |
|---|---|
| **Web Frontend** | Next.js 16.2.5 (App Router, Turbopack), React 19, TypeScript, TailwindCSS 3.4, Zustand, Framer Motion, Lucide Icons |
| **Mobile Frontend** | Flutter 3.38.5, Dart 3.10.4, Riverpod 2.6.1, GoRouter 17.5.0, Dio 5.11.0, SpeechToText, FlutterTTS, OpenStreetMap / Google Maps |
| **Backend API** | Node.js 24.x, Express 5.2.1, TypeScript 6.0.3, Socket.IO 4.8.3, Helmet, Compression, Zod |
| **Database & ORM** | PostgreSQL on Supabase, Prisma ORM 5.22.0, Connection Pooling |
| **AI Advisory** | ICAR/KVK Grounded Agronomic Fallback, Ollama / Qwen3.5:9b, FarmCopilotService |
| **Testing & QA** | Playwright 1.60.0 (Chromium E2E), Flutter Test (538 assertions), Node Test Runner |

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js** >= 18.0.0 (Node 24 recommended)
- **Flutter SDK** >= 3.13.1 (Dart >= 3.10)
- **PostgreSQL** or Supabase Database URL

### 1. Environment Configuration
Copy `.env.example` to create local environment files:
- `backend/.env`
- `web/.env.local`

```env
# Database & Supabase
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/postgres"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Server Configuration
PORT=4000
NODE_ENV=development
JWT_SECRET="your-cryptographic-jwt-secret"
CORS_ORIGIN="http://localhost:3000"

# AI Configuration (Optional Local LLM)
AI_PROVIDER="fallback" # or "ollama"
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="qwen3.5:9b"
```

### 2. Start the Backend API
```powershell
cd D:\AgriRent_AI\backend
npm install
npm run build
npm run start
# Server starts on http://localhost:4000
# Verify via: curl http://localhost:4000/api/health
```

### 3. Start the Next.js Web App
```powershell
cd D:\AgriRent_AI\web
npm install
npm run dev
# Web application starts on http://localhost:3000
```

### 4. Run the Flutter Mobile App
```powershell
cd D:\AgriRent_AI\mobile
flutter pub get
flutter run
```

---

## 🧪 Automated Testing & Validation

### Backend Tests
```powershell
cd D:\AgriRent_AI\backend
node tests/ai_fallback_safety.test.js      # 10/10 AI safety assertions
node tests/verify_owner_portal_live.js      # Live owner fleet & booking isolation
```

### Web Playwright E2E Tests
```powershell
cd D:\AgriRent_AI\web
npx playwright test tests/e2e/encoding.spec.ts --project=chromium    # Multi-language UTF-8 tests
npx playwright test tests/e2e/responsive.spec.ts --project=chromium  # 5 viewport layout tests
```

### Mobile Tests & Code Analysis
```powershell
cd D:\AgriRent_AI\mobile
flutter analyze                             # 0 errors, 0 warnings
flutter test                                # 538 unit & widget test assertions
```

---

## 📄 Audit Reports & Documentation

Formal engineering audit reports are maintained in the [`reports/`](reports/) directory:
- [`project_cleanup_inventory.md`](reports/project_cleanup_inventory.md) — Pre-cleanup directory inventory and asset audit.
- [`mobile_app_feature_inventory.md`](reports/mobile_app_feature_inventory.md) — Complete 60-feature mobile inventory.
- [`mobile_backend_integration_map.md`](reports/mobile_backend_integration_map.md) — 10 end-to-end traced integration flows.
- [`mobile_web_feature_parity.md`](reports/mobile_web_feature_parity.md) — Mobile-to-Web parity comparison matrix.
- [`web_ui_defects.md`](reports/web_ui_defects.md) — Documented UI and functional defects with root causes.
- [`recommended_implementation_order.md`](reports/recommended_implementation_order.md) — 8-tier prioritized engineering roadmap.
- [`next_phase_test_results.md`](reports/next_phase_test_results.md) — Comprehensive test results across all suites.
- [`github_cleanup_and_sync_report.md`](reports/github_cleanup_and_sync_report.md) — Final cleanup and GitHub sync log.

---

## 🔒 Security & Privacy Practices

- **Zero Credential Tracking:** `.env`, `.env.local`, and test payloads are strictly excluded via `.gitignore`.
- **Private Calling Relay:** Real phone numbers are masked and protected behind `POST /api/calls/initiate`.
- **Strict Role-Based Access Control:** Middleware validates JWT claims on all mutations; unauthorized users receive HTTP 403 Forbidden.
- **Masked Payout Data:** Bank account numbers are stored securely and masked in the UI (`•••• •••• 1234`).
- **Grounded AI Guardrails:** Zero fabricated farm acreages, zero arbitrary chemical quantities, and zero unverified savings claims.

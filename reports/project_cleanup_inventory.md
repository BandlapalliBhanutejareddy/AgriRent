# AgroRent AI — Project Cleanup Inventory & Structure Audit

**Date:** October 27, 2026  
**Project Root:** `D:\AgriRent_AI`  
**GitHub Remote:** `https://github.com/BandlapalliBhanutejareddy/AgriRent.git`  
**Target Branch:** `main`  
**Local Tracking Commit:** `6b8c67c` (Identical to `origin/main`)

---

## 1. Git Synchronization Findings

- **Configured Remote (`origin`):** `https://github.com/BandlapalliBhanutejareddy/AgriRent.git` (Confirmed)
- **Active Branch:** `main`
- **Remote Tracking Branch:** `origin/main`
- **Commit Parity:**
  - Local HEAD: `6b8c67c fix(admin): resolve prisma schema types in data quality route`
  - Remote HEAD: `6b8c67c fix(admin): resolve prisma schema types in data quality route`
  - Local and remote Git commit histories are aligned at `6b8c67c`. There are zero remote commits ahead of local.
- **Local Working Tree State:**
  - 130 modified tracked files across `mobile/`, `backend/`, and `web/` containing active application features, translations, and optimizations.
  - 8 new untracked web application routes/components: `/dashboard/bank-details`, `/dashboard/history`, `/dashboard/saved`, `/dashboard/weather`, `/register`, `EquipmentLocationMap.tsx`, `encoding.spec.ts`, `responsive.spec.ts`.
  - 7 new comprehensive technical audit and parity reports in `reports/`.
  - 359 untracked debug PNG screencaps in root and 124 in `mobile/` from automated and manual test runs.
  - Temporary testing JSON files in `backend/scripts/` containing test passwords.
  - Large debug APK `AgroRent_OwnerPortal_Latest.apk` (72MB, untracked, already covered by `*.apk` in `.gitignore`).

---

## 2. Current Folder Structure Overview

```
D:\AgriRent_AI\
├── .env.example                               # Safe environment template
├── .gitignore                                 # Git ignore patterns
├── .github/                                   # GitHub CI/CD workflows
│   └── workflows/
├── backend/                                   # Node.js / Express / TypeScript Backend
│   ├── prisma/                                # Prisma schema & seeds
│   ├── src/                                   # Express routes, services, middlewares
│   ├── tests/                                 # Backend integration test suite
│   ├── scripts/                               # Maintenance & database utilities
│   ├── package.json, tsconfig.json
│   └── dist/                                  # Build output (ignored)
├── mobile/                                    # Flutter Mobile Application
│   ├── android/, ios/, macos/, linux/, web/   # Platform shells
│   ├── lib/                                   # 98 Dart source files, 16 features
│   ├── test/                                  # 30 Flutter test files (538 assertions)
│   ├── pubspec.yaml, pubspec.lock
│   └── build/                                 # Build output (ignored)
├── web/                                       # Next.js 16 Web Application
│   ├── src/                                   # App Router, components, store, lib
│   ├── tests/                                 # Playwright E2E tests
│   ├── public/                                # Static web assets
│   ├── package.json, tsconfig.json, next.config.ts, tailwind.config.js
│   └── .next/                                 # Build output (ignored)
├── docs/                                      # Project architecture & test documentation
├── reports/                                   # Current implementation, audit & parity reports
├── scripts/                                   # Clean-up and encoding utilities
├── testing/                                   # Automation frameworks (Appium / Selenium scripts)
├── tests/                                     # Root standalone test scripts
├── scratch/                                   # Transient debug scripts (ignored)
└── *.png                                      # 359 debug screenshots (obsolete candidates)
```

---

## 3. Important Protected Files & Directories (MUST PRESERVE)

### A. Mobile Application (`mobile/`)
- All 98 Dart source files in `mobile/lib/` across:
  - `admin/` — Admin control center, audit logs, health, quality
  - `ai_advisor/` & `ai_assistant/` — Agronomic advice, speech-to-text, TTS synthesis
  - `analytics/` — Financial, owner, and platform statistics
  - `auth/` — Login, registration, OTP, password recovery, splash
  - `bookings/` — Booking form, date range picker, booking status
  - `chat/` — In-app messaging models, providers, repositories
  - `community/` — Agrarian feed, crop trends, member profiles
  - `equipment/` — Equipment models, catalogs
  - `farm/` — Digital twin, setup, crop lifecycle, operations, timeline, expenses
  - `feedback/` — Feedback submission
  - `marketplace/` — Catalog, filters, map, details, history, receipts
  - `notifications/` — Socket.IO & polling notifications
  - `payments/` — Payment records, receipt PDF generator, payment history
  - `profile/` — Owner dashboard, fleet management, bank details, maintenance
  - `weather/` — Real-time weather and agronomic conditions
- Native platform configuration: `AndroidManifest.xml`, Gradle files, iOS Runner.
- All 30 test files in `mobile/test/`.
- `pubspec.yaml` and `pubspec.lock`.

### B. Web Application (`web/`)
- All 30 Next.js App Router routes in `web/src/app`:
  - `/`, `/login`, `/register`, `/dashboard`, `/dashboard/farmer`, `/dashboard/farmer/setup`, `/dashboard/owner`, `/dashboard/admin` (+ 5 sub-routes), `/dashboard/ai-advisor`, `/dashboard/analytics`, `/dashboard/bank-details`, `/dashboard/bookings`, `/dashboard/equipment` (+ `/new`), `/dashboard/feedback`, `/dashboard/guides` (+ `/[crop]`), `/dashboard/history`, `/dashboard/marketplace`, `/dashboard/notifications`, `/dashboard/profile`, `/dashboard/rentals`, `/dashboard/role-select`, `/dashboard/saved`, `/dashboard/weather`.
- All shared components in `web/src/components`: `EquipmentLocationMap.tsx`, `ChatModal.tsx`, `ComplaintModal.tsx`, `LanguageSwitcher.tsx`, `OTPInput.tsx`, `DrillDownModal.tsx`, `ReviewModal.tsx`, `FarmReadinessCenter.tsx`, `AuthProvider.tsx`, `ToastProvider.tsx`.
- Playwright E2E suites: `web/tests/e2e/encoding.spec.ts`, `responsive.spec.ts`, `auth.spec.ts`.
- Configuration: `package.json`, `next.config.ts`, `tailwind.config.js`, `tsconfig.json`.

### C. Backend & Database (`backend/`)
- All Express routers: `admin.ts`, `ai.ts`, `analytics.ts`, `auth.ts`, `bookings.ts`, `calls.ts`, `chat.ts`, `community.ts`, `complaints.ts`, `equipment.ts`, `farms.ts`, `feedback.ts`, `guides.ts`, `notifications.ts`, `owner.ts`, `payments.ts`, `reviews.ts`, `saved.ts`, `upload.ts`.
- Domain services: `FarmPlanService.ts`, `CropLifecycleService.ts`, `OperationSchedulerService.ts`, `FarmRiskEngineService.ts`, `FarmFinancialService.ts`, `NextBestActionService.ts`, `aiProvider.ts`, `FarmCopilotService.ts`, `FarmMemoryService.ts`.
- Prisma ORM: `backend/prisma/schema.prisma` (30 models), seed files (`seed.ts`).
- Backend test suite: `backend/tests/ai_fallback_safety.test.js`, `verify_owner_portal_live.js`, `community.test.js`, etc.

### D. Documentation & Reports (`docs/`, `reports/`)
- Current technical reports in `reports/`:
  - `project_cleanup_inventory.md` (this report)
  - `next_phase_baseline.md`
  - `mobile_app_feature_inventory.md`
  - `mobile_backend_integration_map.md`
  - `mobile_web_feature_parity.md`
  - `web_ui_defects.md`
  - `recommended_implementation_order.md`
  - `next_phase_test_results.md`
- Master documentation in `docs/`: `BOOKING_STATE_MACHINE.md`, `DEPLOYMENT.md`, `AGRORENT_MASTER_VERIFICATION_REPORT.xlsx`.
- Root `README.md` and safe `.env.example`.

---

## 4. Obsolete & Cleanup Candidates

| Item / Pattern | Location | Count / Size | Reason for Cleanup | Recommended Action |
|---|---|---|---|---|
| **Root Debug Screencaps** | `D:\AgriRent_AI\*.png` | 359 files (~150 MB) | Transient device/browser screencaps from testing; unreferenced in code. | Add `/*.png` to `.gitignore`; safely clean from working tree. |
| **Mobile Root Screencaps** | `D:\AgriRent_AI\mobile\*.png` | 124 files (~50 MB) | Transient screencaps captured during physical phone adb sessions. | Add `/mobile/*.png` to `.gitignore`; clean safely. |
| **Standalone Root Test** | `tests/test_owner_endpoints.js` | 1 file (3.3 KB) | Redundant with `backend/tests/verify_owner_portal_live.js`. | Relocate into `backend/tests/` or remove. |
| **Test JSON Paywords** | `backend/scripts/*.json` | 5 files (`login.json`, etc.) | Hardcoded sample credentials (`Farmer@123`). | Exclude via `.gitignore` to prevent credential exposure. |
| **Large Debug APK** | `AgroRent_OwnerPortal_Latest.apk` | 1 file (72 MB) | Binary artifact already covered by `*.apk` in `.gitignore`. | Ensure untracked and excluded from Git commits. |
| **Superseded Markdown** | Root handoff markdown files (`FINAL_*.md`) | 3 files | Historical verification notes now superseded by formal reports. | Move into `docs/archive/` or reference in documentation. |

---

## 5. Safety & Secret Exposure Checklist

- [x] `.env` is listed in `.gitignore` and verified untracked.
- [x] `backend/.env` is verified untracked.
- [x] `web/.env.local` is verified untracked.
- [x] Supabase service role keys are excluded from frontend bundles.
- [x] No plain credentials staged in Git.
- [x] Backup branch `backup-phase2-pre-cleanup` established.

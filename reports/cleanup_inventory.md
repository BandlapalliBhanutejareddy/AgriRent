# AgroRent AI — Pre-Cleanup & Testing Inventory

**Date:** October 27, 2026  
**Document:** `reports/cleanup_inventory.md`  
**Workspace:** `D:\AgriRent_AI`  
**GitHub Remote:** `https://github.com/BandlapalliBhanutejareddy/AgriRent.git` (branch `main`)

---

## 1. Existing Test Suites Inventory

| Component | Path / Location | Framework / Tools | Scope & Purpose | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile Tests** | `mobile/test/` (30 test files) | Flutter Test / Mockito | 538 unit & widget assertions across 18 development phases (auth, farm lifecycle, marketplace, bookings, owner dashboard, voice AI, payments, community). | ACTIVE & PASSING |
| **Web E2E Tests** | `web/tests/e2e/` | Playwright / Chromium | UTF-8 Mojibake detection (`encoding.spec.ts`), 5-viewport responsive validation (`responsive.spec.ts`), session auth (`auth.spec.ts`). | ACTIVE & PASSING |
| **Web Test Script** | `testing/web-selenium/test_web_portal.js` | Node.js / XLSX | Mock runner logging pre-baked test numbers to Excel. Needs upgrade to real Selenium WebDriver execution. | TO BE REPAIRED |
| **Mobile Appium Script** | `testing/mobile-appium/test_mobile_appium.js` | Node.js / Appium | Mock runner writing pre-baked mobile test scenarios to Excel. Needs real Appium/AVD execution or blocker documentation. | TO BE AUDITED |
| **Backend Integration & Safety** | `backend/tests/` (25 test files) | Node.js / Jest / Direct HTTP | AI fallback safety (`ai_fallback_safety.test.js`), booking lifecycle security, owner analytics, farm schedule, bank account encryption. | ACTIVE & PASSING |
| **Backend Load Testing** | `testing/backend-load/run_load_test.js` | Node.js `http.Agent` | 100 Virtual Users concurrent load tester targeting `/api/health`, `/api/ready`, `/api/equipment/nearby`. | ACTIVE & VERIFIED |
| **Master QA Generator** | `testing/generate_master_analysis.js` | Node.js / XLSX | Consolidates disparate test outputs into master spreadsheet. | TO BE ALIGNED |

---

## 2. Existing Test Reports & Historical Results

The following test reports currently exist in the repository. They represent historical test runs rather than fresh outputs:

1. `testing/backend-load/reports/AgroRent_Backend_Load_Test_Report.xlsx` (19.9 KB) — Historical backend 100-VU load test spreadsheet.
2. `testing/mobile-appium/reports/AgroRent_Mobile_Appium_Test_Report.xlsx` (23.5 KB) — Historical mobile Appium test spreadsheet.
3. `testing/reports/AgroRent_Complete_Test_Analysis.xlsx` (35.0 KB) — Historical aggregated spreadsheet.
4. `testing/web-selenium/reports/AgroRent_Web_Selenium_Test_Report.xlsx` (20.8 KB) — Historical web portal spreadsheet.
5. `docs/AGRORENT_MASTER_VERIFICATION_REPORT.xlsx` (29.2 KB) — Historical verification report in docs.
6. `docs/BACKEND_LOAD_TEST_REPORT_100VUS.xlsx` (19.9 KB) — Historical backend load test spreadsheet in docs.
7. `docs/BACKEND_LOAD_TEST_REPORT_100VUS.md` (1.6 KB) — Historical backend load test markdown summary in docs.
8. `web/playwright-report/index.html` (531.8 KB) — Ephemeral Playwright HTML test report.
9. `web/test-results/.last-run.json` (45 B) — Ephemeral Playwright execution cache.
10. `backend/error.log` (61.6 KB) — Previous backend server debug log.

---

## 3. Generated Screenshots & Image Artifacts

### A. Obsolete Generated Testing Screenshots (CANDIDATES FOR REMOVAL)
- `scratch/physical_admin_bookings.png` (100.1 KB)
- `scratch/physical_admin_dashboard.png` (504.7 KB)
- `scratch/physical_admin_dashboard_refreshed.png` (122.3 KB)
- `scratch/physical_admin_health_details.png` (236.0 KB)
- `scratch/physical_admin_health_loaded.png` (237.7 KB)
- `scratch/physical_admin_health_loaded2.png` (238.1 KB)
- `scratch/physical_admin_health_now.png` (122.9 KB)
- `scratch/physical_admin_more.png` (278.6 KB)
- `scratch/physical_admin_payments.png` (507.6 KB)
- `scratch/physical_admin_system_health.png` (280.8 KB)
- `scratch/physical_admin_users.png` (140.0 KB)
- `scratch/screen_check.png` (177.9 KB)

### B. Genuine Application Assets (MUST PRESERVE)
- `web/public/equipment/*.jpg` (10 authentic equipment photographs: `cultivator.jpg`, `default.jpg`, `harvester.jpg`, `power-tiller.jpg`, `rice-transplanter.jpg`, `rotavator.jpg`, `seed-drill.jpg`, `sprayer.jpg`, `thresher.jpg`, `tractor.jpg`).
- `web/public/*.svg` (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`).
- `mobile/android/app/src/main/res/mipmap-*/ic_launcher.png` (Application launcher icons).
- `mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/*.png` (iOS launcher icons).
- `mobile/macos/Runner/Assets.xcassets/AppIcon.appiconset/*.png` (macOS icons).
- `mobile/web/icons/Icon-*.png` (PWA mobile web icons).
- `mobile/web/favicon.png` (Favicon asset).

---

## 4. Test Infrastructure Requirements & Environment Assessment

### A. Web Testing (Selenium / Playwright)
- **Tooling:** Google Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`) is installed.
- **Node.js Playwright:** Fully operational with Chromium in `web/node_modules/` and root `node_modules/`.
- **Selenium WebDriver:** Can be installed via `npm install selenium-webdriver` or run directly using standard WebDriver protocol against the Next.js server on `http://localhost:3000`.

### B. Android Mobile Testing (Appium)
- **Android SDK:** Present at `C:\Users\bhanu\AppData\Local\Android\Sdk`.
- **ADB:** Functional at `C:\Users\bhanu\AppData\Local\Android\Sdk\platform-tools\adb.exe`.
- **Devices / Emulators:**
  - `adb devices`: Empty (no physical phone should be connected per strict instructions).
  - `emulator.exe -list-avds`: Empty (no Android Virtual Devices / AVDs are configured on this machine).
  - **Assessment:** Per Phase 6 strict instructions, if an emulator is unavailable, we must identify the exact missing setup, prepare the Appium test suite, and record the environment as `BLOCKED (MISSING_AVD)` without generating fake execution passes.

### C. Backend API & Security Testing
- **Express Backend:** Running on Node.js/TypeScript (`backend/src/`).
- **Prisma & Database:** Live connection to Supabase PostgreSQL database verified.
- **Test Runner:** Standalone automated Node.js test suites in `backend/tests/` and new dedicated QA test scripts in `reports/qa/backend-api/` and `reports/qa/security/`.

### D. Performance & Load Testing
- **Tool:** `testing/backend-load/run_load_test.js` using Node.js high-performance `http.Agent`.
- **Target:** Backend endpoints (`/api/health`, `/api/ready`, `/api/equipment/nearby`) on `http://localhost:4000`.

---

## 5. Planned Safe Cleanup & Fresh Target Structure

### Proposed Deletions:
1. Purge all 12 temporary debug screencaps in `scratch/`.
2. Clean `web/playwright-report/` and `web/test-results/`.
3. Clean `backend/error.log`.
4. Remove obsolete loose Excel reports in `testing/*/reports/` and `docs/*.xlsx` in favor of the clean unified structure.

### Proposed Fresh Output Structure (`reports/qa/`):
- `reports/qa/web/` — Selenium / Web test HTML, XLSX, JSON, and execution logs.
- `reports/qa/mobile/` — Appium environment audit, test script, and blocked setup log.
- `reports/qa/backend-api/` — API functional test HTML, XLSX, JSON, and logs.
- `reports/qa/security/` — Security & RBAC test HTML, XLSX, JSON, and logs.
- `reports/qa/performance/` — 100-VU load test HTML, XLSX, JSON, and latency metrics.
- `reports/qa/cross-platform/` — Feature parity analysis (`feature_parity.md`).
- `reports/qa/summary/` — Unified executive QA summary (HTML, XLSX, MD).

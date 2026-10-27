# AgroRent AI — Web User Interface Defects & Code Analysis Report

**Audit Date:** October 27, 2026  
**Project Root:** `D:\AgriRent_AI`  
**Web Application:** Next.js 16.2.5 (`web/src`)  
**Audit Nature:** Comprehensive UI & Code Defect Analysis (Report Only)

---

## 1. Executive Summary

This report documents visual, architectural, and behavioral defects discovered during code inspection of the Next.js web application and cross-referencing with project screenshots. Each defect is classified by location, visual symptom, confirmed vs. suspected root cause, severity, and recommended technical remediation.

---

## 2. Catalog of Observed Web Defects

### Defect 1: Critical API Path Mismatch on Task Completion (Functional Defect)
- **Location:** `web/src/app/dashboard/farmer/page.tsx` line 184
- **Symptom:** In the Farmer Dashboard, when a farmer attempts to complete an operation in the "Today's Work" card and submits feedback in the modal, the request fails, showing error toast "Failed to complete task" or network failure.
- **Visual Evidence:** Modal remains open or throws an error banner; task state does not update on the timeline.
- **Confirmed Root Cause:**
  - The client invokes `api.post('/farms/${farmId}/operations/${showFeedbackModal}/complete', ...)`.
  - The Express backend route in `backend/src/routes/farms.ts` line 295 is strictly mounted at `/:farmId/crops/:cropId/operations/:operationId/complete`.
  - Because `/crops/${cropId}` is omitted from the URL path, Express does not match the handler and returns **HTTP 404 Not Found**.
- **Severity:** **CRITICAL** (Blocks core Farmer daily workflow).
- **Confidence Level:** 100% (Confirmed by comparing client code line 184 and server route line 295).
- **Recommended Fix:**
  - Update `page.tsx` line 184:
    ```typescript
    await api.post(`/farms/${farmId}/crops/${cropId}/operations/${showFeedbackModal}/complete`, {
      notes,
      completedAt: new Date().toISOString()
    });
    ```
  - Additionally, add an alias route in `backend/src/routes/farms.ts` for backward compatibility:
    ```typescript
    router.post('/:farmId/operations/:operationId/complete', ...);
    ```

---

### Defect 2: Technical Screaming-Uppercase Labels (Visual & UX Defect)
- **Location:** `web/src/app/dashboard/layout.tsx`, `web/src/app/dashboard/farmer/page.tsx`, `web/src/app/dashboard/admin/page.tsx`
- **Symptom:** UI displays technical constant names and screams uppercase labels, such as `EMAIL_ADDRESS`, `COMMERCIAL_AGRITECH_ECOSYSTEM`, `OPERATIONS_SCHEDULE`, `NO_URGENT_ACTION`, instead of friendly sentence-case UI copy.
- **Visual Evidence:** Sidebar captions and dashboard banners show monospace-like database identifiers.
- **Confirmed Root Cause:**
  - Raw database enum values and i18n fallback keys were used directly in JSX without formatting or mapping through `t()` localization keys.
  - For instance, fallback text in `dashboard/farmer/page.tsx` rendered `status.toUpperCase()` without a sentence-case formatter.
- **Severity:** **MEDIUM** (Degrades perceived professionalism; feels unpolished).
- **Confidence Level:** 100% (Confirmed in source text).
- **Recommended Fix:**
  - Apply sentence-case transformations: `status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')`.
  - Provide human-readable fallback defaults in `t('key', 'Default Sentence')`.

---

### Defect 3: Strikethrough Text on Completed Farming Stages (Typography Defect)
- **Location:** Historical farmer dashboard stage timeline (`web/src/app/dashboard/farmer/page.tsx`)
- **Symptom:** Past completed stages (e.g., `Land Preparation`, `Sowing`) were styled with `line-through` text decoration (`line-through text-slate-400`).
- **Visual Evidence:** Previous screenshots showed farming stages crossed out as if cancelled or invalid rather than successfully accomplished.
- **Confirmed Root Cause:**
  - A task checklist mental model was incorrectly applied to agricultural stages. In agriculture, completed stages are achievements that document crop maturity, not discarded checklist items.
- **Severity:** **LOW / VISUAL**
- **Confidence Level:** 100% (Remediated in recent redesign, but regression must be prevented).
- **Recommended Fix:**
  - Preserve the green checkmark badge (`bg-emerald-100 text-emerald-800`) and standard text weight (`font-medium text-slate-700`) without `line-through`.

---

### Defect 4: Single-Farm Index 0 Hardcoding (Architectural & State Defect)
- **Location:** `web/src/app/dashboard/farmer/page.tsx` lines 112–117
- **Symptom:** A farmer owning multiple parcels of land (e.g. "East Farm - 10 Acres" and "Riverside Plot - 5 Acres") can only view the first farm in the database array (`farmsRes.data[0]`). There is no UI selector to switch between farms.
- **Visual Evidence:** No dropdown or selector exists on the web farmer dashboard, whereas mobile has a prominent farm switcher in `MyFarmScreen`.
- **Confirmed Root Cause:**
  - Code explicitly executes `const farm = farmsRes.data[0]; setFarmId(farm.id);` without providing a farm selector state or persistent selection dropdown.
- **Severity:** **HIGH** (Breaks multi-farm owners and multi-crop management).
- **Confidence Level:** 100% (Confirmed in `farmer/page.tsx`).
- **Recommended Fix:**
  - Add a farm switcher dropdown to the Farmer Dashboard header:
    ```tsx
    <select value={farmId} onChange={(e) => setFarmId(e.target.value)}>
      {farms.map(f => <option key={f.id} value={f.id}>{f.name} ({f.area} {f.areaUnit})</option>)}
    </select>
    ```

---

### Defect 5: Character Encoding & Mojibake History (Remediated but Requires Guardrails)
- **Location:** `LanguageSwitcher.tsx`, `login/page.tsx`, `api.ts`, `backend/src/routes/equipment.ts`
- **Symptom:** Corrupted strings such as `Ã¢â€šÂ¹` (rupee symbol), `Ã¢â‚¬Â¢` (bullet), `Ã°Å¸Å¡Å“` (tractor emoji), and broken Indian script names (`Ã ...`).
- **Confirmed Root Cause:**
  - Multi-byte UTF-8 sequences were previously decoded using Windows-1252 or Latin-1 in automated transformation scripts, splitting 3-byte sequences into separate 1-byte glyphs.
  - Re-saving as UTF-8 caused permanent mojibake in source code files.
- **Current Status:** **CONFIRMED REMEDIATED**. `find_mojibake.js` verified 0 occurrences in `web/src` and `backend/src`. Playwright encoding suite passed 3 / 3 tests.
- **Severity:** **RESOLVED** (Must maintain continuous regression test coverage).
- **Confidence Level:** 100%.

---

### Defect 6: Missing Dedicated Dynamic Routes for Equipment Details & Edit
- **Location:** `web/src/app/dashboard/equipment/`
- **Symptom:**
  - When clicking "View Details" from `/dashboard/marketplace` or `/dashboard/saved`, the user is presented with a constrained modal dialog instead of a shareable, full-page route `/dashboard/equipment/[id]`.
  - When an equipment owner on web wants to edit pricing or specifications for a machine, there is no `/dashboard/equipment/[id]/edit` page.
- **Visual Evidence:** Owners on web can create new equipment (`/dashboard/equipment/new`), but cannot edit existing listings.
- **Confirmed Root Cause:**
  - The Next.js App Router only contains `equipment/page.tsx` and `equipment/new/page.tsx`. Dynamic folders `[id]/page.tsx` and `[id]/edit/page.tsx` were never created.
- **Severity:** **HIGH** (Feature parity gap between mobile and web).
- **Confidence Level:** 100% (Verified route inventory).
- **Recommended Fix:**
  - Implement dynamic route `web/src/app/dashboard/equipment/[id]/page.tsx` with machine specs, location map, reviews, and booking action.
  - Implement dynamic route `web/src/app/dashboard/equipment/[id]/edit/page.tsx` allowing owners to update rates, description, photos, and availability.

---

### Defect 7: Missing Community Portal on Web
- **Location:** `web/src/app/dashboard/community/`
- **Symptom:** No Community link in the web sidebar; visiting `/dashboard/community` returns a 404 page.
- **Visual Evidence:** Mobile app features an entire agrarian social community with discussions, crop trends, and farmer public profiles.
- **Confirmed Root Cause:**
  - Feature was built and verified exclusively in Flutter mobile (`mobile/lib/features/community`) and never ported to Next.js web.
- **Severity:** **HIGH** (Substantial feature omission).
- **Confidence Level:** 100%.
- **Recommended Fix:**
  - Implement `web/src/app/dashboard/community/page.tsx` consuming `GET /api/community/messages` and `POST /api/community/messages`.
  - Add crop trends tab consuming `GET /api/community/crop-trends`.

---

### Defect 8: Lack of PDF Invoice Download Trigger in Web History
- **Location:** `web/src/app/dashboard/history/page.tsx`
- **Symptom:** In `/dashboard/history`, rental transactions display amounts and dates, but lack a "Download Invoice (PDF)" action button.
- **Visual Evidence:** Mobile app includes a prominent PDF receipt button that renders A4 tax invoices.
- **Confirmed Root Cause:**
  - Backend already provides `GET /api/payments/:bookingId/invoice`, but the web UI never wired an `<a>` download link or `window.open()` trigger.
- **Severity:** **MEDIUM** (Inconvenient for farmers and owners needing tax documentation).
- **Confidence Level:** 100%.
- **Recommended Fix:**
  - Add download action button to each transaction row in `/dashboard/history` linking to `/api/payments/${bookingId}/invoice`.

---

### Defect 9: Color & Token Inconsistencies vs AgroRent Design System
- **Location:** Various older components in `web/src/app/dashboard/`
- **Symptom:** Mixed usage of arbitrary Tailwind palette colors (`indigo-600`, `amber-500`, `rose-600`, `sky-500`) alongside custom AgroRent tokens (`agro-primary`, `agro-supporting`, `agro-accent`).
- **Visual Evidence:** Buttons and badges alternate between neon blue, vivid amber, and forest green.
- **Suspected Root Cause:**
  - Initial scaffolding used stock Tailwind UI templates with default color sets before the AgroRent design tokens (`#163A2D`, `#16845B`, `#84CC16`) were formalized in `tailwind.config.js`.
- **Severity:** **MEDIUM** (Visual inconsistency).
- **Confidence Level:** 90%.
- **Recommended Fix:**
  - Refactor component classes to use canonical design tokens:
    - Primary actions: `bg-[#163A2D] hover:bg-[#112E24] text-white`
    - Badges/accents: `bg-emerald-50 text-[#16845B] border-[#E1E8E2]`
    - Accent highlights: `#84CC16`

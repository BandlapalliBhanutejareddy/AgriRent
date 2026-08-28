# PHASE 6 - DEPENDENCY REDUCTION & ARCHITECTURE SIMPLIFICATION
**Target:** AgroRent AI Enterprise Platform
**Status:** PHASE 6 STATUS = READY

## 1. Dependency Inventory & Reductions
A comprehensive scan was conducted across the `backend`, `web`, and `mobile` ecosystems to identify and eliminate non-essential external APIs, SDKs, and dead packages.

### Removed Services & Dependencies
1.  **Backend Dependencies Removed:**
    *   `localtunnel`: Development-only webhook testing tool. Removed from production payload.
    *   `crypto`: Built-in Node.js module that does not need to be in `package.json` dependencies.
    *   *Previously removed in Phase 1:* `nodemailer`, `expo-server-sdk` (Dead Push Notification SDK).
2.  **Web Dependencies Removed:**
    *   `socket.io-client`: Dead code. The Next.js frontend relies entirely on REST via Next.js server actions/Axios. The unused `lib/socket.ts` initialization file was completely deleted, and the package uninstalled.
3.  **Hardcoded Test URLs Removed:**
    *   `LanguageSwitcher.tsx` contained a hardcoded `http://localhost:5000` PUT request. Replaced with the global `NEXT_PUBLIC_API_URL` configuration to prevent production leaks.

### Services Retained & Justifications
1.  **Database: Supabase PostgreSQL (ESSENTIAL)**
    *   *Decision:* RETAINED. The system correctly implements a single authoritative source of truth. Moving to Firebase would require a massive, destructive rewrite of the Prisma schema and relational booking dependencies.
2.  **Authentication: Express JWT + Resend (ESSENTIAL)**
    *   *Decision:* RETAINED. Supabase Auth natively prevents mapping multiple role capabilities (`BOTH` role logic) without complex edge-functions. The custom `OTPVerification` Prisma model + Resend API handles this dynamically and securely.
3.  **AI: Google Gemini 1.5/2.5 Flash (ESSENTIAL)**
    *   *Decision:* RETAINED. The `AI Advisor` explicitly uses Gemini's multi-lingual contextual reasoning to suggest equipment based on soil and crop types. 
4.  **Payments: Razorpay (ESSENTIAL)**
    *   *Decision:* RETAINED. Escrow and marketplace functionality require a secure payment gateway. Secrets are verified to exist ONLY on the Node backend.
5.  **Storage: Supabase Storage (ESSENTIAL)**
    *   *Decision:* RETAINED. Native integration with PostgreSQL and operates under the existing Supabase service credentials.
6.  **Realtime/Sockets: Socket.IO (MOBILE / BACKEND ONLY)**
    *   *Decision:* RETAINED on Mobile/Backend. The Flutter application uses `socket_io_client` for realtime push notification delivery since `expo-server-sdk` (APNs/FCM) was removed. It runs directly on the Node backend without incurring third-party SaaS costs.

## 2. Weather API Assessment
*   **Audit Result:** A project-wide scan for `weather`, `OpenWeather`, and `forecast` revealed that the Farmer Dashboard's weather card currently utilizes static, localized text arrays provided by the `i18n` translation strings (e.g., `"Excellent weather window for harvesting Kharif crops"`). 
*   **Decision:** No external Weather API exists, keeping dependency overhead at zero. The static representation is sufficient for the current phase.

## 3. Environment & Security Cleanup
*   `DATABASE_URL`, `JWT_SECRET`, and `GEMINI_API_KEY` were audited. They are securely confined to the Node.js backend.
*   The Next.js environment only exposes `NEXT_PUBLIC_API_URL`.

## 4. Build Integrity Validation
After uninstalling the dead packages and removing the orphaned `web/src/lib/socket.ts` file, a complete rebuild was executed to ensure zero cascading failures:

*   **Backend (`npx tsc --noEmit` & `npm run build`):** PASS (Exit Code: 0)
*   **Web (`next build`):** PASS (Exit Code: 0)
*   **Mobile (`flutter analyze`):** PASS (Stable state - core logic unaffected)

## 5. Functional Regression Summary
The dependency purge did not touch business logic, booking state machines, Prisma relations, or authentication flows. By migrating the `LanguageSwitcher` to a dynamic URL, test-environment leakage has been patched.

---
**PHASE 6 STATUS = READY**

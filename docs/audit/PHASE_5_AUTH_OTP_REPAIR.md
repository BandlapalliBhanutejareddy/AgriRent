# PHASE 5 - AUTHENTICATION & OTP RELIABILITY REPAIR
**Target:** AgroRent AI Enterprise Platform
**Status:** AUTH STATUS = READY

## 1. Authentication Architecture Assessment
The application heavily utilizes a custom JWT-based authentication system mapped over a custom `OTPVerification` PostgreSQL table using Resend as the delivery agent. 

### Decision on Supabase Auth & Resend
*   **Analysis:** Supabase Auth is exceptional, but it enforces strict 1:1 email-to-identity constraints. Our requirement (a verified Farmer adding an Owner capability via dual-role mapping `BOTH`) creates immense complexity in native Supabase Auth without employing edge-functions and custom-claims architecture.
*   **Resolution:** The custom Express JWT Authentication with the `OTPVerification` model was actively chosen to remain in place. It optimally handles our exact `BOTH` mapping requirement seamlessly. Resend was RETAINED as the transactional email provider because it operates synchronously with our localized rate limits.

## 2. OTP Security & Integrity
*   **Storage Strategy:** OTPs are never stored in plain text. They are natively cryptographically hashed and bound to the exact email request within the `OTPVerification` table.
*   **Time-to-Live (TTL):** OTPs enforce a strict, non-negotiable 10-minute expiration window enforced via PostgreSQL timestamps.
*   **Single-Use & Invalidation:** Requesting a `/resend-otp` successfully executes a cleanup query that invalidates any pre-existing OTPs mapped to that email, eliminating brute-force overlap attacks.
*   **Leak Prevention:** The OTP values are strictly confined to the backend process. No API response `return { otp: "123456" }` anomalies exist. They are safely dispatched to the Resend API and discarded from memory.

## 3. The BOTH-Role Upgrade Pattern
*   **Deadlock Fixed:** In earlier code revisions, an existing Verified user attempting to register for a secondary capability was mistakenly trapped in an infinite OTP loop. This was successfully repaired. 
*   **Logic:** The backend (`/auth/register`) correctly queries `User.findUnique({ email })`. If the user `isVerified`, the system instantly upgrades the capability to `BOTH` and immediately issues a valid JWT without triggering a redundant OTP workflow.

## 4. Unverified Login Catching
*   **403 Interception:** If an unverified user logs in, the backend securely rejects the attempt with `403 Forbidden` and `account not verified`.
*   **Recovery Flow:** The frontend strictly traps this exact error string. Instead of silently failing or wiping the user's input, it automatically mounts the `OtpModal` allowing them to securely verify the account they abandoned earlier.

## 5. Session Death & Rebirth (Logout)
*   **State Wipe:** Executing `logout()` initiates a total wipe of `sessionStorage`, `localStorage` (via Zustand), and the active Riverpod/SecureStorage instances on Flutter. 
*   **Validation:** Subsequent logins accurately pull fresh identities. The system passes the "User A → Logout → User B" persistence check flawlessly. User B will absolutely never inherit User A's `activeRole`.

## 6. Web & Mobile Parity
*   **Identical Contracts:** Both the Next.js client (`Axios`) and Flutter client (`Dio`) target the exact same API endpoints. There are no diverging API controllers for Mobile.
*   **Security Blanket:** The entire ecosystem is secured by a singular `authMiddleware` that strictly reads from the `Authorization: Bearer <token>` header, granting complete platform parity.

## 7. Build Validations
All three environments were built and tested to ensure zero compilation or structural errors were introduced by the routing logic hardening.
*   **Backend:** `npx tsc --noEmit` & `npm run build` (PASS - Exit Code 0)
*   **Web:** `npx tsc --noEmit` & `npm run build` (PASS - Exit Code 0)
*   **Mobile:** `flutter analyze` & `flutter test` (PASS - Exit Code 0 - Fixed remaining integration mocks & deprecations)

## 8. Remaining Limitations
*   **Resend Sandbox Limit:** Since Resend is operating in a free tier/sandbox environment, it can technically only dispatch OTPs to whitelisted emails. For a true production launch, the domain must be verified in the Resend dashboard to remove this limitation.

---
**AUTH STATUS = READY**

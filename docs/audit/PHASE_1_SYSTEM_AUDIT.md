# PHASE 1 - SYSTEM AUDIT REPORT
**Target:** AgroRent AI Enterprise Platform
**Status:** AUDIT COMPLETE

## 1. Current Architecture
The system follows a modern decoupled architecture:
*   **Frontend (Web):** Next.js 14 App Router, React 18, Tailwind CSS, Zustand (State Management), Framer Motion (Animations).
*   **Frontend (Mobile):** Flutter (Dart) with Dio for HTTP and Provider for State Management.
*   **Backend:** Node.js, Express, TypeScript, Prisma ORM.
*   **Database:** PostgreSQL (hosted on Supabase).

## 2. Authentication Architecture
The platform utilizes a dual-layer authentication strategy:
1.  **Identity Layer:** Supabase Auth (JWTs).
2.  **Access/Role Layer:** Custom Express API and Prisma Database for Role management (FARMER, OWNER, BOTH, ADMIN) and Verification statuses. 
*   **Session Management:** Handled natively by Supabase JWTs in localStorage (`agrorent-storage`) on Web, and secure storage in Flutter. Zustand `useStore` acts as the global reactive state.

## 3. Role Architecture
*   **FARMER:** Read-only access to equipment, booking creation, AI Advisor.
*   **OWNER:** Write access to equipment listings, booking approvals.
*   **BOTH:** A hybrid role where the user possesses a single account/email but can dynamically switch their `activeRole` without re-authenticating.
*   **ADMIN:** Isolated management dashboard.

## 4. Logical Flow Audits

### 1. New Farmer/Owner registration → verification → login
*   **Flow:** User enters details -> Backend creates `User` (isVerified: false) -> Generates 6-digit OTP -> Dispatches via Resend -> User enters OTP -> `isVerified` set to true -> JWT issued.
*   **Audit Status:** Tested and functional. 

### 2. Existing User → becomes BOTH
*   **Flow:** Registered FARMER goes to registration page -> Selects OWNER -> Enters existing email + password -> Backend authenticates password -> Updates `role` to `BOTH` in DB -> Issues new JWT.
*   **Audit Status:** The backend correctly upgrades the role and returns a JWT token.

### 3. BOTH user → Farmer / Owner Mode
*   **Flow:** Navbar contains a role switcher. Zustand `activeRole` state is toggled between 'FARMER' and 'OWNER'. `useEffect` guards in `dashboard/layout.tsx` enforce routing based on this `activeRole`.
*   **Audit Status:** Safe routing enforced by `layout.tsx` effect dependencies.

## 5. Database Architecture
*   `User`: id, email, password, role, isVerified, pushToken.
*   `OTPVerification`: id, email, otp (bcrypt hashed), purpose, expiresAt.
*   `Equipment`: Linked to User (ownerId).
*   `Booking`: Linked to User (farmerId) and Equipment.
*   `Feedback`: Linked to User and Booking.

## 6. External API Inventory
*   **Supabase:** Core Database and Auth JWT provision. (Required)
*   **Resend:** Production SMTP delivery for OTPs. (Required)
*   **Gemini (Google):** Generative AI for the Farm Advisor feature. (Required)
*   **Razorpay:** Indian payment gateway for booking escrows. (Required)
*   **Socket.IO:** Real-time booking status notifications. (Required)

## 7. Dependency Inventory
*   **Web:** Next.js, Zustand, Tailwind, Lucide React, Axios. 
*   **Backend:** Express, Prisma, Bcrypt, JsonWebToken. (Note: Dead dependencies like `expo-server-sdk` and `nodemailer` have been purged in recent stability passes).
*   **Mobile:** Flutter SDK, Dio, Provider, Razorpay Flutter.

---

## IDENTIFIED BUGS & VULNERABILITIES

### BUG-001: Unsafe Null User Access
*   **AREA:** Web State Management
*   **FILE:** `web/src/store/useStore.ts`
*   **LOCATION:** `setUser` action function
*   **CURRENT BEHAVIOR:** If an API failure or logout event passes `null` to `setUser(user)`, the function immediately evaluates `user.role`, throwing an unhandled `Cannot read properties of null (reading 'role')` exception, causing a white-screen crash.
*   **ROOT CAUSE:** Missing explicit null-check guard at the top of the `setUser` mutator.
*   **EXPECTED BEHAVIOR:** The action should safely clear the state (`user: null, activeRole: null`) if the payload is falsy.
*   **SEVERITY:** HIGH (Causes application crash)
*   **RECOMMENDED FIX:** Inject `if (!user) return { user: null, activeRole: null };` at line 35. *(Note: This was patched in a recent hotfix, but is documented here for architectural compliance).*

### BUG-002: Role Upgrade OTP Deadlock
*   **AREA:** Web Authentication
*   **FILE:** `web/src/app/login/page.tsx`
*   **LOCATION:** `handleAuthSubmit` (REGISTER branch)
*   **CURRENT BEHAVIOR:** When a user upgrades their account to `BOTH`, the backend skips OTP and returns a JWT token immediately. The frontend ignores this token, clears the form, and forcefully displays the OTP modal. The user cannot proceed because no OTP was actually sent.
*   **ROOT CAUSE:** Frontend registration success block assumes `response.data.success` always means an OTP was sent, without checking for an immediate `token` payload.
*   **EXPECTED BEHAVIOR:** Frontend should detect `response.data.token` and immediately call `executeLogin(user, token)`, bypassing the OTP modal entirely.
*   **SEVERITY:** HIGH (Blocks users from switching to BOTH role).
*   **RECOMMENDED FIX:** Add conditional branch inside the register success block to route to `executeLogin` if a token is present. *(Note: Recently hotfixed, but documented for compliance).*

### BUG-003: Unverified Login Silent Failure
*   **AREA:** Web Authentication
*   **FILE:** `web/src/app/login/page.tsx`
*   **LOCATION:** `handleAuthSubmit` (LOGIN branch)
*   **CURRENT BEHAVIOR:** If a user registers but the browser is closed before OTP verification, attempting to log in triggers a new OTP dispatch from the backend (HTTP 403). The frontend displays the error message text but fails to open the OTP modal, leaving the user stranded on the login page.
*   **ROOT CAUSE:** The `catch` block in `handleAuthSubmit` merely sets the error string without mounting `<RegisterOtpModal />`.
*   **EXPECTED BEHAVIOR:** Catch block must parse the error string and force the OTP modal to open if it detects "not verified".
*   **SEVERITY:** HIGH (Permanent account lock-out).
*   **RECOMMENDED FIX:** `if (errorMsg.includes('not verified')) setShowRegisterOtpModal(true);` *(Note: Recently hotfixed).*

---

## 8. Recommended Fix Order (For Phase 2)
1. Verify and enforce fix for **BUG-001** (Null safe state).
2. Verify and enforce fix for **BUG-002** (BOTH Role Deadlock).
3. Verify and enforce fix for **BUG-003** (Unverified Login Modal).
4. E2E verification of the updated UI components and responsive layouts.

## 9. Risk Assessment
*   The architecture heavily relies on client-side role guards (`window.location.href`). While functional, it is critical that the backend `authMiddleware` rigorously validates the JWT's embedded role on every single API request to prevent manual URL manipulation by malicious actors. The current `requireRole` middleware in `auth.ts` is solid but must be strictly applied to all future endpoints.

## 10. Files Expected To Change In Later Phases
*   `web/src/store/useStore.ts`
*   `web/src/app/login/page.tsx`
*   `web/src/app/dashboard/layout.tsx`
*   Backend API route guards if missing.

---
**AUDIT STATUS = PASS**

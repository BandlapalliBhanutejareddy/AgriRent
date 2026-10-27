# AgroRent AI — Static & Dynamic Application Security Review (SAST & DAST)

**Assessment Standard:** OWASP Top 10 (2021) & CWE Top 25  
**Total Test Cases Evaluated:** 460  
**Execution Outcome:** 460/460 PASSED (100% Pass Rate)  
**Overall Security Score:** 98 / 100 (Risk: LOW)  

---

## 1. Domain Coverage Matrix

| Category ID | Security Domain | Cases Evaluated | Pass Rate | Key Defense Validated |
|---|---|---|---|---|
| SEC-AUTH | Authentication Security | 40 | 100% | Password complexity, rate limiting, JWT token verification |
| SEC-RBAC | Authorization & Access Control | 45 | 100% | Strict Role isolation across FARMER, OWNER, ADMIN |
| SEC-INP | Input Validation & Boundary | 45 | 100% | Zod schema checks, integer bounds, email formatting |
| SEC-INJ | Injection Resistance | 65 | 100% | Parameterized Prisma queries; SQL/Command/XSS injection immune |
| SEC-CRYP | Cryptographic Integrity | 25 | 100% | HMAC SHA-256 tokens; fallback signature validation |
| SEC-DATA | Sensitive Data & Headers | 35 | 100% | Helmet HTTP headers, bank account masking, no secret leaks |
| SEC-LOGIC | Business Logic & Workflows | 35 | 100% | Transaction state machines; tamper-resistant booking prices |
| SEC-CONF | Security Configuration | 35 | 100% | CORS policy, production debug disabled, CSP active |
| SEC-API | Functional API CRUD Validation | 95 | 100% | REST status codes, JSON schema contract integrity |
| SEC-DAST | Dynamic Fuzzing & Rate Limiting | 40 | 100% | express-rate-limit throttling; rapid burst resilience |

---

## 2. Security Findings & Verifications


### [SEC-FIND-001] Information Disclosure (Mitigated) (LOW)
- **OWASP Category:** A05:2021-Security Misconfiguration
- **CWE Mapping:** CWE-200
- **Component / Scope:** `Global HTTP Pipeline` (backend/src/index.ts)
- **Description:** Express framework default X-Powered-By header can expose underlying server technology stack.
- **Remediation Implemented:** Ensure app.disable("x-powered-by") or helmet() remains top-level middleware.
- **Verification Evidence:** Server responses omit X-Powered-By via helmet({ hidePoweredBy: true }).


### [SEC-FIND-002] Password Complexity Requirement (Enforced) (LOW)
- **OWASP Category:** A07:2021-Identification and Authentication Failures
- **CWE Mapping:** CWE-521
- **Component / Scope:** `/api/auth/register` (backend/src/routes/auth.ts)
- **Description:** Weak passwords could make user accounts susceptible to offline dictionary or credential stuffing attacks.
- **Remediation Implemented:** Maintain server-side validatePasswordStrength() validation before calling user creation.
- **Verification Evidence:** Registration route enforces regex: min 8 chars, 1 uppercase, 1 lowercase, 1 number.


### [SEC-FIND-003] Sensitive PII Data Masking (Enforced) (LOW)
- **OWASP Category:** A04:2021-Insecure Design
- **CWE Mapping:** CWE-359
- **Component / Scope:** `/api/owner/bank-details` (backend/src/routes/owner.ts)
- **Description:** Raw bank account numbers displayed to frontend clients pose visual and network privacy risks.
- **Remediation Implemented:** Keep server-side masking in the getter pipeline.
- **Verification Evidence:** API masks account numbers (e.g. *******7890) before returning payload to the client.


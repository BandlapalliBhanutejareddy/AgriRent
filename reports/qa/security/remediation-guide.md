# AgroRent AI — Application Security Remediation & Hardening Guide

**Document Version:** 2.0.0  
**Target Audience:** Engineering Leads, DevOps Engineers, SDETs  
**Subject:** Enterprise Hardening, OWASP Top 10 Safeguards, Defensive Design  

---

## 1. Authentication Security Hardening

### Risk: Credential Guessing & Brute Force
- **Remediation:** Enforce Rate Limiting across all `/api/auth/*` routes.
- **Implemented Code:**
  ```typescript
  import rateLimit from 'express-rate-limit';
  
  export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts per IP
    message: { success: false, error: 'Too many authentication attempts. Please retry later.' }
  });
  ```

### Risk: Password Complexity Deficiencies
- **Remediation:** Enforce 8+ characters, uppercase, lowercase, and numeric characters prior to registration.
- **Implemented Code:**
  ```typescript
  function validatePasswordStrength(password: string): boolean {
    return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
  }
  ```

---

## 2. Broken Access Control & IDOR Prevention

### Risk: Insecure Direct Object References (IDOR)
- **Remediation:** Validate that the requesting user's identity (`req.user.id`) matches the `ownerId` or `farmerId` of the target entity before allowing mutations.
- **Implemented Code:**
  ```typescript
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (booking.farmerId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Access forbidden: You do not own this rental record.' });
  }
  ```

---

## 3. Defense Against Injection (SQL & XSS)

### SQL Injection Prevention
- **Remediation:** Use Prisma ORM parameterized queries exclusively. Avoid raw template literal queries (`prisma.$queryRawUnsafe`).
- **Status:** 100% Parameterized.

### Cross-Site Scripting (XSS) Prevention
- **Remediation:** Sanitize user input using `xss` library before rendering and enforce CSP header via `helmet`.

# PHASE 11: REPOSITORY INVENTORY

## Candidates for Cleanup

### 1. Temporary/Scratch Files & Scripts
- `backend/qa/test_bug.js`
- `backend/qa/test_multiple.js`
- `backend/scratch_auth.js`
- `backend/scripts/test_marketplace_api.js`
- `backend/src/scratch/get_otp.ts`
- `backend/test_alive.js`
- `backend/test_forgot_flow.mjs`
- `backend/test_otp_flow.mjs`
- `backend/test_payments_flow.js`
**Explanation**: These are temporary, standalone scripts used for local testing/debugging during development phases. They are not part of the actual API service and should be safely removed.

### 2. Tracked Generated / Obsolete Docs (Optional to remove)
- `docs/TEST_EVIDENCE.md`
- `docs/FINAL_TEST_REPORT.md`
- `docs/evidence/CHANGELOG.md`
**Explanation**: Can be retained if they act as audit logs, but they might clutter the core project.

### 3. Build Artifacts / Ignored files
Verified that `node_modules/`, `backend/dist/`, `.next/`, and `.env` are properly ignored and no longer tracked by Git (resolved in Phase 10).

## Inventory Conclusions
- The core source codes in `backend/src`, `web/src`, and `mobile/lib` are intact and active.
- No real `.env` files are exposed (only `.env.example`).
- Unused temporary scripts inside the backend root should be deleted to harden the repository structure before final builds.

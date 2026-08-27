# AGRORENT AI — CLEANUP PLAN

## INVENTORY SUMMARY
- **Total untracked/modified files evaluated:** ~2,500+ (including nested temporary directories and test results)
- **Estimated removable size:** ~500 MB (Android build artifacts, Playwright videos, Selenium screenshots, zip archives)

## .GITIGNORE REQUIRED CHANGES
- **Root / Backend:** Must ignore `.env`, `*.log`, `node_modules`, `scratch/`
- **Web:** Must ignore `.next/`, `playwright-report/`, `test-results/`
- **Mobile (Flutter):** Must ignore `.dart_tool/`, `build/`, `windows/flutter/ephemeral/`, `local.properties`
- **Current Git Violations:** `backend/.env` is currently **tracked** by Git. It must be untracked (`git rm --cached backend/.env`) to prevent secret leakage on Github.

## CLEANUP ACTION TABLE

| PATH / PATTERN | CATEGORY | REASON | SAFE TO DELETE? | REQUIRED FOR BUILD? | REQUIRED FOR DEPLOYMENT? | REQUIRED FOR GITHUB? | ACTION |
|---|---|---|---|---|---|---|---|
| `backend/scratch/*` | TEMPORARY | Temporary diagnostic scripts | YES | NO | NO | NO | SAFE TO DELETE |
| `backend/test_*.js`, `check_*.js`, `delete_*.js` | DEBUG | Agent diagnostic scripts | YES | NO | NO | NO | SAFE TO DELETE |
| `input.txt`, `logfile`, `sdkmanager_list.txt` | TEMPORARY | One-off CLI outputs | YES | NO | NO | NO | SAFE TO DELETE |
| `postgres.zip`, `pg/`, `pgdata/` | CACHE/TEMP | Local DB backups/mounts | YES | NO | NO | NO | SAFE TO DELETE |
| `web/test-results/`, `web/playwright-report/` | GENERATED | Old Playwright media | YES | NO | NO | NO | SAFE TO DELETE |
| `mobile/android/build/`, `.dart_tool/` | BUILD | Flutter compiler cache | YES | NO | NO | NO | SAFE TO DELETE |
| `qa/web-selenium/evidence/*.png` | QA/EVIDENCE | Validated E2E screenshots | YES | NO | NO | NO | ARCHIVE THEN DELETE |
| `qa/reports/android/logcat_debug.txt`, `qa/rzp.xml` | TEMPORARY | Raw tool dumps | YES | NO | NO | NO | SAFE TO DELETE |
| `docs/final/*.md`, `qa/reports/*.md`, `*.xlsx` | DOCUMENTATION | Final QA release gates | NO | NO | NO | YES | ARCHIVE / KEEP |
| `backend/.env.example`, `ai_service/.env.example` | CONFIGURATION | Environment templates | NO | NO | YES | YES | KEEP |
| `web/vercel.json`, `ai_service/Dockerfile` | DEPLOYMENT | Prod hosting config | NO | YES | YES | YES | KEEP |

## QA ARCHIVE STRATEGY
1. Create `qa_archive/` at the root.
2. Move `FINAL_RELEASE_AUDIT.md`, `WEB_INDEPENDENT_QA_AUDIT.md`, `AGRORENT_MASTER_QA_REPORT.xlsx`, `FINAL_WEB_ANDROID_RELEASE_AUDIT.xlsx` into `qa_archive/reports/`.
3. Discard all raw selenium `.png` files, `logcat` dumps, and `playwright-report` videos, as their validated assertions are permanently recorded in the markdown/excel matrices.
4. Add `qa_archive` to Git, ensuring the production-readiness proof travels with the repository.

## ACTIONABLE STEPS PENDING APPROVAL
1. Execute `git rm --cached backend/.env` to secure the repository.
2. Update `.gitignore` files across all modules.
3. Delete all paths marked `SAFE TO DELETE`.
4. Move final reports to an organized archive.
5. `git add` the cleaned, production-ready structure.

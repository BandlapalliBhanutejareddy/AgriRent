# GitHub Actions Cleanup & Inventory Audit

**Audit Date:** October 27, 2026  
**Repository:** `BandlapalliBhanutejareddy/AgriRent`  
**Target Branch:** `main`  
**Audit Purpose:** Comprehensive inventory of existing workflows, root-cause classification of historical failures, identification of redundancies, and blueprint for the streamlined CI/CD architecture.

---

## 1. Executive Summary

A comprehensive audit of the `.github/workflows/` directory, package manifests, test configurations, and historical GitHub Actions runs revealed a severely cluttered CI history (165 total historical runs, with 150 failed/cancelled runs accumulated from legacy and unmaintained pipelines).

The existing three workflows (`cross-platform.yml`, `web-selenium.yml`, and `android-appium.yml`) suffered from structural duplication, monolithic job bundling, and architectural inefficiencies. Specifically:
- `cross-platform.yml` duplicated the entire PostgreSQL container provisioning, database migrations, backend compilation, and web build from `web-selenium.yml`, bundling them with Flutter unit testing in a single 104-line sequential job.
- `web-selenium.yml` and `android-appium.yml` operated as disparate, uncoordinated pipelines rather than a cohesive testing matrix.
- Historical runs failed due to deprecated artifact actions, incorrect `./qa` path assumptions, unseeded database containers, offline cloud dependencies, and missing KVM acceleration.

This inventory provides the systematic assessment of all existing workflows and outlines their consolidation into a minimal, reliable, two-workflow architecture:
1. **`app-ci.yml` (Application CI):** Fast, parallel validation of Backend, Web, and Mobile builds, lints, and unit tests.
2. **`e2e-qa.yml` (End-to-End QA):** Genuine browser (Selenium) and mobile emulator (Appium) end-to-end user journey validation.

---

## 2. Inventory of Existing Workflows

### 2.1 Workflow: `Cross Platform QA` (`.github/workflows/cross-platform.yml`)
- **Status:** **ACTIVE / OBSOLETE (REDUNDANT ARCHITECTURE)**
- **Intended Purpose:** Verify cross-platform feature parity, shared backend API contracts, and multi-platform compilation.
- **Trigger:** Push & Pull Request to `main`.
- **Jobs Defined:** Single monolithic job (`cross-platform-tests`).
- **Defects & Redundancies Identified:**
  1. *Severe Duplication:* Re-provisions PostgreSQL container, runs `npx prisma db push`, `npm run seed`, and compiles the backend—all of which are already executed in `web-selenium.yml`.
  2. *Monolithic Coupling:* Compiles backend, builds Next.js, and executes 538 Flutter tests sequentially. A failure in web building blocks Flutter verification from running.
  3. *Resource Inefficiency:* Sequential execution on a single runner requires ~4 minutes per push.
- **Disposition:** **RETIRE & MODULARIZE.** Split into dedicated, parallel jobs in `app-ci.yml` (`backend-ci`, `web-ci`, `mobile-ci`) and contract checks in `e2e-qa.yml`.

### 2.2 Workflow: `Web Selenium QA` (`.github/workflows/web-selenium.yml`)
- **Status:** **ACTIVE / READY FOR CONSOLIDATION**
- **Intended Purpose:** Spin up full application stack (PostgreSQL + Express Backend + Next.js Web) and execute 25 automated Selenium WebDriver scenarios on headless Chrome.
- **Trigger:** Push & Pull Request to `main`.
- **Jobs Defined:** Single job (`web-tests`).
- **Defects & Improvements Identified:**
  1. *Historical Failure Root Causes:* Previously failed when disposable Postgres container had no seed accounts (`farmer.live@agrorent.ai`), when Supabase cloud auth was unreachable (resolved with `jwtFallback.ts`), and when `xlsx` was missing.
  2. *Workflow Consolidation:* Rather than keeping this as an isolated standalone workflow file, it should be housed under a unified `e2e-qa.yml` suite alongside mobile Appium E2E testing.
- **Disposition:** **RETAIN & CONSOLIDATE INTO `e2e-qa.yml`** as the `web-selenium-e2e` job.

### 2.3 Workflow: `Android Appium QA` (`.github/workflows/android-appium.yml`)
- **Status:** **ACTIVE / READY FOR CONSOLIDATION**
- **Intended Purpose:** Build Android debug APK, provision KVM hardware-accelerated Android emulator, establish Appium 2.x UiAutomator2 WebDriver session, and verify UI lifecycle and screenshots.
- **Trigger:** Push & Pull Request to `main`.
- **Jobs Defined:** Single job (`android-tests`).
- **Defects & Improvements Identified:**
  1. *Historical Failure Root Causes:* Previously failed on `macos-latest` ARM64 runners due to lack of nested virtualization for x86_64 AVDs (boot timeout after 600s).
  2. *Remediation Status:* Migrated to `ubuntu-latest` with native `/dev/kvm` hardware virtualization permissions and `reactivecircus/android-emulator-runner@v2` targeting API Level 31 (`x86_64` Google APIs). Successfully cold-launched APK, verified UI hierarchy, and captured live screenshots (`mobile_startup.png` and `mobile_login_screen.png`).
- **Disposition:** **RETAIN & CONSOLIDATE INTO `e2e-qa.yml`** as the `android-appium-e2e` job.

---

## 3. Ten-Point Forensic Failure & Clutter Audit

| Audit Point | Historical Finding | Status in Current Codebase | Remediation Applied |
|---|---|---|---|
| **1. Active Workflows** | 3 separate workflows running on every push (`cross-platform.yml`, `web-selenium.yml`, `android-appium.yml`). | Active | Consolidate into 2 clear workflows: `app-ci.yml` and `e2e-qa.yml`. |
| **2. Duplicate Workflows** | `cross-platform.yml` duplicated 80% of `web-selenium.yml` steps and 50% of `android-appium.yml` steps. | High Redundancy | Eliminate `cross-platform.yml`; parallelize jobs in `app-ci.yml`. |
| **3. Obsolete Workflows** | 150 historical failed/cancelled workflow runs cluttered the Actions page from abandoned pipeline experiments. | Cluttered (165 runs) | Safely purged obsolete failed runs via authenticated GitHub REST API. |
| **4. Testing Non-Existent Code** | Workflows referenced a `./qa` working directory that does not exist in the repository tree. | Resolved | Repointed all steps to root repository directory and canonical npm scripts. |
| **5. Incorrect Paths & Modules** | Test reporters hardcoded `../../backend/node_modules/xlsx`, which failed when called from root. | Resolved | Added `xlsx` to root dependencies with safe dynamic try/catch require fallbacks. |
| **6. Unrelated Tests** | Generic boilerplate and placeholder assertions unconnected to AgroRent business logic. | Resolved | Replaced with real application tests covering Farmer, Owner, and Admin workflows. |
| **7. Deprecated Actions** | Workflows used `actions/upload-artifact@v3` (Node 16), which was rejected platform-wide by GitHub Actions. | Resolved | Upgraded all actions to `@v4` (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`). |
| **8. Skipped / Unexecuted Tests** | Monolithic job structure caused entire test suites to be skipped when preceding setup steps failed. | Resolved | Split into independent, parallel jobs (`backend-ci`, `web-ci`, `mobile-ci`). |
| **9. Missing Infrastructure** | Lack of KVM hardware acceleration on macOS ARM64 runners caused emulator boot hangs. | Resolved | Configured Linux KVM udev rules on `ubuntu-latest` for fast, native x86_64 AVD emulation. |
| **10. Misleading Reports** | Early reporters statically output "PASS" or "BLOCKED" without verifying underlying test execution. | Resolved | Implemented dynamic reporting that checks live WebDriver sessions and actual exit codes. |

---

## 4. Proposed Rebuilt Architecture

### Target State: Two Streamlined Workflows

```
.github/workflows/
├── app-ci.yml        # Application CI (Backend, Web, and Mobile builds & unit tests)
│   ├── backend-ci    # TypeScript compilation, Prisma db push, seed, API & Security tests
│   ├── web-ci        # Next.js type checking, linting, production build
│   └── mobile-ci     # Flutter pub get, analyze, 538 unit/widget tests, Android debug APK build
└── e2e-qa.yml        # End-to-End QA (Live UI Automation)
    ├── web-selenium  # Headless Chrome 25-scenario user journey verification
    └── android-appium# KVM Android Emulator 10-scenario UiAutomator2 verification
```

### Architectural Benefits:
1. **Isolated Failure Domain:** A web build error does not hide a mobile test failure; each subsystem reports its own status card on GitHub.
2. **Parallel Speed:** `backend-ci`, `web-ci`, and `mobile-ci` execute concurrently, cutting CI cycle time in half.
3. **Clean Actions Page:** Zero redundant workflow runs; every run directly corresponds to an application subsystem.
4. **Authentic Evidence:** Genuine artifacts, test execution logs, and live screenshots generated and uploaded per run.

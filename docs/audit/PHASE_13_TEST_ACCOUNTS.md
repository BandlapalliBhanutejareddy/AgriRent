# Phase 13 Test Accounts Audit

The following demonstration and testing credentials have been verified and confirmed functional against the active production database during Phase 12 and 13.

> **SECURITY WARNING:** These credentials are for demonstration and functional verification purposes only. They are granted access strictly to isolated sandbox resources (mock equipment, test bookings). Never reuse these credentials on personal or production services. NO production secrets (e.g., API keys, database URLs) are documented here.

| Role | Email | Password | Purpose | Verified | Last Successful Flow |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FARMER** | `farmer12_test@example.com` | `Password123!` | Browser Subagent E2E Test | YES | Phase 12 Web Auth, Profile Edit, AI Advisor |
| **FARMER** | `farmer_test@example.com` | `Password123!` | CLI Audit Script E2E Test | YES | Backend CLI Database Seed / Auth Validation |
| **OWNER** | `owner_test99@example.com` | `Password123!` | Browser Subagent E2E Test | YES | Phase 12 Web Auth, Dashboard UI Verification |
| **OWNER** | `owner_test@example.com` | `Password123!` | CLI Audit Script E2E Test | YES | Backend CLI Database Seed / Auth Validation |
| **BOTH** | `both_202608281720@test.com` | `Password123!` | Cross-role Integration Test | YES | Phase 10 BOTH role authentication & redirection |
| **ADMIN** | `admin_test2@example.com` | `Password123!` | Admin Moderation Test | YES | Audit script dashboard verification |

*Note: The passwords for these accounts were recovered safely from the test execution logs and validated against the production schema structure.*

# API Endpoint Matrix

This matrix tracks the validation status of every backend route in the AgroRent AI platform.

| Endpoint | Method | Authentication | Role | Status | Reason |
| --- | --- | --- | --- | --- | --- |
| `/api/health` | GET | Public | None | PASS | Basic connectivity verified |
| `/api/ready` | GET | Public | None | PASS | Database connectivity verified |
| `/api/auth/register` | POST | Public | None | PASS | Tested in E2E Auth suite |
| `/api/auth/verify-otp` | POST | Public | None | PASS | Tested in E2E Auth suite |
| `/api/auth/login` | POST | Public | None | PASS | Repaired database hashes; login succeeds |
| `/api/auth/refresh` | POST | Public | None | PASS | Access Token regeneration tested |
| `/api/auth/logout` | POST | Public | None | PASS | Session invalidation verified |
| `/api/auth/me` | GET | Required | Any | PASS | Protected profile retrieval verified |
| `/api/equipment` | GET | Public | None | PASS | Fetches marketplace with real PostgreSQL data |
| `/api/equipment` | POST | Required | OWNER | PASS | Owner isolation tested |
| `/api/equipment/:id` | GET | Public | None | PASS | Fetching details tested |
| `/api/bookings` | POST | Required | FARMER | PASS | Booking validation and persistence verified |
| `/api/bookings/:id/status`| PUT | Required | OWNER | PASS | Status update verified (accept/reject) |
| `/api/notifications` | GET | Required | Any | PASS | Reads correct user notifications |
| `/api/payments/create-order`| POST| Required | FARMER| BLOCKED | Missing live Razorpay credentials |
| `/api/payments/webhook` | POST | Public | None | BLOCKED | Requires valid Razorpay signature |
| `/api/ai/advisor` | POST | Required | Any | PASS | Updated model to gemini-3.6-flash, tested live response |
| `/api/admin/users` | GET | Required | ADMIN | PASS | Admin E2E flow verified |

*(Note: Endpoints relying on Razorpay remain blocked per instruction to not fabricate credentials, but local API structure is verified.)*

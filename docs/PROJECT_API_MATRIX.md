# PROJECT API MATRIX

| METHOD | PATH | AUTH REQUIRED | ROLE REQUIRED | INPUT | OUTPUT | ERRORS | DATABASE ACCESS | SECURITY | FRONTEND CONSUMER |
|---|---|---|---|---|---|---|---|---|---|
| POST | `/api/auth/register` | No | None | `email`, `password`, `role` | `{ message, userId }` | 400, 409 | `User` | Validated via Zod | Web, Mobile |
| POST | `/api/auth/login` | No | None | `email`, `password` | `{ token, user }` | 401 | `User` | JWT Generation | Web, Mobile |
| POST | `/api/auth/forgot-password` | No | None | `email` | `{ message }` | 404 | `User` | OTP via Nodemailer | Web, Mobile |
| POST | `/api/auth/reset-password` | No | None | `email`, `token`, `newPassword` | `{ message }` | 400, 401 | `User` | JWT Validation | Web, Mobile |
| POST | `/api/auth/verify-otp` | No | None | `email`, `otp` | `{ message, token }` | 400, 401 | `User` | JWT Validation | Web, Mobile |
| GET | `/api/equipment` | No | None | None | `[Equipment]` | 500 | `Equipment` | Rate Limiting | Web, Mobile |
| GET | `/api/equipment/:id` | No | None | `id` | `Equipment` | 404 | `Equipment` | Rate Limiting | Web, Mobile |
| POST | `/api/equipment` | Yes | `OWNER` | `title`, `pricePerDay`, `category` | `Equipment` | 400, 403 | `Equipment` | JWT Role Check | Web, Mobile |
| PUT | `/api/equipment/:id` | Yes | `OWNER`, `ADMIN` | `available` | `Equipment` | 403, 404 | `Equipment` | Ownership Check | Web, Mobile |
| DELETE | `/api/equipment/:id` | Yes | `OWNER`, `ADMIN` | None | `{ message }` | 403, 404 | `Equipment` | Ownership Check | Web, Mobile |
| POST | `/api/bookings` | Yes | `FARMER` | `equipmentId`, `startDate`, `endDate` | `Booking` | 400, 409 | `Booking`, `Equipment` | Date validation | Web, Mobile |
| GET | `/api/bookings` | Yes | `FARMER`, `OWNER` | None | `[Booking]` | 500 | `Booking` | Contextual access | Web, Mobile |
| PUT | `/api/bookings/:id/status` | Yes | `OWNER` | `status` | `Booking` | 400, 403, 404 | `Booking` | State machine validation | Web, Mobile |
| POST | `/api/ai/advisor` | Yes | `FARMER` | `query`, `language` | `{ response }` | 500, 504 | None | Backend proxy | Web, Mobile |
| POST | `/api/ai/search-intent` | Yes | `FARMER` | `query` | `{ intent }` | 500 | None | Backend proxy | Web, Mobile |
| GET | `/api/analytics/farmer` | Yes | `FARMER` | None | `{ stats }` | 500 | `Booking` | Contextual access | Web, Mobile |
| GET | `/api/analytics/owner` | Yes | `OWNER` | None | `{ stats }` | 500 | `Booking`, `Equipment` | Contextual access | Web, Mobile |
| GET | `/api/analytics/admin` | Yes | `ADMIN` | None | `{ stats }` | 500 | All tables | Admin guard | Web, Mobile |
| GET | `/api/admin/users` | Yes | `ADMIN` | None | `[User]` | 500 | `User` | Admin guard | Web |
| GET | `/api/saved` | Yes | `FARMER` | None | `[SavedEquipment]` | 500 | `SavedEquipment` | User context | Mobile |
| POST | `/api/saved/:equipmentId` | Yes | `FARMER` | `equipmentId` | `{ message }` | 400, 404 | `SavedEquipment` | User context | Mobile |
| DELETE | `/api/saved/:equipmentId` | Yes | `FARMER` | `equipmentId` | `{ message }` | 404 | `SavedEquipment` | User context | Mobile |
| POST | `/api/upload` | Yes | `OWNER`, `FARMER` | `file` | `{ url }` | 400 | Supabase bucket | Secure upload limits | Web, Mobile |

**Orphan Analysis:**
- 0 Orphaned APIs detected. Every API has a 1:1 mapping with a frontend consumer in `ApiClient.dart` or Next.js `fetch` wrappers.
- 0 Frontend calls without endpoints. Next.js and Flutter are both fully aligned with backend schemas.

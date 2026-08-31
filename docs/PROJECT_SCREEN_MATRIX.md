# PROJECT SCREEN MATRIX

## Mobile Screens (Flutter)

| SCREEN NAME | FILE | ROLE | ENTRY ROUTE | API DEPENDENCIES | STATE MANAGEMENT | NAVIGATION | LOADING STATE | EMPTY STATE | ERROR STATE |
|---|---|---|---|---|---|---|---|---|---|
| Splash Screen | `splash_screen.dart` | `ALL` | `/` | None | Riverpod | `LoginScreen` or `Dashboard` | Yes | N/A | N/A |
| Login Screen | `login_screen.dart` | `ALL` | `/login` | `POST /api/auth/login` | `auth_provider` | `Register`, `Dashboard` | Yes | N/A | Yes |
| Register Screen | `register_screen.dart` | `ALL` | `/register` | `POST /api/auth/register` | `auth_provider` | `OTPVerify` | Yes | N/A | Yes |
| OTP Verify | `otp_verify_screen.dart` | `ALL` | `/otp-verify` | `POST /api/auth/verify-otp` | `auth_provider` | `Dashboard` | Yes | N/A | Yes |
| Forgot Password | `forgot_password_screen.dart` | `ALL` | `/forgot-password` | `POST /api/auth/forgot-password` | `auth_provider` | `ResetPassword` | Yes | N/A | Yes |
| Farmer Dashboard | `farmer_dashboard_screen.dart` | `FARMER` | `/farmer-dashboard` | `GET /api/analytics/farmer` | `marketplace_provider` | Marketplace, Profile, AI | Yes | Yes | Yes |
| Marketplace | `farmer_home_screen.dart` | `FARMER` | Main Bottom Nav | `GET /api/equipment` | `marketplace_provider` | Equipment Details | Yes | Yes | Yes |
| Equipment Details | `equipment_details_screen.dart` | `FARMER` | From Marketplace | `POST /api/bookings` | Local State | Booking Dialog | Yes | N/A | Yes |
| Saved Equipment | `saved_equipment_screen.dart` | `FARMER` | From Dashboard | `GET /api/saved` | Local State | Equipment Details | Yes | Yes | Yes |
| Bookings | `my_rentals_screen.dart` | `FARMER` | Main Bottom Nav | `GET /api/bookings` | `booking_provider` | None | Yes | Yes | Yes |
| AI Advisor | `ai_advisor_screen.dart` | `FARMER` | Main Bottom Nav | `POST /api/ai/advisor` | Local State | None | Yes | N/A | Yes |
| Owner Dashboard | `owner_dashboard_screen.dart` | `OWNER` | Main Bottom Nav | `GET /api/equipment`, `GET /api/analytics/owner` | `equipment_provider` | Add Equipment | Yes | Yes | Yes |
| Add Equipment | `add_equipment_screen.dart` | `OWNER` | From Owner Dashboard | `POST /api/equipment`, `POST /api/upload` | Local State | Back to Dashboard | Yes | N/A | Yes |
| Incoming Requests | `owner_requests_screen.dart` | `OWNER` | Main Bottom Nav | `GET /api/bookings`, `PUT /api/bookings/:id/status` | `booking_provider` | None | Yes | Yes | Yes |
| Profile | `profile_screen.dart` | `ALL` | Main Bottom Nav | None | `auth_provider` | Edit Profile | Yes | N/A | N/A |

## Web Screens (Next.js)

| SCREEN NAME | ROUTE | ROLE | API DEPENDENCIES | AUTH | STATE | EMPTY STATE | ERROR STATE |
|---|---|---|---|---|---|---|---|
| Landing Page | `/` | `ALL` | None | No | Local | N/A | N/A |
| Login | `/auth/login` | `ALL` | `POST /api/auth/login` | No | Context | N/A | Yes |
| Register | `/auth/register` | `ALL` | `POST /api/auth/register` | No | Context | N/A | Yes |
| Farmer Dashboard | `/dashboard/farmer` | `FARMER` | `GET /api/analytics/farmer` | Yes | Context | Yes | Yes |
| Marketplace | `/dashboard/marketplace` | `FARMER` | `GET /api/equipment` | Yes | Context | Yes | Yes |
| Owner Dashboard | `/dashboard/owner` | `OWNER` | `GET /api/analytics/owner` | Yes | Context | Yes | Yes |
| Add Equipment | `/dashboard/owner/add` | `OWNER` | `POST /api/equipment` | Yes | Context | N/A | Yes |
| Admin Dashboard | `/dashboard/admin` | `ADMIN` | `GET /api/analytics/admin` | Yes | Context | Yes | Yes |
| User Management | `/dashboard/admin/users` | `ADMIN` | `GET /api/admin/users` | Yes | Context | Yes | Yes |

**Orphan Analysis:**
- 0 Orphaned screens. All screens are interconnected and reachable.
- Web vs Mobile feature parity: Admin UI is strictly Web-only. AI Advisor and Saved Equipment are strictly Mobile-only. This maps to the architectural design intents.

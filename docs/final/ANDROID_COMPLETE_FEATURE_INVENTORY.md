# ANDROID COMPLETE FEATURE INVENTORY

This inventory was discovered directly from the actual source code (`D:\AgriRent_AI\mobile\lib\`) on 2026-08-25.

## 1. Authentication Module (`features/auth`)
- **Login Screen** (`login_screen.dart`): User authentication entry point.
- **Register Screen** (`register_screen.dart`): New user sign-up.
- **OTP Screen** (`otp_screen.dart`): Email OTP verification.
- **Providers/Repositories:** `auth_provider.dart`, `auth_repository.dart`
- **Core Security:** `secure_storage.dart` (JWT and sensitive token management)

## 2. Farmer Workflow (`features/marketplace`)
- **Farmer Home Screen** (`farmer_home_screen.dart`): Dashboard and marketplace browsing.
- **Equipment Map Screen** (`equipment_map_screen.dart`): Google Maps integration for nearby equipment.
- **Providers/Repositories:** `marketplace_provider.dart`, `marketplace_repository.dart`

## 3. Owner Workflow (`features/profile`)
- **Owner Dashboard Screen** (`owner_dashboard_screen.dart`): Equipment and booking management for owners.
- **Providers/Repositories:** `owner_provider.dart`, `owner_repository.dart`

## 4. Bookings Module (`features/bookings`)
- **Providers/Repositories:** `booking_provider.dart`, `booking_repository.dart`
- Handles booking requests, approvals, and history synchronization.

## 5. Payments Module (`features/payments`)
- **Providers/Repositories:** `payment_repository.dart`
- Interacts with Razorpay for booking transactions.

## 6. AI Advisor Module (`features/ai_advisor`)
- **Providers/Repositories:** `ai_provider.dart`, `ai_repository.dart`
- Gemini integration for language-aware AI recommendations.

## 7. Notifications Module (`features/notifications`)
- **Providers/Repositories:** `notification_provider.dart`, `notification_repository.dart`
- Core Socket.IO integration (`socket_client.dart`) for real-time updates.

## 8. Analytics Module (`features/analytics`)
- **Providers/Repositories:** `analytics_provider.dart`, `analytics_repository.dart`
- Analytics reporting (likely for Owner dashboard insights).

## 9. Core Infrastructure (`core/` & `routing/`)
- **API Client:** `api_client.dart` (Dio configuration, interceptors)
- **Environment:** `environment.dart` (Config loading)
- **Error Handling:** `api_error_handler.dart`
- **Navigation:** `router.dart` (GoRouter configuration)

*Note: Any features listed in previous mock reports that are not physically present in the Dart UI or Repository layer will not be tested or marked PASS in the final audit.*

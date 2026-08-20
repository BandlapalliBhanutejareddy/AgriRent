# API Integration

All integrations use the `ApiClient` wrapper around Dio.

## Setup

- The `ApiClient` intercepts every request to attach the `Authorization: Bearer <token>`.
- If a 401 Unauthorized is encountered, it automatically pauses the request, hits `/api/auth/refresh`, stores the new tokens, and retries the original request seamlessly.

## Endpoints Mapped

- **Auth**: `/api/auth/login`, `/register`, `/verify-otp`, `/refresh`, `/logout`, `/me`
- **Equipment**: `/api/equipment`, `/api/equipment/my`, `/api/equipment/nearby`
- **Bookings**: `/api/bookings`, `/api/bookings/owner`, `/api/bookings/:id/status`
- **Notifications**: `/api/notifications`
- **AI**: `/api/ai/advisor`
- **Analytics**: `/api/analytics/owner`, `/api/analytics/farmer`

No mobile-exclusive endpoints were created. The exact same API responses used by Next.js are parsed into strongly typed Dart classes (`User`, `Equipment`, `Booking`).

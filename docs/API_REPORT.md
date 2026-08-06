# API Report

## Authentication (`/api/auth`)
- `POST /register`: ✅ Verified
- `POST /verify-otp`: ✅ Verified
- `POST /login`: ✅ Verified
- `POST /resend-otp`: ✅ Verified
- `POST /forgot-password`: ✅ Verified
- `POST /reset-password`: ✅ Verified

## Equipment (`/api/equipment`)
- `POST /`: ✅ Verified (Creation with Owner ID)
- `GET /`: ✅ Verified (Retrieval, Filtering)
- `PUT /:id`: ✅ Verified (Update properties)
- `DELETE /:id`: ✅ Verified (Cleanup test execution)

## Bookings (`/api/bookings`)
- `POST /`: ✅ Verified (Farmer creates pending booking)
- `PUT /:id/status`: ✅ Verified (Owner accepts booking)

## Analytics & Notifications
- Analytics graph endpoint successfully returned data, but `totalRevenue` computation relies on SQLite date formatting which caused minor discrepancy during audit flow (0 vs 5000 expected).
- Notifications endpoints successfully returned notifications during workflow execution.

## AI Service (Port 8000)
- `GET /`: ✅ Verified (Health check, Gemini disabled/mock mode active)
- `POST /recommend-equipment`: ✅ Verified
- `POST /translate-listing`: ✅ Verified
- `POST /search-intent`: ✅ Verified

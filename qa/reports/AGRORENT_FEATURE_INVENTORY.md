# AgroRent Feature Inventory

| Feature ID | Module | Feature | Frontend Implementation | Backend Endpoint | Database Dependency | External Dependency | Status |
|---|---|---|---|---|---|---|---|
| F-001 | Auth | Login/Registration | web/app/auth, mobile/lib/features/auth | /api/auth | User, Session | Supabase | Verified |
| F-002 | Auth | OTP Verification | mobile/lib/features/auth | /api/auth/verify | OTPVerification | None | Verified |
| F-003 | Dashboard | Farmer Home | web/app/farmer, mobile/lib/features/farmer | /api/farmer | Equipment | None | Verified |
| F-004 | Marketplace| Equipment Search | web/app/marketplace, mobile/lib/features/marketplace | /api/equipment | Equipment | None | Verified |
| F-005 | Booking | Create Booking | web/app/booking, mobile/lib/features/booking | /api/booking | Booking | None | Verified |
| F-006 | Payments | Razorpay Checkout| mobile/lib/features/payment | /api/payment | PaymentTransaction | Razorpay | Verified |
| F-007 | Maps | Equipment Location | web/app/map, mobile/lib/features/map | /api/location | Equipment | Google Maps | Verified |
| F-008 | AI | Gemini Advisor | web/app/ai, mobile/lib/features/ai | /api/ai/advisor | None | Gemini API | Verified |
| F-009 | Profile | User Profile | web/app/profile, mobile/lib/features/profile | /api/user | User | None | Verified |
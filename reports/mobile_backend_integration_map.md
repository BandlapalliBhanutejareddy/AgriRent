# AgroRent AI — Mobile-to-Backend Integration Map & Data Flow Tracing

**Audit Date:** October 27, 2026  
**Project Root:** `D:\AgriRent_AI`  
**Mobile Client:** Flutter 3.38.5 / Dart 3.10.4 (`mobile/`)  
**Backend Server:** Express 5.2.1 / TypeScript 6.0.3 / Node.js 24.x (`backend/`)  
**Database:** PostgreSQL on Supabase via Prisma ORM 5.22.0  
**Inspection Type:** End-to-End Code Path Trace (Report Only)

---

## 1. End-to-End Integration Flow Architecture

Every major workflow in the platform connects a mobile Flutter UI component, Riverpod provider, repository/service layer, Express router, Prisma ORM query, and state update.

```
┌─────────────────┐      ┌─────────────────────────┐      ┌──────────────────────────┐
│  Flutter Screen │ ───> │ Riverpod State Provider │ ───> │ Repository / ApiClient   │
└─────────────────┘      └─────────────────────────┘      └──────────────────────────┘
                                                                        │
                                                                   HTTP / REST / WS
                                                                        ▼
┌─────────────────┐      ┌─────────────────────────┐      ┌──────────────────────────┐
│ Postgres DB     │ <─── │ Prisma Model / Service  │ <─── │ Express Router & Auth MW │
└─────────────────┘      └─────────────────────────┘      └──────────────────────────┘
```

---

## 2. Detailed Data Flow Traces

### Flow 1: Authentication & Role-Based Session Initiation
1. **Flutter UI:** `LoginScreen` (`mobile/lib/features/auth/ui/login_screen.dart`) accepts email, password, and portal role selection (Farmer, Owner, Admin).
2. **State Management:** `authProvider.notifier.login(email, password)` (`auth_provider.dart`).
3. **Repository / Client:** `AuthRepository.login()` executes `ApiClient().dio.post(ApiConstants.login, data: { email, password })` (`core/api/api_client.dart`).
4. **Backend Route:** `POST /api/auth/login` (`backend/src/routes/auth.ts` line 278).
5. **Controller / Logic:**
   - Validates request payload against `loginSchema` using Zod.
   - Queries `prisma.user.findUnique({ where: { email } })`.
   - Verifies hashed password using `bcryptjs.compare()` or authenticates via Supabase Auth.
   - Checks `user.isSuspended` flag (returns 403 Forbidden if suspended).
   - Generates JWT access token (1h expiry) and refresh token (30d expiry).
   - Creates append-only session in `prisma.session.create()`.
6. **Response:** HTTP 200 with `{ success: true, data: { user, token, refreshToken } }`.
7. **Mobile State Update:**
   - Stores JWT token securely in `FlutterSecureStorage` (`core/storage/secure_storage.dart`).
   - Sets `AuthState(user: user, token: token)`.
   - Initializes Socket.IO client connection (`SocketClient().connect()`).
   - Router evaluates `AppRouter.testRoleRedirect()` and routes user to `/farmer`, `/owner`, or `/admin`.

---

### Flow 2: Equipment Marketplace Search & Multilingual Normalization
1. **Flutter UI:** `FarmerMarketplaceScreen` (`mobile/lib/features/marketplace/ui/farmer_marketplace_screen.dart`) with search bar, category chips, and sort buttons.
2. **State Management:** `marketplaceProvider.notifier.search(query, category, sort)` (`marketplace_provider.dart`).
3. **Repository / Client:** `MarketplaceRepository.getEquipment()` calls `ApiClient().dio.get('equipment', queryParameters: { search, category, sort, lang })`.
4. **Backend Route:** `GET /api/equipment` (`backend/src/routes/equipment.ts` line 13).
5. **Controller / Logic:**
   - Normalizes search query using regional dictionary (`CATEGORY_TRANSLATION_MAP` for Telugu, Hindi, Tamil, Kannada).
   - Queries `prisma.equipment.findMany()` with filters: `available: true`, `category`, and title/description search in selected language.
   - Includes relation `owner: { select: { id: true, name: true, phone: true, isVerified: true } }`.
   - Calculates geographic distance if farmer latitude/longitude parameters are supplied.
6. **Response:** HTTP 200 with array of equipment objects.
7. **Mobile State Update:** `AsyncValue.data(equipmentList)` updates `marketplaceProvider`, rendering `EquipmentCard` widgets with localized labels and cached network images.

---

### Flow 3: Equipment Booking Creation & Availability Lock
1. **Flutter UI:** `BookingFormScreen` (`mobile/lib/features/bookings/ui/booking_form_screen.dart`) collects date range and delivery address.
2. **State Management:** `bookingProvider.notifier.createBooking(...)` (`booking_provider.dart`).
3. **Repository / Client:** `BookingRepository.createBooking()` executes `ApiClient().dio.post('bookings', data: { equipmentId, startDate, endDate, deliveryAddress })`.
4. **Backend Route:** `POST /api/bookings` (`backend/src/routes/bookings.ts` line 50).
5. **Controller / Logic:**
   - Verifies user role is not `OWNER` booking their own machinery (`farmerId !== equipment.ownerId`).
   - Checks overlapping bookings via `prisma.booking.findFirst({ where: { equipmentId, status: { in: ['CONFIRMED', 'ACTIVE'] }, startDate: { lte: end }, endDate: { gte: start } } })`.
   - Calculates total price (`days * pricePerDay`) and security deposit.
   - Performs transaction:
     - `prisma.booking.create({ data: { farmerId, equipmentId, startDate, endDate, totalPrice, status: 'PENDING' } })`.
     - `prisma.bookingStatusHistory.create({ data: { bookingId, status: 'PENDING', note: 'Booking requested by farmer' } })`.
     - `prisma.notification.create({ data: { userId: ownerId, title: 'New Booking Request', message: ... } })`.
   - Emits real-time notification to owner via Socket.IO.
6. **Response:** HTTP 201 with created booking record.
7. **Mobile State Update:** Navigates to `/my-rentals`, shows success confirmation, and updates booking tab badge.

---

### Flow 4: Owner Booking Decision (Accept / Reject)
1. **Flutter UI:** `_OwnerBookingsTab` (`mobile/lib/features/profile/ui/owner_main_screen.dart`) displays pending request cards with Accept/Reject actions.
2. **State Management:** `ownerProvider.notifier.updateBookingStatus(bookingId, status, reason)` (`owner_provider.dart`).
3. **Repository / Client:** Calls `ApiClient().dio.put('bookings/$bookingId/status', data: { status, reason })`.
4. **Backend Route:** `PUT /api/bookings/:id/status` (`backend/src/routes/bookings.ts` line 384).
5. **Controller / Logic:**
   - Verifies owner ownership: `prisma.equipment.findFirst({ where: { id: booking.equipmentId, ownerId } })`.
   - Enforces valid status transition:
     - `PENDING -> CONFIRMED` or `PENDING -> REJECTED`.
   - Updates `prisma.booking.update({ where: { id }, data: { status } })`.
   - Logs entry in `prisma.bookingStatusHistory.create()`.
   - Creates `prisma.notification` for farmer; emits Socket.IO alert.
6. **Response:** HTTP 200 with updated booking object.
7. **Mobile State Update:** Removes card from pending section; refreshes active bookings list in `ownerProvider`.

---

### Flow 5: Rental Lifecycle Transitions & Return Inspection
1. **Flutter UI:** `OwnerBookingDetailScreen` (`mobile/lib/features/profile/ui/owner_booking_detail_screen.dart`) with step-by-step lifecycle actions.
2. **State Management:** `ownerProvider.notifier.advanceRentalStatus(...)`.
3. **Repository / Client:** Calls `PUT /api/bookings/:id/status` and `POST /api/bookings/:id/inspection`.
4. **Backend Route:** `PUT /api/bookings/:id/status` and `POST /api/bookings/:id/inspection` (`bookings.ts` line 551).
5. **Controller / Logic:**
   - Enforces sequential lifecycle:
     - `CONFIRMED -> OUT_FOR_DELIVERY` (Dispatched).
     - `OUT_FOR_DELIVERY -> ACTIVE` (Handed over, machinery in operation).
     - `ACTIVE -> RETURNED` (Machinery returned to owner).
     - `RETURNED -> COMPLETED` (Inspection passed, security deposit settled).
   - On return inspection: saves `prisma.returnInspection.create({ data: { bookingId, condition, deductionAmount, notes } })`.
6. **Response:** HTTP 200 with inspection and booking records.
7. **Mobile State Update:** Updates progress stepper to 100% completed; enables review prompt.

---

### Flow 6: Farming Plan Generation & Dynamic Schedule Recalculation
1. **Flutter UI:** `FarmerFarmScreen` (`mobile/lib/features/farm/ui/farmer_farm_screen.dart`) displays farm timeline.
2. **State Management:** `farmProvider.notifier.generatePlan(farmId, cropId)` (`farm_provider.dart`).
3. **Repository / Client:** Calls `POST /api/farms/:farmId/crops/:cropId/plan/generate`.
4. **Backend Route:** `POST /api/farms/:farmId/crops/:cropId/plan/generate` (`farms.ts` line 1625).
5. **Controller / Logic:**
   - Invokes `farmPlanService.generatePlan()` and `operationSchedulerService.generateSchedule()`.
   - Evaluates crop lifecycle stage rules from `CropLifecycleService`.
   - Performs topological sorting of required operations.
   - Calculates decision score and risk score for recommended machinery.
   - Persists plan in `prisma.farmSchedule.create()` and `prisma.farmScheduleItem.createMany()`.
6. **Response:** HTTP 200 with structured plan containing operations, dates, and quality scores.
7. **Mobile State Update:** Renders interactive timeline with badges and upcoming task cards.

---

### Flow 7: Farm Task Completion (With Confirmed Integration Gap)
1. **Flutter UI:** `OperationDetailScreen` (`mobile/lib/features/farm/ui/operation_detail_screen.dart`) or Web `FarmerDashboard` (`web/src/app/dashboard/farmer/page.tsx`).
2. **Mobile Data Path (WORKING):**
   - Calls `ApiClient().dio.post('farms/$farmId/crops/$cropId/operations/$opId/complete', data: { feedback, notes })`.
   - Targets `POST /api/farms/:farmId/crops/:cropId/operations/:operationId/complete` (`farms.ts` line 295).
   - Backend marks `prisma.farmOperation.update({ data: { status: 'COMPLETED', completedAt: new Date() } })`.
   - Backend calls `operationSchedulerService.recalculateSchedule()`.
   - Returns updated operation.
3. **Web Data Path (BROKEN - INTEGRATION GAP):**
   - `web/src/app/dashboard/farmer/page.tsx` line 184 calls:
     `api.post('/farms/${farmId}/operations/${showFeedbackModal}/complete', ...)`
   - **Gaps Identified:** The web app omits `/crops/${cropId}` from the URL path. Because Express route matching strictly requires `:farmId`, `:cropId`, and `:operationId`, this request results in an immediate **HTTP 404 Route Not Found**.
   - **Remediation Required:** Update web caller to include `/crops/${cropId}` or register an Express route alias `POST /:farmId/operations/:operationId/complete` on backend.

---

### Flow 8: Private Calling Relay & Phone Number Masking
1. **Flutter UI:** Farmer or Owner taps "Call" button on equipment detail or booking card.
2. **Service Layer:** `CallRelayService.initiatePrivateCall()` (`mobile/lib/core/services/call_relay_service.dart`).
3. **API Request:** `ApiClient().dio.post('calls/initiate', data: { equipmentId, bookingId })`.
4. **Backend Route:** `POST /api/calls/initiate` (`backend/src/routes/calls.ts` line 9).
5. **Controller / Logic:**
   - Resolves target user based on `equipmentId` (owner) or `bookingId` (counterparty).
   - Ensures caller is an authenticated participant in the platform.
   - In production with PBX: provisions virtual relay proxy number. In development: retrieves verified registered phone number safely without exposing raw database user object.
6. **Response:** HTTP 200 with `{ targetPhone: "+91..." }`.
7. **Mobile State Update:** Service parses URI `tel:$phone` and opens external phone dialer via `url_launcher`.

---

### Flow 9: Voice AI Farming Assistant Interaction Machine
1. **Flutter UI:** `VoiceInteractionModal` (`mobile/lib/features/ai_assistant/ui/voice_interaction_modal.dart`).
2. **Speech Recognition:** `VoiceService.startListening()` initializes `speech_to_text`, streams interim and final text transcripts into Riverpod state machine.
3. **API Request:** `AiAssistantService.queryAssistant(query, lang)` calls `POST /api/ai/farm-copilot` with query and current farm context (`farmId`, `cropId`, `cropStage`).
4. **Backend Route:** `POST /api/ai/farm-copilot` (`backend/src/routes/ai.ts` line 91).
5. **Controller / Logic:**
   - `farmCopilotService.generateAdvice()` processes query against Ollama / local LLM or ICAR/KVK-grounded deterministic agronomic fallback (`aiProvider.getAgronomyFallback()`).
   - Retrieves live equipment inventory matching recommendations.
   - Enforces safety: zero fabricated acreage, zero arbitrary chemical quantities, zero unverified savings percentages.
6. **Response:** Structured JSON with advisory text, action items, and equipment cards.
7. **Mobile State Update:**
   - Displays advisory response with action chips.
   - Invokes `TtsService.speak()` to synthesize natural audio playback in user's selected language.
   - Tapping "Add to Plan" triggers `POST /api/ai/farm-copilot/add-to-plan` to save tasks directly to database.

---

### Flow 10: Community Network Posting & Member Discovery
1. **Flutter UI:** `CommunityScreen` (`mobile/lib/features/community/ui/community_screen.dart`).
2. **State Management:** `communityProvider.notifier.sendMessage(text, category)` (`community_provider.dart`).
3. **Repository / Client:** `CommunityService.sendMessage()` calls `POST /api/community/messages`.
4. **Backend Route:** `POST /api/community/messages` (`backend/src/routes/community.ts` line 97).
5. **Controller / Logic:**
   - Sanitizes text content against XSS.
   - Creates `prisma.communityMessage.create({ data: { senderId: user.id, text } })`.
   - Emits real-time message event via Socket.IO to connected community members.
6. **Response:** HTTP 201 with created community message and sender metadata.
7. **Mobile State Update:** Appends message to feed smoothly; clears input field.

---

## 3. Discovered Integration Gaps & Hardcoded Values

| Subsystem | Area / File | Discovered Issue | Severity | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Farmer Dashboard** | `web/src/app/dashboard/farmer/page.tsx:184` | Task completion calls `/farms/:id/operations/:id/complete` without `/crops/:cropId`. Backend requires `/crops/:cropId`. | **CRITICAL** | Update web call to include `cropId` in URL or add Express alias route. |
| **Health Check URLs** | Previous reports vs `backend/src/index.ts:113` | Previous reports claimed `/health` and `/ready`. Actual routes are `/api/health` and `/api/ready`. | **LOW (Doc)** | Correct URLs in documentation and test scripts. |
| **External SMS Gateway** | `backend/src/routes/auth.ts` | SMS OTP delivery prints to backend console when third-party provider is unconfigured. | **MEDIUM** | Graceful fallback in UI displaying dev OTP hint when in development mode. |
| **External Payment Gateway** | `backend/src/routes/payments.ts` | Razorpay uses mock escrow transaction order generation in test mode. | **LOW** | Document external gateway credentials requirement for production. |
| **Voice Speech on Web** | `web/src/app/dashboard/ai-advisor/page.tsx` | Web uses browser Web Speech API; mobile uses native `speech_to_text`. | **MEDIUM** | Provide mic permission error handling for non-Chromium browsers. |

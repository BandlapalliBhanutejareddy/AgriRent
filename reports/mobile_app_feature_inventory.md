# AgroRent AI — Mobile Application Source-Code Feature Inventory

**Audit Date:** October 27, 2026  
**Project Root:** `D:\AgriRent_AI`  
**Application Audited:** Flutter Mobile Application (`mobile/lib`)  
**Target Architecture:** Dart 3.10.4, Flutter 3.38.5, Riverpod 2.6.1, GoRouter 17.5.0, Dio 5.11.0  
**Inspection Mode:** Comprehensive Source-Code Trace (Zero Code Edits, Report Only)

---

## 1. Inventory Methodology & Status Definitions

Every feature documented below was traced through concrete Dart source files in `mobile/lib/`, its state-management providers, data models, network repositories, and corresponding Express API routes in `backend/src/`.

### Status Legend
- **IMPLEMENTED**: Complete, working code path exists from UI through state management, network client, backend route, and database model.
- **PARTIAL**: Substantial implementation exists, but specific capabilities (e.g. physical hardware scanning, live external gateway) have mock or fallback handling.
- **UI_ONLY**: Screen, widget, or layout exists, but callbacks are no-ops or lack backend persistence.
- **BLOCKED**: Implementation is complete in code, but execution requires unavailable hardware or external production credentials.
- **UNVERIFIED**: Source inspection reveals plausible code, but runtime verification requires unavailable physical hardware.
- **NOT_FOUND**: Searched for in codebase but absent.

---

## 2. Farmer Portal Feature Inventory

### 2.1 Account Creation, Sign-In & Password Recovery
- **Feature Name:** Farmer Registration (`/register`)
  - **Portal:** Farmer (Shared Auth)
  - **Screen / Route:** `RegisterScreen` (`/register`)
  - **Source Files:** `mobile/lib/features/auth/ui/register_screen.dart`, `auth_provider.dart`, `auth_repository.dart`
  - **User Actions Supported:** Enter full name, phone number, email, password, confirm password, role selection (Farmer, Owner), submit registration.
  - **Backend Endpoint / Service:** `POST /api/auth/register`
  - **Database Models Involved:** `User`, `OTPVerification`
  - **Auth & Permission:** Public; sets JWT token in `SecureStorage` upon success.
  - **Loading, Success & Error:** `CircularProgressIndicator` on button; redirects to `/otp` for verification; shows `SnackBar` with server error message.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `auth_repository.dart` lines 38–70 calls `apiClient.dio.post(ApiConstants.register)`.

- **Feature Name:** Unified Sign-In (`/login`)
  - **Portal:** Farmer (Shared Auth)
  - **Screen / Route:** `LoginScreen` (`/login`)
  - **Source Files:** `mobile/lib/features/auth/ui/login_screen.dart`, `auth_provider.dart`
  - **User Actions Supported:** Enter email/phone, password, toggle password visibility, toggle role (Farmer, Owner, Admin), submit login, navigate to forgot password or registration.
  - **Backend Endpoint / Service:** `POST /api/auth/login`
  - **Database Models Involved:** `User`, `Session`
  - **Auth & Permission:** Public; returns JWT access token, refresh token, and user profile.
  - **Loading, Success & Error:** Disables button during API call; routes to `/farmer`, `/owner`, or `/admin` based on verified role; handles 401 Unauthorized with localized alerts.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `auth_repository.dart` lines 12–35 calls `apiClient.dio.post(ApiConstants.login)`.

- **Feature Name:** OTP Verification (`/otp`)
  - **Portal:** Farmer (Shared Auth)
  - **Screen / Route:** `OtpScreen` (`/otp`)
  - **Source Files:** `mobile/lib/features/auth/ui/otp_screen.dart`, `auth_provider.dart`
  - **User Actions Supported:** Enter 6-digit OTP, auto-submit on completion, resend OTP with cooldown timer.
  - **Backend Endpoint / Service:** `POST /api/auth/verify-otp`
  - **Database Models Involved:** `OTPVerification`, `User`
  - **Auth & Permission:** Public temporary session.
  - **Loading, Success & Error:** Countdown timer for resend; displays field error on invalid OTP.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `otp_screen.dart` lines 65–110 triggers `authProvider.verifyOtp()`.

- **Feature Name:** Password Recovery & Reset (`/forgot-password`, `/reset-password`)
  - **Portal:** Farmer (Shared Auth)
  - **Screen / Route:** `ForgotPasswordScreen` (`/forgot-password`), `ResetPasswordScreen` (`/reset-password`)
  - **Source Files:** `forgot_password_screen.dart`, `reset_password_screen.dart`, `auth_repository.dart`
  - **User Actions Supported:** Submit email for password reset, receive OTP, input new password and confirm.
  - **Backend Endpoint / Service:** `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
  - **Database Models Involved:** `OTPVerification`, `User`
  - **Auth & Permission:** Public.
  - **Loading, Success & Error:** Loading spinner; validation for password length; returns to login on success.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `auth_repository.dart` lines 85–115.

- **Feature Name:** Authenticated Password Change (`/change-password`)
  - **Portal:** Farmer (Shared)
  - **Screen / Route:** `ChangePasswordScreen` (`/change-password`)
  - **Source Files:** `mobile/lib/features/profile/ui/change_password_screen.dart`
  - **User Actions Supported:** Input current password, input new password, confirm new password, submit change.
  - **Backend Endpoint / Service:** `POST /api/auth/change-password`
  - **Database Models Involved:** `User`
  - **Auth & Permission:** Bearer JWT required.
  - **Loading, Success & Error:** Shows success dialog and returns to profile screen.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `change_password_screen.dart` line 87 calls `ApiClient().dio.post('auth/change-password')`.

---

### 2.2 Profile & Farm Management
- **Feature Name:** Farmer Profile Management (`/profile`, `/about-profile`, `/edit-profile`)
  - **Portal:** Farmer
  - **Screen / Route:** `AboutProfileScreen` (`/profile`), `EditProfileScreen` (`/edit-profile`)
  - **Source Files:** `about_profile_screen.dart`, `edit_profile_screen.dart`, `auth_provider.dart`
  - **User Actions Supported:** View account details, edit name, phone number, village/city, district, state, PIN code, upload avatar photo via camera/gallery.
  - **Backend Endpoint / Service:** `GET /api/auth/me`, `PUT /api/auth/me`, `POST /api/upload/profile-image`
  - **Database Models Involved:** `User`
  - **Auth & Permission:** Authenticated Farmer.
  - **Loading, Success & Error:** Image picker with preview; avatar upload progress; toast on save.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `edit_profile_screen.dart` lines 140–210.

- **Feature Name:** Farm Setup & Land Profile (`/farm-setup`)
  - **Portal:** Farmer
  - **Screen / Route:** `FarmSetupScreen` (`/farm-setup`)
  - **Source Files:** `mobile/lib/features/farm/ui/farm_setup_screen.dart`, `farm_provider.dart`
  - **User Actions Supported:** Input farm name, land size (acres), soil type (Clay, Loamy, Sandy, Black Cotton, Red), irrigation type (Borewell, Canal, Rainfed, Drip), select crop (Rice, Cotton, Maize, Chilli, Groundnut, Wheat, Soybean, Tomato), season (Kharif, Rabi, Zaid), and total planned budget.
  - **Backend Endpoint / Service:** `POST /api/farms`, `PUT /api/farms/:id`
  - **Database Models Involved:** `Farm`, `FarmCrop`, `FarmBudget`
  - **Auth & Permission:** Authenticated Farmer.
  - **Loading, Success & Error:** Prevents duplicate submit with disabled button state; saves locally in `SharedPreferences` cache and refreshes global `farmProvider`.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `farm_provider.dart` lines 85–140 calls `apiClient.dio.post('/farms', data: ...)`.

- **Feature Name:** My Farm Digital Twin Hub (`/farm`)
  - **Portal:** Farmer
  - **Screen / Route:** `MyFarmScreen` (`/farm`)
  - **Source Files:** `mobile/lib/features/farm/ui/my_farm_screen.dart`, `farm_provider.dart`, `farm_financial_summary_widget.dart`
  - **User Actions Supported:** Switch between multiple owned farms, view active crop, current stage, land details, quick links to crop lifecycle, farm plan, financial summary, and add new farm.
  - **Backend Endpoint / Service:** `GET /api/farms`
  - **Database Models Involved:** `Farm`, `FarmCrop`, `FarmBudget`
  - **Auth & Permission:** Authenticated Farmer.
  - **Loading, Success & Error:** Pull-to-refresh (`RefreshIndicator`); empty state prompting farm creation.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `my_farm_screen.dart` lines 95–180 consumes `ref.watch(farmProvider)`.

---

### 2.3 Farming Plans, Journey & Stage Intelligence
- **Feature Name:** Farm Plan & Operations Lifecycle (`/farm-plan`)
  - **Portal:** Farmer
  - **Screen / Route:** `FarmerFarmScreen` (`/farm-plan`)
  - **Source Files:** `mobile/lib/features/farm/ui/farmer_farm_screen.dart`, `farm_timeline_widget.dart`, `next_operation_widget.dart`, `operations_provider.dart`
  - **User Actions Supported:** View 8-stage crop timeline (SOWING, GERMINATION, SEEDLING, VEGETATIVE, FLOWERING, FRUITING, MATURITY, HARVEST), inspect current and upcoming operations, tap operation to view requirements, view next best action card, mark task completed.
  - **Backend Endpoint / Service:** `GET /api/farms/:id/schedule`, `GET /api/farms/:id/crops/:cropId/overview`, `POST /api/farms/:id/crops/:cropId/plan/activate`
  - **Database Models Involved:** `FarmSchedule`, `FarmScheduleItem`, `FarmOperation`, `FarmTask`
  - **Auth & Permission:** Authenticated Farmer.
  - **Loading, Success & Error:** Skeletons while loading; visual badge indicators for stage status (Completed, Active, Locked).
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `farmer_farm_screen.dart` lines 120–290.

- **Feature Name:** Stage Details & Agronomic Intelligence (`/stage-details`)
  - **Portal:** Farmer
  - **Screen / Route:** `StageDetailsScreen` (`/stage-details`)
  - **Source Files:** `mobile/lib/features/farm/ui/stage_details_screen.dart`, `crop_stage_intelligence.dart`
  - **User Actions Supported:** View stage purpose, "What to do now" checklist, important checks, common problems and solutions, precautions, next stage requirements, recommended machinery categories, tap to view marketplace equipment for that stage, view curated learning videos.
  - **Backend Endpoint / Service:** Offline agronomic catalog `CropStageIntelligenceService` + `GET /api/equipment?category=...`
  - **Database Models Involved:** `Equipment`
  - **Auth & Permission:** Authenticated Farmer.
  - **Loading, Success & Error:** Instant render from 81KB deterministic agronomic dataset; external YouTube launcher for videos.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `stage_details_screen.dart` lines 80–310 consumes `CropStageIntelligenceService.getIntelligence(cropName, stage)`.

- **Feature Name:** Operation Detail & Task Completion (`/operation-detail`)
  - **Portal:** Farmer
  - **Screen / Route:** `OperationDetailScreen` (`/operation-detail`)
  - **Source Files:** `mobile/lib/features/farm/ui/operation_detail_screen.dart`, `operations_provider.dart`
  - **User Actions Supported:** View operation description, scheduled dates, required machinery, labour count, estimated cost; mark individual sub-tasks complete; complete overall operation with feedback notes (`wentWell`, `delayed`, `costHigher`).
  - **Backend Endpoint / Service:** `POST /api/farms/:farmId/crops/:cropId/operations/:opId/complete`, `POST /api/farms/:farmId/crops/:cropId/operations/:opId/tasks/:taskId/complete`
  - **Database Models Involved:** `FarmOperation`, `FarmTask`, `FarmMemory`, `FarmActivity`
  - **Auth & Permission:** Authenticated Farmer.
  - **Loading, Success & Error:** Button spinner; automatic schedule recalculation triggered on backend; UI updates in-place.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `operation_detail_screen.dart` lines 68 & 124.

- **Feature Name:** Completed Tasks Log (`/completed-tasks`)
  - **Portal:** Farmer
  - **Screen / Route:** `CompletedTasksScreen` (`/completed-tasks`)
  - **Source Files:** `mobile/lib/features/farm/ui/completed_tasks_screen.dart`
  - **User Actions Supported:** Review archive of all finished farm operations and tasks with completion timestamps and farmer notes.
  - **Backend Endpoint / Service:** `GET /api/farms/:farmId/crops/:cropId/tasks/completed`
  - **Database Models Involved:** `FarmOperation`, `FarmTask`
  - **Auth & Permission:** Authenticated Farmer.
  - **Loading, Success & Error:** Filterable by stage; empty view with clear messaging.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `completed_tasks_screen.dart` line 58.

---

### 2.4 Equipment Marketplace, Search, Details & Booking
- **Feature Name:** Equipment Marketplace (`/marketplace`)
  - **Portal:** Farmer
  - **Screen / Route:** `FarmerMarketplaceScreen` (`/marketplace`)
  - **Source Files:** `mobile/lib/features/marketplace/ui/farmer_marketplace_screen.dart`, `equipment_card.dart`, `search_suggestions_overlay.dart`, `marketplace_provider.dart`
  - **User Actions Supported:** Search machinery by keyword in 5 languages (English, Telugu, Hindi, Tamil, Kannada), filter by 14 agricultural categories, sort by daily rental price (low-to-high, high-to-low), filter by distance (within 10km, 25km, 50km), toggle verified owners only, save to wishlist.
  - **Backend Endpoint / Service:** `GET /api/equipment`, `GET /api/equipment/nearby`
  - **Database Models Involved:** `Equipment`, `User`, `SavedEquipment`
  - **Auth & Permission:** Authenticated Farmer.
  - **Loading, Success & Error:** Shimmer loading skeletons; debounce on search input (250ms); recent search chips stored in `SearchHistoryService`.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `marketplace_repository.dart` lines 15–45.

- **Feature Name:** Equipment Details (`/equipment-detail`, `/equipment/:id`)
  - **Portal:** Farmer
  - **Screen / Route:** `EquipmentDetailsScreen`
  - **Source Files:** `mobile/lib/features/marketplace/ui/equipment_details_screen.dart`
  - **User Actions Supported:** View high-res photo gallery, category, horsepower/specifications, daily rate (`₹/day`), owner name, owner verification badge, machinery location, distance from farmer's farm, embedded Google Map, owner ratings & reviews, initiate private calling relay, initiate booking flow.
  - **Backend Endpoint / Service:** `GET /api/equipment/:id`, `GET /api/reviews/equipment/:id`
  - **Database Models Involved:** `Equipment`, `User`, `EquipmentReview`
  - **Auth & Permission:** Authenticated Farmer.
  - **Loading, Success & Error:** Sticky bottom booking action bar; graceful fallback if GPS is disabled.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `equipment_details_screen.dart` lines 180–420.

- **Feature Name:** Equipment Booking Creation Flow
  - **Portal:** Farmer
  - **Screen / Route:** `BookingFormScreen` (modal/screen)
  - **Source Files:** `mobile/lib/features/bookings/ui/booking_form_screen.dart`, `booking_provider.dart`
  - **User Actions Supported:** Select start and end rental dates using date range picker, check real-time machinery availability, enter delivery address or pick farm location, review cost breakdown (days × rate + security deposit), accept rental terms, submit booking request.
  - **Backend Endpoint / Service:** `GET /api/bookings/availability`, `POST /api/bookings`
  - **Database Models Involved:** `Booking`, `BookingStatusHistory`, `Equipment`
  - **Auth & Permission:** Authenticated Farmer.
  - **Loading, Success & Error:** Validates non-overlapping dates; shows confirmation dialog; redirects to rental tracking.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `booking_repository.dart` lines 12–35 calls `apiClient.dio.post(ApiConstants.bookings)`.

- **Feature Name:** Booking History & Rental Tracking (`/my-rentals`, `/booking-details`)
  - **Portal:** Farmer
  - **Screen / Route:** `MyRentalsScreen` (`/my-rentals`), `ReceiptScreen` (`/booking-details`)
  - **Source Files:** `mobile/lib/features/marketplace/ui/my_rentals_screen.dart`, `receipt_screen.dart`
  - **User Actions Supported:** Filter bookings by status tab (All, Pending, Confirmed, In-Progress, Completed, Cancelled), view 5-step rental lifecycle progress bar, view owner contact with private call relay, open live chat with owner, view return inspection notes, cancel pending booking with reason.
  - **Backend Endpoint / Service:** `GET /api/bookings`, `PUT /api/bookings/:id/status`
  - **Database Models Involved:** `Booking`, `BookingStatusHistory`, `ReturnInspection`
  - **Auth & Permission:** Authenticated Farmer.
  - **Loading, Success & Error:** Color-coded status chips; push notifications on status updates.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `my_rentals_screen.dart` lines 110–260.

- **Feature Name:** Saved Equipment Wishlist (`/saved`, `/saved-equipment`)
  - **Portal:** Farmer
  - **Screen / Route:** `SavedEquipmentScreen`
  - **Source Files:** `mobile/lib/features/marketplace/ui/saved_equipment_screen.dart`, `saved_equipment_provider.dart`
  - **User Actions Supported:** View all bookmarked machinery items, one-tap removal, one-tap navigation to equipment details or booking form.
  - **Backend Endpoint / Service:** `GET /api/saved`, `POST /api/saved/:id`, `DELETE /api/saved/:id`
  - **Database Models Involved:** `SavedEquipment`, `Equipment`
  - **Auth & Permission:** Authenticated Farmer.
  - **Loading, Success & Error:** Optimistic bookmark toggle in UI with background API sync.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `saved_equipment_provider.dart` lines 18–48.

---

### 2.5 Payments & Financial Intelligence
- **Feature Name:** Farmer Payment History (`/payment-history`, `/payment-detail`)
  - **Portal:** Farmer
  - **Screen / Route:** `FarmerPaymentHistoryScreen`, `PaymentDetailScreen`
  - **Source Files:** `farmer_payment_history_screen.dart`, `payment_detail_screen.dart`, `payment_provider.dart`
  - **User Actions Supported:** View transaction log of all rental payments, transaction reference IDs, date, amount, payment method, booking link, download formatted PDF tax invoice.
  - **Backend Endpoint / Service:** `GET /api/payments/history`, `GET /api/payments/:bookingId/invoice`
  - **Database Models Involved:** `PaymentTransaction`, `Booking`
  - **Auth & Permission:** Authenticated Farmer.
  - **Loading, Success & Error:** Empty state for zero transactions; PDF open/print preview via `Printing.layoutPdf()`.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `farmer_payment_history_screen.dart` lines 45–130.

- **Feature Name:** Farm Spending & Financial Reports (`/all-expenses`)
  - **Portal:** Farmer
  - **Screen / Route:** `AllExpensesScreen` (`/all-expenses`)
  - **Source Files:** `mobile/lib/features/farm/ui/all_expenses_screen.dart`, `expenses_provider.dart`, `financial_provider.dart`
  - **User Actions Supported:** Log new manual farm expense (category: Machinery Rental, Seeds, Fertilizers, Labour, Fuel, Irrigation, Other; amount, date, notes), view expense breakdown pie chart, filter by category or crop stage, view budget utilization bar.
  - **Backend Endpoint / Service:** `GET /api/farms/:id/financials`, `GET /api/farms/:id/financials/expenses`, `POST /api/farms/:id/financials/expense`
  - **Database Models Involved:** `FarmBudget`, `FarmActivity`
  - **Auth & Permission:** Authenticated Farmer.
  - **Loading, Success & Error:** Immediate local budget recalculation; validation preventing negative amounts.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `expenses_provider.dart` lines 30–80.

---

### 2.6 AI Advisory, Guides & Voice Assistant
- **Feature Name:** AI Farm Copilot & Assistant (`/farm-copilot`, `/ai-assistant`)
  - **Portal:** Farmer
  - **Screen / Route:** `FarmCopilotScreen`, `AiAssistantScreen`
  - **Source Files:** `farm_copilot_screen.dart`, `ai_assistant_screen.dart`, `ai_assistant_service.dart`, `copilot_provider.dart`
  - **User Actions Supported:** Ask farming questions in natural language (text or voice), view grounded agronomic recommendations (pest identification, weather defense, equipment suggestions), add suggested operation directly to farm plan (`addToPlan`), save single action item.
  - **Backend Endpoint / Service:** `POST /api/ai/farm-copilot`, `POST /api/ai/farm-copilot/add-to-plan`
  - **Database Models Involved:** `FarmOperation`, `FarmTask`, `FarmDecision`, `FarmMemory`
  - **Auth & Permission:** Authenticated Farmer.
  - **Loading, Success & Error:** Multi-step animated processing checklist; ICAR/KVK-grounded fallback when LLM offline.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `ai_assistant_service.dart` lines 40–120.

- **Feature Name:** Voice AI Assistant (Speech Recognition & TTS)
  - **Portal:** Farmer (Shared)
  - **Screen / Route:** `VoiceInteractionModal` (invoked via microphone floating action button on home)
  - **Source Files:** `voice_interaction_modal.dart`, `voice_service.dart`, `tts_service.dart`
  - **User Actions Supported:** Tap mic button, speak agricultural query in English, Telugu, Hindi, Tamil, or Kannada; live speech-to-text transcription; AI processing; listen to spoken response via natural audio synthesis; tap quick prompt chips.
  - **Backend Endpoint / Service:** `VoiceService` (SpeechToText) -> `POST /api/ai/farm-copilot` -> `TtsService` (FlutterTts)
  - **Database Models Involved:** `FarmDecision`
  - **Auth & Permission:** Authenticated Farmer.
  - **Loading, Success & Error:** Strict 7-state interaction machine (`idle`, `listening`, `transcribing`, `processing`, `answer`, `error`, `cancelled`); handles microphone permission denial cleanly.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `voice_service.dart` lines 50–140, `voice_interaction_modal.dart` lines 75–230.

- **Feature Name:** Agricultural Guides & Knowledge Base (`/knowledge`, `/guides`)
  - **Portal:** Farmer
  - **Screen / Route:** `KnowledgeBaseScreen`
  - **Source Files:** `mobile/lib/features/marketplace/ui/knowledge_base_screen.dart`
  - **User Actions Supported:** Browse comprehensive agronomy guides by crop, step-by-step operation manuals, smart farming tips, recommended machinery with direct rental links, modern cultivation techniques.
  - **Backend Endpoint / Service:** `GET /api/guides`, `GET /api/guides/techniques`
  - **Database Models Involved:** `FarmingGuide`, `ModernTechnique`
  - **Auth & Permission:** Authenticated Farmer.
  - **Loading, Success & Error:** Category filters; expandable bottom sheet for full guide steps.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `knowledge_base_screen.dart` lines 90–240.

---

### 2.7 Community Agrarian Network
- **Feature Name:** Community Feed & Discussions (`/community`)
  - **Portal:** Farmer
  - **Screen / Route:** `CommunityScreen` (`/community`)
  - **Source Files:** `mobile/lib/features/community/ui/community_screen.dart`, `community_service.dart`, `community_provider.dart`
  - **User Actions Supported:** Read community messages, filter by topic (All, Discussions, Crops & Farming, Equipment Demand, Farming Advice), search posts by keyword or author, post new message to agrarian community, like messages, view author details.
  - **Backend Endpoint / Service:** `GET /api/community`, `GET /api/community/messages`, `POST /api/community/messages`
  - **Database Models Involved:** `CommunityMessage`, `User`
  - **Auth & Permission:** Authenticated Farmer.
  - **Loading, Success & Error:** Pull-to-refresh; debounced search (250ms); post length validation.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `community_service.dart` lines 19–49.

- **Feature Name:** Farmer Public Profile (`/farmer-profile/:id`)
  - **Portal:** Farmer
  - **Screen / Route:** `FarmerPublicProfileScreen`
  - **Source Files:** `mobile/lib/features/community/ui/farmer_public_profile_screen.dart`, `community_service.dart`
  - **User Actions Supported:** View peer farmer's village, state, registered crops, farming experience, equipment owned, initiate private call relay.
  - **Backend Endpoint / Service:** `GET /api/community/members/:id`
  - **Database Models Involved:** `User`, `Farm`, `FarmCrop`
  - **Auth & Permission:** Authenticated Farmer.
  - **Loading, Success & Error:** Skeleton view; masked phone number for privacy protection.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `community_service.dart` line 67.

- **Feature Name:** Regional Crop Trends & Crop Registration (`/crop-trends`, `register_crop_sheet.dart`)
  - **Portal:** Farmer
  - **Screen / Route:** `CropTrendsScreen`, `RegisterCropSheet`
  - **Source Files:** `crop_trends_screen.dart`, `register_crop_sheet.dart`, `community_service.dart`
  - **User Actions Supported:** Register current and planned next crop to the community board; inspect district-wide aggregated crop distribution (percentage of farmers growing Paddy, Cotton, Maize, etc.) to prevent regional over-supply and price crashes.
  - **Backend Endpoint / Service:** `GET /api/community/crop-trends`, `POST /api/community/my-crops`, `GET /api/community/my-crops`
  - **Database Models Involved:** `FarmCrop`, `User`
  - **Auth & Permission:** Authenticated Farmer.
  - **Loading, Success & Error:** Visual percentage distribution bars; confirmation toast.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `community_service.dart` lines 75–111.

---

### 2.8 Weather & Market Information
- **Feature Name:** Weather & Agricultural Advisory
  - **Portal:** Farmer
  - **Screen / Route:** `WeatherWidget` (embedded on home and farm screens)
  - **Source Files:** `mobile/lib/features/weather/ui/weather_widget.dart`, `weather_repository.dart`, `weather_provider.dart`
  - **User Actions Supported:** View current temperature, weather condition icon, humidity, wind speed, rainfall probability, and automated agronomic recommendations (e.g. "Optimal conditions for spraying" vs "Delay puddling due to heavy rain forecast").
  - **Backend Endpoint / Service:** `GET /api/farms/:id/weather`, `GET /api/farms/weather/lookup`
  - **Database Models Involved:** Real-time Open-Meteo / external weather API via backend `WeatherService`.
  - **Auth & Permission:** Authenticated Farmer.
  - **Loading, Success & Error:** Location-based auto-fetch; graceful offline fallback to historical seasonal averages.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `weather_repository.dart` lines 12–35.

---

### 2.9 Communication, In-App Chat & Notifications
- **Feature Name:** Real-Time In-App Chat (`/chat`)
  - **Portal:** Farmer (Shared with Owner)
  - **Screen / Route:** `ChatScreen` (`/chat`)
  - **Source Files:** `mobile/lib/features/marketplace/ui/chat_screen.dart`, `chat_provider.dart`, `chat_repository.dart`, `socket_client.dart`
  - **User Actions Supported:** Send and receive real-time messages regarding a specific equipment rental booking, view read receipts, view timestamped message history, auto-scroll to latest message.
  - **Backend Endpoint / Service:** `GET /api/chat/booking/:id`, `POST /api/chat/booking/:id`, Socket.IO event `message`
  - **Database Models Involved:** `Message`, `Booking`, `User`
  - **Auth & Permission:** Authenticated participant (Farmer or Owner) in booking.
  - **Loading, Success & Error:** Instant optimistic local message display; retry on socket disconnect; unread count badge.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `chat_repository.dart` lines 15–50, `socket_client.dart` lines 20–45.

- **Feature Name:** Notification Center (`/notifications`)
  - **Portal:** Farmer (Shared)
  - **Screen / Route:** `NotificationScreen` (`/notifications`)
  - **Source Files:** `mobile/lib/features/notifications/ui/notification_screen.dart`, `notification_provider.dart`
  - **User Actions Supported:** View list of platform alerts (Booking confirmed, Machinery dispatched, Weather alert, Payment received), mark single notification as read, mark all as read, delete notification, deep link into corresponding booking or weather screen.
  - **Backend Endpoint / Service:** `GET /api/notifications`, `PUT /api/notifications/:id/read`, `PUT /api/notifications/read-all`, `DELETE /api/notifications/:id`
  - **Database Models Involved:** `Notification`, `User`
  - **Auth & Permission:** Authenticated User.
  - **Loading, Success & Error:** Real-time badge counter via Socket.IO `notification` event; dismissible swipe actions.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `notification_repository.dart` lines 10–65.

- **Feature Name:** Private Call Relay (`CallRelayService`)
  - **Portal:** Farmer (Shared with Owner)
  - **Screen / Route:** Invoked via call buttons on equipment details, booking cards, and profiles.
  - **Source Files:** `mobile/lib/core/services/call_relay_service.dart`
  - **User Actions Supported:** Tap "Call Owner" or "Call Renter", backend provisions masked virtual relay number or fetches contact, launches native device dialer via `tel:` URL scheme.
  - **Backend Endpoint / Service:** `POST /api/calls/initiate`
  - **Database Models Involved:** `User`, `Booking`, `Equipment`
  - **Auth & Permission:** Authenticated User involved in transaction.
  - **Loading, Success & Error:** Fallback `SnackBar` if phone number unlisted or dialer fails to open.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `call_relay_service.dart` lines 15–44.

---

## 3. Owner Portal Feature Inventory

### 3.1 Owner Registration & Dashboard
- **Feature Name:** Owner Registration & Role Switching
  - **Portal:** Owner
  - **Screen / Route:** `RegisterScreen` (`role: OWNER`), `RoleSelectScreen` (`/role-select`)
  - **Source Files:** `register_screen.dart`, `role_select_screen.dart`, `auth_provider.dart`
  - **User Actions Supported:** Register dedicated Owner account, switch between Farmer and Owner personas if account has `BOTH` role.
  - **Backend Endpoint / Service:** `POST /api/auth/register`, `POST /api/auth/login`
  - **Database Models Involved:** `User`
  - **Auth & Permission:** Role guards enforce Owner dashboard access.
  - **Loading, Success & Error:** Automatic redirect to `/owner` upon authentication.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `router.dart` lines 95–115.

- **Feature Name:** Owner Dashboard Hub (`/owner` Tab 0)
  - **Portal:** Owner
  - **Screen / Route:** `OwnerHomeScreen` (tab inside `OwnerMainScreen`)
  - **Source Files:** `mobile/lib/features/profile/ui/owner_home_screen.dart`, `owner_provider.dart`
  - **User Actions Supported:** View fleet overview (Total Equipment, Active Rentals, Pending Requests, Monthly Earnings), quick actions to add equipment, manage bookings, view revenue reports, review recent booking cards, warm cache on refresh.
  - **Backend Endpoint / Service:** `GET /api/analytics/owner`, `GET /api/equipment/my`, `GET /api/bookings/owner`
  - **Database Models Involved:** `Equipment`, `Booking`, `User`
  - **Auth & Permission:** Authenticated Owner.
  - **Loading, Success & Error:** Skeletons; pull-to-refresh warming dashboard data.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `owner_home_screen.dart` lines 110–380.

---

### 3.2 Equipment Inventory Management
- **Feature Name:** Owner Fleet Inventory (`/owner` Tab 1)
  - **Portal:** Owner
  - **Screen / Route:** `_OwnerEquipmentTab` (inside `OwnerMainScreen`)
  - **Source Files:** `mobile/lib/features/profile/ui/owner_main_screen.dart`, `owner_provider.dart`
  - **User Actions Supported:** View all owned machinery, toggle active availability status (`available: true/false`), filter by availability status (All, Available, Rented, Maintenance), tap machine to view equipment details or edit listing, tap "Add Equipment".
  - **Backend Endpoint / Service:** `GET /api/equipment/my`, `PUT /api/equipment/:id`
  - **Database Models Involved:** `Equipment`
  - **Auth & Permission:** Authenticated Owner.
  - **Loading, Success & Error:** Optimistic toggle switch; rollback on network failure; empty state prompting first listing.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `owner_main_screen.dart` lines 420–780.

- **Feature Name:** Add New Equipment Listing (`/add-equipment`)
  - **Portal:** Owner
  - **Screen / Route:** `AddEquipmentScreen` (`/add-equipment`)
  - **Source Files:** `mobile/lib/features/profile/ui/add_equipment_screen.dart`, `owner_provider.dart`
  - **User Actions Supported:** Select from 14 agricultural categories, enter machine title, model, specifications, daily rental rate (`₹/day`), select machine location/village, take photo via camera or select from gallery, upload image to storage bucket, submit new listing.
  - **Backend Endpoint / Service:** `POST /api/upload`, `POST /api/equipment`
  - **Database Models Involved:** `Equipment`
  - **Auth & Permission:** Authenticated Owner.
  - **Loading, Success & Error:** Upload progress indicator; input validation; returns to fleet list and invalidates equipment providers upon success.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `add_equipment_screen.dart` lines 140–380.

- **Feature Name:** Edit Equipment Listing (`/edit-equipment`)
  - **Portal:** Owner
  - **Screen / Route:** `EditEquipmentScreen` (`/edit-equipment`)
  - **Source Files:** `mobile/lib/features/profile/ui/edit_equipment_screen.dart`, `owner_provider.dart`
  - **User Actions Supported:** Pre-populates existing equipment details, update price per day, update description, update location, replace photograph, toggle availability, delete listing with confirmation dialog.
  - **Backend Endpoint / Service:** `GET /api/equipment/:id`, `PUT /api/equipment/:id`, `DELETE /api/equipment/:id`
  - **Database Models Involved:** `Equipment`
  - **Auth & Permission:** Authenticated Owner of the specific equipment item.
  - **Loading, Success & Error:** Deletion confirmation alert; immediate cache invalidation.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `edit_equipment_screen.dart` lines 90–310.

- **Feature Name:** Equipment Maintenance & Downtime Tracking (`OwnerMaintenanceDialog`)
  - **Portal:** Owner
  - **Screen / Route:** `OwnerMaintenanceDialog` (dialog invoked from equipment options)
  - **Source Files:** `mobile/lib/features/profile/ui/owner_maintenance_dialog.dart`, `owner_provider.dart`
  - **User Actions Supported:** Log maintenance service (Oil Change, Tyre Repair, Engine Overhaul, Blade Replacement, General Inspection), cost of service, service provider, downtime start and end dates, toggle machine offline during servicing.
  - **Backend Endpoint / Service:** `POST /api/equipment/:id/maintenance`, `GET /api/equipment/:id/maintenance`
  - **Database Models Involved:** `Equipment`, `FarmActivity`
  - **Auth & Permission:** Authenticated Owner.
  - **Loading, Success & Error:** Auto-updates equipment availability flag to false during maintenance window.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `owner_maintenance_dialog.dart` lines 110–280.

---

### 3.3 Booking Decision & Rental Lifecycle Management
- **Feature Name:** Owner Bookings Decision Hub (`/owner` Tab 2)
  - **Portal:** Owner
  - **Screen / Route:** `_OwnerBookingsTab` (inside `OwnerMainScreen`)
  - **Source Files:** `mobile/lib/features/profile/ui/owner_main_screen.dart`, `owner_provider.dart`
  - **User Actions Supported:** Filter bookings by status (All, Pending, Confirmed, Active, Completed, Cancelled), review renter details, dates, total revenue; one-tap Accept (`CONFIRMED`) or Reject (`REJECTED`) pending requests; tap to open detailed booking management.
  - **Backend Endpoint / Service:** `GET /api/bookings/owner`, `PUT /api/bookings/:id/status`
  - **Database Models Involved:** `Booking`, `BookingStatusHistory`, `User`
  - **Auth & Permission:** Authenticated Owner.
  - **Loading, Success & Error:** Swipe-to-refresh; dialog prompting rejection reason when rejecting.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `owner_main_screen.dart` lines 850–1210.

- **Feature Name:** Detailed Booking Lifecycle & Return Inspection (`/owner-booking-detail`)
  - **Portal:** Owner
  - **Screen / Route:** `OwnerBookingDetailScreen` (`/owner-booking-detail`)
  - **Source Files:** `mobile/lib/features/profile/ui/owner_booking_detail_screen.dart`
  - **User Actions Supported:** Advance rental lifecycle through verified states:
    1. Pending -> Confirm or Reject
    2. Confirmed -> Mark Dispatched (`OUT_FOR_DELIVERY`)
    3. Dispatched -> Mark Active Handover (`ACTIVE`)
    4. Active -> Mark Returned (`RETURNED`)
    5. Submit return inspection report: record machine condition (Good, Minor Wear, Damaged), note deductions from security deposit, complete rental (`COMPLETED`), call renter, chat with renter.
  - **Backend Endpoint / Service:** `PUT /api/bookings/:id/status`, `POST /api/bookings/:id/inspection`
  - **Database Models Involved:** `Booking`, `BookingStatusHistory`, `ReturnInspection`
  - **Auth & Permission:** Authenticated Owner.
  - **Loading, Success & Error:** Step-by-step confirmation prompts; prevents invalid state jumps.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `owner_booking_detail_screen.dart` lines 180–450.

---

### 3.4 Financial Ledger, Payouts & Analytics
- **Feature Name:** Owner Payments Received (`/payments-received`)
  - **Portal:** Owner
  - **Screen / Route:** `OwnerPaymentsReceivedScreen` (`/payments-received`)
  - **Source Files:** `mobile/lib/features/payments/ui/owner_payments_received_screen.dart`, `payment_provider.dart`
  - **User Actions Supported:** View ledger of all incoming rental payouts, gross earnings, platform commission deductions (5%), net received, transaction date, download tax receipt PDF.
  - **Backend Endpoint / Service:** `GET /api/payments/received`
  - **Database Models Involved:** `PaymentTransaction`, `Booking`
  - **Auth & Permission:** Authenticated Owner.
  - **Loading, Success & Error:** Total revenue sum card; filter by date range.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `owner_payments_received_screen.dart` lines 40–160.

- **Feature Name:** Owner Bank Details Setup (`OwnerBankDetailsDialog`)
  - **Portal:** Owner
  - **Screen / Route:** `OwnerBankDetailsDialog` (dialog invoked from Owner More screen)
  - **Source Files:** `mobile/lib/features/profile/ui/owner_bank_details_dialog.dart`
  - **User Actions Supported:** Enter bank account number, confirm account number, IFSC code, account holder name, bank name, branch; view masked existing account (`•••• •••• 1234`).
  - **Backend Endpoint / Service:** `GET /api/owner/bank-details`, `POST /api/owner/bank-details`
  - **Database Models Involved:** `BankDetails`, `User`
  - **Auth & Permission:** Authenticated Owner.
  - **Loading, Success & Error:** IFSC regex validation; masked display for security.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `owner_bank_details_dialog.dart` lines 90–240.

- **Feature Name:** Owner Analytics Dashboard (`/owner-analytics`)
  - **Portal:** Owner
  - **Screen / Route:** `OwnerAnalyticsDashboardScreen` (`/owner-analytics`)
  - **Source Files:** `mobile/lib/features/profile/ui/owner_analytics_dashboard_screen.dart`, `owner_analytics_repository.dart`
  - **User Actions Supported:** Inspect 6-month revenue trends, fleet utilization rate (percentage of days machinery rented vs idle), top performing equipment rankings, customer satisfaction rating breakdown.
  - **Backend Endpoint / Service:** `GET /api/analytics/owner/performance`
  - **Database Models Involved:** `Booking`, `Equipment`, `EquipmentReview`
  - **Auth & Permission:** Authenticated Owner.
  - **Loading, Success & Error:** Interactive bar/line chart visualizations.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `owner_analytics_dashboard_screen.dart` lines 120–380.

---

## 4. Admin Portal Feature Inventory

### 4.1 Administration Dashboard & Oversight
- **Feature Name:** Admin Authentication & Role Protection (`/admin`)
  - **Portal:** Admin
  - **Screen / Route:** `AdminDashboardScreen` (`/admin`)
  - **Source Files:** `mobile/lib/features/admin/ui/admin_dashboard_screen.dart`, `router.dart`
  - **User Actions Supported:** Dedicated administrator credentials route to `/admin`. Non-admin accounts attempting access are blocked by `AppRouter.testRoleRedirect` and redirected.
  - **Backend Endpoint / Service:** `GET /api/admin/stats`
  - **Database Models Involved:** `User`, `AuditLog`
  - **Auth & Permission:** Role strictly `ADMIN`.
  - **Loading, Success & Error:** 403 Forbidden on unauthorized role; full page administrative container.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `router.dart` line 125, `admin_dashboard_screen.dart` lines 18–25.

- **Feature Name:** Platform Overview & Metrics (`/admin` Tab 0)
  - **Portal:** Admin
  - **Screen / Route:** `_buildStatsTab` (inside `AdminDashboardScreen`)
  - **Source Files:** `admin_dashboard_screen.dart`
  - **User Actions Supported:** Inspect high-level platform KPIs: Total Registered Users, Active Equipment Listings, Total Bookings Count, Platform Gross Merchandise Value (GMV), Active Rentals Count, Pending Equipment Approvals.
  - **Backend Endpoint / Service:** `GET /api/admin/stats`
  - **Database Models Involved:** `User`, `Equipment`, `Booking`, `PaymentTransaction`
  - **Auth & Permission:** Admin only.
  - **Loading, Success & Error:** Refresh action button invalidating all administrative providers.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `admin_dashboard_screen.dart` lines 204 & 310–540.

- **Feature Name:** User Management (`/admin` Tab 1)
  - **Portal:** Admin
  - **Screen / Route:** `_buildUsersTab` (inside `AdminDashboardScreen`)
  - **Source Files:** `admin_dashboard_screen.dart`
  - **User Actions Supported:** Search platform users by name or email, filter by role (All, Farmer, Owner, Admin), inspect user verification status, suspend user account (`isSuspended: true`), unsuspend account, verify user identity.
  - **Backend Endpoint / Service:** `GET /api/admin/users`, `PUT /api/admin/users/:id/suspend`, `PUT /api/admin/users/:id/verify`
  - **Database Models Involved:** `User`, `AuditLog`
  - **Auth & Permission:** Admin only.
  - **Loading, Success & Error:** Immediate badge update; suspended users see restricted lockout banner on login.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `admin_dashboard_screen.dart` lines 550–820.

- **Feature Name:** Feedback & Complaints Moderation (`/admin` Tab 2)
  - **Portal:** Admin
  - **Screen / Route:** `_buildAlertsTab` (inside `AdminDashboardScreen`)
  - **Source Files:** `admin_dashboard_screen.dart`
  - **User Actions Supported:** Review user feedback submissions, inspect user complaints and disputes (Equipment condition issues, Payment disputes, Unreturned machinery), update complaint status (Under Review, Resolved, Dismissed), attach admin resolution notes.
  - **Backend Endpoint / Service:** `GET /api/admin/feedback-complaints`, `PUT /api/admin/complaints/:id/status`
  - **Database Models Involved:** `Feedback`, `Complaint`, `User`
  - **Auth & Permission:** Admin only.
  - **Loading, Success & Error:** Status filter chips; dialog to enter resolution notes.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `admin_dashboard_screen.dart` lines 830–1100.

- **Feature Name:** System Health & Performance Monitoring (`/admin` Tab 3)
  - **Portal:** Admin
  - **Screen / Route:** `_buildSystemHealthTab` (inside `AdminDashboardScreen`)
  - **Source Files:** `admin_dashboard_screen.dart`
  - **User Actions Supported:** Review server uptime, Node.js process memory usage (RSS, Heap Used), database query response latency (ms), active Socket.IO connections count, data quality scores (percentage of equipment with complete photos and specs).
  - **Backend Endpoint / Service:** `GET /api/admin/system-health`, `GET /api/admin/data-quality`
  - **Database Models Involved:** Internal Express process metrics, Supabase PostgreSQL latency query.
  - **Auth & Permission:** Admin only.
  - **Loading, Success & Error:** Color-coded status cards (Healthy green, Warning amber, Critical red).
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `admin_dashboard_screen.dart` lines 1110–1350.

- **Feature Name:** Audit Logs Viewer (`/admin` Tab 4)
  - **Portal:** Admin
  - **Screen / Route:** `_buildAdminProfileTab` -> Audit Logs Modal
  - **Source Files:** `admin_dashboard_screen.dart`
  - **User Actions Supported:** Inspect append-only platform security log: timestamp, actor ID, actor role, action performed (`USER_SUSPENDED`, `BOOKING_CANCELLED`, `EQUIPMENT_DELISTED`), target resource ID, IP address.
  - **Backend Endpoint / Service:** `GET /api/admin/audit-logs`
  - **Database Models Involved:** `AuditLog`
  - **Auth & Permission:** Admin only.
  - **Loading, Success & Error:** Chronological scrolling list; expandable JSON metadata viewer.
  - **Status:** **IMPLEMENTED**
  - **Evidence:** `admin_dashboard_screen.dart` lines 1360–1600.

---

## 5. Shared Infrastructure & Platform Services

- **Feature Name:** Multilingual Localization (5 Languages)
  - **Portal:** Shared
  - **Source Files:** `mobile/lib/core/localization/app_localizations.dart` (4,878 lines)
  - **Capabilities:** Comprehensive translation dictionaries for English (`en`), Telugu (`te`), Hindi (`hi`), Tamil (`ta`), and Kannada (`kn`). Consumes `languageProvider` with persistent storage in `FlutterSecureStorage` and backend sync via `PUT /api/auth/language`.
  - **Status:** **IMPLEMENTED**

- **Feature Name:** Network State & Offline Detection
  - **Portal:** Shared
  - **Source Files:** `mobile/lib/core/providers/network_status_provider.dart`, `connectivity_plus`
  - **Capabilities:** Monitors WiFi and cellular network connectivity. Injects offline banner when connection is lost; queues requests in local cache.
  - **Status:** **IMPLEMENTED**

- **Feature Name:** Theme Mode & Dark Mode Support
  - **Portal:** Shared
  - **Source Files:** `mobile/lib/core/providers/theme_provider.dart`, `app_theme.dart`
  - **Capabilities:** Supports System Default, Light, and Dark mode with agricultural color palette tokens.
  - **Status:** **IMPLEMENTED**

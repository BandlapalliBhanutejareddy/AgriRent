# AGRORENT AI — PHASE 0: MOBILE APP AUDIT, BASELINE & HANDOFF REPORT

**Document ID**: `MOBILE-PHASE-0-AUDIT`  
**Date**: 20 October 2026  
**Auditor**: Antigravity AI (Pair Programming Mobile Audit Agent)  
**Target Repository**: `D:\AgriRent_AI\mobile`  
**Reference Specification**: *AgroRent AI Mobile and Web Development Report* (Version 1.0, 20 October 2026)  
**Strict Scope**: Flutter Android Mobile App Only (Next.js Web excluded from modifications)

---

## 1. Project & Environment Details

| Component | Value / Configuration |
|---|---|
| **Mobile App Root** | `D:\AgriRent_AI\mobile` |
| **Flutter Version** | `3.47.5` (channel `stable`, revision `6a19cca564`, 5 weeks ago) |
| **Dart SDK Version** | `3.13.4` (stable, on `windows_x64`) |
| **Android SDK Path** | `C:\Users\bhanu\AppData\Local\Android\Sdk` |
| **Java / JDK Version** | JDK 17 (compileOptions: `JavaVersion.VERSION_17`, Kotlin JVM target: `17`) |
| **Android Application ID** | `com.example.mobile` (in `android/app/build.gradle.kts`) |
| **Android Manifest Label** | `android:label="mobile"` (in `android/app/src/main/AndroidManifest.xml`) |
| **Supabase Project URL** | `https://ezylxyrtnodxthdgynvn.supabase.co` |
| **Supabase Anon Key** | Verified JWT (`iss: supabase`, `ref: ezylxyrtnodxthdgynvn`, expiry: `2093725122`) |
| **Backend Base URL (Dev)** | `http://127.0.0.1:4000/api/` (Default flavor: `development`) |
| **Backend Socket URL (Dev)** | `http://127.0.0.1:4000` |
| **Backend Base URL (Staging)** | `https://staging-api.agrorent.ai/api/` |
| **Backend Base URL (Prod)** | `https://agrirent-5qpx.onrender.com/api/` |
| **State Management** | Flutter Riverpod `2.6.1` |
| **Routing Framework** | GoRouter `17.5.0` |
| **HTTP Client** | Dio `5.11.0` with custom `NetworkInterceptor` for offline caching |
| **Local Storage** | `flutter_secure_storage: 9.2.2` & `shared_preferences: 2.5.5` |
| **Mapping Engine** | `google_maps_flutter: 2.18.0` with `MAPS_API_KEY` injected via `local.properties` |
| **Voice & Speech Engines** | `speech_to_text: 7.5.0` and `flutter_tts: 4.2.5` |

---

## 2. Git Branch & Working-Tree Status

- **Current Git Branch**: `main` (synchronized with `origin/main` at commit `6b8c67c`).
- **Working Tree State**:
  - `mobile/`: 44 modified tracked files (7,490 insertions, 3,159 deletions in active working tree).
  - `backend/`: 19 modified tracked files (inspected for API contracts; unmodified during this audit).
  - Uncommitted additions contain recent enhancements to role guards, clean localization keys, admin stats, and formatters.
- **Untracked Artifacts**:
  - Over 100 historical PNG screenshots and shell helper scripts (`scripts/clean_mojibake.js`, `scripts/build_clean_localizations.js`, etc.) remain in the root and `mobile/` directory from earlier testing runs.
- **Preservation Assurance**:
  - Zero git resets, destructive file removals, or premature code replacements were executed.
  - All existing features and implementations remain intact.

---

## 3. Complete Mobile Screen & Route Inventory

### 3.1 Registered Routes in `router.dart` (37 Total Routes)

| Path | Screen Widget | File Location | Intended Roles |
|---|---|---|---|
| `/` | `SplashScreen` | `lib/features/auth/ui/splash_screen.dart` | Public |
| `/splash` | `SplashScreen` | `lib/features/auth/ui/splash_screen.dart` | Public |
| `/welcome` | `WelcomeScreen` | `lib/features/auth/ui/welcome_screen.dart` | Public |
| `/login` | `LoginScreen` | `lib/features/auth/ui/login_screen.dart` | Public |
| `/role-select` | `RoleSelectScreen` | `lib/features/auth/ui/role_select_screen.dart` | Dual-Role (`BOTH`) |
| `/register` | `RegisterScreen` | `lib/features/auth/ui/register_screen.dart` | Public |
| `/otp` | `OtpScreen` | `lib/features/auth/ui/otp_screen.dart` | Public |
| `/forgot-password` | `ForgotPasswordScreen` | `lib/features/auth/ui/forgot_password_screen.dart` | Public |
| `/reset-password` | `ResetPasswordScreen` | `lib/features/auth/ui/reset_password_screen.dart` | Public |
| `/farmer` | `FarmerMainScreen` | `lib/features/marketplace/ui/farmer_main_screen.dart` | `FARMER`, `BOTH` |
| `/marketplace` | `FarmerMarketplaceScreen` | `lib/features/marketplace/ui/farmer_marketplace_screen.dart` | `FARMER`, `BOTH` |
| `/farm` | `MyFarmScreen` | `lib/features/farm/ui/my_farm_screen.dart` | `FARMER`, `BOTH` |
| `/farm-plan` | `FarmerFarmScreen` | `lib/features/farm/ui/farmer_farm_screen.dart` | `FARMER`, `BOTH` |
| `/crop-lifecycle` | `CropLifecycleScreen` | `lib/features/farm/ui/crop_lifecycle_screen.dart` | `FARMER`, `BOTH` |
| `/stage-details` | `StageDetailsScreen` | `lib/features/farm/ui/stage_details_screen.dart` | `FARMER`, `BOTH` |
| `/operations` | `StageOperationsScreen` | `lib/features/farm/ui/stage_operations_screen.dart` | `FARMER`, `BOTH` |
| `/operation-detail` | `OperationDetailScreen` | `lib/features/farm/ui/operation_detail_screen.dart` | `FARMER`, `BOTH` |
| `/crop-advisor` | `CropAdvisorScreen` | `lib/features/marketplace/ui/crop_advisor_screen.dart` | `FARMER`, `BOTH` |
| `/advisor` | `CropAdvisorScreen` | `lib/features/marketplace/ui/crop_advisor_screen.dart` | `FARMER`, `BOTH` |
| `/ai-assistant` | `AiAssistantScreen` | `lib/features/ai_assistant/ui/ai_assistant_screen.dart` | `FARMER`, `BOTH` |
| `/knowledge` | `KnowledgeBaseScreen` | `lib/features/marketplace/ui/knowledge_base_screen.dart` | All Roles |
| `/guides` | `KnowledgeBaseScreen` | `lib/features/marketplace/ui/knowledge_base_screen.dart` | All Roles |
| `/owner` | `OwnerMainScreen` | `lib/features/profile/ui/owner_main_screen.dart` | `OWNER`, `BOTH` |
| `/feedback` | `FeedbackScreen` | `lib/features/feedback/ui/feedback_screen.dart` | All Roles |
| `/admin` | `AdminDashboardScreen` | `lib/features/admin/ui/admin_dashboard_screen.dart` | `ADMIN` |
| `/add-equipment` | `AddEquipmentScreen` | `lib/features/profile/ui/add_equipment_screen.dart` | `OWNER`, `BOTH` |
| `/about-profile` | `AboutProfileScreen` | `lib/features/profile/ui/about_profile_screen.dart` | All Roles |
| `/edit-profile` | `EditProfileScreen` | `lib/features/profile/ui/edit_profile_screen.dart` | All Roles |
| `/change-password` | `ChangePasswordScreen` | `lib/features/profile/ui/change_password_screen.dart` | All Roles |
| `/farm-setup` | `FarmSetupScreen` | `lib/features/farm/ui/farm_setup_screen.dart` | `FARMER`, `BOTH` |
| `/farm-copilot` | `FarmCopilotScreen` | `lib/features/farm/ui/farm_copilot_screen.dart` | `FARMER`, `BOTH` |
| `/notifications` | `NotificationScreen` | `lib/features/notifications/ui/notification_screen.dart` | All Roles |
| `/saved` | `SavedEquipmentScreen` | `lib/features/marketplace/ui/saved_equipment_screen.dart` | `FARMER`, `BOTH` |
| `/payment-history` | `FarmerPaymentHistoryScreen` | `lib/features/payments/ui/farmer_payment_history_screen.dart` | `FARMER`, `BOTH` |
| `/payments-received`| `OwnerPaymentsReceivedScreen` | `lib/features/payments/ui/owner_payments_received_screen.dart`| `OWNER`, `BOTH` |
| `/payment-detail` | `PaymentDetailScreen` | `lib/features/payments/ui/payment_detail_screen.dart` | All Roles |
| `/community` | `CommunityScreen` | `lib/features/community/ui/community_screen.dart` | `FARMER`, `BOTH` |
| `/crop-trends` | `CropTrendsScreen` | `lib/features/community/ui/crop_trends_screen.dart` | `FARMER`, `BOTH` |
| `/farmer-profile/:id`| `FarmerPublicProfileScreen` | `lib/features/community/ui/farmer_public_profile_screen.dart` | `FARMER`, `BOTH` |
| `/chat` | `ChatScreen` | `lib/features/marketplace/ui/chat_screen.dart` | All Roles |
| `/my-rentals` | `MyRentalsScreen` | `lib/features/marketplace/ui/my_rentals_screen.dart` | `FARMER`, `BOTH` |
| `/booking-details`| `ReceiptScreen` | `lib/features/marketplace/ui/receipt_screen.dart` | `FARMER`, `OWNER` |
| `/equipment-detail`| `EquipmentDetailsScreen` | `lib/features/marketplace/ui/equipment_details_screen.dart` | All Roles |
| `/equipment/:id` | `EquipmentLoaderScreen` | `lib/features/marketplace/ui/equipment_loader_screen.dart` | All Roles |
| `/all-expenses` | `AllExpensesScreen` | `lib/features/farm/ui/all_expenses_screen.dart` | `FARMER`, `BOTH` |
| `/completed-tasks`| `CompletedTasksScreen` | `lib/features/farm/ui/completed_tasks_screen.dart` | `FARMER`, `BOTH` |

### 3.2 Modal Sheets & Dynamically Navigated Screens (Not in Router)

| Screen / Modal | Trigger Location | Purpose |
|---|---|---|
| `BookingFormScreen` | `equipment_details_screen.dart:68` | Direct `MaterialPageRoute` date picker and rental submission form. |
| `EquipmentMapScreen` | `equipment_details_screen.dart:401` | Modal view for equipment location radius on Google Maps. |
| `RegisterCropSheet` | `community_screen.dart:408` | Modal bottom sheet to update farmer crop and season. |
| `VoiceInteractionModal` | `farmer_home_screen.dart` / Search bar | Mic listening, speech transcription animation, and AI query trigger. |
| `_PrivateCallModal` | `call_relay_service.dart:30` | Masked phone relay initiator bottom sheet. |

### 3.3 Dead, Orphaned, or Duplicate Screen Files

| File | Status | Code Lines | Diagnostic Finding |
|---|---|---|---|
| `lib/features/marketplace/ui/farmer_dashboard_screen.dart` | **Dead Code** | 934 | Legacy monolithic dashboard. Never routed or instantiated. Superseded by `farmer_home_screen.dart`. |
| `lib/features/marketplace/ui/farmer_hub_screen.dart` | **Dead Code** | 112 | Legacy quick-action screen. Unused. Contains broken navigation link (`context.push('/profile')`). |
| `lib/features/profile/ui/owner_home_placeholder_screen.dart` | **Dead Code** | 31 | Legacy "Coming in future phase" placeholder. Superseded by `owner_home_screen.dart`. |
| `lib/features/profile/ui/profile_screen.dart` | **Dead Code** | 595 | Legacy profile screen. Unlinked. Contains broken routes (`/my-equipment`, `/owner-bookings`). Superseded by `farmer_more_screen.dart` and `owner_more_screen.dart`. |
| `lib/features/payments/repository/payment_repository.dart` | **Unused Duplicate**| 16 | Mock stub `confirmDirectPayment` class in singular `repository/` folder. The actual repository is in `repositories/payment_repository.dart`. |

---

## 4. Role-Based Feature Matrices

Status Labels:
- `CONFIRMED WORKING` — Verified by automated test or live functional run.
- `IMPLEMENTED, NOT VERIFIED` — Code exists end-to-end, awaiting physical device/live account verification.
- `FAILED` — Demonstrably broken or triggers an exception.
- `BLOCKED` — Cannot execute due to missing external/device prerequisites.
- `NOT TESTED` — No adequate test executed yet.
- `NOT IMPLEMENTED` — Feature is absent from the mobile codebase.

### 4.1 Farmer Portal Feature Matrix

| Feature / Screen | Status | Evidence / Code Trace | Notes & Defect References |
|---|---|---|---|
| **Authentication & Session Restore** | `CONFIRMED WORKING` | `auth_repository.dart:187`, verified in `env_test.dart` & `widget_test.dart`. | Session restore via Supabase refresh token works. |
| **Home Dashboard & Analytics** | `IMPLEMENTED, NOT VERIFIED` | `farmer_home_screen.dart:67`, `analytics/farmer` endpoint. | Analytics API called, but empty database displays zero states. |
| **My Farm & Field Twin** | `IMPLEMENTED, NOT VERIFIED` | `my_farm_screen.dart:100` | **Defect**: Hardcoded to `farms.first`. Cannot switch multiple fields. |
| **Crop Lifecycle & Stages** | `IMPLEMENTED, NOT VERIFIED` | `crop_lifecycle_screen.dart`, `stage_details_screen.dart`. | Stages render from `kCanonicalStages`. |
| **Farm Plan & Tasks** | `IMPLEMENTED, NOT VERIFIED` | `farmer_farm_screen.dart:61`, `farms/:farmId/crops/:cropId/operations`. | Tasks fetch from backend operation scheduler. |
| **Task Completion Persistence** | `IMPLEMENTED, NOT VERIFIED` | `operation_detail_screen.dart:65`, `POST .../tasks/:id/complete`. | Optimistic local state update + backend call. |
| **Farm Memory** | `NOT IMPLEMENTED` | Grep across `mobile/lib` returned 0 matches. | Backend Prisma has `model FarmMemory`, but Mobile has no UI. |
| **Voice Search & Mic Modal** | `CONFIRMED WORKING` (Unit/Widget) | `voice_ai_assistant_test.dart` (10 passing tests); `voice_interaction_modal.dart`. | Physical mic permission requires physical device testing. |
| **Farm Copilot vs AI Assistant** | `FAILED` (Architecture) | `farm_copilot_screen.dart` AND `ai_assistant_screen.dart`. | **Defect**: Duplicate chatbot screens. Violates design system North Star. |
| **Equipment Marketplace** | `CONFIRMED WORKING` (Unit) | `category_and_call_test.dart`, `farmer_marketplace_screen.dart`. | Category filtering supported on backend and client. |
| **Equipment Title Visuals** | `FAILED` (Aesthetics) | `equipment_card.dart:378` | **Defect**: Displays generic tractor icon for all machinery types without photos. |
| **Saved Equipment** | `CONFIRMED WORKING` | `saved_equipment_screen.dart`, `saved_equipment_provider.dart`. | Toggle save/bookmark persists via `POST /equipment/:id/save`. |
| **Booking Creation** | `IMPLEMENTED, NOT VERIFIED` | `booking_form_screen.dart:79`, `POST /bookings`. | Uses date range picker and calls backend create endpoint. |
| **My Bookings Lifecycle** | `IMPLEMENTED, NOT VERIFIED` | `my_rentals_screen.dart`, `receipt_screen.dart:58`. | Status transitions (Confirm, Cancel, Return) implemented. |
| **Private Call Relay** | `CONFIRMED WORKING` (Unit) | `category_and_call_test.dart`, `call_relay_service.dart:83`. | Calls `POST /calls/initiate` and launches `tel:` masked dialer. |
| **Chat with Owner** | `CONFIRMED WORKING` (Unit) | `chat_test.dart` (3 tests passed); `chat_screen.dart`. | Socket.IO + REST fallback implemented. |
| **Farmer Community Chat** | `CONFIRMED WORKING` (Unit) | `community_test.dart` (4 tests passed); `community_screen.dart`. | Chat messages serialize and send via Socket/REST. |
| **Farmer Public Profiles** | `IMPLEMENTED, NOT VERIFIED` | `farmer_public_profile_screen.dart:38`. | `GET /community/members/:id` displays sanitized public profile. |
| **Current / Next Crop Reg** | `IMPLEMENTED, NOT VERIFIED` | `register_crop_sheet.dart:114`. | Updates current and next crop in community profile. |
| **Group Selling & Declarations**| `NOT IMPLEMENTED` | `register_crop_sheet.dart` inspection. | Advance quantity ranges, harvest windows, and group pricing missing. |
| **Weather & Farm Alerts** | `IMPLEMENTED, NOT VERIFIED` | `weather_widget.dart:11`, `weather_repository.dart`. | Fetches Open-Meteo weather via backend `/farms/:id/weather`. |
| **Farm Finance & Budget** | `IMPLEMENTED, NOT VERIFIED` | `all_expenses_screen.dart:49`. | **Defect**: Hardcoded fallback budget of ₹50,000. Voice entry absent. |
| **Payment History & Receipts** | `CONFIRMED WORKING` (Unit) | `formatters_and_semantics_test.dart`, `farmer_payment_history_screen.dart`. | PDF receipt generation implemented via `ReceiptPdfService`. |
| **Notifications** | `IMPLEMENTED, NOT VERIFIED` | `notification_screen.dart:34`. | Fetches `GET /notifications`; deep links to chat. |
| **Farming Guides & Videos** | `IMPLEMENTED, NOT VERIFIED` | `knowledge_base_screen.dart`, `stage_details_screen.dart:43`. | YouTube search URLs generated by `CropStageIntelligence`. |
| **Offline GET Caching** | `IMPLEMENTED, NOT VERIFIED` | `network_interceptor.dart:13`. | GET responses cached to SharedPreferences. |
| **Offline Write Queue** | `NOT IMPLEMENTED` | `network_interceptor.dart:56`. | Writes fail immediately when offline; no transaction queue. |

---

### 4.2 Equipment Owner Portal Feature Matrix

| Feature / Screen | Status | Evidence / Code Trace | Notes & Defect References |
|---|---|---|---|
| **Owner Role Isolation** | `CONFIRMED WORKING` | `router.dart:90-95`, `owner_test.dart`. | Non-owners redirected away from `/owner`. |
| **Owner Home & Dashboard** | `IMPLEMENTED, NOT VERIFIED` | `owner_home_screen.dart`, `owner_provider.dart:33`. | Fetches fleet stats, active rentals, and earnings. |
| **Equipment Inventory** | `CONFIRMED WORKING` (Unit) | `owner_test.dart`, `owner_main_screen.dart:47`. | Lists owner machines with availability switch. |
| **Add Equipment & Image Upload**| `IMPLEMENTED, NOT VERIFIED`| `add_equipment_screen.dart:196`. | Uploads image to Supabase Storage via `POST /upload`. |
| **Edit Equipment & Pricing** | `IMPLEMENTED, NOT VERIFIED` | `edit_equipment_screen.dart`, `owner_provider.dart`. | Updates price, title, category, and availability. |
| **Booking Requests & Actions** | `IMPLEMENTED, NOT VERIFIED` | `owner_main_screen.dart:49` (`_OwnerBookingsTab`). | Accept/Reject and Complete rental lifecycle actions. |
| **Payments Received** | `IMPLEMENTED, NOT VERIFIED` | `owner_payments_received_screen.dart:18`. | Fetches `GET /payments/received`; displays earnings records. |
| **Owner Profile & Photo** | `IMPLEMENTED, NOT VERIFIED` | `edit_profile_screen.dart:203`. | Uploads avatar to Supabase via `POST /upload/profile-image`. |
| **Bank Details & Phone Verify** | `IMPLEMENTED, NOT VERIFIED` | `add_equipment_screen.dart:150`. | Validates 10-digit Indian mobile number before listing. |
| **Owner Fleet AI Advisor** | `FAILED` (Routing) | `owner_main_screen.dart:223` | **Defect**: "Ask AI" in Owner Talk tab opens Farmer Crop Advisor (`/advisor`). |

---

### 4.3 Admin Portal Feature Matrix

| Feature / Screen | Status | Evidence / Code Trace | Notes & Defect References |
|---|---|---|---|
| **Admin Login & Role Guard** | `CONFIRMED WORKING` | `router.dart:87-89`, `admin_test.dart`. | Non-admins blocked from `/admin`. |
| **Operations Overview & Stats** | `CONFIRMED WORKING` (Unit) | `admin_test.dart`, `admin_dashboard_screen.dart:18`. | Fetches `GET /admin/stats` (users, bookings, equipment, GMV). |
| **User & Role Management** | `IMPLEMENTED, NOT VERIFIED` | `admin_dashboard_screen.dart:27`. | Lists users with suspend/activate toggle. |
| **Equipment Listing Moderation** | `IMPLEMENTED, NOT VERIFIED`| `admin_dashboard_screen.dart:2227`. | Approve/reject equipment modal sheet. |
| **Booking Monitoring** | `NOT IMPLEMENTED` (UI) | `admin_dashboard_screen.dart:43`. | `adminBookingsProvider` is declared but never displayed in UI. |
| **Payments & Reports** | `FAILED` (Navigation / UI) | `admin_dashboard_screen.dart:228`. | Tab 3 is labeled "Reports", but displays System Health. No payments list. |
| **Feedback & Complaints** | `FAILED` (Navigation) | `admin_dashboard_screen.dart:223`. | Tab 2 is labeled "Talk" with a mic icon, but displays Complaints/Alerts. |
| **Crop Groups Monitoring** | `IMPLEMENTED, NOT VERIFIED` | `admin_dashboard_screen.dart:2258`. | **Defect**: Falls back to hardcoded list `['Rice', 'Sugarcane', ...]`. |
| **System Health & Telemetry** | `CONFIRMED WORKING` (Unit) | `admin_test.dart`, `admin_dashboard_screen.dart:68`. | Checks database, redis, and API latency. |
| **Audit Logs & Token Control** | `IMPLEMENTED, NOT VERIFIED` | `admin_dashboard_screen.dart:51`. | Displays audit trail from `GET /admin/audit-logs`. |

---

## 5. Broken Navigation & Duplicate Destination Findings

| Defect ID | Source Screen | Trigger Control | Expected Destination | Actual Destination / Failure | Severity | Phase 1 Status |
|---|---|---|---|---|---|---|
| **NAV-01** | `farmer_home_screen.dart:540` | Tapping Category Chip #4 ("Knowledge Base") | `/knowledge` or `/guides` | Throws `GoException: no routes for location: /knowledge-base` | **CRITICAL** | **RESOLVED (Phase 1)** |
| **NAV-02** | `farmer_hub_screen.dart:89` | Tapping Profile shortcut | `/edit-profile` or `/about-profile` | Throws `GoException: no routes for location: /profile` | **HIGH** | Open (Dead Screen) |
| **NAV-03** | `profile_screen.dart:440, 448` | Menu items "Fleet Management" & "Owner Bookings" | Valid Owner Routes | Pushes unrouted `/my-equipment` and `/owner-bookings` (Crash) | **HIGH** | Open (Dead Screen) |
| **NAV-04** | `owner_main_screen.dart:223` | "Ask AI" in "Fleet Advisor" banner | Owner Fleet/Pricing Assistant | Pushes `/advisor` -> Opens Farmer Crop Advisory wizard! | **CRITICAL** | **RESOLVED (Phase 1)** |
| **NAV-05** | `admin_dashboard_screen.dart:223` | Admin Tab 2 Navigation Bar Icon | Alerts & Complaints | Labeled "Talk" with mic icon; renders Complaints | **MEDIUM** | **RESOLVED (Phase 1)** |
| **NAV-06** | `admin_dashboard_screen.dart:228` | Admin Tab 3 Navigation Bar Icon | Financial Reports / Revenue | Labeled "Reports" with chart icon; renders System Health | **MEDIUM** | **RESOLVED (Phase 1)** |
| **NAV-07** | `community_screen.dart:86-90` | Leading AppBar Back Arrow on Tab 2 | Tab switch or hidden leading button | Calls `Navigator.pop()`, popping the entire FarmerMainScreen stack | **HIGH** | **RESOLVED (Phase 1)** |
| **NAV-08** | `farmer_more_screen.dart:827, 838, 901` | "Fields", "Acres", or "My Farm" tiles | Switch IndexedStack to Tab 1 | Pushes duplicate instance of `MyFarmScreen` onto navigator | **MEDIUM** | Open (Architectural) |
| **NAV-09** | `farmer_more_screen.dart:931` | "Equipment Bookings" tile | Switch IndexedStack to Tab 3 | Pushes duplicate instance of `MyRentalsScreen` onto navigator | **MEDIUM** | Open (Architectural) |
| **NAV-10** | `farmer_more_screen.dart:941` | "Crop Groups & Selling" tile | Switch IndexedStack to Tab 2 | Pushes duplicate instance of `CommunityScreen` onto navigator | **MEDIUM** | Open (Architectural) |
| **NAV-11** | `crop_advisor_screen.dart:550, 558` | "View" or "Book" on recommended equipment | Equipment Details or Booking Form | Pushes `/marketplace?id=...`; `router.dart` ignores query params! | **HIGH** | **RESOLVED (Phase 1)** |

---

## 6. Real Data Flow Audit

### 6.1 Database & API Connectivity
- **Supabase PostgreSQL & Prisma**: Active and healthy.
- **Seeded Data Condition**: `backend/prisma/seed.ts` intentionally deletes all equipment listings, bookings, and payments to start with a clean demo state.
  - *Finding*: The marketplace, booking list, and owner earnings start completely **empty** by design. This is not an API parsing bug, but a lack of seeded test listings.

### 6.2 Hardcoded Fallbacks & Mock Data
- **`all_expenses_screen.dart:49`**: Hardcoded `totalBudget = expData?.totalBudget ?? 50000.0`.
- **`admin_dashboard_screen.dart:2261`**: Hardcoded fallback crop varieties `['Rice', 'Sugarcane', 'Cotton', 'WHEAT', 'Tomato', 'Maize', 'Chilli', 'Turmeric']`.
- **`environment.dart:9-13`**: `switchDevHost()` contains dead code that assigns `'127.0.0.1'` in both branches.
- **`equipment_card.dart:378`**: Generic tractor icon `Icons.agriculture_rounded` fallback on all machinery.

### 6.3 Missing Mobile Implementations
- **Single-Field Lock**: `my_farm_screen.dart:100` and `farmer_farm_screen.dart:51` hardcode `farm = farms.first`. A farmer with multiple fields cannot switch fields in the mobile UI.
- **Farm Memory Absent**: Prisma `model FarmMemory` exists on backend, but Mobile has 0 lines of code or UI for field memories/notes.
- **Advance Crop Group Selling Absent**: `register_crop_sheet.dart` only records crop name/season; group declarations, quantity targets, and buyer offers are not implemented.
- **Offline Write Queue Absent**: `network_interceptor.dart:56` rejects non-GET requests when disconnected.

---

## 7. Authentication, Session & Security Audit

### 7.1 Security Verifications Passed
- **Least-Privilege API Responses**: Phone numbers, passwords, and emails are scrubbed from public community member lists (`GET /api/community/members`).
- **Owner Phone Masking**: Equipment listings do not return owner phone numbers (`equipment.ts:195`); calls are routed via masked dialer relay `POST /calls/initiate`.
- **Booking Access Control**: Backend checks that only the booking's farmer, owner, or admin can access `/bookings/:id`.
- **Role Isolation Guards**: Client-side route guards in `router.dart:87-95` prevent cross-role URL navigation.

### 7.2 Authentication Defects
- **SEC-01 (Logout Preference Wipe)**:
  - Location: `mobile/lib/features/auth/repository/auth_repository.dart:181-184`
  - Code:
    ```dart
    await SecureStorage.clearAll();
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    ```
  - *Impact*: Calling `_storage.deleteAll()` and `prefs.clear()` on logout wipes the user's selected language (`app_language`) and theme (`user_theme_mode`). Every logout reverts the app to default English and light/system theme.

---

## 8. Localization, Encoding & UI Quality Audit

### 8.1 Critical Mojibake / Encoding Corruption (DEFECT LOC-01)
- Location: `mobile/lib/core/localization/app_localizations.dart`
- Scope:
  - **Telugu (`'te'`)**: Lines 600 to 882 contain double-encoded UTF-8 mojibake (`à°†à°°à± à°¥à°¿à°•`, `à°¬à± à°•à°¿à°‚à°—à± `).
  - **Tamil (`'ta'`)**: Lines 1600 to 1700 contain double-encoded UTF-8 mojibake (`à®µà®¿à®µà®°à®•à¯ à®•à¯ à®±à®¿à®ªà¯ à®ªà¯ à®•à®³à¯ `).
  - **Kannada (`'kn'`)**: Lines 2110 to 2350 contain double-encoded UTF-8 mojibake (`à²’à²Ÿà³ à²Ÿà³  à²…à²‚à²¦à²¾à²œà³ `).
- *Impact*: In Telugu, Tamil, and Kannada, all booking details, cancel booking, payment status, AI smart plan dialogs, and equipment prompts render as illegible garbled text.

### 8.2 Missing Flutter Framework Localization (DEFECT LOC-02)
- Location: `mobile/lib/main.dart:30-37`
- *Impact*: `MaterialApp.router` is configured without `supportedLocales` or `localizationsDelegates`. Built-in framework widgets (`showDateRangePicker`, text selection context menus, form validation tooltips) cannot display Indian regional languages.

### 8.3 Dark Mode Contrast Defect (DEFECT UI-01)
- Location: `mobile/lib/features/weather/ui/weather_widget.dart:68, 132`
- Code: `color: Color(0xFF0F172A)`
- *Impact*: In dark mode, temperature and weather headers use a hardcoded dark navy color on top of a dark green background (`#1E3528`), rendering the text unreadable.

---

## 9. Automated Checks Execution Results

| Check Command | Working Directory | Exit Code | Execution Time | Actual Output / Result |
|---|---|---|---|---|
| `flutter --version` | `mobile/` | `0` | ~1.5s | `Flutter 3.47.5 • channel stable • Tools • Dart 3.13.4` |
| `dart --version` | `mobile/` | `0` | ~0.5s | `Dart SDK version: 3.13.4 (stable) on windows_x64` |
| `flutter analyze` | `mobile/` | `0` | 177.9s | `No issues found!` |
| `flutter test` | `mobile/` | `0` | 5.2s | `00:05 +30: All tests passed!` (9 test files passed) |
| `flutter build apk --debug`| `mobile/` | `0` | 179.4s | `√ Built build\app\outputs\flutter-apk\app-debug.apk`<br>*Warning*: `flutter_tts` & `package_info_plus` apply KGP. |

---

## 10. Physical Android Device Status

- **Command Executed**: `adb devices -l`
- **Output**:
  ```text
  List of devices attached
  ```
- **Device ID**: *None detected*
- **Connection State**: *Disconnected / Unavailable*
- **Status Label**: `PHYSICAL VERIFICATION: NOT TESTED`
- **Reason**: No physical Android smartphone is currently attached via USB or wireless debugging to the development workstation.
- **Physical Tests Queued for Phase 1**:
  1. Live microphone audio capture and permission handling in `VoiceInteractionModal`.
  2. Native telephone dialer launch via `CallRelayService` on a real carrier network.
  3. Real offline flight-mode toggling and cached response verification.
  4. Physical camera image capture in `AddEquipmentScreen` and `EditProfileScreen`.

---

## 11. Prioritized Defect Inventory

### Critical Priority (Must fix before user testing)
1. **[DEF-01 / NAV-01]** `mobile/lib/features/marketplace/ui/farmer_home_screen.dart:540`: Chip 4 pushes non-existent route `/knowledge-base` causing GoRouter crash.
2. **[DEF-02 / NAV-04]** `mobile/lib/features/profile/ui/owner_main_screen.dart:223`: "Ask AI" in Owner portal pushes `/advisor`, opening the Farmer crop wizard instead of an owner fleet assistant.
3. **[DEF-03 / LOC-01]** `mobile/lib/core/localization/app_localizations.dart:600-882, 1600-1700, 2110-2350`: Massive mojibake character corruption in Telugu, Tamil, and Kannada string dictionaries.

### High Priority (Major usability or architectural breaks)
4. **[DEF-04 / SEC-01]** `mobile/lib/features/auth/repository/auth_repository.dart:181-184`: Logout clears all local storage, wiping language and theme preferences.
5. **[DEF-05 / NAV-07]** `mobile/lib/features/community/ui/community_screen.dart:86-90`: AppBar has a hardcoded pop back button on a bottom tab, breaking tab navigation.
6. **[DEF-06 / NAV-11]** `mobile/lib/features/marketplace/ui/crop_advisor_screen.dart:550, 558`: Marketplace push includes equipment ID in query params, which `router.dart` discards.
7. **[DEF-07 / LOC-02]** `mobile/lib/main.dart:30-37`: `MaterialApp.router` lacks `supportedLocales` and delegates, leaving native dialogs in English.
8. **[DEF-08 / ARCH-01]** `mobile/lib/features/farm/ui/farm_copilot_screen.dart` vs `mobile/lib/features/ai_assistant/ui/ai_assistant_screen.dart`: Duplicate assistant screens violate product North Star.

### Medium Priority (Sub-optimal UX, visual glitches, or dead code)
9. **[DEF-09 / UI-01]** `mobile/lib/features/weather/ui/weather_widget.dart:68, 132`: Hardcoded navy font color creates illegible dark-on-dark contrast in dark mode.
10. **[DEF-10 / DATA-01]** `mobile/lib/features/farm/ui/my_farm_screen.dart:100` & `farmer_farm_screen.dart:51`: Hardcoded `farms.first` locks UI to single field.
11. **[DEF-11 / NAV-05,06]** `mobile/lib/features/admin/ui/admin_dashboard_screen.dart:221-228`: Admin bottom bar tab labels ("Talk", "Reports") do not match their rendered screens (Complaints, System Health).
12. **[DEF-12 / CODE-01]** `mobile/lib/core/config/environment.dart:9-13`: `switchDevHost()` is a no-op setting `127.0.0.1` in both branches.
13. **[DEF-13 / CODE-02]** Dead code cleanup: `farmer_dashboard_screen.dart`, `farmer_hub_screen.dart`, `owner_home_placeholder_screen.dart`, `profile_screen.dart`, and duplicate `payments/repository/payment_repository.dart`.

### Low Priority (Cosmetic / Enhancements)
14. **[DEF-14 / AESTH-01]** `mobile/lib/features/marketplace/ui/widgets/equipment_card.dart:378`: Missing category-specific fallback illustrations for rotavators, sprayers, harvesters, and pumps.
15. **[DEF-15 / AESTH-02]** `mobile/android/app/src/main/AndroidManifest.xml:8`: App name is configured as `"mobile"` instead of `"AgroRent AI"`.

---

## 12. Prioritized Repair Plan

```mermaid
graph TD
    A[Phase 1A: Navigation & Routing Repairs] --> B[Phase 1B: Clean Mojibake & Localization]
    B --> C[Phase 1C: Session & Preference Preservation]
    C --> D[Phase 1D: Theme Contrast & Visual Fixes]
    D --> E[Phase 1E: Dead Code Consolidation]
```

1. **Step 1: Fix Broken Navigation & Route Guards**:
   - Add `/knowledge-base` alias or redirect to `/knowledge` in `router.dart`.
   - Fix `owner_main_screen.dart:223` so "Ask AI" routes to an owner-appropriate modal or contextual fleet helper.
   - Remove destructive leading back button from `community_screen.dart`.
   - Update `router.dart` for `/marketplace` to handle `id` and `bookId` query parameters.
   - Correct Admin Tab 2 and Tab 3 bottom bar destination labels and icons.
2. **Step 2: Clean Mojibake in `app_localizations.dart`**:
   - Repair double-encoded Telugu, Tamil, and Kannada string dictionaries to restore native Unicode characters.
   - Add `supportedLocales` and `localizationsDelegates` to `main.dart`.
3. **Step 3: Fix Logout Preference Wipe**:
   - Modify `auth_repository.dart:logout()` to preserve `app_language` and `user_theme_mode` across user sign-outs.
4. **Step 4: Resolve Dark Theme Contrast**:
   - Fix `weather_widget.dart` text colors to dynamically adapt to dark mode.
5. **Step 5: Consolidate AI Copilot Experience**:
   - Align `farm_copilot_screen.dart` and `ai_assistant_screen.dart` into a single unified assistant.

---

## 13. Recommended Next Phase & Acceptance Criteria

### Phase 1 Execution & Repair Status: **COMPLETED**
*Detailed Report: See [`MOBILE_PHASE_1_REPAIR_REPORT.md`](file:///D:/AgriRent_AI/mobile/docs/MOBILE_PHASE_1_REPAIR_REPORT.md)*

**Scope Completed**:
- Fixed confirmed critical navigation errors (`NAV-01`, `NAV-04`, `NAV-07`, `NAV-11`, `NAV-05`, `NAV-06`).
- Restored 100% clean, uncorrupted Unicode Indic text across Telugu, Tamil, and Kannada (`LOC-01`, `LOC-02`).
- Preserved user language and theme preferences during logout (`SEC-01`).
- Fixed weather card dark-mode contrast (`UI-01`).
- Fixed development host failover logic (`CODE-01`).

**Phase 1 Acceptance Criteria Results**:
1. Zero GoRouter navigation exceptions across all three role portals: **PASSED (AUTOMATED VERIFIED)**
2. All 5 supported languages display 100% clean Unicode characters without mojibake: **PASSED (AUTOMATED VERIFIED)**
3. Logging out does not reset language or theme preferences: **PASSED (AUTOMATED VERIFIED)**
4. Weather card text is readable in both light and dark themes: **PASSED (AUTOMATED VERIFIED)**
5. `flutter analyze` (0 issues) and `flutter test` (40/40 tests passing): **PASSED (AUTOMATED VERIFIED)**
6. `flutter build apk --debug` succeeded (`build\app\outputs\flutter-apk\app-debug.apk`): **PASSED (AUTOMATED VERIFIED)**
7. Physical Device Connectivity: `adb devices -l` returned 0 attached devices -> **PHYSICAL VERIFICATION: NOT TESTED — DEVICE DISCONNECTED**

---

## 14. What Cannot Be Verified Without External Dependencies

| Feature | Missing Dependency | Required Verification |
|---|---|---|
| **Voice Microphone Capture** | Physical Android Phone | Live audio permission prompt and hardware microphone recording. |
| **Masked Phone Relay Dialing**| Physical Android Phone + SIM | Launching native Android dialer intent with masked relay phone number. |
| **Marketplace Listings UI** | Seeded Database Equipment | Creating test equipment items under a verified owner to inspect listings. |
| **Booking Payment Receipts** | Live Booking Transaction | Flow verification from booking request to confirmed payment PDF receipt. |

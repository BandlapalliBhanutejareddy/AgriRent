# AGRORENT AI — PHASES 1–18 PHYSICAL DEVICE VERIFICATION PLAN

- **Document ID:** `PHASES-1-18-DEVICE-VERIFICATION-PLAN`
- **Target Platform:** Physical Android Device (`CPH2793`, Android 16, API 36, 1272x2772, 560 dpi)
- **Target Repository:** `D:\AgriRent_AI` (`mobile` + `backend`)
- **Status:** Active Execution Plan
- **Scope:** Complete functional, visual, security, and localization verification across Phases 1–18

---

## 1. Hardware & Environment Specifications

| Component | Specification | Verification Status |
|---|---|---|
| **Device Model** | CPH2793 (Physical Android Smartphone) | Detected via `flutter devices` & `adb devices` |
| **Android OS** | Android 16 (API 36, Release 16) | Confirmed via `getprop ro.build.version.release` |
| **Display Geometry** | 1272 × 2772 px, 560 dpi density | Confirmed via `wm size` & `wm density` |
| **Flutter SDK** | 3.47.5 (Channel stable) on Windows 11 | Confirmed via `flutter doctor` |
| **Dart SDK** | 3.7.0+ | Confirmed via Flutter toolchain |
| **ADB Connection** | USB Debugging Authorized (Device ID: `3C165D004M800000`) | Confirmed via `adb devices` |
| **Port Reverse** | `adb reverse tcp:4000 tcp:4000` | Configured & Active |
| **Local Backend** | Express + TypeScript on port 4000 | Configured with Supabase + Prisma |
| **Local AI Service** | Ollama running `qwen:0.5b` on port 11434 | Confirmed Active |

---

## 2. Feature-by-Feature Verification Checklist (Phases 1–18)

### Phase 1: Core Navigation, Routing, Localization, Theme Contrast, Dev Host Failover
- [ ] **P1-01 (Knowledge Base Nav):** Quick action chip #4 opens Knowledge Base screen (`/knowledge`) without crash; back returns to Home.
- [ ] **P1-02 (Owner Advisor Isolation):** Equipment Owner attempting `/crop-advisor` is redirected to `/owner`.
- [ ] **P1-03 (Community Back Nav):** Tapping back in Community tab switches to Tab 0 (Home) without closing app; pushed route pops cleanly.
- [ ] **P1-04 (Marketplace Param Nav):** Navigating with equipment query (`/marketplace?id=...` or `/equipment/:id`) loads target equipment directly.
- [ ] **P1-05 (Admin Tabs):** Admin bottom navigation displays correct labels (Dashboard, Users, Alerts, Health).
- [ ] **P1-06 (5-Language Switching):** Switching between `en`, `te`, `hi`, `ta`, `kn` renders authentic native Unicode without mojibake.
- [ ] **P1-07 (Framework Delegates):** Material/Cupertino dialogs and date pickers respect selected locale.
- [ ] **P1-08 (Preference Persistence):** Language and Dark/Light theme persist across app restart and logout.
- [ ] **P1-09 (Theme Contrast):** Weather card and surface cards maintain high contrast in both Light and Dark modes.
- [ ] **P1-10 (Host Port Bridge):** `127.0.0.1:4000` bridges seamlessly over USB via `adb reverse tcp:4000 tcp:4000`.

### Phase 2: Multi-Field Support, 5-Tab Navigation, Strict Role Guards, AI Copilot
- [ ] **P2-01 (Field Switcher Sheet):** Tapping "Switch Field" on `MyFarmScreen` opens modal; selecting field updates metrics.
- [ ] **P2-02 (Zero-Farm Fallback):** Account with 0 fields displays clean empty state ("Set Up Farm") without null crashes.
- [ ] **P2-03 (Farm Plan Switcher):** Field switcher in `FarmerFarmScreen` AppBar updates schedule and budget.
- [ ] **P2-04 (Field Persistence):** Selected field persists across app restart in `SharedPreferences`.
- [ ] **P2-05 (Logout Data Isolation):** Logging out purges in-memory farm state; logging in as another farmer loads fresh fields.
- [ ] **P2-06 (Farmer 5 Tabs):** `FarmerMainScreen` provides exactly 5 tabs (Home, Farm, Marketplace, Bookings, More).
- [ ] **P2-07 (Owner 4 Tabs):** `OwnerMainScreen` provides exactly 4 tabs (Home, Equipment, Bookings, More) without dead tabs.
- [ ] **P2-08 (PopScope Handling):** Pressing Android hardware back on secondary tabs returns to Tab 0 instead of quitting.
- [ ] **P2-09 (Route Role Guards):** Farmer blocked from `/owner`, Owner blocked from `/farmer`.
- [ ] **P2-10 (AI Copilot Navigation):** Tapping AI Copilot launches `/farm-copilot?farmId=...&cropId=...` seeded with active field context.

### Phase 3: Farmer Dashboard & Farm Context Synchronization
- [ ] **P3-01 (Dashboard Layout):** Top-to-bottom layout matches design hierarchy (Weather, Status, Crop, Stages, Ops, Analytics).
- [ ] **P3-02 (Farm Sync):** Active farm context matches between Farmer Home and My Farm screen.
- [ ] **P3-03 (Stale Response Guard):** Rapid field switching discards in-flight responses for previous farm IDs.
- [ ] **P3-04 (Task Progress):** Completed task ratio updates progress bar without advancing crop lifecycle stage.
- [ ] **P3-05 (Empty/Error States):** Clean empty card when no farms exist; informative retry banner on network error.
- [ ] **P3-06 (Financial Metrics):** Total spending displays with ₹ symbol; uncompleted payments separated from completed payments.
- [ ] **P3-07 (Crop Advisor Launch):** Smart Crop Advisor navigates cleanly with crop context.

### Phase 4: Farm Setup & Crop Lifecycle Management
- [ ] **P4-01 (Setup Form Layout):** Form sections (Farm Profile, Crop Context, Budget) display cleanly with asterisks for required fields.
- [ ] **P4-02 (Input Validation):** Missing name/location or negative/zero area triggers inline validation without network submission.
- [ ] **P4-03 (Budget Validation):** Rejects negative numbers; accepts positive numbers or empty optional field.
- [ ] **P4-04 (Farm Creation):** Submits `POST /api/farms`; on success, refreshes farm list and selects new farm.
- [ ] **P4-05 (Value Preservation):** Network failure keeps user-entered text in text controllers without data loss.
- [ ] **P4-06 (Double-Tap Mutex):** Rapid double-tap on submit button disables button and fires exactly 1 POST request.
- [ ] **P4-07 (Canonical Stages):** Dropdown displays canonical stages (SOWING, GERMINATION, SEEDLING, VEGETATIVE, FLOWERING, FRUITING, MATURITY, HARVEST).
- [ ] **P4-08 (Form Keyboard Avoidance):** Form scrolls smoothly when Android virtual keyboard appears; no yellow/black `RenderFlex` stripes.

### Phase 5: Farm Operations, Tasks & Activity Logging
- [ ] **P5-01 (Operations Schedule):** Operations grouped by stage and status (TODO, IN_PROGRESS, COMPLETED).
- [ ] **P5-02 (Task Completion):** Toggling task checkbox updates task status and logs activity.
- [ ] **P5-03 (Operation Detail):** Tapping operation navigates to `/operation-detail` showing instructions, inputs, and notes.

### Phase 6: Booking Creation Flow (Farmer to Equipment)
- [ ] **P6-01 (Date Selection):** Date range picker enforces start date <= end date and future dates.
- [ ] **P6-02 (Cost Calculation):** Total estimate computes as `days × rate + deposit`.
- [ ] **P6-03 (Booking Submit):** `BookingFormScreen` submits `POST /api/bookings` with equipment ID, dates, and calculated totals.
- [ ] **P6-04 (Submit Mutex):** Rapid double-tap on "Confirm Booking" is guarded against duplicate submission.
- [ ] **P6-05 (Unavailable Guard):** Equipment marked `available: false` disables booking and shows unavailable notice.

### Phase 7: Booking Timeline & Farmer Rentals List
- [ ] **P7-01 (My Rentals List):** Tab 3 (`MyRentalsScreen`) loads farmer's active and past bookings.
- [ ] **P7-02 (Status Filter Chips):** Filters bookings by All, Pending, Confirmed, Active, Completed, Cancelled.
- [ ] **P7-03 (Booking Receipt):** Tapping booking opens `ReceiptScreen` with reference ID, dates, breakdown, and PDF export preview.
- [ ] **P7-04 (Cancellation):** Farmer can cancel PENDING booking; confirmed cancel transitions to CANCELLED.

### Phase 8: Marketplace Browsing, Filtering & Search
- [ ] **P8-01 (Marketplace Feed):** Tab 2 (`FarmerMarketplaceScreen`) renders equipment cards with images, rates, ratings, and locations.
- [ ] **P8-02 (Category Filter):** Category chips (Tractors, Harvesters, Sprayers, etc.) filter listings dynamically.
- [ ] **P8-03 (Search Debouncing):** Search bar debounces input (350ms) before triggering query.
- [ ] **P8-04 (Sort Selector):** Bottom sheet allows sorting by Newest, Price Low-High, Price High-Low.
- [ ] **P8-05 (Infinite Scroll):** Scrolling to bottom loads next page of listings via `fetchMore()`.
- [ ] **P8-06 (Card Navigation):** Tapping card pushes `EquipmentDetailsScreen` with full details.

### Phase 9: Return Request & Inspection Lifecycle
- [ ] **P9-01 (Return Initiation):** Farmer can initiate return on active rental (`RETURN_PENDING`).
- [ ] **P9-02 (Lifecycle Timeline):** Chronological steps show request, dispatch, active rental, return, inspection, and completion.

### Phase 10: Financial Intelligence & Expense Analytics
- [ ] **P10-01 (Expenses Screen):** `/all-expenses` displays categorized spending breakdown.
- [ ] **P10-02 (Indian Currency):** Numbers formatted in Indian numbering system (`₹1,50,000`).
- [ ] **P10-03 (Budget Progress):** Visual indicator compares actual spend to planned farm budget.

### Phase 11: In-App Notifications & Private Call Relay
- [ ] **P11-01 (Notification Center):** Tapping bell opens `/notifications` listing alerts and updates.
- [ ] **P11-02 (Mark as Read):** Tapping notification marks it as read and decrements unread badge.
- [ ] **P11-03 (Private Call Relay):** Tapping Call opens native Android phone dialer (`tel:...`) without exposing private server keys.

### Phase 12: Voice & AI Copilot Integration
- [ ] **P12-01 (AI Assistant Screen):** `/ai-assistant` accepts agronomic queries.
- [ ] **P12-02 (Ollama Integration):** Submits to backend AI route backed by local Ollama (`qwen:0.5b`).
- [ ] **P12-03 (Offline/Unavailable Fallback):** Displays informative error when AI service is unavailable without crashing app.

### Phase 13: Farmer Community & Crop Demand Intelligence
- [ ] **P13-01 (Community Tabs):** `/community` displays Discussion, Members, and Trending Crops tabs.
- [ ] **P13-02 (Discussion Polling):** Message feed polls updates every 4 seconds without resetting user scroll.
- [ ] **P13-03 (Send Message Mutex):** Double-tap on send button is suppressed; text preserved in controller on failure.
- [ ] **P13-04 (Member Directory):** Lists real community members and registered crops.
- [ ] **P13-05 (Public Profile):** Member profile displays crops and farm summary while strictly excluding phone, email, and coordinates.
- [ ] **P13-06 (Crop Trends):** `/crop-trends` shows platform cultivation counts and explicit "UNAVAILABLE" external price disclaimers.

### Phase 14: Equipment Owner Portal & Fleet Operations
- [ ] **P14-01 (Owner Home):** Tab 0 displays Fleet Summary (Total, Active, Inactive), Financial Summary, and Recent Requests.
- [ ] **P14-02 (Accept/Reject Mutex):** Quick-action buttons on PENDING requests lock mutex during in-flight status update.
- [ ] **P14-03 (Pull-to-Refresh):** Pull-to-refresh on Owner Home reloads authoritative fleet and requests from backend.

### Phase 15: Owner Equipment Management
- [ ] **P15-01 (Equipment Tab):** Tab 1 lists owner's fleet with image, category, rate, and availability switch.
- [ ] **P15-02 (Availability Toggle):** Toggling switch updates `available` state with mutex and server sync.
- [ ] **P15-03 (Add Equipment):** `/add-equipment` validates required fields, daily rate > 0, and uploads listing.
- [ ] **P15-04 (Edit Equipment):** `/edit-equipment` pre-fills existing values and updates listing.
- [ ] **P15-05 (Delete Equipment):** Deletion requires confirmation dialog and cascade-purges listing.

### Phase 16: Owner Bookings & Return Inspection Lifecycle
- [ ] **P16-01 (Bookings Tab):** Tab 2 lists owner bookings with filter chips (All, Pending, Confirmed, Active, Returns, Completed).
- [ ] **P16-02 (Booking Detail):** `/owner-booking-detail` displays renter card, schedule, financial breakdown, and actions.
- [ ] **P16-03 (Equipment Dispatch):** Owner can dispatch confirmed booking (`DISPATCHED`).
- [ ] **P16-04 (Return Inspection Sheet):** Modal sheet allows selecting condition (EXCELLENT, GOOD, FAIR, DAMAGED) and deduction amount.
- [ ] **P16-05 (Deduction Validation):** Rejects negative deduction or deduction exceeding security deposit.
- [ ] **P16-06 (Inspection Record):** Completed booking renders inspection card with condition, deductions, and notes.

### Phase 17: Owner Analytics & Performance Dashboard
- [ ] **P17-01 (Dashboard Entry):** Accessible via quick action and headers navigating to `/owner-analytics`.
- [ ] **P17-02 (Period Selector):** Switching periods (`7d`, `30d`, `90d`, `this_month`, `all`) updates metrics.
- [ ] **P17-03 (Financial Accuracy):** Renders Verified Payments Collected (not settled bank deposits), Gross Value, and Uncollected Balance.
- [ ] **P17-04 (Fleet Utilization):** Operational utilization percentage computed strictly from overlapping booking intervals.
- [ ] **P17-05 (Trends Chart):** Interactive bar chart displays chronological bookings and revenue.
- [ ] **P17-06 (Equipment Ranking):** Equipment ranking sorts by revenue, bookings, utilization, or rating.

### Phase 18: Saved Equipment & Favorites
- [ ] **P18-01 (Heart Button on Cards):** Tapping heart on `EquipmentCard` toggles save state with optimistic UI and snackbar.
- [ ] **P18-02 (Details Screen Sync):** Heart icon in `EquipmentDetailsScreen` reflects active state and toggles consistently.
- [ ] **P18-03 (Auth Guard):** Unauthenticated user tapping heart receives `please_login_to_save` prompt without API call.
- [ ] **P18-04 (Saved Screen):** `/saved` and `/saved-equipment` list current user's saved items.
- [ ] **P18-05 (Unsave from List):** Unsaving from list immediately updates list and synchronizes backend.
- [ ] **P18-06 (Empty/Error States):** Shows custom empty icon, localized subtitle, and "Explore Marketplace" action.
- [ ] **P18-07 (Availability Integrity):** Unavailable equipment preserves `available: false` without faking booking status.
- [ ] **P18-08 (Navigation Shortcuts):** Favorite button in Marketplace AppBar and Saved Equipment tile in More screen lead directly to `/saved`.

---

## 3. UI & Visual Quality Inspection Matrix

- **Layout & Geometry:** Zero `RenderFlex` overflows on 1272x2772 (560 dpi) display; horizontal/vertical margins consistent (16/20dp).
- **Typography:** Text readable, no clipped action labels, proper scaling with system font sizes.
- **5 Languages:** English, Telugu, Hindi, Tamil, Kannada render native script with zero mojibake or raw fallback keys.
- **Dark & Light Modes:** Both themes maintain accessible WCAG AA contrast ratios; no hardcoded dark-on-dark or white-on-white text.
- **Keyboard Handling:** Virtual keyboard smoothly pans scrollable forms (`FarmSetupScreen`, `BookingFormScreen`, `AddEquipmentScreen`) without obscuring active fields.

---

## 4. Test Accounts & Security Boundaries

| Role | Email | Password | Primary Routes |
|---|---|---|---|
| **Farmer** | `farmer@agrorent.ai` | Seeded / Auth Token | `/farmer`, `/farm`, `/marketplace`, `/my-rentals`, `/saved` |
| **Owner** | `owner@agrorent.ai` | Seeded / Auth Token | `/owner`, `/add-equipment`, `/owner-analytics`, `/owner-booking-detail` |
| **Admin** | `admin@agrorent.ai` | Seeded / Auth Token | `/admin` |

- **Security Rule:** Farmer accounts attempting `/owner` or `/owner-analytics` are strictly redirected to `/farmer`.
- **Security Rule:** Owner accounts attempting `/crop-advisor` or `/farmer` are strictly redirected to `/owner`.
- **Tenant Isolation:** Cross-owner IDs or cross-farmer IDs return HTTP 403.
- **Credential Protection:** Passwords, OTPs, Supabase service keys, and JWT secrets are strictly masked and never printed to logs or screenshots.

---

## 5. Execution Protocol

1. **Step 1 (Port Reverse):** `adb reverse tcp:4000 tcp:4000` to bridge local backend to physical phone.
2. **Step 2 (Backend Run):** Start Express backend in development mode.
3. **Step 3 (Flutter Build & Install):** Build debug APK and install onto `3C165D004M800000`.
4. **Step 4 (Launch & Logcat):** Launch application via `adb shell am start` or `flutter run -d 3C165D004M800000`.
5. **Step 5 (Screen Inspection & Screenshot Audit):** Capture screenshots via `adb exec-out screencap -p` and inspect each screen.
6. **Step 6 (Defect Remediation):** If visual defects or functional bugs are identified, fix minimally and re-verify.
7. **Step 7 (Final Report):** Compile `backend/docs/PHASES_1_18_DEVICE_VERIFICATION_REPORT.md`.

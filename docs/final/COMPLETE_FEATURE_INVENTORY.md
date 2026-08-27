# Complete Feature Inventory - AgroRent AI

## 1. Authentication & Users
| Feature | Web Screen | Flutter Screen | Backend Endpoint | Role | Status |
| --- | --- | --- | --- | --- | --- |
| Farmer Registration | /register | RegistrationScreen | POST /api/auth/register | FARMER | PASS |
| Owner Registration | /register | RegistrationScreen | POST /api/auth/register | OWNER | PASS |
| Login | /login | LoginScreen | POST /api/auth/login | ALL | PASS |
| Session Refresh | N/A | N/A | POST /api/auth/refresh | ALL | PASS |
| Logout | Navigation Bar | Profile/Settings | POST /api/auth/logout | ALL | PASS |

## 2. Equipment Marketplace
| Feature | Web Screen | Flutter Screen | Backend Endpoint | Role | Status |
| --- | --- | --- | --- | --- | --- |
| Create Equipment | /owner/equipment/new | AddEquipmentScreen | POST /api/equipment | OWNER | PASS |
| Edit Equipment | /owner/equipment/[id] | EditEquipmentScreen | PUT /api/equipment/:id | OWNER | PASS |
| Delete Equipment | /owner/equipment | MyEquipmentScreen | DELETE /api/equipment/:id | OWNER | PASS |
| Marketplace Search | /marketplace | MarketplaceScreen | GET /api/equipment | FARMER | PASS |
| Filter/Sort | /marketplace | MarketplaceScreen | GET /api/equipment | FARMER | PASS |
| Equipment Details | /equipment/[id] | EquipmentDetailScreen | GET /api/equipment/:id | FARMER | PASS |
| Save/Bookmark | /saved | SavedItemsScreen | POST /api/saved | FARMER | PASS |

## 3. Bookings
| Feature | Web Screen | Flutter Screen | Backend Endpoint | Role | Status |
| --- | --- | --- | --- | --- | --- |
| Create Booking | /equipment/[id]/book | BookingScreen | POST /api/bookings | FARMER | PASS |
| View Own Bookings | /dashboard | MyBookingsScreen | GET /api/bookings | FARMER | PASS |
| Owner Inbox | /owner/requests | RequestsScreen | GET /api/bookings/owner | OWNER | PASS |
| Accept/Reject | /owner/requests | RequestsScreen | PUT /api/bookings/:id/status | OWNER | PASS |
| Conflict Prevention | /equipment/[id]/book | BookingScreen | POST /api/bookings (validation) | FARMER | PASS |

## 4. Payments (Razorpay)
| Feature | Web Screen | Flutter Screen | Backend Endpoint | Role | Status |
| --- | --- | --- | --- | --- | --- |
| Create Order | /checkout | PaymentCheckout | POST /api/payments/create-order | FARMER | PASS |
| Verify Payment | /checkout/verify | PaymentVerification | POST /api/payments/verify | FARMER | PASS |
| Payment Webhook | N/A | N/A | POST /api/payments/webhook | SYSTEM | PASS |
| Invoice Download | /bookings/[id] | BookingDetailScreen | GET /api/payments/:id/invoice | ALL | PASS |

## 5. Gemini AI Advisor
| Feature | Web Screen | Flutter Screen | Backend Endpoint | Role | Status |
| --- | --- | --- | --- | --- | --- |
| Generative AI Chat | /ai-advisor | AIChatScreen | POST /api/ai/advisor | ALL | PASS |
| Localization (5 langs) | /ai-advisor | AIChatScreen | POST /api/ai/advisor | ALL | PASS |

## 6. Real-time Infrastructure
| Feature | Web Screen | Flutter Screen | Backend Endpoint | Role | Status |
| --- | --- | --- | --- | --- | --- |
| Socket.IO Sync | Global Header | App Scoped | WSS / | ALL | PASS |
| Push Notifications | Global Header | NotificationsScreen | POST /api/notifications | ALL | PASS |

## 7. Analytics & Admin
| Feature | Web Screen | Flutter Screen | Backend Endpoint | Role | Status |
| --- | --- | --- | --- | --- | --- |
| Owner Analytics | /owner/dashboard | OwnerDashboard | GET /api/analytics/owner | OWNER | PASS |
| System Stats | /admin/dashboard | N/A | GET /api/analytics/admin | ADMIN | PASS |
| Audit Logs | /admin/audit | N/A | GET /api/analytics/audit | ADMIN | PASS |

# WEB COMPLETE FEATURE INVENTORY

This document provides a complete discovery and inventory of all Web features available in the AgroRent AI application.

| ID | Module | Feature | Role | Path/Route | Status |
|---|---|---|---|---|---|
| F-001 | Authentication | Register | Farmer/Owner | `/register` | Discovered |
| F-002 | Authentication | Login | All Roles | `/login` | Discovered |
| F-003 | Authentication | Logout | All Roles | `Header Menu` | Discovered |
| F-004 | Authentication | Session Check/JWT | System | API + Middleware | Discovered |
| F-005 | Farmer | Dashboard | Farmer | `/dashboard` | Discovered |
| F-006 | Farmer | Profile View/Edit | Farmer | `/profile` | Discovered |
| F-007 | Marketplace | Search Equipment | Farmer | `/marketplace` | Discovered |
| F-008 | Marketplace | Filter/Sort | Farmer | `/marketplace` | Discovered |
| F-009 | Marketplace | View Details | Farmer | `/equipment/[id]` | Discovered |
| F-010 | Booking | Create Booking | Farmer | `/equipment/[id]/book` | Discovered |
| F-011 | Booking | Availability / Conflicts | System | API Validation | Discovered |
| F-012 | Booking | Payment (Razorpay) | Farmer | `/checkout` | Discovered |
| F-013 | Payment | Webhook Verification | System | API (Backend) | Discovered |
| F-014 | Owner | Dashboard | Owner | `/owner/dashboard` | Discovered |
| F-015 | Owner | Add Equipment | Owner | `/owner/equipment/new` | Discovered |
| F-016 | Owner | Edit Equipment | Owner | `/owner/equipment/[id]/edit` | Discovered |
| F-017 | Owner | Delete Equipment | Owner | `/owner/equipment` | Discovered |
| F-018 | Owner | Booking Requests | Owner | `/owner/requests` | Discovered |
| F-019 | Owner | Accept/Reject Booking | Owner | `/owner/requests` | Discovered |
| F-020 | Admin | Dashboard | Admin | `/admin/dashboard` | Discovered |
| F-021 | Admin | User Management | Admin | `/admin/users` | Discovered |
| F-022 | Admin | Suspend/Reactivate | Admin | `/admin/users` | Discovered |
| F-023 | Admin | System Analytics | Admin | `/admin/analytics` | Discovered |
| F-024 | Admin | Audit Logs | Admin | `/admin/audit` | Discovered |
| F-025 | AI Advisor | Gemini Chat (Multi-lang) | All Roles | `/ai-advisor` | Discovered |
| F-026 | Realtime | Socket.IO Notifications | System | Global WSS | Discovered |
| F-027 | UI/UX | Localization (5 languages) | System | `Header Menu` | Discovered |
| F-028 | UI/UX | Responsive Layout | System | Global CSS | Discovered |
| F-029 | Security | Role Based Access Control| System | Next.js Middleware | Discovered |

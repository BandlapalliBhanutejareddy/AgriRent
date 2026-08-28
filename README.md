# AgroRent AI Platform

A comprehensive agricultural equipment rental platform with AI-powered features, built with modern web and mobile technologies. This repository contains the full production-ready release of AgroRent AI (v1.0.0).

## 🚀 Live Applications

### 🌐 Web Application
[Open AgroRent AI Web App](https://agri-rent-two.vercel.app)

### 📱 Mobile Application
Android APK — build locally using `flutter build apk --release`

### 🔗 Backend API
[AgroRent AI API](https://agrirent-5qpx.onrender.com)
- Health Endpoint: [https://agrirent-5qpx.onrender.com/api/health](https://agrirent-5qpx.onrender.com/api/health)
- Ready Endpoint: [https://agrirent-5qpx.onrender.com/api/ready](https://agrirent-5qpx.onrender.com/api/ready)

### 📂 GitHub Repository
[https://github.com/BandlapalliBhanutejareddy/AgriRent](https://github.com/BandlapalliBhanutejareddy/AgriRent)

## 🧪 Demo / Test Accounts

> **WARNING:** These credentials are for demonstration/testing only. Never use production credentials in this repository.

| Role | Email | Password |
|------|-------|----------|
| Farmer | `farmer_test@example.com` | `Password123!` |
| Owner | `owner_test@example.com` | `Password123!` |
| BOTH | `both_202608281720@test.com` | `Password123!` |

## 📋 Features

- **Multi-Role Authentication System**: Secure JWT-based auth separating Farmer and Owner portals, with a unique `BOTH` role capability that allows seamless role-switching.
- **Secure Password Recovery**: Robust OTP-to-Hash password recovery utilizing cryptographically secure single-use database tokens, rate limiting, and zero account enumeration.
- **AI Service**: Intelligent equipment recommendations and farming insights via Gemini AI.
- **Booking & Payments**: End-to-end sandbox-verified payment orchestration with Razorpay.
- **Cross-Platform Experience**: fully synchronized UI/UX state between the Vercel-hosted Next.js web application and the Flutter mobile client.

## 🛠️ Technology Stack

- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Web**: Next.js 16, React, Tailwind CSS, Zustand
- **Mobile**: Flutter, Riverpod, GoRouter
- **Security**: bcrypt, JWT, Rate Limiting, Helmet, XSS Protection

## 🚀 Development Setup

1. Clone the repository
2. Install dependencies for each service:
   - Backend: `cd backend && npm install`
   - Mobile: `cd mobile && flutter pub get`
   - Web: `cd web && npm install`
3. Configure environment variables (`.env`) for Backend and Web.
4. Start development servers:
   - Backend: `npm run dev`
   - Web: `npm run dev`

## 📁 Project Structure

```
AgriRent_AI/
├── ai_service/          # AI recommendation service
├── backend/             # Node.js API with Prisma
├── mobile/              # Flutter app
├── web/                 # Next.js web application
└── README.md            # Project Documentation
```

## 🔒 Security Best Practices Implemented

- All sensitive credentials are removed from the repository.
- Password recovery tokens are hashed securely before storing.
- JWT and session caching correctly isolates the Farmer, Owner, and BOTH dashboards.
- Hardened server configuration with Helmet, CORS, and Rate limiting.

## 🌐 Repository

**GitHub**: https://github.com/BandlapalliBhanutejareddy/AgriRent.git

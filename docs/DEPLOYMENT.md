# v0.95 Deployment Checklist

This document outlines the strict protocol for safely migrating the AgroRent AI platform to a live production environment.

## Phase 1: Database Initialization (Supabase)
1. **Create Production Project**: Create a new project in Supabase.
2. **Retrieve Credentials**: Note the `DATABASE_URL` and `DIRECT_URL`.
3. **Migrate Schema**: Run `npx prisma db push` targeting the production database.
4. **Bucket Configuration**: Ensure the `equipment-images` bucket is set to PUBLIC in Supabase Storage.
5. **Backups**: Navigate to Database settings and enable Point-in-Time Recovery (PITR).

## Phase 2: External Services
1. **Resend (Email)**: Verify your domain. Retrieve the Production API Key.
2. **Razorpay (Payments)**: Toggle to Live Mode (or ensure Test Mode keys are correctly placed for a soft launch).
3. **Google Gemini**: Secure a production API key for the `gemini-2.5-flash` model.

## Phase 3: Backend Deployment (Render / Railway)
1. **Repository Link**: Connect your GitHub repository to the hosting provider.
2. **Environment Variables**: Provide all keys securely:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `JWT_SECRET` (Must be cryptographically strong, min 64 chars)
   - `RESEND_API_KEY`
   - `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`
   - `GEMINI_API_KEY`
   - `RAZORPAY_WEBHOOK_SECRET`
3. **Build Command**: `npm run build`
4. **Start Command**: `npm run start`
5. **Verification**: Access the `/api/health` and `/api/ready` endpoints to assert successful boot.

## Phase 4: Frontend Deployment (Vercel)
1. **Repository Link**: Connect to Vercel.
2. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` (Point to the production backend URL)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Verification**: 
   - Test login flow.
   - Test equipment creation (validates Multer and Supabase Storage).
   - Test AI Advisor (validates Google Gen AI).

## Phase 5: Webhook Linking
1. Copy the production backend URL.
2. Open Razorpay Dashboard > Webhooks.
3. Set the webhook URL to `https://<YOUR_BACKEND_URL>/api/payments/webhook`.
4. Subscribe to `payment.captured`, `payment.failed`, and `refund.processed`.
5. Enter the production `RAZORPAY_WEBHOOK_SECRET`.

## Pre-Launch Checks
- [ ] Run `npm run verify` locally pointing to production DB.
- [ ] Monitor the `/api/ready` endpoint.
- [ ] Review Helmet headers via Browser inspector.

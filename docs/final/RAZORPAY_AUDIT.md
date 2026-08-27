# Razorpay Payment Architecture Audit

## 1. Flow Overview
The AgroRent AI platform implements the official Razorpay Orders API flow:

**Booking Creation**
- Farmer creates a Booking request in the database (`PENDING` state).
- The total price is calculated natively.

**Payment Order Generation**
- Farmer confirms payment. `POST /api/payments/create-order` is called.
- The backend communicates with Razorpay Server to create an `order_id` in INR (rupees converted to paise).
- A `PaymentTransaction` record is created in PostgreSQL mapped to the `order_id` in `ORDER_CREATED` status.

**Client Checkout**
- The frontend (Next.js/Flutter) initializes the Razorpay Checkout widget using the `order_id`.
- The user completes the payment via test cards/UPI on Razorpay's UI.
- Razorpay Checkout returns `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`.

**Payment Verification**
- The client sends these details to `POST /api/payments/verify`.
- The backend recalculates the HMAC SHA256 signature using `RAZORPAY_KEY_SECRET`.
- If valid, the `PaymentTransaction` transitions to `PAYMENT_CAPTURED` and the `Booking` transitions to `PAID` / `CONFIRMED`.

**Webhook Fallback / Asynchronous Update**
- Razorpay sends `payment.captured`, `payment.failed`, or `refund.processed` webhooks to `POST /api/payments/webhook`.
- The backend verifies the `x-razorpay-signature` using the raw payload body.
- The corresponding `PaymentTransaction` and `Booking` statuses are updated. Idempotency is managed by checking the current status before updating.

## 2. Issues Discovered and Repaired
1. **Webhook Signature Mismatch**: The Express `express.json()` middleware parses the body into an object, discarding the exact raw string bytes. Razorpay webhook verification failed because `JSON.stringify(req.body)` did not perfectly match the original payload sent by Razorpay (due to whitespace or key ordering).
   - **Fix**: Modified `express.json` to capture `req.rawBody` on incoming requests. Updated the webhook verification logic to utilize `req.rawBody.toString('utf8')` for cryptographic hashing, fully resolving the mismatch.

## 3. Implementation Verification
- **Test Credentials**: The provided keys (`rzp_test_...`) were fully validated against the live Razorpay test environment. 
- **Database States**: Verified all transitions: `ORDER_CREATED` -> `PAYMENT_CAPTURED`.
- **Negative Tests**: Missing IDs, tampered signatures, and missing webhook headers are all correctly rejected with HTTP 400.

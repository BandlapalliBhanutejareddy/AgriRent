# AGRORENT AI — BOOKING STATE MACHINE AUDIT & REDESIGN PLAN

> **Document Version:** 1.0  
> **Phase:** Phase 1 Forensic Audit  
> **Primary Change:** Complete Removal of External Payment Gateways (Razorpay) from Booking Core  

---

## 1. Audit of Current Booking Lifecycle

The current system relies on a payment gateway check before confirming a booking, leading to state locks when external payment APIs are unreachable.

### Current Database Enum / String States Identified:
- `PENDING` (Initial creation)
- `PAID` (Gateway payment confirmed - **TO BE REMOVED FROM MANDATORY FLOW**)
- `ACCEPTED` (Owner approved)
- `CONFIRMED` (Booking active/scheduled)
- `REJECTED` (Owner declined)
- `CANCELLED` (Farmer or Owner cancelled)
- `DISPATCHED` (Equipment in transit)
- `ACTIVE` (Rental in progress)
- `RETURN_PENDING` (Farmer initiated return)
- `COMPLETED` (Return inspected & closed)
- `REFUND_PENDING` (Gateway refund pending - **TO BE REMOVED**)
- `REFUNDED` (Gateway refund completed - **TO BE REMOVED**)

---

## 2. Target Offline-First Direct Approval State Machine

Under the new target architecture, bookings do not depend on external payment gateways. Rental confirmation is achieved via **Direct Owner Approval**.

```
[ FARMER ]
 Select Equipment & Dates
           │
           ▼
  CONFIRM RENTAL REQUEST
           │
           ▼
      [ PENDING ] ──────────────► [ CANCELLED ] (Farmer Cancels Before Approval)
           │
           ├───────────────────────────────┐
           │ (Owner Action)                │ (Owner Action)
           ▼                               ▼
     [ ACCEPTED ]                    [ REJECTED ] (End State)
           │
           ▼ (Equipment Handover / Transit)
    [ DISPATCHED ]
           │
           ▼ (Start Date Reached / In Use)
      [ ACTIVE ]
           │
           ▼ (Farmer Submits Return)
  [ RETURN_PENDING ]
           │
           ▼ (Owner Conducts Inspection)
     [ COMPLETED ] (End State)
```

---

## 3. Simplified State Machine Specification

| State | Trigger Event | Allowed Transitions | Role Responsible | System Action |
| :--- | :--- | :--- | :--- | :--- |
| **`PENDING`** | Farmer submits rental date selection. | `ACCEPTED`, `REJECTED`, `CANCELLED` | Farmer | Creates `Booking` record; sends notification to Equipment Owner. |
| **`ACCEPTED`** | Owner reviews & approves rental request. | `DISPATCHED`, `CANCELLED` | Owner | Locks equipment calendar for selected dates; notifies Farmer. |
| **`REJECTED`** | Owner declines rental request. | None (Terminal State) | Owner | Unlocks dates; notifies Farmer with optional reason. |
| **`CANCELLED`** | Farmer or Owner cancels prior to handover. | None (Terminal State) | Farmer / Owner | Releases date lock; records cancellation reason. |
| **`DISPATCHED`** | Owner dispatches or farmer picks up equipment. | `ACTIVE` | Owner / Farmer | Updates tracking status; enables live GPS/chat tracking. |
| **`ACTIVE`** | Rental period starts; equipment is in field operation. | `RETURN_PENDING` | Farmer | Rental timer running; logs daily operation audit. |
| **`RETURN_PENDING`** | Farmer marks equipment as returned. | `COMPLETED` | Farmer | Prompts Owner to perform inspection. |
| **`COMPLETED`** | Owner inspects condition and approves return. | None (Terminal State) | Owner | Releases deposit hold; unlocks reviews for both parties. |

---

## 4. Payment Field Audit & Database Restructuring Plan

The `Booking` and `PaymentTransaction` models contain payment gateway references. In Phase 2, these will be refactored without destroying historical data:

### `Booking` Model Fields Refactoring:
1. `paymentId` -> **Deprecate / Rename to `settlementRef`** (Internal tracking reference).
2. `paymentStatus` -> **Refactor values to `DIRECT_SETTLEMENT` | `PENDING_SETTLEMENT` | `WAIVED`**.
3. `totalPrice` -> **Retain** (Calculated as `pricePerDay * durationInDays`).
4. `amountPaid` -> **Retain as `agreedAmount`** (Agreed rental cost between parties).
5. `securityDeposit` -> **Retain** (Logged as collateral deposit agreement).

### `PaymentTransaction` Model Refactoring:
- Convert table into an **Internal Operational Ledger**.
- `transactionRef`: Generated internally via CUID (`AGR-TXN-...`).
- `paymentMethod`: Hardcode default to `'DIRECT_AGREEMENT'` or `'CASH_ON_DELIVERY'`.
- Remove Razorpay webhook dependencies and API signature verification routes.

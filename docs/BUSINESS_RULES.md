# 11. Business Rules Specification

> Authoritative backend-enforced business logic across Memberships, Payments, Class Bookings, Store & Delivery, CRM, HRM, and Access Control.

---

## 11.1 Membership Lifecycle (`Asia/Dhaka` / `UTC+06:00`)

- **End-of-Day Validity Boundary:** A membership stays active until `23:59:59.999+06:00` of its `endDate` (`getDhakaEndOfDayCutoff`), never cutting off at midnight `00:00` on the final day.
- **Automatic Expiry:** Once past `23:59:59.999+06:00`, active records automatically transition to `EXPIRED`, blocking class bookings and physical door access.
- **Immutable Renewal History:** Renewals always insert a new `Membership` linked via `previousMembershipId`, preserving historical plan changes.

---

## 11.2 Membership Payments, Receipts & Refunds

- **Payment vs. Activation Separation:** Submitting a `PENDING` payment or renewal request never activates a `Membership` or unlocks turnstiles.
- **Atomic Verification:** Staff payment verification (`VerifyPaymentDto`) atomically updates `Payment` to `VERIFIED_PAID`, creates an immutable `PaymentReceipt` (`RCP-YYYYMM-XXXX`), logs `AuditLog`, and optionally activates the linked membership.
- **Bounded Refunds:** Only `@StrictRoles(SUPER_ADMIN, ADMIN)` can issue refunds (`RefundPaymentDto`), restricted to `VERIFIED_PAID` / `PARTIALLY_PAID` payments and `refundAmountBdt <= netAmountBdt`.
- **Zero Card Storage:** Raw credit/debit PANs, CVVs, or mobile banking PINs are never sent or saved.

---

## 11.3 Class Booking & Capacity Locking

- **No Duplicates:** DB unique constraint `@@unique([classScheduleId, memberProfileId, sessionDate])` blocks double bookings (`409 Conflict`).
- **Concurrency Capacity Lock:** Bookings run inside `prisma.$transaction()`, checking `bookedCount < capacity` before incrementing `bookedCount`.
- **Dhaka Cancellation Window:** Members cancelling own bookings must act at least `cancellationCutoffHours` (default `2` hours) prior to `Asia/Dhaka` start time; cancellation decrements `bookedCount`.

---

## 11.4 Icon Gear Store, Delivery Charges & QR Tracking

| Rule Area                | Enforced Behavior                                                                             |
| :----------------------- | :-------------------------------------------------------------------------------------------- |
| **Delivery Charges**     | Ashkona Desk Pickup: **`৳0`** · Dhaka Home Delivery: **`৳80`** · Nationwide Courier: **`৳150`** |
| **Non-Member Advance**   | Guests pay minimum **`min(৳500, total)`** via bKash/Nagad/Rocket/Bank/Card + valid TrxID (`CASH` rejected) |
| **Student ID Waiver**    | Verified active gym students (`IFG-****`) waive advance (`৳0` advance / Cash & COD eligible)  |
| **Anti-Spoofing Guard**  | Guest `IFG-****` waiver requires matching registered phone digits OR authenticated owner/staff JWT |
| **Promo Codes**          | Validates `PERCENTAGE` / `FIXED_BDT`, active flag, expiry & `maxUses` inside transaction      |
| **Stock & Profit**       | Atomic inventory decrement on order; automatic restock on cancel; snapshots `unitCostBdt` & `profitBdt` |
| **PNG Cash Memo & QR**   | Auto-downloads PNG slip (`IconFitness-PaymentSlip-*.png`) linking QR to `/verify/order/[code]` |
| **4-Stage Order Track**  | `PENDING` *(Placed)* → `CONFIRMED` → `READY_FOR_PICKUP` *(Packed/Courier)* → `COMPLETED` *(Delivered)* |

---

## 11.5 CRM & HRM Operational Rules

- **CRM (`CrmModule`):** Imports inquiries idempotently via `sourceInquiryId`, surfaces memberships expiring within 7 days on the Retention Radar, and tracks staff call/WhatsApp outreach scorecards.
- **HRM (`HrmModule`):** Enforces unique `(employeeId, monthKey)` payroll disbursements (`netPaidBdt = base + bonus + overtime - deduction`) and tracks categorized utility/maintenance expenses (`GymExpense`).

---

## 11.6 Smart Access Control & Gender Session Rules

- **Authoritative Backend Engine:** Turnstile decisions run strictly on the backend (`AccessControlService`); frontend/device caches are never trusted.
- **Ashkona Official Timetable (`Asia/Dhaka`):**
  - `07:00 AM – 01:00 PM` (Sat–Thu): `MALE_SESSION` — Active Male & Female Members
  - `01:00 PM – 03:30 PM` (Sat–Thu): `FEMALE_SESSION` — **Female Members only** + **Female Trainer physically checked in** (`FEMALE_SESSION_RESTRICTED` / `FEMALE_TRAINER_UNAVAILABLE` otherwise)
  - `03:30 PM – 11:00 PM` (Sat–Thu) & `05:00 PM – 11:00 PM` (Fri): `MALE_SESSION` — Active Male & Female Members
- **Fail-Secure & Life-Safety Independence:** Offline devices keep entrances locked (`DEVICE_UNAVAILABLE`), while physical break-glass exits always stay 100% independent of software (`emergencyExitIndependent: true`).

---

← [10. Authentication & RBAC](./AUTHENTICATION_AND_RBAC.md) · Next: [12. Smart Access Control →](./SMART_ACCESS_CONTROL.md)

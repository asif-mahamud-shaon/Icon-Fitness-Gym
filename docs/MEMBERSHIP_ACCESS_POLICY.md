# 18. Membership-Based Automatic Access Policy

> How PostgreSQL membership validity, `Asia/Dhaka` end-of-day cutoffs, and verified payments govern physical gym access.

---

## 18.1 Mandatory Entry Eligibility Conditions

Turnstile entry (`AccessDecision.GRANTED`) requires **all seven** backend checks to pass at evaluation time:

1. **Identity & Liveness:** Face match confidence `>= 0.85` (`minFaceMatchConfidence`) and `livenessPassed === true`.
2. **Biometric Consent:** Active `BiometricEnrollment` with `consentGranted === true` and `status: ENROLLED`.
3. **Account State:** `User.status === ACTIVE` and `deletedAt === null`.
4. **Membership Status:** Holds an `ACTIVE` package in PostgreSQL.
5. **Dhaka Validity Window (`Asia/Dhaka` / `UTC+06:00`):**  
   Current time satisfies `getDhakaStartOfDayCutoff(startDate) <= now <= getDhakaEndOfDayCutoff(endDate)`.  
   > **End-of-Day Rule:** A plan expiring on `2026-11-30` remains valid through **`2026-11-30T23:59:59.999+06:00`** and is never locked out at `00:00` of its final day.
6. **Verified Payment:** No unverified payment blocks; `PENDING` or `FAILED` payments trigger `PAYMENT_PENDING`.
7. **Gender Session & Trainer Check:** Active operating window permits member's gender, and Ladies-Only sessions have a physically checked-in Female Trainer.

---

## 18.2 Automatic Expiration & Renewal Restoration

- **Instant Expiry Transition:** The moment `now > getDhakaEndOfDayCutoff(endDate)`, the next gate check or portal sync marks `Membership.status = EXPIRED`, keeps the door locked (`MEMBERSHIP_EXPIRED`), writes `AuditLog`, and notifies the member.
- **Renewal Restoration:** Submitting a renewal claim or `PENDING` bKash/Nagad transaction never unlocks access. Automatic entry resumes only once staff verify the payment (`VERIFIED_PAID`) and the renewed membership is `ACTIVE`.

---

← [17. Hardware Setup Guide](./HARDWARE_SETUP_GUIDE.md) · Next: [19. Development Roadmap →](./DEVELOPMENT_ROADMAP.md)

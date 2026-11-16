# 12. Smart Access Control — Architecture & Evaluation Pipeline

> Backend-authoritative facial recognition, membership enforcement, gender-based sessions, and door relay architecture for Ashkona.

---

## 12.1 System Capabilities

1. **Vendor-Agnostic Terminal Layer:** Connects real or simulated IP biometric terminals via `HardwareAdapterService`.
2. **Real-Time Membership & Payment Check:** Enforces `Asia/Dhaka` (`UTC+06:00`) `23:59:59.999` expiry boundaries and `VERIFIED_PAID` requirements.
3. **Gender-Based Sessions (`MALE_SESSION` / `FEMALE_SESSION`):** Automatically locks turnstiles against unauthorized entry during `01:00 PM – 03:30 PM` Dedicated Ladies-Only slots.
4. **Physical Female Trainer Presence Lock:** Guarantees Ladies-Only entry unlocks **only** when a Female Trainer has physically checked in.
5. **Fail-Secure Entrance & Independent Egress:** Offline doors fail closed (`DEVICE_UNAVAILABLE`), while physical break-glass exits remain 100% software-independent.

---

## 12.2 Authoritative 7-Step Evaluation Pipeline

Every entry attempt (`POST /api/v1/access-control/devices/verify-callback` or `/simulate-entry`) runs sequentially inside `AccessControlService.processAccessAttempt`:

```text
Step 1 ──> Replay & Idempotency Guard
           Validate `callbackTimestamp` against `callbackReplayWindowSec` (60s)
           Deduplicate via `AccessEvent.idempotencyKey` (`idempotentReplay: true`)

Step 2 ──> Device Auth & Reachability
           Constant-time SHA-256 verification of `x-device-api-key`
           Verify device is `ONLINE` and heartbeat within `deviceHeartbeatTimeoutSec` (`90s`)

Step 3 ──> Anti-Spoofing & Confidence Score
           Enforce `livenessPassed === true` (`SPOOF_DETECTED`)
           Enforce `recognitionScore >= minFaceMatchConfidence` (`0.85` / `FACE_NOT_RECOGNIZED`)

Step 4 ──> Member & Biometric Consent
           Resolve via HMAC-SHA256 `templateToken` or `memberCode` (`MEMBER_NOT_FOUND`)
           Confirm `consentGranted === true`, status `ENROLLED`, user `ACTIVE` (`BIOMETRIC_NOT_ENROLLED` / `ACCOUNT_INACTIVE`)

Step 5 ──> Real-Time Membership & Payment Validity (`Asia/Dhaka`)
           Transition expired memberships past `23:59:59.999+06:00` to `EXPIRED` + log AuditLog
           Block `PENDING`, `SUSPENDED`, `CANCELLED`, or expired packages with exact `AccessDenialCode`

Step 6 ──> Gender Session & Female Trainer Physical Check-In
           Resolve active `GymSession` and `GymSessionException` for current `Asia/Dhaka` time
           During `FEMALE_SESSION`: block Male Members (`FEMALE_SESSION_RESTRICTED`) & verify live Female Trainer `TrainerAttendance` (`FEMALE_TRAINER_UNAVAILABLE`)

Step 7 ──> Door Command Dispatch & Immutable Audit Log
           On `GRANTED`: emit `UNLOCK_CONFIRMED` / `SIMULATED_UNLOCKED` -> log `AccessEvent` & `DoorControllerEvent`
           On `DENIED`: emit `LOCKED_DENIED` -> record exact `AccessDenialCode` and human-readable reason
```

---

← [11. Business Rules](./BUSINESS_RULES.md) · Next: [13. Access Control API →](./ACCESS_CONTROL_API.md)

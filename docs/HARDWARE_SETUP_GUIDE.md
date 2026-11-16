# 17. Hardware Setup, Offline Fallback & Emergency Safety Guide

> Physical turnstile commissioning at Ashkona, fail-secure offline handling, and software-independent life-safety egress.

---

## 17.1 Physical Terminal & Relay Topology
- **Entrance Lane (`DEV-ASHKONA-ENTRY-01`):** Main lobby facial recognition terminal wired to Door Controller (`DOOR-CTRL-ASHKONA-01`).
- **Exit Lane (`DEV-ASHKONA-EXIT-01`):** Lobby exit lane reader.
- **Relay Pulse:** Configurable `doorUnlockDurationSec` (default `5` seconds).

---

## 17.2 Commissioning a Physical Terminal

1. Open `/admin/access-control/devices` as `SUPER_ADMIN` or `ADMIN`.
2. Register the device with its `deviceCode`, `vendorType`, `direction` (`ENTRY` / `EXIT`), and LAN IP.
3. Copy the one-time `issuedDeviceApiKeyOnce` into the terminal header (`x-device-api-key`).
4. Configure webhook URLs on the terminal:
   - **Verification Callback:** `POST https://<backend-host>/api/v1/access-control/devices/verify-callback`
   - **Periodic Heartbeat (30–60s):** `POST https://<backend-host>/api/v1/access-control/devices/heartbeat`

---

## 17.3 Offline Fallback & Fail-Secure Mode
- **Fail-Secure Entrance Lock:** If a device goes `OFFLINE`, enters `MAINTENANCE`, or misses heartbeats past `deviceHeartbeatTimeoutSec` (`90s`), automated biometric entry is blocked (`DEVICE_UNAVAILABLE` + `LOCKED_DENIED`).
- **Staff Manual Verification Fallback:** Authorized staff use **Manual Verify** on `/admin/access-control` (`POST /api/v1/access-control/manual-verify`), which still enforces `Asia/Dhaka` membership expiry and Ladies-Only trainer rules.

---

## 17.4 Mandatory Emergency Egress Independence

> [!CAUTION]
> **100% Hardware Life-Safety Rule:** All emergency exits and mechanical break-glass releases are wired fail-safe in hardware (`emergencyExitIndependent: true`, `canSoftwareBlockEmergencyExit: false`). Software locks, database outages, or denied turnstile flags can **never** impede emergency exit from the facility.

---

← [16. Gym Session Rules](./GYM_SESSION_RULES.md) · Next: [18. Membership Access Policy →](./MEMBERSHIP_ACCESS_POLICY.md)

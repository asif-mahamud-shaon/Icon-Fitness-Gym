# 15. Face Recognition Hardware & Adapter Integration Guide

> Modular vendor adapters, constant-time device authentication, replay protection, and transparent simulation labeling.

---

## 15.1 Vendor Adapter Layer (`HardwareAdapterService`)

`backend/src/modules/access-control/hardware-adapter.service.ts` decouples physical biometric protocols from gym access rules across five supported `DeviceVendorType` adapters:

| `DeviceVendorType`          | Target Hardware / Usage                                                           |
| :--------------------------- | :-------------------------------------------------------------------------------- |
| `SIMULATED_TERMINAL`         | Built-in Development/QA terminal simulator marked `[SIMULATED]` (`isSimulated: true`) |
| `GENERIC_REST_WEBHOOK`       | Standard HTTPS JSON webhook adapter for IP biometric kiosks & turnstiles          |
| `ZKTECO_COMPATIBLE`          | Push SDK adapter for ZKTeco SpeedFace / ProFace terminals                         |
| `HIKVISION_ISAPI_COMPATIBLE` | Event stream adapter for Hikvision MinMoe ISAPI devices                           |
| `SUPREMA_COMPATIBLE`         | Adapter interface for Suprema BioStar / FaceStation controllers                   |

---

## 15.2 Device Authentication & Callback Hardening

1. **One-Time Per-Device API Keys**  
   Registering a terminal via `POST /api/v1/access-control/devices` issues a random secret (`IFG-DEV-KEY-...`) returned **once** (`issuedDeviceApiKeyOnce`) while storing only its SHA-256 digest (`apiKeyHash`).
2. **Constant-Time Verification (`verifyDeviceApiKey`)**  
   Incoming `x-device-api-key` headers are checked via `crypto.timingSafeEqual` on **every** device callback and heartbeat—including simulated devices.
3. **Replay Protection**  
   `callbackTimestamp` is validated against `callbackReplayWindowSec` (default `60` seconds).
4. **Idempotency Deduplication**  
   Retries sharing `idempotencyKey` return `idempotentReplay: true` without pulsing the door relay twice.

---

## 15.3 Simulation Honesty Policy

> [!NOTE]
> Simulated terminals never masquerade as live hardware: every simulated event sets `isSimulated: true`, `verificationMethod: SIMULATED_BIOMETRIC`, `simulationDisclosure`, and renders a `[SIMULATED]` badge in `/admin/access-control`.

---

← [14. Biometric Privacy & Security](./BIOMETRIC_PRIVACY_AND_SECURITY.md) · Next: [16. Gym Session Rules →](./GYM_SESSION_RULES.md)

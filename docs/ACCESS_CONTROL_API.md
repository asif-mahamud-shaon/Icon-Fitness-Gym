# 13. Smart Access Control REST API (`/api/v1/access-control`)

> Endpoints governing terminals, biometric enrollment, simulations, sessions, female trainer check-ins, and access audit logs.

---

## 13.1 Overview, Logs & Life-Safety Endpoints

| Method | Endpoint                            | Roles / Guards                          | Description                                                             |
| :----- | :---------------------------------- | :-------------------------------------- | :---------------------------------------------------------------------- |
| `GET`  | `/access-control/overview`          | `STAFF+` (`access_control`)             | Live occupancy, active Dhaka session, Female Trainer presence & alerts  |
| `GET`  | `/access-control/events`            | `STAFF+` (`access_control`)             | Filterable log of granted/denied entry attempts                         |
| `GET`  | `/access-control/events/export/csv` | `@StrictRoles(SUPER_ADMIN, ADMIN)`      | Download filtered access logs as RFC-4180 CSV                           |
| `GET`  | `/access-control/emergency-safety`  | `STAFF+` (`access_control`)             | Verifies software-independent physical break-glass egress policy        |

---

## 13.2 Verification, Simulator & Manual Staff Fallback

| Method | Endpoint                                   | Auth / Roles                                     | Description                                                               |
| :----- | :----------------------------------------- | :----------------------------------------------- | :------------------------------------------------------------------------ |
| `POST` | `/access-control/devices/verify-callback`  | `@Public()` + `x-device-api-key`                 | Authoritative hardware terminal verification webhook                      |
| `POST` | `/access-control/simulate-entry`           | `STAFF+` (`access_control`)                      | Dev/QA simulator (`isSimulated: true` + `[SIMULATED]` disclosure)         |
| `POST` | `/access-control/manual-verify`            | `STAFF+` (`access_control`)                      | Front-desk manual verification fallback (still enforces session/expiry)   |

---

## 13.3 Biometric Enrollment & Member Self-Service

| Method   | Endpoint                                     | Roles                                  | Description                                                             |
| :------- | :------------------------------------------- | :------------------------------------- | :---------------------------------------------------------------------- |
| `GET`    | `/access-control/biometrics`                 | `STAFF+` (`access_control`)            | Sanitized biometric status list (never exposes ciphers or raw hashes)   |
| `POST`   | `/access-control/biometrics/enroll`          | `STAFF+` or `MEMBER` *(self)*          | Encrypts descriptor via AES-256-GCM; requires explicit `consentGranted`  |
| `DELETE` | `/access-control/biometrics/:memberProfileId`| `ADMIN+` or `MEMBER` *(self)*          | Right-to-erasure purge (`encryptedTemplateCipher = null` + `AuditLog`)  |
| `GET`    | `/access-control/my`                         | `MEMBER` *(self)*, `STAFF+`            | Member Portal access validity, permitted sessions & personal entry log  |

---

## 13.4 Devices, Sessions, Exceptions & Trainer Check-Ins

| Method        | Endpoint                               | Roles / Guards                                | Description                                                       |
| :------------ | :------------------------------------- | :-------------------------------------------- | :---------------------------------------------------------------- |
| `GET`         | `/access-control/devices`              | `STAFF+` (`access_control`)                   | Lists terminals & door controllers with heartbeat health          |
| `POST`/`PATCH`| `/access-control/devices`, `/:id`      | `@StrictRoles(SUPER_ADMIN, ADMIN)`            | Registers terminal (one-time API key) or updates status/unlock ms |
| `POST`        | `/access-control/devices/heartbeat`    | `@Public()` + `x-device-api-key`              | Validates device API key on all devices & marks terminal `ONLINE` |
| `GET`         | `/access-control/sessions`             | Authenticated                                 | Lists `Asia/Dhaka` `MALE_SESSION` and `FEMALE_SESSION` slots      |
| `POST`/`PATCH`| `/access-control/sessions`, `/:id`     | `@StrictRoles(SUPER_ADMIN, ADMIN)`            | Configures gender-based sessions with overlap prevention          |
| `GET`/`POST`  | `/access-control/session-exceptions`   | `GET`: `STAFF+`; `POST`: `@StrictRoles(ADMIN+)`| Manages holiday closures & modified operating windows            |
| `GET`/`POST`  | `/access-control/trainer-assignments`  | `GET`: `TRAINER`/`STAFF+`; `POST`: `@StrictRoles(ADMIN+)` | Assigns primary & backup Female Trainers to sessions  |
| `GET`/`POST`  | `/access-control/trainer-attendance`   | `TRAINER` *(self)*, `STAFF+`                  | Records physical Female/General trainer check-in (`PRESENT`/`LATE`) |
| `GET`/`PATCH` | `/access-control/settings`             | `GET`: `STAFF+`; `PATCH`: `ADMIN+` (`access_settings`) | Configures thresholds, replay window & retention days    |

---

← [12. Smart Access Control](./SMART_ACCESS_CONTROL.md) · Next: [14. Biometric Privacy & Security →](./BIOMETRIC_PRIVACY_AND_SECURITY.md)

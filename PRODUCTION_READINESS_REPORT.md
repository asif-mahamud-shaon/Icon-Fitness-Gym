# Production Readiness Report — Icon Fitness Gym

> **Audit Date:** `2026-11-16` · **Workspace:** `Icon-Fitness-Gym`  
> **Verdict:** **CONDITIONALLY READY** *(Online build, `npm audit`, DB schema sync, and live E2E cutover pending)*  
> **Scope:** Security Hardening · Bug Fixes · `.gitignore` & Secrets Hygiene · SEO & Headers · Build & Jest Verification

---

## 1. Stack & Architecture Snapshot

| Layer            | Technologies & Runtime                                                                 |
| :--------------- | :------------------------------------------------------------------------------------- |
| **Frontend**     | Next.js `14.2.35`, React `18.3.1`, TypeScript `5.7.2`, Tailwind CSS `3.4.17`, Playwright |
| **Backend**      | NestJS `10.4.15`, Node.js `20-alpine`, Prisma `5.22.0`, PostgreSQL `16`, Jest          |
| **Security**     | `passport-jwt`, `bcryptjs`, `class-validator`, `helmet`, `@nestjs/throttler`, CSP       |
| **Integrations** | Hardware/Simulated Biometrics, optional Redis, optional Cloudinary, optional SSLCommerz |
| **Hosting**      | Containerized backend (`backend/Dockerfile`) + Next.js/Vercel over HTTPS (`trust proxy: 1`) |

---

## 2. Security Audit Summary

| ID         | Title                                                   | Severity | Retest Status     |
| :--------- | :------------------------------------------------------ | :------- | :---------------- |
| **SEC-01** | BFLA via `@RequirePermission` / `@Roles` bypass         | **High** | **Pass** *(Jest)* |
| **SEC-02** | Unauthenticated Member PII Disclosure                   | **High** | **Pass** *(Jest)* |
| **SEC-03** | Guest Advance-Waiver Spoofing (`POST /store/orders`)    | **High** | **Pass** *(Jest)* |
| **SEC-04** | Suspended Account Refresh & Missing Session Revocation  | **High** | **Pass** *(Jest)* |
| **SEC-05** | Unauthenticated Simulated Device Heartbeat Spoofing     | **High** | **Pass** *(Jest)* |
| **SEC-06** | Trainer PII/Workout Scope, URL Validation & Refunds     | **High** | **Pass** *(Jest)* |
| **SEC-07** | Dev CSP Origin Leakage & Dhaka Timezone Cutoff Bugs     | **Medium** | **Pass** *(Lint)* |
| **SEC-08** | `localStorage` JWT Token Storage                        | **Medium** | **Accepted Risk** |
| **SEC-09** | Unvalidated Inline `@Body()` Types (Secondary Handlers) | **Low**    | **Open**          |

---

### Detailed Findings & Remediations

#### `SEC-01` — BFLA via `@RequirePermission` / `@Roles` Bypass
- **Severity:** High · **Status:** **Pass** (`security-hardening.spec.ts` & `permissions.spec.ts`)
- **Affected Files:** `backend/src/common/guards/roles.guard.ts`, Admin controllers (`store`, `crm`, `payments`, `gallery`, `testimonials`, `classes`, `schedules`, `membership-plans`, `access-control`, `reports`, `settings`)
- **Root Cause:** `RolesGuard` granted access immediately when a user held `@RequirePermission`, letting `STAFF` bypass stricter `@Roles(SUPER_ADMIN, ADMIN)` constraints on promo codes, deletions, refunds, and exports.
- **Resolution:** Added `@StrictRoles()` (`strict-roles.decorator.ts`) enforcing both `@Roles` AND `@RequirePermission` simultaneously while preserving delegatable modules (`hrm`), plus service-level checks in `StoreService` and `CrmService`.

#### `SEC-02` — Unauthenticated Member PII Disclosure (`GET /store/members/verify`)
- **Severity:** High · **Status:** **Pass** (`security-hardening.spec.ts`)
- **Affected Files:** `store.controller.ts`, `store.service.ts`, `StoreCheckoutModal.tsx`
- **Root Cause:** Public lookup returned unredacted `phone`, `email`, `address`, `userId`, and `memberProfileId` for any guessed `IFG-...` code.
- **Resolution:** Redacted public `/store/members/verify` to `fullName`, `maskedPhone`, `memberCode`, `planName`, `validUntil` (`12/min` throttle); moved full auto-fill to ownership-checked `/store/members/verify-auth`; masked `transactionReference` on public QR checks.

#### `SEC-03` — Guest Advance-Waiver Spoofing (`POST /store/orders`)
- **Severity:** High · **Status:** **Pass** (`security-hardening.spec.ts`)
- **Affected Files:** `backend/src/modules/store/store.service.ts`
- **Root Cause:** Anonymous callers passing any active `memberCode` received `isMemberVerified=true`, waiving the `৳500` advance and decrementing stock via `CASH` orders.
- **Resolution:** Enforced owning JWT / `STAFF+` role OR matching registered `customerPhone` digits on guest orders claiming a `memberCode`.

#### `SEC-04` — Suspended Account Refresh Persistence & Missing Lockout
- **Severity:** High · **Status:** **Pass** (`security-hardening.spec.ts`)
- **Affected Files:** `auth.service.ts`, `auth.dto.ts`, `auth.controller.ts`, `users.service.ts`
- **Root Cause:** `refreshTokens()` did not block suspended/deleted users; password changes and suspensions left active `RefreshToken` rows valid; `login()` lacked per-account lockout; `getMe()` exposed extra columns.
- **Resolution:** Rejected/revoked suspended & deleted accounts on refresh, revoked active tokens on `changePassword()` and `updateUserStatus()`, added 5-attempt per-email brute-force lockout + audit logging, enforced letter+digit password rule, and stripped internal columns in `getMe()`.

#### `SEC-05` — Unauthenticated Simulated Device Heartbeat Spoofing
- **Severity:** High · **Status:** **Pass** (`security-hardening.spec.ts`)
- **Affected Files:** `backend/src/modules/access-control/access-control.service.ts`
- **Root Cause:** `recordDeviceHeartbeat()` skipped `apiKey` checks when `device.isSimulated === true`.
- **Resolution:** Required `verifyDeviceApiKey()` for all devices on `@Public()` heartbeat.

#### `SEC-06` — Trainer PII Scope, Workout Ownership, URL Sanitization & Refunds
- **Severity:** High · **Status:** **Pass** (`security-hardening.spec.ts`)
- **Affected Files:** `members.service.ts`, `trainers.service.ts`, `workouts.service.ts`, `payments.service.ts`, `payments.dto.ts`, `gallery.service.ts`, `settings.service.ts`
- **Root Cause:** Trainers saw `nidNumber`/`rfidCardNumber`/`biometricEnrollment`/`accessEvents`, could overwrite admin workouts (`createdByTrainerId: null`), and could toggle `isFeatured`/`isActive`; URLs were unsanitized; `refundPayment` lacked status/bounds checks.
- **Resolution:** Redacted KYC/biometrics/access events from trainers; restricted trainer self-promotion & admin workout edits; enforced `https:` embed & URL sanitization; added strict DTOs (`VerifyPaymentDto`, `RefundPaymentDto`, `CreateAdminUserDto`) and bounded refund validation.

#### `SEC-07` — Dev CSP Origin Leakage & Dhaka Timezone Cutoff Bugs
- **Severity:** Medium · **Status:** **Pass** (Build/Lint)
- **Affected Files:** `frontend/next.config.mjs`, `bookings.service.ts`, `memberships.service.ts`
- **Root Cause:** `localhost:4000` appeared in production CSP `connect-src`; `cancelBooking` used `setUTCHours` instead of UTC+6; `findMyMemberships` missed end-of-day Dhaka cutoff.
- **Resolution:** Scoped localhost `connect-src` to `isDev`, expanded `img-src` safely to `https:` for CMS media, and fixed `Asia/Dhaka` (`UTC+06:00`) boundary math. *(Additionally updated `frame-src` for Google Maps embeds on `/contact`.)*

#### `SEC-08` & `SEC-09` — Accepted Risk & Low-Priority Backlog
- **`SEC-08` (Accepted Risk):** JWT tokens reside in `localStorage` (`frontend/src/lib/api.ts`) for decoupled `:3000 -> :4000` calls, mitigated via React escaping, `SanitizeInputPipe`, CSP, `15m` access TTL, and refresh rotation/revocation.
- **`SEC-09` (Open / Low):** Some secondary admin/trainer handlers (`classes`, `schedules`, `exercises`, `membership-plans`, `members`, `memberships`, `workouts`, `testimonials`, `access-control`) still use inline `@Body()` TS types; protected today by `SanitizeInputPipe`, role guards, and service allowlists.

---

## 3. Functional, Runtime & Infrastructure Fixes

- **Backend Compilation & Runtime Fixes:**
  - Added missing `ForbiddenException` import in `crm.service.ts` and removed duplicate DTO exports in `payments.dto.ts`.
  - Added public DB readiness endpoint `GET /api/v1/health` (`HealthController`) returning HTTP `200` / `503`.
- **Frontend Stability & SEO:**
  - Resolved `react-hooks/exhaustive-deps` warning in `StoreCheckoutModal.tsx`.
  - Added `frontend/src/app/error.tsx` root client error boundary.
  - Added `/why-icon` and `/store` to `sitemap.ts`; disallowed `/verify/`, `/admin/`, `/member/`, `/trainer/`, and `/api/` in `robots.ts`; set `noindex, nofollow` + `no-store` portal headers.
  - Fixed Contact page Google Maps embed (`frame-src 'self' https://www.google.com https://maps.google.com` + `referrerPolicy="no-referrer-when-downgrade"`).
- **Verified Features & `.gitignore` Hygiene:**
  - Synchronized Ladies-Only session (`01:00 PM – 03:30 PM` Sat–Thu) across backend & frontend, Store 2-step checkout, auto PNG slip download, and 4-stage QR order tracking.
  - Hardened `/.gitignore` to exclude `.env*`, build artifacts, logs, keys (`*.pem`, `*.key`), local DB dumps, and `backend/uploads/` while preserving `.env.example` templates and Prisma schema/migrations.
  - Note: No `.git` repository exists in the current directory (`git status` not verified); confirm untracked `.env` files before initializing Git.

---

## 4. Verification Results Matrix

| Check                      | Command                              | Outcome            | Scope / Notes                                                            |
| :------------------------- | :----------------------------------- | :----------------- | :----------------------------------------------------------------------- |
| **Prisma Validate**        | `cd backend; npx prisma validate`    | **Passed**         | `schema.prisma` valid (`exit code 0`)                                    |
| **Backend TypeScript**     | `cd backend; npx tsc --noEmit`       | **Passed**         | `0` errors                                                               |
| **Backend Build**          | `cd backend; npm run build`          | **Passed**         | `nest build` clean (`exit code 0`)                                       |
| **Backend Jest Suites**    | `cd backend; npm test`               | **Passed (49/49)** | `4/4` suites (`permissions`, `business-rules`, `access-control`, `security-hardening`) |
| **Frontend TypeScript**    | `cd frontend; npx tsc --noEmit`      | **Passed**         | `0` errors                                                               |
| **Frontend ESLint**        | `cd frontend; npm run lint`          | **Passed**         | `0` errors (intentional `<img>` warnings only; `0` hook warnings)        |
| **Secret Pattern Scan**    | `Select-String` across `src/`        | **Passed**         | `0` hardcoded credential patterns; `0` client secret leaks               |
| **Frontend Prod Build**    | `cd frontend; npm run build`         | **Failed Offline** | Blocked by offline Google Fonts fetch & sandbox `EPERM` on `.next\types` |
| **Dependency Audit**       | `npm audit --json`                   | **Not Verified**   | Offline sandbox returned `403` contacting `registry.npmjs.org`           |
| **Live DB / Playwright**   | Playwright / Live HTTP probe         | **Not Verified**   | Offline sandbox & local `.env` pointed to non-Gym DB                     |

---

## 5. Pre-Launch Cutover Checklist & Remaining Risks

1. **Run Online Pre-Deploy Checks:** Execute `npm audit --omit=dev` (backend & frontend) and `cd frontend && npm run build` in an online CI/host environment.
2. **Sync Production PostgreSQL 16:** Because `schema.prisma` contains newer tables/columns beyond the two historical migration folders (`Store*`, `Hrm*`, `Crm*`, `websiteConfigJson`, `permissionsJson`), run `npx prisma generate && npx prisma db push` (or create a fresh baseline migration) + `npx prisma db seed` for fresh DBs.
3. **Verify Health & Secrets:** Ensure `NODE_ENV=production`, `ALLOW_DEV_RESET_TOKEN=false`, `ENABLE_SWAGGER=false`, strong 64-byte secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `BIOMETRIC_ENCRYPTION_KEY`, `BIOMETRIC_HASH_SALT`), and confirm `GET /api/v1/health` returns HTTP `200`.
4. **Remaining Architectural Notes:** Lockout/rate-limit counters run in single-node memory until connected to a shared Redis adapter for multi-replica scaling. Rotate all dev passwords before launch.

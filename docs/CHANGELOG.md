# 23. Changelog

> Chronological release history of the **Icon Fitness Gym** full-stack platform.

---

## `[1.3.0]` — 2026-11-16 · Security Hardening, Ashkona Session Sync & Production Readiness

### Security & Access Control
- **Hybrid RBAC Hardening:** Added `@StrictRoles()` in `RolesGuard` so `STAFF` permission keys cannot bypass Admin-only operations across Store, CRM, Payments, Reports, CMS, Content, Classes, Plans, and Access Control.
- **PII Redaction & Store Anti-Spoofing:** Redacted `/store/members/verify` for guests, added phone/ownership checks on `IFG-****` advance waivers, masked public `transactionReference` values, and introduced authenticated `/store/members/verify-auth`.
- **Auth & Session Protection:** Enforced 5-attempt per-email brute-force lockout, password letter+digit validation, suspended/deleted user rejection in `JwtStrategy` & `refreshTokens()`, and session revocation on password changes or user suspension.
- **Trainer & Hardware Controls:** Redacted member KYC/biometric records from Trainers, isolated Admin workouts, enforced API key verification on simulated device heartbeats, and added bounded refund DTO validation.

### Platform, SEO & Bug Fixes
- **Official Session Sync:** Updated Ashkona Dedicated Ladies-Only slot from `01:30 PM – 03:30 PM` to **`01:00 PM – 03:30 PM`** (Sat–Thu) and Morning General to `07:00 AM – 01:00 PM` across seed data, schedules, Store checkout, and documentation.
- **Readiness & Resilience:** Added `GET /api/v1/health`, root `frontend/src/app/error.tsx` boundary, Google Maps CSP `frame-src` + `referrerPolicy` fix on `/contact`, updated `.gitignore`, `sitemap.ts`, `robots.ts`, and `PRODUCTION_READINESS_REPORT.md`.

---

## `[1.2.0]` — 2026-11-15 · Icon Store, Online Delivery, QR Slips, CRM, HRM & Dual-Theme UI

- **Icon Gear Store (`/store`, `/member/store`, `/admin/store`):** Added 2-step Bag -> Checkout wizard, official Ashkona Contact bKash/Nagad/Rocket card with copy, Delivery charges (`৳80` Dhaka / `৳150` Nationwide / `৳0` Desk Pickup), `IFG-****` student auto-fill & waiver, Auto-Downloaded **PNG Cash Memo Slip** (`download-order-slip.ts`), live 4-stage QR order tracking (`/verify/order/[code]`), promo codes, POS orders & profit tracking.
- **CRM & HRM ERP:** Added `CrmModule` (`/admin/crm` leads, inquiry import, 7-day expiry retention radar, scorecard) and `HrmModule` (`/admin/hrm` staff roster, monthly payroll, utility expenses).
- **CMS, Permissions & Dual-Theme:** Added `AdminSettingsWorkspace` (`/admin/website-cms`), `18` delegatable `PermissionKey` overrides (`/admin/users`), and Light-default Dual-Theme architecture (`ThemeContext`) + `MobileBottomNav`.

---

## `[1.1.0]` — 2026-11-11 · Smart Face Recognition & Gender-Based Gym Sessions

- **Schema & Engine (`20261111140829_smart_access_control`):** Added 9 Access Control models, `AccessControlModule`, `HardwareAdapterService`, `BiometricSecurityService` (AES-256-GCM + HMAC-SHA256), `Asia/Dhaka` EOD cutoffs, and physical Female Trainer presence locks.
- **Portals & Tests:** Built `9` Admin Access Control views, `/member/access`, and 17-scenario `access-control.spec.ts`.

---

## `[1.0.0]` — 2026-11-11 · Core Platform Launch

- Launched Next.js App Router website, NestJS REST API (`/api/v1`), PostgreSQL core schema (`20261111120541_init`), Member & Trainer Portals, Admin Dashboard, and Playwright E2E suite.

---

← [22. Environment Variables](./ENVIRONMENT_VARIABLES.md) · [Back to README →](../README.md)

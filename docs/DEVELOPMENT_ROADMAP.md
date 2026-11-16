# 19. Development Roadmap

> Milestone execution tracker from foundation (`v1.0.0`) through Store/ERP expansion (`v1.2.0`) and Production Hardening (`v1.3.0`).

---

## 19.1 Phase Overview

| Phase    | Milestone                     | Primary Scope                                            | Status       |
| :------- | :---------------------------- | :------------------------------------------------------- | :----------- |
| **P01**  | Foundation & Environment      | Repo structure, Docker Compose, `.env` templates         | ✅ Completed |
| **P02**  | Dual-Theme Design System      | Light default + Dark Cinematic theme, typography, UI kit | ✅ Completed |
| **P03**  | Public Website & SEO          | Public routes, Google Maps, `error.tsx`, sitemap, JSON-LD| ✅ Completed |
| **P04**  | Database & NestJS API         | `41` Prisma models, `25` modules, `/health`, `seed.ts`   | ✅ Completed |
| **P05**  | Auth, Lockout & Hybrid RBAC   | JWT rotation, lockout, `@StrictRoles()`, `18` permissions| ✅ Completed |
| **P06**  | Store, Delivery & QR Tracking | 2-step checkout, `৳80`/`৳150` shipping, `IFG-****`, PNG slip| ✅ Completed |
| **P07**  | Member & Trainer Portals      | `/member/*` (`9` views) & `/trainer/*` (`4` views)       | ✅ Completed |
| **P08**  | Admin ERP, CRM, HRM & CMS     | Smart Access (`9` views), CRM, HRM payroll, Website CMS  | ✅ Completed |
| **P09**  | Security Audit & Jest Suites  | `4/4` suites (`49/49` tests) + Playwright E2E spec       | ✅ Completed |
| **P10**  | Production Readiness & Docs   | `PRODUCTION_READINESS_REPORT.md` + 23 synced guides      | ✅ Completed |

---

## 19.2 Key Delivered Highlights

- **v1.0.0 — Core Platform:** Normalized PostgreSQL backend, Public Website, Member Portal, Trainer Portal, Admin Dashboard, and Recharts/CSV reporting.
- **v1.1.0 — Smart Access Control:** Biometric AES-256-GCM encryption, vendor hardware adapters, `Asia/Dhaka` end-of-day membership validity, and Female Trainer physical presence locks.
- **v1.2.0 — Store POS, Delivery, CRM, HRM & CMS:** Gear Store with Dhaka (`৳80`) & Nationwide (`৳150`) delivery, Student ID (`IFG-****`) auto-fill & waiver, Auto PNG Cash Memo slips, 4-stage QR tracking, CRM Retention Radar, HRM payroll, and Light-default Dual-Theme UI.
- **v1.3.0 — Principal Hardening & Session Sync:** `@StrictRoles()` BFLA fix, PII redaction, per-email brute-force lockout, `/api/v1/health`, `01:00 PM – 03:30 PM` Ladies-Only slot sync, Google Maps CSP fix, and production readiness report.

---

← [18. Membership Access Policy](./MEMBERSHIP_ACCESS_POLICY.md) · Next: [20. Testing Strategy →](./TESTING_STRATEGY.md)

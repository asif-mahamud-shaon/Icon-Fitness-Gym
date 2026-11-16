# 02. Requirements Specification

> Complete functional and non-functional engineering specification for **Icon Fitness Gym** (`/api/v1` + Next.js 14 App Router).

---

## 2.1 Functional Requirements

### A. Public Website, SEO & QR Verification
- **`FR-PUB-01` CMS-Driven Homepage:** Render Hero, live KPIs, Facilities, Plans, Trainers, Workouts, Schedules, Store Preview, Testimonials, Gallery, and Ashkona location from `GymSettings.websiteConfigJson`.
- **`FR-PUB-02` Authentic Database Pricing:** Only display plans marked `isActive = true` and `isPublic = true`. Never fabricate pricing if unconfigured.
- **`FR-PUB-03` Dynamic SEO Detail Routes:** Serve `/facilities/[slug]`, `/trainers/[slug]`, `/programs/[slug]`, and `/store/[slug]`.
- **`FR-PUB-04` Live Class Timetable:** Show weekly schedules (`/schedule`) with real-time remaining seats (`capacity - bookedCount`).
- **`FR-PUB-05` Contact & Ashkona Map:** Persist validated `/contact` submissions into `ContactInquiry` and display Ashkona Google Maps embed (`frame-src` CSP allowlisted).
- **`FR-PUB-06` SEO & Crawl Controls:** Output Open Graph tags, `HealthClub` JSON-LD, `sitemap.ts`, and `robots.ts` blocking `/admin/`, `/member/`, `/trainer/`, `/api/`, and `/verify/`.
- **`FR-PUB-07` Public QR Verification:** Verify receipts (`/verify/receipt/[code]`) and Store orders (`/verify/order/[code]`) publicly with masked sensitive references.

### B. Icon Gear Store & Online Delivery (`/store`)
- **`FR-STR-01` Catalog & Bag:** Filter by category (`BOTTLES`, `GLOVES`, `BELTS`, `SUPPLEMENTS`, `ACCESSORIES`, `APPAREL`) with stock indicators and persistent local cart.
- **`FR-STR-02` Two-Step Checkout:** `Gear Bag` → `Continue` → `Delivery & Payment` with official Ashkona bKash/Nagad/Rocket Contact number and copy helper.
- **`FR-STR-03` Fulfillment & Delivery Charges:** Support **Ashkona Desk Pickup (`৳0`)** and **Online Home Delivery** (`৳80` Inside Dhaka / `৳150` Nationwide with address validation).
- **`FR-STR-04` Student ID (`IFG-****`) Waiver & Anti-Spoofing:** Verified active gym students auto-fill details (`/store/members/verify-auth`) and waive the `৳500` advance (`CASH`/COD eligible). Guests pay minimum `min(৳500, total)` via mobile banking/bank/card; guest `IFG-****` claims require phone suffix verification.
- **`FR-STR-05` Promo Codes:** Enforce percentage/fixed `StoreDiscountCode` bounds, expiry, and `maxUses` inside order transactions.
- **`FR-STR-06` Auto PNG Cash Memo & Live Tracking:** Auto-download PNG payment slip (`IconFitness-PaymentSlip-*.png`) on order confirmation with QR code linking to 4-stage tracking (`PENDING` → `CONFIRMED` → `READY_FOR_PICKUP` → `COMPLETED`).
- **`FR-STR-07` Admin POS & Profit Analytics:** Create front-desk POS orders, track `buyingPriceBdt` vs `profitBdt`, manage promo codes, and restock inventory on order cancellation.

### C. Authentication, Lockout & Hybrid RBAC
- **`FR-AUTH-01` Member Registration:** Create `User`, `MemberProfile` (`IFG-YYYY-XXXX`), and optional pending `Membership`.
- **`FR-AUTH-02` Brute-Force Protection & Token Rotation:** Lock login after `5` consecutive invalid attempts per email; issue `15m` JWT access tokens + SHA-256 rotated `7d` refresh tokens.
- **`FR-AUTH-03` Session Revocation:** Immediately reject suspended/deleted users in `JwtStrategy` & `refreshTokens()`, and revoke active tokens on `changePassword()` or user suspension.
- **`FR-AUTH-04` `@StrictRoles()` & `18` Permission Keys:** Prevent permission-only bypass on sensitive Admin operations via `@StrictRoles()`, while supporting `permissionsJson` delegation for staff modules.

### D. Member & Trainer Portals
- **`FR-MEM-01..05` Member Portal (`/member/*`):** Live `Asia/Dhaka` membership countdown, renewals, concurrency-safe bookings, assigned workouts, Member Store, biometric consent (`/member/access`), notifications, and profile edits.
- **`FR-TRN-01..04` Trainer Portal (`/trainer/*`):** Assigned client insights (KYC/biometrics/access logs redacted), class attendance, trainer check-ins for Ladies Sessions, and workout authoring.

### E. Admin ERP, CRM, HRM & Smart Access Control
- **`FR-ADM-01..06` ERP Operations:** Recharts KPIs, manual payment verification + receipts, bounded refunds, **CRM Leads & Retention Radar (`/admin/crm`)**, **HRM Payroll & Utility Expenses (`/admin/hrm`)**, **Website CMS (`/admin/website-cms`)**, CSV exports, and `AuditLog`.
- **`FR-SAC-01..05` Smart Gate & Gender Sessions:** Authoritative turnstile verification (`/access-control/devices/verify-callback`), timing-safe device API keys (including heartbeats), AES-256-GCM templates, `23:59:59.999+06:00` end-of-day expiry, Ladies-Only (`01:00 PM – 03:30 PM` Sat–Thu) Female Trainer check-in enforcement, fail-secure offline locks, and software-independent emergency egress.

---

## 2.2 Non-Functional Requirements

| Code         | Domain          | Requirement                                                                                  |
| :----------- | :-------------- | :------------------------------------------------------------------------------------------- |
| `NFR-SEC-01` | Security        | Fail-closed startup secret checks (`secrets.util.ts`), Bcrypt (`12`), Helmet, `SanitizeInputPipe`, CSP |
| `NFR-CON-01` | Concurrency     | Atomic `prisma.$transaction()` locking on `ClassSchedule.bookedCount` and `StoreProduct.stockQty` |
| `NFR-OPS-01` | Observability   | Public `GET /api/v1/health` PostgreSQL readiness probe (`200` / `503`), `error.tsx`, `not-found.tsx` |
| `NFR-A11Y-01`| Accessibility   | AA contrast in both Light and Dark themes, keyboard focus rings, `prefers-reduced-motion`    |
| `NFR-PERF-01`| Performance     | Composite PostgreSQL indexes, GZIP JSON compression (> 1 KB), Next.js `optimizePackageImports` |

---

← [01. Project Overview](./PROJECT_OVERVIEW.md) · Next: [03. Design System →](./DESIGN_SYSTEM.md)

# 05. Frontend Structure (`/frontend`)

> Next.js 14 App Router directory layout, portal modules, shared Store/QR utilities, and security headers.

---

## 5.1 Directory Layout

```text
frontend/
├── public/                              # Static store imagery (/images/store/*), icons & assets
├── e2e/
│   └── icon-fitness.spec.ts             # Playwright end-to-end test specification
├── src/
│   ├── app/
│   │   ├── (public)/                    # Public Website, Storefront & QR Verification
│   │   │   ├── page.tsx                 # Homepage (HomeClient + live CMS/API sections)
│   │   │   ├── about/page.tsx
│   │   │   ├── why-icon/page.tsx
│   │   │   ├── facilities/              # Facilities directory & [slug] detail
│   │   │   ├── membership/page.tsx      # Public membership plans & pricing
│   │   │   ├── trainers/                # Trainer roster & [slug] detail
│   │   │   ├── programs/                # Workout programs & [slug] detail
│   │   │   ├── schedule/page.tsx        # Weekly class timetable & capacities
│   │   │   ├── gallery/page.tsx
│   │   │   ├── store/                   # Gear & Supplements Pro-Shop + [slug] details
│   │   │   ├── contact/page.tsx         # Inquiry form + Ashkona Google Maps embed
│   │   │   ├── login/page.tsx
│   │   │   ├── register/                # Member registration & payment step
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── verify/
│   │   │   │   ├── order/[code]/page.tsx    # Live 4-stage QR order tracking
│   │   │   │   └── receipt/[code]/page.tsx  # Membership receipt verification
│   │   │   └── privacy-policy|terms|cancellation-policy/page.tsx
│   │   │
│   │   ├── member/                      # Protected Member Portal (MEMBER)
│   │   │   ├── layout.tsx
│   │   │   └── dashboard|access|membership|bookings|workouts|trainer|store|profile|notifications/
│   │   │
│   │   ├── trainer/                     # Protected Trainer Portal (TRAINER)
│   │   │   ├── layout.tsx
│   │   │   └── dashboard|members|schedule|workouts/
│   │   │
│   │   ├── admin/                       # Protected Admin ERP (STAFF, ADMIN, SUPER_ADMIN)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard|members|membership-plans|memberships|payments/
│   │   │   ├── trainers/ & trainers/[id]/
│   │   │   ├── store|crm|hrm|reports|users|website-cms|settings|audit-logs/
│   │   │   ├── exercises|workouts|classes|schedules|bookings|attendance/
│   │   │   ├── gallery|testimonials|inquiries/
│   │   │   └── access-control/          # Overview, biometrics, devices, sessions, history, denied,
│   │   │                                # settings, trainer-assignments, trainer-attendance
│   │   │
│   │   ├── layout.tsx                   # Root layout, Google Fonts, Theme + Auth + Toast Providers
│   │   ├── globals.css                  # Light/Dark CSS variables & adaptive utility overrides
│   │   ├── error.tsx                    # Client Error Boundary
│   │   ├── not-found.tsx                # Custom 404 Page
│   │   ├── sitemap.ts                   # Dynamic SEO Sitemap
│   │   └── robots.ts                    # Crawler policy
│   │
│   ├── components/
│   │   ├── ui/index.tsx                 # Button, Card, Modal, StatusBadge, StatCard, Input, Pagination
│   │   ├── home/HomeClient.tsx          # Interactive CMS homepage client
│   │   ├── admin/AdminSettingsWorkspace.tsx
│   │   ├── layout/                      # PublicNavbar, PublicFooter, PortalShell, MobileBottomNav
│   │   └── shared/                      # StoreCheckoutModal, StoreOrderSlipModal, StoreProductVisual,
│   │                                    # QrCodeSvg, PromoCodeInput, ReceiptModal, FaceVerificationFormModal
│   │
│   ├── context/                         # AuthContext, ThemeContext, ToastContext
│   ├── lib/                             # api.ts, download-order-slip.ts, store-cart.ts, receipt-helpers.ts,
│   │                                    # website-config.ts, media-upload.ts, facilities-catalog.ts, programs-catalog.ts
│   └── types/                           # Shared TypeScript interfaces
│
├── playwright.config.ts
├── next.config.mjs                      # CSP, Google Maps frame-src, portal noindex/no-store
├── tailwind.config.ts
├── .env.example
└── tsconfig.json
```

---

## 5.2 Core Frontend Modules

| Module / Utility           | Responsibility                                                                        |
| :------------------------- | :------------------------------------------------------------------------------------ |
| `lib/api.ts`               | Typed `apiFetch()` client with Bearer auth, 401 refresh rotation, and error unwrapping |
| `context/ThemeContext.tsx` | Persistent Light (default) / Dark Cinematic theme switching                           |
| `lib/download-order-slip.ts`| Client-side Canvas Cash Memo PNG renderer + embedded QR order tracking link          |
| `components/shared/StoreCheckoutModal.tsx` | 2-step Gear Bag -> Delivery/Payment modal + `IFG-****` Student ID check |
| `next.config.mjs`          | CSP (`frame-src` for Google Maps), `X-Frame-Options: DENY`, `camera=(self)`, GZIP     |

---

← [04. System Architecture](./SYSTEM_ARCHITECTURE.md) · Next: [06. Backend Structure →](./BACKEND_STRUCTURE.md)

# ICON FITNESS GYM

> **Full-Stack Gym Platform, Gear Store, QR Order Tracking, Smart Access Control & Operations ERP**  
> **Location:** Ashkona Main Road, Dakshinkhan, Dhaka-1230, Bangladesh  
> **Stack:** `Next.js 14` · `React 18` · `NestJS 10` · `Prisma 5.22` · `PostgreSQL 16`

---

## Platform Overview

**Icon Fitness Gym** unifies five connected experiences under a single **Role-Based Access Control (RBAC)** architecture and **`Asia/Dhaka` (`UTC+06:00`)** operational engine:

| Module / Portal         | Target Users                    | Key Capabilities                                                              |
| :---------------------- | :------------------------------ | :---------------------------------------------------------------------------- |
| **Public Site & Store** | Visitors, Buyers, Walk-ins      | CMS showcase, plans, schedules, Gear Store, delivery, QR order/receipt verify |
| **Member Portal**       | Active Gym Students (`MEMBER`)  | Membership tracking, class booking, workouts, Face ID consent, Member Store   |
| **Trainer Portal**      | Coaches (`TRAINER`)             | Assigned clients (KYC-redacted), class attendance, workout builder, check-ins |
| **Admin ERP Console**   | `STAFF`, `ADMIN`, `SUPER_ADMIN` | Recharts analytics, Store POS, CRM, HRM payroll, CMS, permissions, audit logs |
| **Smart Gate Engine**   | Biometric Terminals & Staff     | AES-256-GCM templates, replay guard, Ladies-Only trainer check-in lock        |

---

## Tech Stack Summary

### Frontend (`/frontend`)
- **Framework:** `Next.js 14.2.35` (App Router), `React 18.3.1`, `TypeScript 5.7.2`
- **Design & Theming:** `Tailwind CSS 3.4.17` with Dual-Theme tokens via `ThemeContext` (Light default + Dark Cinematic toggle)
- **Typography:** `Anton` (Display) · `Inter` (UI/Body) · `Space Grotesk` (Metrics & Numerals)
- **UI & Utilities:** `lucide-react`, `motion`, `recharts`, `qrcode`, Canvas PNG Cash Memo generator (`download-order-slip.ts`)
- **E2E Testing:** `@playwright/test`

### Backend (`/backend`)
- **Framework:** `NestJS 10.4.15` (Global REST prefix `/api/v1`), `TypeScript 5.7.2`
- **Database:** `PostgreSQL 16` via `Prisma ORM 5.22.0` (`41` normalized models across `10` domains)
- **Security & Auth:** JWT (`15m`) + SHA-256 Refresh Token Rotation (`7d`), `bcryptjs` (`12` rounds), 5-attempt lockout, `@StrictRoles()`, `18` delegatable `PermissionKey` overrides, `SanitizeInputPipe`, `Helmet`, `@nestjs/throttler`
- **API Docs & Health:** Swagger (`/api/docs`, non-prod opt-in) & `GET /api/v1/health` DB readiness probe
- **Testing:** `Jest` (`4` suites, `49` regression tests)

---

## Repository Layout

```text
icon-fitness-gym/
├── backend/                     # NestJS 10 REST API (25 modules) & Prisma ORM (41 models)
├── frontend/                    # Next.js 14 App Router UI (Public, Store, Member, Trainer, Admin)
├── docs/                        # 23 structured architecture, API, security & operations guides
├── docker-compose.yml           # Local PostgreSQL 16 & Redis 7 services
├── .env.example                 # Root environment template
├── backend/.env.example         # Backend environment template
├── frontend/.env.example        # Frontend environment template
├── PRODUCTION_READINESS_REPORT.md
└── README.md
```

---

## Quick Start

> [!IMPORTANT]
> Never commit real `.env`, `backend/.env`, or `frontend/.env.local` files to Git. Start from the provided `.env.example` templates and configure strong random 64-byte secrets before booting outside `test` mode.

### 1. Prerequisites
- **Node.js** `>= 20.x`
- **PostgreSQL** `>= 15` (Local service or `docker compose up -d`)

### 2. Backend Setup (`:4000`)
```bash
cd backend
npm install
npx prisma generate
npx prisma db push               # Sync all 41 schema models to PostgreSQL
npx prisma db seed               # Seed demo RBAC users, Ashkona sessions, plans & store items
npm run start:dev
```
- **API Base:** `http://localhost:4000/api/v1`
- **Health Check:** `http://localhost:4000/api/v1/health`
- **Swagger UI:** `http://localhost:4000/api/docs` *(when `NODE_ENV !== 'production'` and `ENABLE_SWAGGER=true`)*

### 3. Frontend Setup (`:3000`)
```bash
cd frontend
npm install
npm run dev
```
- **Web App:** `http://localhost:3000`

### 4. Verification Commands
```bash
# Backend checks
cd backend && npx prisma validate && npx tsc --noEmit && npm run build && npm test

# Frontend checks
cd frontend && npx tsc --noEmit && npm run lint && npm run build
```

---

## Documentation Index (`/docs`)

### Architecture & Product Specs
| #  | Document                                                      | Scope                                                        |
| :- | :------------------------------------------------------------ | :----------------------------------------------------------- |
| 01 | [PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)               | Vision, personas, portals & Ashkona session schedule         |
| 02 | [REQUIREMENTS.md](docs/REQUIREMENTS.md)                       | Functional & non-functional system specifications            |
| 03 | [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)                     | Dual Light/Dark color tokens, typography & shared components |
| 04 | [SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md)         | Architecture diagram, guard pipeline & envelope conventions  |
| 05 | [FRONTEND_STRUCTURE.md](docs/FRONTEND_STRUCTURE.md)           | Next.js App Router tree, components, CSP & headers           |
| 06 | [BACKEND_STRUCTURE.md](docs/BACKEND_STRUCTURE.md)             | NestJS 25-module layout, guards, pipes & test suites         |

### Database, API & Business Logic
| #  | Document                                                      | Scope                                                        |
| :- | :------------------------------------------------------------ | :----------------------------------------------------------- |
| 07 | [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)                 | Complete catalog of 41 Prisma models & enums                 |
| 08 | [DATABASE_RELATIONSHIPS.md](docs/DATABASE_RELATIONSHIPS.md)   | Mermaid ER diagram, foreign keys, cascades & indexes         |
| 09 | [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)             | Full `/api/v1` REST endpoint reference                       |
| 10 | [AUTHENTICATION_AND_RBAC.md](docs/AUTHENTICATION_AND_RBAC.md) | JWT rotation, lockout, `@StrictRoles()` & 18 permissions     |
| 11 | [BUSINESS_RULES.md](docs/BUSINESS_RULES.md)                   | Memberships, Store & Delivery, CRM, HRM & access policies    |

### Smart Access Control & Ashkona Operations
| #  | Document                                                                    | Scope                                                     |
| :- | :-------------------------------------------------------------------------- | :-------------------------------------------------------- |
| 12 | [SMART_ACCESS_CONTROL.md](docs/SMART_ACCESS_CONTROL.md)                     | 7-step authoritative face verification & door relay flow  |
| 13 | [ACCESS_CONTROL_API.md](docs/ACCESS_CONTROL_API.md)                         | Turnstile, heartbeat, biometrics & session REST endpoints |
| 14 | [BIOMETRIC_PRIVACY_AND_SECURITY.md](docs/BIOMETRIC_PRIVACY_AND_SECURITY.md) | Opt-in consent, AES-256-GCM encryption & data erasure     |
| 15 | [FACE_RECOGNITION_INTEGRATION.md](docs/FACE_RECOGNITION_INTEGRATION.md)     | Vendor adapters, timing-safe API keys & simulation badges |
| 16 | [GYM_SESSION_RULES.md](docs/GYM_SESSION_RULES.md)                           | Ashkona `Asia/Dhaka` schedule & `01:00–03:30 PM` Ladies   |
| 17 | [HARDWARE_SETUP_GUIDE.md](docs/HARDWARE_SETUP_GUIDE.md)                     | Terminal commissioning, offline fallback & break-glass    |
| 18 | [MEMBERSHIP_ACCESS_POLICY.md](docs/MEMBERSHIP_ACCESS_POLICY.md)             | End-of-day expiry semantics (`23:59:59.999+06:00`)        |

### Delivery, DevOps & Release History
| #  | Document                                                  | Scope                                                |
| :- | :-------------------------------------------------------- | :--------------------------------------------------- |
| 19 | [DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md)     | Phase 1–10 milestones and delivery status            |
| 20 | [TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md)           | Jest suites (`49/49`), static checks & Playwright    |
| 21 | [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)           | Production checklist, DB sync, healthcheck & backups |
| 22 | [ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) | `.env` keys & fail-closed startup secret checks      |
| 23 | [CHANGELOG.md](docs/CHANGELOG.md)                         | Release history from `v1.0.0` to `v1.3.0`            |

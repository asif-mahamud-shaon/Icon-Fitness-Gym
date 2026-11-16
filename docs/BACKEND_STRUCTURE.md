# 06. Backend Structure (`/backend`)

> NestJS 10 REST API (`/api/v1`) containing `25` modular domain packages, global security guards, and Jest test suites.

---

## 6.1 Directory Layout

```text
backend/
├── prisma/
│   ├── schema.prisma                    # Normalized 41-model PostgreSQL schema across 10 domains
│   ├── migrations/                      # Historical SQL migration baselines
│   └── seed.ts                          # Configurable gym settings, Ashkona sessions, plans, classes & store
│
├── src/
│   ├── common/
│   │   ├── decorators/                  # @Roles(), @StrictRoles(), @RequirePermission(), @CurrentUser(), @Public()
│   │   ├── permissions/                 # permissions.constants.ts (18 delegatable keys & resolver)
│   │   ├── pipes/                       # SanitizeInputPipe (XSS/script stripping)
│   │   ├── security/                    # secrets.util.ts (fail-closed startup validation)
│   │   ├── filters/                     # GlobalHttpExceptionFilter
│   │   ├── guards/                      # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/                # ResponseTransformInterceptor
│   │   └── dto/                         # PaginationQueryDto
│   │
│   ├── prisma/                          # Global PrismaModule & PrismaService
│   │
│   ├── modules/                         # 25 Domain Feature Modules
│   │   ├── access-control/              # Smart Face Recognition, Biometrics, Devices & Gender Sessions
│   │   ├── attendance/                  # Class attendance tracking
│   │   ├── audit-logs/                  # Immutable administrative & security audit trail
│   │   ├── auth/                        # JWT, SHA-256 RefreshToken rotation, lockout, password reset
│   │   ├── bookings/                    # Concurrency-locked class bookings (Asia/Dhaka cutoff)
│   │   ├── classes/                     # Gym classes & facility definitions
│   │   ├── crm/                         # Leads pipeline, Retention Radar, CrmActivity & scorecard
│   │   ├── exercises/                   # Exercise catalog
│   │   ├── gallery/                     # Facility gallery & URL validation
│   │   ├── health/                      # Public PostgreSQL readiness endpoint (/api/v1/health)
│   │   ├── hrm/                         # Employee roster, monthly payroll & utility expenses
│   │   ├── inquiries/                   # Public contact inquiry inbox
│   │   ├── members/                     # Member profiles, KYC redaction & registration approval
│   │   ├── membership-plans/            # Configurable plans & discounts
│   │   ├── memberships/                 # Subscriptions, renewals & Dhaka EOD expiration
│   │   ├── notifications/               # In-app notifications
│   │   ├── payments/                    # Manual payment verification, QR receipts & bounded refunds
│   │   ├── reports/                     # Executive SQL KPIs & RFC-4180 CSV exports
│   │   ├── schedules/                   # Weekly class timetable & capacities
│   │   ├── settings/                    # Singleton GymSettings & websiteConfigJson CMS
│   │   ├── store/                       # Store catalog, POS, Online Delivery, Student verify & promo codes
│   │   ├── testimonials/                # Member review moderation
│   │   ├── trainers/                    # Trainer profiles & trainer portal dashboard
│   │   ├── users/                       # Admin user CRUD, roles, status revocation & 18 permissions
│   │   └── workouts/                    # Workout programs & member assignments
│   │
│   ├── business-rules.spec.ts           # Core gym & RBAC business logic tests
│   ├── access-control.spec.ts           # 17-scenario Smart Access Control & Dhaka session suite
│   ├── permissions.spec.ts              # 18-key delegatable permission resolution tests
│   ├── security-hardening.spec.ts       # Security regression suite (@StrictRoles, PII redaction, lockout)
│   ├── app.module.ts                    # Global ThrottlerGuard, JwtAuthGuard, RolesGuard + 25 modules
│   └── main.ts                          # Bootstrap, Helmet, CORS, GZIP, ValidationPipe, Swagger
│
├── Dockerfile
├── nest-cli.json
├── package.json
├── .env.example
└── tsconfig.json
```

---

## 6.2 Request Lifecycle Pipeline (`main.ts` + `AppModule`)

```text
Incoming HTTP Request
  ├── Express Middleware ──> Helmet CSP/Frameguard · CORS Allowlist · Payload Size Cap · GZIP (> 1KB)
  ├── Global Pipes       ──> SanitizeInputPipe (XSS trim) -> ValidationPipe (whitelist + transform)
  ├── Global Guards      ──> ThrottlerGuard -> JwtAuthGuard -> RolesGuard (@StrictRoles / @RequirePermission)
  ├── Controller/Service ──> Prisma ORM Transaction + Ownership Check + AuditLog
  └── Response/Error     ──> ResponseTransformInterceptor / GlobalHttpExceptionFilter (JSON Envelope)
```

---

← [05. Frontend Structure](./FRONTEND_STRUCTURE.md) · Next: [07. Database Schema →](./DATABASE_SCHEMA.md)

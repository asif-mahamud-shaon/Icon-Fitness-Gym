# 20. Testing Strategy

> Automated verification pyramid spanning Jest business/security suites, static type/lint checks, and Playwright E2E coverage.

---

## 20.1 Test Suite Coverage

| Suite / Layer                 | Scope & Verified Guarantees                                                          |
| :---------------------------- | :----------------------------------------------------------------------------------- |
| `business-rules.spec.ts`      | Payment separation, atomic receipts, class capacity locks, renewal history, RBAC     |
| `access-control.spec.ts`      | `17` scenarios: Dhaka `23:59:59.999` expiry, Ladies-Only Female Trainer check, replay/IDOR |
| `permissions.spec.ts`         | Resolution & normalization of all `18` delegatable `PermissionKey` overrides         |
| `security-hardening.spec.ts`  | `@StrictRoles()`, Store PII redaction, waiver anti-spoofing, lockout, heartbeat keys |
| `icon-fitness.spec.ts` *(E2E)*| Playwright end-to-end flows across Public routes, Auth, Member, Trainer & Admin      |

---

## 20.2 Suite Highlights

### Backend Unit & Security Regression (`4` Suites · `49/49` Tests)
- **Memberships & Bookings:** Confirms `PENDING` payments never activate access, atomic receipts write `AuditLog`, duplicate bookings reject (`409`), capacity overflows fail closed (`400`), and cancellations release seats (`bookedCount - 1`).
- **Smart Access Control (`17` Scenarios):** Verifies `GRANTED`/`DENIED` codes, `FEMALE_SESSION_RESTRICTED`, `FEMALE_TRAINER_UNAVAILABLE`, offline fail-secure locks (`DEVICE_UNAVAILABLE`), idempotent replay handling, constant-time API key verification, and software-independent emergency exits.
- **Security Hardening:** Verifies `@StrictRoles()` blocks `STAFF` on Admin actions, `/store/members/verify` redacts PII, guest `IFG-****` waivers reject unmatched phone claims, suspended users fail refresh, 5 failed logins trigger lockout, and Trainers cannot read KYC/biometric fields or mutate Admin workouts.

### Frontend Static Analysis & Build
- Strict TypeScript type-checking (`tsc --noEmit`) across App Router components and API clients.
- Next.js ESLint (`npm run lint`) with zero errors and zero hook-dependency warnings.
- Production compilation (`npm run build`) verifying static/dynamic App Router generation.

---

## 20.3 Execution Commands

```bash
# Backend schema, typecheck, production build & Jest suites
cd backend
npx prisma validate
npx tsc --noEmit
npm run build
npm test

# Frontend typecheck, ESLint, production build & Playwright E2E
cd frontend
npx tsc --noEmit
npm run lint
npm run build
npx playwright test
```

---

← [19. Development Roadmap](./DEVELOPMENT_ROADMAP.md) · Next: [21. Deployment Guide →](./DEPLOYMENT_GUIDE.md)

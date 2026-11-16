# 21. Deployment Guide & Backup Strategy

> Production topology, environment hardening, PostgreSQL 16 synchronization, health verification, and disaster recovery.

---

## 21.1 Production Topology

| Tier           | Runtime / Target                                | Notes                                                   |
| :------------- | :---------------------------------------------- | :------------------------------------------------------ |
| **Frontend**   | Next.js 14 (`frontend/Dockerfile` or Vercel)    | Serves `.next` via `npm run start` (`compress: true`)   |
| **Backend**    | NestJS 10 Node 20 (`backend/Dockerfile`)        | Executes `node dist/main.js` (`trust proxy: 1`)         |
| **Database**   | PostgreSQL 16+                                  | Normalized `41`-model schema + daily `pg_dump` backups  |
| **Proxy / TLS**| Nginx or Cloudflare                             | TLS 1.3, HTTP/2, HSTS & edge rate limiting              |

---

## 21.2 Step-by-Step Cutover Checklist

### 1. Harden Environment Variables
Review [`ENVIRONMENT_VARIABLES.md`](./ENVIRONMENT_VARIABLES.md) and verify:
- `NODE_ENV=production`, `ALLOW_DEV_RESET_TOKEN=false`, `ENABLE_SWAGGER=false`, `TZ=Asia/Dhaka`
- Distinct 64-byte hex secrets for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `BIOMETRIC_ENCRYPTION_KEY`, and `BIOMETRIC_HASH_SALT`
- Production HTTPS origins in `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_SITE_URL`

### 2. Clean Install, Audit & Build (Online CI / Host)
```bash
# Backend
cd backend
npm ci && npm audit --omit=dev
npx tsc --noEmit && npm run build && npm test

# Frontend
cd frontend
npm ci && npm audit --omit=dev
npx tsc --noEmit && npm run lint && npm run build
```

### 3. Synchronize PostgreSQL 16 Schema

> [!IMPORTANT]
> `backend/prisma/schema.prisma` includes tables and columns added after the two historical folders in `backend/prisma/migrations/` (`Store*`, `Hrm*`, `Crm*`, `websiteConfigJson`, `permissionsJson`). On fresh or pre-migration production databases, synchronize via `prisma db push` (or generate a baseline migration first).

```bash
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed          # Fresh environments only
```

### 4. Start Services & Probe Health
- **Backend (`npm run start:prod`):** Probe `GET https://<api-host>/api/v1/health` -> expect HTTP `200` (`database: connected`).
- **Frontend (`npm run start`):** Confirm `/contact` renders Ashkona Google Maps (`frame-src`) and `/verify/order/[code]` loads QR tracking cleanly.

---

## 21.3 Automated Backups & Smart Gate Commissioning

```bash
# Daily compressed PostgreSQL snapshot
pg_dump -Fc -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "Icon-Fitness-Gym" > "/backups/icon_fitness_$(date +%Y%m%d_%H%M%S).dump"

# Restore verification
pg_restore -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "Icon-Fitness-Gym" --clean --if-exists /backups/icon_fitness_latest.dump
```

- **Retention:** 7 daily · 4 weekly · 12 monthly encrypted off-site backups.
- **Physical Gate Commissioning:** Register Ashkona terminals in `/admin/access-control/devices`, configure `issuedDeviceApiKeyOnce`, point webhooks to `/access-control/devices/verify-callback` & `/heartbeat`, assign Female Trainer for `01:00 PM – 03:30 PM`, and verify break-glass emergency exits (`emergencyExitIndependent: true`).

---

← [20. Testing Strategy](./TESTING_STRATEGY.md) · Next: [22. Environment Variables →](./ENVIRONMENT_VARIABLES.md)

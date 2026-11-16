# 22. Environment Variables Reference

> Configuration templates (`/.env.example`, `backend/.env.example`, `frontend/.env.example`) and fail-closed startup secret checks.

---

> [!CAUTION]
> Never commit `.env`, `backend/.env`, or `frontend/.env.local` files to version control, and **never** expose private database, JWT, SMTP, or gateway keys inside `NEXT_PUBLIC_*` frontend variables.

---

## 22.1 Fail-Closed Startup Secret Validation

Outside `NODE_ENV=test`, `backend/src/common/security/secrets.util.ts` (`validateSecurityEnvironment`) blocks server boot if any required secret is missing, `< 32` characters, uses placeholder values, or reuses keys:
- `JWT_ACCESS_SECRET` *(must differ from `JWT_REFRESH_SECRET`)*
- `JWT_REFRESH_SECRET`
- `BIOMETRIC_ENCRYPTION_KEY`
- `BIOMETRIC_HASH_SALT`

---

## 22.2 Backend Environment (`backend/.env`)

| Variable                   | Req | Example / Default                                | Purpose                                               |
| :------------------------- | :-: | :----------------------------------------------- | :---------------------------------------------------- |
| `DATABASE_URL`             | Yes | `postgresql://user:pass@localhost:5432/Icon-Fitness-Gym` | PostgreSQL Prisma connection string            |
| `PORT`                     | No  | `4000`                                           | NestJS HTTP listen port                               |
| `NODE_ENV`                 | No  | `production`                                     | `development`, `test`, or `production`                |
| `API_PREFIX`               | No  | `api/v1`                                         | Global REST route prefix                              |
| `CORS_ORIGIN`              | Yes | `http://localhost:3000`                          | Allowed frontend origins (comma-separated)            |
| `JWT_ACCESS_SECRET`        | Yes | *(64-byte hex)*                                  | Access token HMAC signing key                         |
| `JWT_REFRESH_SECRET`       | Yes | *(distinct 64-byte hex)*                         | Refresh token HMAC signing key                        |
| `BIOMETRIC_ENCRYPTION_KEY` | Yes | *(64-byte hex)*                                  | AES-256-GCM biometric encryption key                  |
| `BIOMETRIC_HASH_SALT`      | Yes | *(32–64-byte hex)*                               | HMAC-SHA256 template digest salt                      |
| `JWT_ACCESS_EXPIRES_IN`    | No  | `15m`                                            | Short-lived access token TTL                          |
| `JWT_REFRESH_EXPIRES_IN`   | No  | `7d`                                             | Rotated refresh token TTL                             |
| `BCRYPT_SALT_ROUNDS`       | No  | `12`                                             | `bcryptjs` password work factor                       |
| `ALLOW_DEV_RESET_TOKEN`    | No  | `false`                                          | Must stay `false` in production                       |
| `ENABLE_SWAGGER`           | No  | `false`                                          | Exposes `/api/docs` only when `true` in non-prod      |
| `CLOUDINARY_ENABLED`       | No  | `false`                                          | Enables Cloudinary uploads when keys are configured   |
| `CLOUDINARY_*`             | Cond| `CLOUD_NAME`, `API_KEY`, `API_SECRET`            | Cloudinary credentials                                |
| `REDIS_ENABLED`            | No  | `false`                                          | Enables Redis caching adapter                         |
| `REDIS_*`                  | Cond| `REDIS_HOST=localhost`, `REDIS_PORT=6379`        | Redis host, port & optional password                  |
| `PAYMENT_GATEWAY_ENABLED`  | No  | `false`                                          | `false` = manual TrxID verify; `true` = gateway       |
| `SSLCOMMERZ_*`             | Cond| `STORE_ID`, `STORE_PASSWD`, `IS_LIVE=false`      | Live payment gateway credentials                      |
| `TZ`                       | No  | `Asia/Dhaka`                                     | Session timetable & end-of-day expiry timezone (`+06`)|

---

## 22.3 Frontend Environment (`frontend/.env.local`)

| Variable                   | Req | Example / Default                        | Purpose                                                |
| :------------------------- | :-: | :--------------------------------------- | :----------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`      | Yes | `http://localhost:4000/api/v1`           | Public backend API URL (used by client & CSP `connect-src`) |
| `NEXT_PUBLIC_SITE_URL`     | Yes | `http://localhost:3000`                  | Canonical site URL for SEO, Open Graph & `sitemap.xml` |
| `NEXT_PUBLIC_GYM_NAME`     | No  | `Icon Fitness Gym`                       | Public brand display name                              |
| `NEXT_PUBLIC_GYM_LOCATION` | No  | `Ashkona, Dakshinkhan, Dhaka, Bangladesh`| Public facility location label                         |
| `INTERNAL_API_URL`         | No  | `http://localhost:4000/api/v1`           | Server-only SSR API base URL (never bundled to client) |

---

← [21. Deployment Guide](./DEPLOYMENT_GUIDE.md) · Next: [23. Changelog →](./CHANGELOG.md)

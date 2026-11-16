# 09. REST API Documentation (`/api/v1`)

> **Base URL:** `http://localhost:4000/api/v1` · **Health:** `GET /api/v1/health`  
> **Swagger UI:** `http://localhost:4000/api/docs` *(active when `NODE_ENV !== 'production'` & `ENABLE_SWAGGER=true`)*  
> **Auth Header:** `Authorization: Bearer <accessToken>` *(Protected by `JwtAuthGuard` + `RolesGuard`)*

---

## 9.1 Core System & Authentication

### Health & Auth (`/health`, `/auth`)
| Method  | Endpoint                | Access        | Purpose                                                           |
| :------ | :---------------------- | :------------ | :---------------------------------------------------------------- |
| `GET`   | `/health`               | `@Public`     | PostgreSQL `SELECT 1` readiness probe (`200 OK` / `503 Down`)     |
| `POST`  | `/auth/register`        | `@Public`     | Register `User` + `MemberProfile` + optional pending `Membership` |
| `POST`  | `/auth/login`           | `@Public`     | Login w/ 5-attempt per-email lockout; returns JWT + refresh token |
| `POST`  | `/auth/refresh`         | `@Public`     | Rotate SHA-256 refresh token; blocks suspended/deleted accounts   |
| `POST`  | `/auth/logout`          | `@Public`     | Revoke refresh token in DB                                        |
| `POST`  | `/auth/forgot-password` | `@Public`     | Generate password reset token                                     |
| `POST`  | `/auth/reset-password`  | `@Public`     | Reset password via token & revoke active refresh tokens           |
| `PATCH` | `/auth/change-password` | Authenticated | Change own password (letter + digit) & revoke existing tokens     |
| `GET`   | `/auth/me`              | Authenticated | Fetch current user profile & resolved `permissions`               |

### Users & Delegatable Permissions (`/users`)
| Method  | Endpoint                   | Access                  | Purpose                                               |
| :------ | :------------------------- | :---------------------- | :---------------------------------------------------- |
| `GET`   | `/users`                   | `ADMIN`, `SUPER_ADMIN`  | Paginated user list filterable by role & status       |
| `GET`   | `/users/permissions/catalog`| `ADMIN`, `SUPER_ADMIN` | Lists all `18` delegatable `PermissionKey` modules    |
| `POST`  | `/users`                   | `SUPER_ADMIN`           | Create admin/staff/trainer user (`CreateAdminUserDto`)|
| `PATCH` | `/users/:id/role`          | `SUPER_ADMIN`           | Change user role                                      |
| `PATCH` | `/users/:id/status`        | `ADMIN`, `SUPER_ADMIN`  | Activate, suspend, or deactivate (revokes sessions)   |
| `PATCH` | `/users/:id/permissions`   | `ADMIN`, `SUPER_ADMIN`  | Grant or revoke per-user `permissionsJson` overrides  |

---

## 9.2 Members, Trainers, Memberships & Payments

### Members & Trainers (`/members`, `/trainers`)
| Method  | Endpoint                 | Access                               | Purpose                                               |
| :------ | :----------------------- | :----------------------------------- | :---------------------------------------------------- |
| `GET`   | `/members/me`            | `MEMBER`                             | Self-portal dashboard & profile payload               |
| `PATCH` | `/members/me`            | `MEMBER`                             | Update own profile, health notes & sanitized URLs     |
| `GET`   | `/members`               | `STAFF+`, `TRAINER` *(assigned)*     | Search/filter member directory                        |
| `GET`   | `/members/:id`           | Self, `STAFF+`, `TRAINER` *(redacted)*| Member detail (`nidNumber`/biometrics hidden from Trainers) |
| `POST` / `PATCH` | `/members`, `/members/:id`, `/members/:id/approve` | `STAFF+` (`members`) | Walk-in registration, edits, trainer assignment & approval |
| `GET`   | `/trainers/public`, `/trainers/public/:slug` | `@Public`        | Active public trainer profiles                        |
| `GET`   | `/trainers/me/dashboard` | `TRAINER`                            | Assigned members, classes & workout stats             |
| `GET` / `POST` / `PATCH` | `/trainers`, `/trainers/:id/details`, `/trainers/:id` | `ADMIN+` / Self | Manage trainers (self-edit blocks `isFeatured`/`isActive`) |

### Plans, Memberships & Payments (`/membership-plans`, `/memberships`, `/payments`)
| Method  | Endpoint                         | Access                          | Purpose                                                     |
| :------ | :------------------------------- | :------------------------------ | :---------------------------------------------------------- |
| `GET`   | `/membership-plans/public`       | `@Public`                       | Active public pricing tiers                                 |
| `POST` / `PATCH` | `/membership-plans`, `/:id` | `@StrictRoles(SUPER_ADMIN, ADMIN)` | Create/update plans                                       |
| `GET`   | `/memberships/my`                | `MEMBER`                        | Member memberships (evaluates `Asia/Dhaka` EOD cutoff)      |
| `POST`  | `/memberships/renewal-request`   | `MEMBER`                        | Submit renewal or plan upgrade request                      |
| `GET` / `POST` / `PATCH` | `/memberships`, `/:id/status`, `/:id/renew` | `STAFF+` (`memberships`) | Manage subscriptions & renewal chains                 |
| `GET`   | `/payments/receipts/verify/:code`| `@Public`                       | Public QR receipt check (masked transaction ref)            |
| `GET` / `POST` / `PATCH` | `/payments/my`, `/payments`, `/:id/my` | `MEMBER` / `STAFF+` | Submit & update pending payment claims                      |
| `PATCH` | `/payments/:id/verify`           | `STAFF+` (`payments`)           | Mark `VERIFIED_PAID`, issue `PaymentReceipt` & activate plan|
| `PATCH` | `/payments/:id/refund`           | `@StrictRoles(SUPER_ADMIN, ADMIN)`| Bounded refund (`<= netAmountBdt`)                        |
| `GET`   | `/payments/:id/receipt`          | `MEMBER` *(owner)* or `STAFF+`  | Structured receipt payload                                  |

---

## 9.3 Icon Gear Store & Online Delivery (`/store`)

| Method  | Endpoint                        | Access                            | Purpose                                                  |
| :------ | :------------------------------ | :-------------------------------- | :------------------------------------------------------- |
| `GET`   | `/store/products`, `/products/:slug` | `@Public`                    | Public Pro-Shop catalog & item detail                    |
| `GET`   | `/store/members/verify`         | `@Public` *(12/min throttle)*     | Redacted Gym ID check (`fullName`, `maskedPhone`, plan)  |
| `GET`   | `/store/members/verify-auth`    | Authenticated                     | Full auto-fill for owning member or `STAFF+` POS         |
| `POST`  | `/store/discount-codes/validate`| `@Public`                         | Validate promo coupon against order subtotal             |
| `POST`  | `/store/orders`                 | `@Public`                         | Place guest/student order (Delivery `৳80`/`৳150`, `৳500` adv)|
| `POST` / `GET` | `/store/orders/member`, `/orders/my` | Authenticated               | Place authenticated order & view personal order history  |
| `GET`   | `/store/orders/verify/:code`    | `@Public`                         | Public 4-stage live QR tracking & masked Cash Memo check |
| `GET` / `POST` / `PATCH` | `/store/admin/products` | `STAFF+` (`store`)        | Manage inventory, SKU & buying/selling prices            |
| `DELETE`| `/store/admin/products/:id`     | `@StrictRoles(SUPER_ADMIN, ADMIN)`| Delete product safely                                    |
| `GET` / `PATCH` | `/store/admin/orders`, `/:id/status` | `STAFF+` (`store`)     | Process POS/online orders & auto-restock on cancellation |
| `CRUD`  | `/store/admin/discount-codes`   | `@StrictRoles(SUPER_ADMIN, ADMIN)`| Create, update, deactivate & delete promo codes          |

---

## 9.4 CRM, HRM, Training, Classes, Content & Audit Logs

| Module       | Base Route     | Key Endpoints & Permissions                                                                 |
| :----------- | :------------- | :------------------------------------------------------------------------------------------ |
| **CRM**      | `/crm`         | `overview`, `leads`, `leads/import-inquiries`, `retention`, `activities`, `scorecard` (`STAFF+`); `DELETE /leads/:id` (`@StrictRoles(ADMIN+)`) |
| **HRM**      | `/hrm`         | `overview`, `employees` CRUD, `salaries` CRUD + `/:id/status`, `expenses` CRUD (`ADMIN+` or `hrm` permission) |
| **Exercises**| `/exercises`   | `GET` list; `POST`/`PATCH` (`TRAINER`, `ADMIN+`)                                            |
| **Workouts** | `/workouts`    | `public`, `public/:slug`, `my`, CRUD, `assign`, `assignments/:id`                           |
| **Classes**  | `/classes`     | `public`, `facilities/public`, `facilities` (`@StrictRoles(ADMIN+)` write), `classes`       |
| **Schedules**| `/schedules`   | `public` live seat counts, `GET`, `POST`/`PATCH` (`@StrictRoles(ADMIN+)`)                   |
| **Bookings** | `/bookings`    | `my`, `GET`, `POST` (concurrency capacity lock), `/:id/cancel` (`Asia/Dhaka` cutoff)        |
| **Attendance**| `/attendance` | `GET` & `POST` class attendance (`TRAINER`, `STAFF+`)                                       |
| **Gallery**  | `/gallery`     | `public`, `GET`; `POST`/`PATCH`/`DELETE` (`@StrictRoles(ADMIN+)`)                           |
| **Reviews**  | `/testimonials`| `public`, `GET`, `POST` (`MEMBER`, `STAFF+`); `PATCH`/`DELETE` (`@StrictRoles(ADMIN+)`)     |
| **Inquiries**| `/inquiries`   | `POST /public`, `GET`, `PATCH` (`STAFF+`)                                                   |
| **Alerts**   | `/notifications`| `GET /my`, `PATCH /:id/read`, `PATCH /read-all`                                            |
| **Reports**  | `/reports`     | `GET /overview` (`STAFF+`); `GET /export/:type` CSV (`@StrictRoles(ADMIN+)`)                |
| **Settings** | `/settings`    | `GET /public`, `GET` (`STAFF+`); `PATCH` (`@StrictRoles(ADMIN+)` + `website_cms`)           |
| **Audit**    | `/audit-logs`  | `GET` immutable compliance & security events (`ADMIN`, `SUPER_ADMIN`)                       |
| **Gate API** | `/access-control` | See full spec in [`ACCESS_CONTROL_API.md`](./ACCESS_CONTROL_API.md)                      |

---

← [08. Database Relationships](./DATABASE_RELATIONSHIPS.md) · Next: [10. Authentication & RBAC →](./AUTHENTICATION_AND_RBAC.md)

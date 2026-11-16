# 10. Authentication & Role-Based Access Control (RBAC)

> Multi-layered JWT authentication, brute-force protection, `@StrictRoles()`, `18` delegatable permissions, and IDOR isolation.

---

## 10.1 Authentication & Session Lifecycle

1. **Password Security**  
   Passwords are hashed via `bcryptjs` (`12` rounds). Create/change DTOs require `>= 8` characters with both letters and numbers.

2. **Brute-Force Lockout (`AuthService`)**  
   `5` consecutive failed login attempts per normalized email trigger a temporary account lockout and record a security event in `AuditLog`.

3. **Access Token (JWT)**  
   Signed with `JWT_ACCESS_SECRET` (`15m` TTL). `JwtStrategy` validates live DB user status on every request, blocking `SUSPENDED`, `DEACTIVATED`, or soft-deleted users immediately.

4. **SHA-256 Refresh Token Rotation & Revocation**  
   - Refresh tokens (`7d` TTL, `JWT_REFRESH_SECRET`) are stored solely as SHA-256 digests (`RefreshToken.tokenHash`).
   - `POST /auth/refresh` revokes old tokens via `replacedByTokenHash`; reuse of a revoked token invalidates all user sessions.
   - `PATCH /auth/change-password` and `PATCH /users/:id/status` (suspend/deactivate) revoke every active refresh token immediately.

---

## 10.2 Hybrid RBAC + `@StrictRoles()` + 18 Permission Keys

**Role Hierarchy:** `SUPER_ADMIN` > `ADMIN` > `STAFF` > `TRAINER` > `MEMBER`

### How `RolesGuard` Resolves Access
1. **`@Public()`** routes bypass authentication & role checks.
2. **`SUPER_ADMIN`** always receives full unrestricted authorization.
3. **`@StrictRoles()` Enforcement:** Sensitive Admin routes carrying `@StrictRoles()` alongside `@Roles(SUPER_ADMIN, ADMIN)` reject lower roles (such as `STAFF`) **before** evaluating delegatable permissions—even if `STAFF` holds that module permission.
4. **Granular Permission Overrides (`User.permissionsJson`):** Admins/Super Admins can toggle any of `18` keys per employee in `/admin/users`:
   - **Operations:** `overview`, `members`, `memberships`, `payments`, `store`, `hrm`, `crm`, `trainers`, `workouts`, `classes`, `attendance`
   - **Biometrics & Gate:** `access_control`, `access_settings`
   - **Content & Website:** `content`, `website_cms`
   - **Administration:** `reports`, `users_access`, `audit_logs`

### Role Permissions Matrix

| Capability / Module                         | `PUBLIC` | `MEMBER` | `TRAINER` | `STAFF`      | `ADMIN` | `SUPER_ADMIN` |
| :------------------------------------------ | :------: | :------: | :-------: | :----------- | :-----: | :-----------: |
| Public Site, Store & QR Tracking            | Yes      | Yes      | Yes       | Yes          | Yes     | Yes           |
| Member Portal, Bookings & Self Biometrics   | No       | Self     | No        | Assist       | Full    | Full          |
| Trainer Portal & Assigned Workouts          | No       | Own View | Assigned  | View         | Full    | Full          |
| Class Attendance & Ladies Check-In          | No       | No       | Assigned  | Full\*       | Full    | Full          |
| Members, Store POS, Payments, CRM, Inquiries| No       | No       | No        | Permitted\*  | Full    | Full          |
| Refunds, Promo Codes, CSVs, CMS & Deletes   | No       | No       | No        | **Denied**   | Full    | Full          |
| HRM Payroll & Facility Utility Expenses     | No       | No       | No        | Denied\*\*   | Full    | Full          |
| Create Admin/Staff & Modify User Roles      | No       | No       | No        | No           | View    | **Full**      |
| Security Audit Logs (`/audit-logs`)         | No       | No       | No        | No           | Read    | **Full**      |

*\*Subject to active `PermissionKey` flags. \*\*Delegatable only if explicitly granted `hrm` permission.*

---

## 10.3 IDOR & PII Confidentiality Controls

- **Member Ownership Isolation:** All `/me` and `/my` routes resolve `memberProfileId` exclusively from `req.user.id`.
- **Store PII Redaction:** Public `/store/members/verify` exposes only `fullName`, `maskedPhone`, `memberCode`, `planName`, and `validUntil`; full auto-fill requires authenticated ownership via `/store/members/verify-auth`.
- **Trainer Confidentiality:** `MembersService` strips `nidNumber`, `rfidCardNumber`, `biometricEnrollment`, and `accessEvents` from Trainer queries, and blocks Trainers from overwriting Admin workout templates.

---

← [09. API Documentation](./API_DOCUMENTATION.md) · Next: [11. Business Rules →](./BUSINESS_RULES.md)

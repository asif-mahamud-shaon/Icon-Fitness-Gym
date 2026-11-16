import { SetMetadata } from '@nestjs/common';

export const STRICT_ROLES_KEY = 'strictRoles';

/**
 * Requires the authenticated user to hold BOTH one of the endpoint's @Roles(...)
 * AND any @RequirePermission(...) constraints (except SUPER_ADMIN).
 * Prevents default module permissions (e.g. STAFF having 'store' or 'crm')
 * from bypassing ADMIN/SUPER_ADMIN-only sub-operations such as refunds, deletions,
 * or promo code creation.
 */
export const StrictRoles = () => SetMetadata(STRICT_ROLES_KEY, true);

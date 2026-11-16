import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, UserStatus } from '@prisma/client';
import { RolesGuard } from './common/guards/roles.guard';
import { ROLES_KEY } from './common/decorators/roles.decorator';
import { IS_PUBLIC_KEY } from './common/decorators/public.decorator';
import { PERMISSION_KEY } from './common/decorators/require-permission.decorator';
import {
  ALL_PERMISSION_KEYS,
  resolveEffectivePermissions,
} from './common/permissions/permissions.constants';
import { AuthenticatedUser } from './common/decorators/current-user.decorator';

describe('Employee Granular Access Matrix & RolesGuard Enforcement', () => {
  it('resolves full permissions for SUPER_ADMIN and empty permissions for MEMBER', () => {
    expect(resolveEffectivePermissions(Role.SUPER_ADMIN, { revoked: ['hrm'] })).toEqual(
      ALL_PERMISSION_KEYS,
    );
    expect(resolveEffectivePermissions(Role.MEMBER, { granted: ['hrm'] })).toEqual([]);
  });

  it('allows expanding STAFF permissions and restricting ADMIN defaults', () => {
    const expandedStaff = resolveEffectivePermissions(Role.STAFF, {
      granted: ['hrm', 'website_cms', 'reports'],
      revoked: [],
    });
    expect(expandedStaff).toContain('hrm');
    expect(expandedStaff).toContain('website_cms');
    expect(expandedStaff).toContain('reports');
    expect(expandedStaff).toContain('payments');

    const restrictedAdmin = resolveEffectivePermissions(Role.ADMIN, {
      granted: [],
      revoked: ['payments', 'users_access'],
    });
    expect(restrictedAdmin).not.toContain('payments');
    expect(restrictedAdmin).not.toContain('users_access');
    expect(restrictedAdmin).toContain('members');
  });

  it('enforces @RequirePermission overrides in RolesGuard (grant & restrict)', () => {
    const buildContext = (user?: AuthenticatedUser) =>
      ({
        getHandler: () => 'handler',
        getClass: () => 'class',
        switchToHttp: () => ({
          getRequest: () => ({ user }),
        }),
      }) as unknown as ExecutionContext;

    const reflector = {
      getAllAndOverride: (key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return [Role.SUPER_ADMIN, Role.ADMIN];
        if (key === PERMISSION_KEY) return ['hrm'];
        return undefined;
      },
    } as unknown as Reflector;

    const guard = new RolesGuard(reflector);

    // STAFF explicitly granted 'hrm' can access endpoint even though @Roles lists SUPER_ADMIN & ADMIN
    expect(
      guard.canActivate(
        buildContext({
          id: 'staff-1',
          email: 'staff@icon.fit',
          fullName: 'Staff User',
          role: Role.STAFF,
          status: UserStatus.ACTIVE,
          permissions: resolveEffectivePermissions(Role.STAFF, {
            granted: ['hrm'],
            revoked: [],
          }),
        }),
      ),
    ).toBe(true);

    // ADMIN whose 'hrm' permission was restricted is blocked
    expect(() =>
      guard.canActivate(
        buildContext({
          id: 'admin-1',
          email: 'admin@icon.fit',
          fullName: 'Restricted Admin',
          role: Role.ADMIN,
          status: UserStatus.ACTIVE,
          permissions: resolveEffectivePermissions(Role.ADMIN, {
            granted: [],
            revoked: ['hrm'],
          }),
        }),
      ),
    ).toThrow(ForbiddenException);

    // MEMBER is never allowed onto permission-gated admin endpoint
    expect(() =>
      guard.canActivate(
        buildContext({
          id: 'member-1',
          email: 'member@icon.fit',
          fullName: 'Gym Member',
          role: Role.MEMBER,
          status: UserStatus.ACTIVE,
          permissions: [],
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});

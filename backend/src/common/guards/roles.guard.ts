import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { STRICT_ROLES_KEY } from '../decorators/strict-roles.decorator';
import { PermissionKey } from '../permissions/permissions.constants';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const strictRoles = Boolean(
      this.reflector.getAllAndOverride<boolean>(STRICT_ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]),
    );

    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionKey[] | PermissionKey
    >(PERMISSION_KEY, [context.getHandler(), context.getClass()]);
    const normalizedRequired = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : requiredPermissions
        ? [requiredPermissions]
        : [];

    if (
      (!requiredRoles || requiredRoles.length === 0) &&
      normalizedRequired.length === 0
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user) {
      throw new ForbiddenException('User context missing for role authorization.');
    }

    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    if (
      strictRoles &&
      requiredRoles &&
      requiredRoles.length > 0 &&
      !requiredRoles.includes(user.role)
    ) {
      throw new ForbiddenException(
        `Access denied. Role '${user.role}' is not authorized for this administrative operation.`,
      );
    }

    if (normalizedRequired.length > 0 && Array.isArray(user.permissions)) {
      if (user.role === Role.MEMBER) {
        throw new ForbiddenException(
          `Access denied. Role '${user.role}' is not authorized for this resource.`,
        );
      }
      if (normalizedRequired.some((perm) => user.permissions!.includes(perm))) {
        return true;
      }
      throw new ForbiddenException(
        `Access denied. Required permission (${normalizedRequired.join(' or ')}) is disabled for your account.`,
      );
    }

    if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Access denied. Role '${user.role}' is not authorized for this resource.`,
      );
    }

    return true;
  }
}


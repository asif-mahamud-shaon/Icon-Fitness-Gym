import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import {
  PermissionKey,
  PermissionOverrideConfig,
} from '../permissions/permissions.constants';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status: UserStatus;
  memberProfileId?: string | null;
  trainerProfileId?: string | null;
  permissions?: PermissionKey[];
  permissionsConfig?: PermissionOverrideConfig | null;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;
    return data ? user?.[data] : user;
  },
);


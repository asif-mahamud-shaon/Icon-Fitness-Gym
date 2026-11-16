import { SetMetadata } from '@nestjs/common';
import { PermissionKey } from '../permissions/permissions.constants';

export const PERMISSION_KEY = 'required_permission';
export const RequirePermission = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSION_KEY, permissions);

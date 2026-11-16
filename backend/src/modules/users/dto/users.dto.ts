import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role, UserStatus } from '@prisma/client';
import {
  ALL_PERMISSION_KEYS,
  PermissionKey,
} from '../../../common/permissions/permissions.constants';

export class CreateAdminUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(150)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(32)
  phone!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Password must include at least one letter and one number.',
  })
  password!: string;

  @IsEnum(Role)
  role!: Role;
}

export class UpdateUserRoleDto {
  @IsEnum(Role)
  role!: Role;
}

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}

export class UpdateUserPermissionsDto {
  @IsOptional()
  @IsArray()
  @IsIn(ALL_PERMISSION_KEYS, { each: true })
  granted?: PermissionKey[];

  @IsOptional()
  @IsArray()
  @IsIn(ALL_PERMISSION_KEYS, { each: true })
  revoked?: PermissionKey[];

  @IsOptional()
  @IsBoolean()
  reset?: boolean;
}

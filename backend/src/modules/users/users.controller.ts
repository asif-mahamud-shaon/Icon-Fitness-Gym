import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role, UserStatus } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PermissionKey } from '../../common/permissions/permissions.constants';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import {
  CreateAdminUserDto,
  UpdateUserPermissionsDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from './dto/users.dto';

@ApiTags('Users (Admin Management)')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('users_access')
  @ApiOperation({ summary: 'List all platform users with role and status filters' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: Role,
    @Query('status') status?: UserStatus,
  ) {
    return this.usersService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      role,
      status,
    });
  }

  @Get('permissions/catalog')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('users_access')
  @ApiOperation({ summary: 'Get module permission definitions and defaults by role' })
  getPermissionsCatalog() {
    return this.usersService.getPermissionsCatalog();
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create administrative, staff, or trainer user (SUPER_ADMIN only)' })
  async createUser(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body: CreateAdminUserDto,
  ) {
    return this.usersService.createAdminOrStaffUser(actor, body);
  }

  @Patch(':id/role')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update user role (SUPER_ADMIN only)' })
  async updateRole(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole(actor, id, body.role);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('users_access')
  @ApiOperation({ summary: 'Activate, suspend, or deactivate user account' })
  async updateStatus(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: UpdateUserStatusDto,
  ) {
    return this.usersService.updateUserStatus(actor, id, body.status);
  }

  @Patch(':id/permissions')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('users_access')
  @ApiOperation({ summary: 'Grant or restrict module access permissions for an employee' })
  async updatePermissions(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: UpdateUserPermissionsDto,
  ) {
    return this.usersService.updateUserPermissions(actor, id, body);
  }
}


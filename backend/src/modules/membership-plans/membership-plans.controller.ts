import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { StrictRoles } from '../../common/decorators/strict-roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { MembershipPlansService } from './membership-plans.service';

@ApiTags('Membership Plans')
@Controller('membership-plans')
export class MembershipPlansController {
  constructor(
    private readonly membershipPlansService: MembershipPlansService,
  ) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'List approved and active public membership plans' })
  async findPublic() {
    return this.membershipPlansService.findPublic();
  }

  @ApiBearerAuth()
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('memberships')
  @ApiOperation({ summary: 'List all membership plans (including inactive)' })
  async findAllAdmin() {
    return this.membershipPlansService.findAllAdmin();
  }

  @ApiBearerAuth()
  @Post()
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('memberships')
  @ApiOperation({ summary: 'Create a new membership plan' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.membershipPlansService.create(user, body);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('memberships')
  @ApiOperation({ summary: 'Update membership plan details or active status' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.membershipPlansService.update(user, id, body);
  }
}


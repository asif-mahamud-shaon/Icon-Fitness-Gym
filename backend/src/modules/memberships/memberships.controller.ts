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
import { MembershipStatus, Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { MembershipsService } from './memberships.service';

@ApiTags('Memberships')
@ApiBearerAuth()
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get('my')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Get authenticated member current and historical memberships' })
  async findMy(@CurrentUser() user: AuthenticatedUser) {
    return this.membershipsService.findMyMemberships(user.id);
  }

  @Post('renewal-request')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Submit a membership renewal or plan change request' })
  async requestRenewal(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { planId: string; renewalNotes?: string },
  ) {
    return this.membershipsService.requestRenewal(user.id, body);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('memberships')
  @ApiOperation({ summary: 'List all memberships with filters' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: MembershipStatus,
    @Query('search') search?: string,
  ) {
    return this.membershipsService.findAllAdmin({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
      search,
    });
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('memberships')
  @ApiOperation({ summary: 'Create or assign a membership for a member' })
  async createByStaff(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.membershipsService.createByStaff(user, body);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('memberships')
  @ApiOperation({ summary: 'Activate, suspend, cancel, or expire a membership' })
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { status: MembershipStatus; cancellationReason?: string; renewalNotes?: string },
  ) {
    return this.membershipsService.updateStatusByStaff(user, id, body);
  }

  @Post(':id/renew')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('memberships')
  @ApiOperation({ summary: 'Renew a membership while preserving historical records' })
  async renewMembership(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.membershipsService.renewMembershipByStaff(user, id, body);
  }
}


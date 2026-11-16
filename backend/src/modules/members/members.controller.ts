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
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { MembersService } from './members.service';
import { UpdateMyProfileDto } from './dto/members.dto';

@ApiTags('Members')
@ApiBearerAuth()
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get('me')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Get authenticated member portal dashboard and profile' })
  async getMyDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.membersService.getMyDashboard(user.id);
  }

  @Patch('me')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Update authenticated member personal profile' })
  async updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateMyProfileDto,
  ) {
    return this.membersService.updateMyProfile(user.id, body);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.TRAINER)
  @RequirePermission('members')
  @ApiOperation({ summary: 'List and search gym members with optional joining month and payment filters' })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: UserStatus,
    @Query('trainerProfileId') trainerProfileId?: string,
    @Query('joinMonth') joinMonth?: string,
    @Query('paymentStatus') paymentStatus?: string,
  ) {
    return this.membersService.findAll(user, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      status,
      trainerProfileId,
      joinMonth,
      paymentStatus,
    });
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.TRAINER, Role.MEMBER)
  @ApiOperation({ summary: 'Get full member details with history' })
  async findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.membersService.findById(user, id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('members')
  @ApiOperation({ summary: 'Create a new member account from Admin/Staff dashboard' })
  async createMember(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.membersService.createByStaff(user, body);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('members')
  @ApiOperation({ summary: 'Update member information and assigned trainer' })
  async updateMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.membersService.updateMemberByStaff(user, id, body);
  }

  @Patch(':id/approve')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('members')
  @ApiOperation({ summary: 'Approve pending member registration' })
  async approveMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.membersService.approveRegistration(user, id);
  }
}


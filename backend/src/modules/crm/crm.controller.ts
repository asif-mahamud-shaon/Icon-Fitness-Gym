import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CrmLeadSource, CrmLeadStage, Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { StrictRoles } from '../../common/decorators/strict-roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { CrmService } from './crm.service';
import {
  CreateCrmLeadDto,
  LogCrmActivityDto,
  UpdateCrmLeadDto,
} from './dto/crm.dto';

@ApiTags('Gym CRM & Staff Accountability')
@ApiBearerAuth()
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
@RequirePermission('crm')
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get CRM pipeline KPIs, overdue follow-ups & retention counts' })
  async getOverview() {
    return this.crmService.getOverview();
  }

  @Get('staff-options')
  @ApiOperation({ summary: 'List active staff & trainers eligible for lead assignment' })
  async findStaffOptions() {
    return this.crmService.findStaffOptions();
  }

  @Get('leads')
  @ApiOperation({ summary: 'List CRM leads with stage, overdue status & activity log' })
  async findLeads(
    @Query('stage') stage?: CrmLeadStage,
    @Query('source') source?: CrmLeadSource,
    @Query('assignedToUserId') assignedToUserId?: string,
    @Query('overdueOnly') overdueOnly?: string,
    @Query('search') search?: string,
  ) {
    return this.crmService.findLeads({
      stage,
      source,
      assignedToUserId,
      overdueOnly: overdueOnly === 'true',
      search,
    });
  }

  @Post('leads')
  @ApiOperation({ summary: 'Create a walk-in, WhatsApp, Facebook, or phone lead' })
  async createLead(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCrmLeadDto,
  ) {
    return this.crmService.createLead(user, dto);
  }

  @Patch('leads/:id')
  @ApiOperation({ summary: 'Update CRM lead stage, assignee, or follow-up schedule' })
  async updateLead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCrmLeadDto,
  ) {
    return this.crmService.updateLead(user, id, dto);
  }

  @Delete('leads/:id')
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Delete a CRM lead record (Admin/Owner only)' })
  async deleteLead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.crmService.deleteLead(user, id);
  }

  @Post('leads/import-inquiries')
  @ApiOperation({ summary: 'Import open website contact inquiries into CRM pipeline' })
  async importWebsiteInquiries(@CurrentUser() user: AuthenticatedUser) {
    return this.crmService.importWebsiteInquiries(user);
  }

  @Get('retention')
  @ApiOperation({ summary: 'Get expiring soon, recently expired & 10-day absent member queues' })
  async findRetentionQueue() {
    return this.crmService.findRetentionQueue();
  }

  @Get('activities')
  @ApiOperation({ summary: 'Get chronological staff call & follow-up timeline' })
  async findActivities() {
    return this.crmService.findActivities();
  }

  @Post('activities')
  @ApiOperation({ summary: 'Log a follow-up call, WhatsApp, or desk interaction' })
  async logActivity(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LogCrmActivityDto,
  ) {
    return this.crmService.logActivity(user, dto);
  }

  @Get('scorecard')
  @ApiOperation({ summary: 'Get per-staff CRM accountability scorecard (30-day window)' })
  async getScorecard() {
    return this.crmService.getScorecard();
  }
}

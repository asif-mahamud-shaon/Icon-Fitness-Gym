import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { StrictRoles } from '../../common/decorators/strict-roles.decorator';
import { ReportsService } from './reports.service';

@ApiTags('Reports & Analytics')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('overview', 'reports')
  @ApiOperation({ summary: 'Get real-time executive dashboard KPIs and chart series' })
  async getOverview() {
    return this.reportsService.getExecutiveOverview();
  }

  @Get('export/:type')
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('reports')
  @ApiOperation({
    summary:
      'Export CSV report (type: memberships | revenue | registrations | expiries | bookings)',
  })
  async exportCsv(@Param('type') type: string, @Res() res: Response) {
    const { filename, csv } = await this.reportsService.exportReportCsv(type);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  }
}


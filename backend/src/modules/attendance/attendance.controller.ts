import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AttendanceStatus, Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { AttendanceService } from './attendance.service';

@ApiTags('Attendance')
@ApiBearerAuth()
@RequirePermission('attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'List class attendance records' })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('classScheduleId') classScheduleId?: string,
    @Query('memberProfileId') memberProfileId?: string,
  ) {
    return this.attendanceService.findAll(user, {
      classScheduleId,
      memberProfileId,
    });
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Record or update class attendance for a member' })
  async record(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      classScheduleId: string;
      memberProfileId: string;
      bookingId?: string;
      sessionDate?: string;
      status: AttendanceStatus;
      remarks?: string;
    },
  ) {
    return this.attendanceService.recordAttendance(user, body);
  }
}


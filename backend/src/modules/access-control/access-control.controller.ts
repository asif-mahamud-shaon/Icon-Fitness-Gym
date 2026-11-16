import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  AccessDecision,
  AccessDenialCode,
  AccessDirection,
  DayOfWeek,
  DeviceStatus,
  DeviceVendorType,
  GymSessionType,
  Role,
  SessionExceptionType,
  TrainerPresenceStatus,
  VerificationMethod,
} from '@prisma/client';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { StrictRoles } from '../../common/decorators/strict-roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { AccessControlService } from './access-control.service';
import { BiometricSecurityService } from './biometric-security.service';
import {
  DeviceHeartbeatDto,
  DeviceVerifyCallbackDto,
  EnrollBiometricsDto,
} from './dto/access-control.dto';

@ApiTags('Smart Access Control, Biometrics & Gender Sessions')
@Controller('access-control')
export class AccessControlController {
  constructor(
    private readonly accessControlService: AccessControlService,
    private readonly biometricSecurityService: BiometricSecurityService,
  ) {}

  // ============================================================================
  // 1. OVERVIEW & SETTINGS
  // ============================================================================

  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('access_control')
  @Get('overview')
  @ApiOperation({
    summary:
      'Get real-time Smart Access Control overview, occupancy, device health, Female Session trainer status, and alerts',
  })
  getOverview() {
    return this.accessControlService.getAdminAccessOverview();
  }

  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('access_control', 'access_settings')
  @Get('settings')
  @ApiOperation({ summary: 'Get Smart Access Control configuration settings' })
  getSettings() {
    return this.accessControlService.getSettings();
  }

  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('access_settings')
  @Patch('settings')
  @ApiOperation({
    summary: 'Update Smart Access Control configuration settings',
  })
  updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: Record<string, any>,
  ) {
    return this.accessControlService.updateSettings(user, body);
  }

  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('access_control')
  @Get('emergency-safety')
  @ApiOperation({
    summary:
      'Verify emergency egress independence from software, database, network, and facial recognition controls',
  })
  getEmergencySafety() {
    return this.accessControlService.getEmergencySafetyStatus();
  }

  // ============================================================================
  // 2. FACE RECOGNITION DEVICES & HARDWARE CALLBACKS
  // ============================================================================

  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('access_control')
  @Get('devices')
  @ApiOperation({
    summary: 'List all facial recognition terminals and door controllers',
  })
  listDevices() {
    return this.accessControlService.listDevices();
  }

  @ApiBearerAuth()
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('access_control')
  @Post('devices')
  @ApiOperation({
    summary: 'Register a new facial recognition terminal / door controller',
  })
  createDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      deviceCode: string;
      name: string;
      locationZone?: string;
      vendorType?: DeviceVendorType;
      direction?: AccessDirection;
      ipAddress?: string;
      doorControllerId?: string;
      doorUnlockDurationSec?: number;
      apiKey?: string;
      isSimulated?: boolean;
    },
  ) {
    return this.accessControlService.createDevice(user, body);
  }

  @ApiBearerAuth()
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('access_control')
  @Patch('devices/:id')
  @ApiOperation({ summary: 'Update device status, mode, or configuration' })
  updateDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      locationZone: string;
      status: DeviceStatus;
      isActive: boolean;
      isSimulated: boolean;
      doorUnlockDurationSec: number;
      ipAddress: string;
    }>,
  ) {
    return this.accessControlService.updateDeviceStatus(user, id, body);
  }

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Post('devices/heartbeat')
  @ApiOperation({
    summary: 'Device heartbeat endpoint (authenticated via device API key)',
  })
  deviceHeartbeat(
    @Headers('x-device-api-key') headerApiKey: string | undefined,
    @Body() body: DeviceHeartbeatDto,
  ) {
    return this.accessControlService.recordDeviceHeartbeat(
      body.deviceCode,
      headerApiKey || body.apiKey,
    );
  }

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Post('devices/verify-callback')
  @ApiOperation({
    summary:
      'Hardware terminal face recognition callback endpoint (authenticated via device API key, replay & idempotency protected)',
  })
  deviceVerifyCallback(
    @Headers('x-device-api-key') headerApiKey: string | undefined,
    @Body() body: DeviceVerifyCallbackDto,
  ) {
    return this.accessControlService.processAccessAttempt({
      ...body,
      deviceApiKey: headerApiKey || body.deviceApiKey,
      isSimulated: false,
    });
  }

  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('access_control')
  @Post('simulate-entry')
  @ApiOperation({
    summary:
      'Development Simulator: Simulate a facial recognition entry/exit attempt and door controller response (explicitly labeled as SIMULATED)',
  })
  simulateAccessEntry(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      idempotencyKey?: string;
      deviceId?: string;
      deviceCode?: string;
      memberProfileId?: string;
      memberCode?: string;
      faceRecognized?: boolean;
      recognitionScore?: number;
      livenessPassed?: boolean;
      direction?: AccessDirection;
      gymSessionIdOverride?: string;
      evaluationTimestamp?: string;
    },
  ) {
    return this.accessControlService.processAccessAttempt(
      {
        ...body,
        isSimulated: true,
      },
      user,
    );
  }

  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('access_control')
  @Post('manual-verify')
  @ApiOperation({
    summary:
      'Authorized staff manual verification when a terminal is offline or for front-desk member check-in',
  })
  manualStaffVerify(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      memberProfileId: string;
      deviceId?: string;
      gymSessionIdOverride?: string;
      direction?: AccessDirection;
      notes: string;
    },
  ) {
    return this.accessControlService.verifyManualStaffEntry(user, body);
  }

  // ============================================================================
  // 3. BIOMETRIC ENROLLMENT & PRIVACY MANAGEMENT (RESTRICTED)
  // ============================================================================

  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('access_control')
  @Get('biometrics')
  @ApiOperation({
    summary:
      'List member biometric enrollment statuses (sanitized — never exposes biometric templates)',
  })
  listBiometrics(@Query('search') search?: string) {
    return this.accessControlService.listMemberBiometricStatuses(search);
  }

  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.MEMBER)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('biometrics/enroll')
  @ApiOperation({
    summary:
      'Enroll member biometric profile after verifying explicit member consent',
  })
  enrollBiometrics(
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
    @Body() body: EnrollBiometricsDto,
  ) {
    return this.biometricSecurityService.enrollMemberBiometrics(user, body, ip);
  }

  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MEMBER)
  @Delete('biometrics/:memberProfileId')
  @ApiOperation({
    summary:
      'Revoke consent and permanently purge a member’s encrypted biometric template',
  })
  deleteBiometrics(
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
    @Param('memberProfileId') memberProfileId: string,
    @Body() body?: { reason?: string },
  ) {
    return this.biometricSecurityService.deleteOrRevokeBiometrics(
      user,
      memberProfileId,
      body?.reason,
      ip,
    );
  }

  // ============================================================================
  // 4. GENDER-BASED GYM SESSIONS & EXCEPTIONS
  // ============================================================================

  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.TRAINER, Role.MEMBER)
  @Get('sessions')
  @ApiOperation({
    summary: 'List configured Male and Female gym sessions (Asia/Dhaka)',
  })
  listSessions(
    @Query('dayOfWeek') dayOfWeek?: DayOfWeek,
    @Query('sessionType') sessionType?: GymSessionType,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.accessControlService.listGymSessions({
      dayOfWeek,
      sessionType,
      activeOnly: activeOnly === 'true',
    });
  }

  @ApiBearerAuth()
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('access_control')
  @Post('sessions')
  @ApiOperation({
    summary: 'Create a configurable Male or Female gym session',
  })
  createSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      name: string;
      code?: string;
      sessionType: GymSessionType;
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
      requiresFemaleTrainer?: boolean;
      allowFemaleInMaleSession?: boolean;
      maxCapacity?: number;
      gracePeriodMinutes?: number;
      accessRulesNotes?: string;
      isActive?: boolean;
      allowOverlap?: boolean;
    },
  ) {
    return this.accessControlService.createGymSession(user, body);
  }

  @ApiBearerAuth()
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('access_control')
  @Patch('sessions/:id')
  @ApiOperation({ summary: 'Update or activate/deactivate a gym session' })
  updateSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.accessControlService.updateGymSession(user, id, body);
  }

  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('access_control')
  @Get('session-exceptions')
  @ApiOperation({
    summary: 'List holiday, closure, and special event session exceptions',
  })
  listSessionExceptions() {
    return this.accessControlService.listSessionExceptions();
  }

  @ApiBearerAuth()
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('access_control')
  @Post('session-exceptions')
  @ApiOperation({
    summary: 'Create a holiday, closure, or special event session exception',
  })
  createSessionException(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      gymSessionId?: string;
      exceptionDate: string;
      exceptionType: SessionExceptionType;
      title: string;
      description?: string;
      overrideSessionType?: GymSessionType;
      overrideStartTime?: string;
      overrideEndTime?: string;
      isGymClosed?: boolean;
    },
  ) {
    return this.accessControlService.createSessionException(user, body);
  }

  // ============================================================================
  // 5. FEMALE TRAINER ASSIGNMENTS & PRESENCE VERIFICATION
  // ============================================================================

  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.TRAINER)
  @Get('trainer-assignments')
  @ApiOperation({
    summary: 'List trainer assignments for Male and Female gym sessions',
  })
  listTrainerAssignments() {
    return this.accessControlService.listTrainerAssignments();
  }

  @ApiBearerAuth()
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('access_control')
  @Post('trainer-assignments')
  @ApiOperation({
    summary:
      'Assign a Female Trainer (or replacement Female Trainer) to a Female Session',
  })
  assignTrainer(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      gymSessionId: string;
      trainerProfileId: string;
      replacementTrainerProfileId?: string;
      notes?: string;
    },
  ) {
    return this.accessControlService.assignTrainerToSession(user, body);
  }

  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.TRAINER)
  @RequirePermission('access_control', 'attendance')
  @Get('trainer-attendance')
  @ApiOperation({
    summary: 'List trainer session check-in, check-out, and presence records',
  })
  listTrainerAttendance(
    @Query('gymSessionId') gymSessionId?: string,
    @Query('trainerProfileId') trainerProfileId?: string,
    @Query('date') date?: string,
  ) {
    return this.accessControlService.listTrainerAttendances({
      gymSessionId,
      trainerProfileId,
      date,
    });
  }

  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.TRAINER)
  @RequirePermission('access_control', 'attendance')
  @Post('trainer-attendance')
  @ApiOperation({
    summary:
      'Record physical trainer check-in, check-out, or replacement presence for a gym session',
  })
  recordTrainerAttendance(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      trainerProfileId: string;
      gymSessionId: string;
      sessionDate?: string;
      status: TrainerPresenceStatus;
      verificationMethod?: VerificationMethod;
      deviceId?: string;
      replacementTrainerProfileId?: string;
      notes?: string;
      checkOut?: boolean;
    },
  ) {
    return this.accessControlService.recordTrainerAttendance(user, body);
  }

  // ============================================================================
  // 6. ACCESS HISTORY, DENIED ATTEMPTS, CSV EXPORT & MEMBER PORTAL VIEW
  // ============================================================================

  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('access_control')
  @Get('events')
  @ApiOperation({
    summary: 'Query unified access and attendance event history with filters',
  })
  listEvents(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('decision') decision?: AccessDecision,
    @Query('denialCode') denialCode?: AccessDenialCode,
    @Query('sessionType') sessionType?: GymSessionType,
    @Query('deviceId') deviceId?: string,
    @Query('memberSearch') memberSearch?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accessControlService.listAccessEvents({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 25,
      decision,
      denialCode,
      sessionType,
      deviceId,
      memberSearch,
      startDate,
      endDate,
    });
  }

  @ApiBearerAuth()
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('access_control')
  @Get('events/export/csv')
  @ApiOperation({ summary: 'Export filtered access event logs to CSV' })
  async exportEventsCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
    @Query('decision') decision?: AccessDecision,
    @Query('denialCode') denialCode?: AccessDenialCode,
    @Query('sessionType') sessionType?: GymSessionType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const csv = await this.accessControlService.exportAccessEventsCsv(user, {
      decision,
      denialCode,
      sessionType,
      startDate,
      endDate,
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="icon-fitness-access-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    res.send(csv);
  }

  @ApiBearerAuth()
  @Roles(Role.MEMBER, Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @Get('my')
  @ApiOperation({
    summary:
      'Get authenticated member’s own biometric status, access eligibility, permitted sessions, and access history',
  })
  getMyAccessSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('memberProfileId') memberProfileId?: string,
  ) {
    return this.accessControlService.getMyMemberAccessSummary(
      user,
      user.role === Role.MEMBER ? undefined : memberProfileId,
    );
  }
}


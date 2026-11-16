import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AccessDecision,
  AccessDenialCode,
  AccessDirection,
  BiometricEnrollmentStatus,
  DayOfWeek,
  DeviceStatus,
  DeviceVendorType,
  DoorCommandStatus,
  Gender,
  GymSessionType,
  MembershipStatus,
  NotificationType,
  PaymentStatus,
  Role,
  SessionExceptionType,
  TrainerPresenceStatus,
  UserStatus,
  VerificationMethod,
} from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { HardwareAdapterService } from './hardware-adapter.service';
import { BiometricSecurityService } from './biometric-security.service';
import {
  doTimeWindowsOverlap,
  getDhakaEndOfDayCutoff,
  getDhakaTimeParts,
  isMembershipValidAtDhakaTime,
  isTimeWithinSessionWindow,
  parseHHmmToMinutes,
} from './timezone.util';

export interface FaceVerificationInput {
  idempotencyKey?: string;
  deviceCode?: string;
  deviceId?: string;
  deviceApiKey?: string;
  memberProfileId?: string;
  memberCode?: string;
  templateToken?: string;
  faceRecognized?: boolean;
  recognitionScore?: number;
  livenessPassed?: boolean;
  direction?: AccessDirection;
  isSimulated?: boolean;
  gymSessionIdOverride?: string;
  evaluationTimestamp?: string | Date;
  callbackTimestamp?: string | Date;
}

@Injectable()
export class AccessControlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
    private readonly hardwareAdapter: HardwareAdapterService,
    private readonly biometricSecurity: BiometricSecurityService,
  ) {}

  private isAuthorizedAdminOrStaff(role: Role): boolean {
    return ([Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF] as Role[]).includes(role);
  }

  private isAuthorizedAdminOnly(role: Role): boolean {
    return ([Role.SUPER_ADMIN, Role.ADMIN] as Role[]).includes(role);
  }

  // ============================================================================
  // 1. SETTINGS MANAGEMENT
  // ============================================================================

  async getSettings() {
    let settings = await this.prisma.accessControlSettings.findUnique({
      where: { singletonKey: 'DEFAULT' },
    });
    if (!settings) {
      settings = await this.prisma.accessControlSettings.create({
        data: { singletonKey: 'DEFAULT' },
      });
    }
    return settings;
  }

  async updateSettings(
    actor: AuthenticatedUser,
    dto: Partial<{
      timezone: string;
      enforceGenderSessions: boolean;
      requireFemaleTrainerPresence: boolean;
      allowFemaleInMaleSession: boolean;
      blockEntryWhenNoActiveSession: boolean;
      minFaceMatchConfidence: number;
      requireLivenessDetection: boolean;
      deviceHeartbeatTimeoutSec: number;
      callbackReplayWindowSec: number;
      biometricRetentionDays: number;
      trainerCheckInAlertLeadMinutes: number;
      allowStaffManualOverride: boolean;
      emergencyEgressNote: string;
    }>,
  ) {
    if (!this.isAuthorizedAdminOnly(actor.role)) {
      throw new ForbiddenException(
        'Only ADMIN or SUPER_ADMIN can update access control security settings.',
      );
    }

    const current = await this.getSettings();
    const updated = await this.prisma.accessControlSettings.update({
      where: { id: current.id },
      data: {
        ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
        ...(dto.enforceGenderSessions !== undefined
          ? { enforceGenderSessions: Boolean(dto.enforceGenderSessions) }
          : {}),
        ...(dto.requireFemaleTrainerPresence !== undefined
          ? {
              requireFemaleTrainerPresence: Boolean(
                dto.requireFemaleTrainerPresence,
              ),
            }
          : {}),
        ...(dto.allowFemaleInMaleSession !== undefined
          ? { allowFemaleInMaleSession: Boolean(dto.allowFemaleInMaleSession) }
          : {}),
        ...(dto.blockEntryWhenNoActiveSession !== undefined
          ? {
              blockEntryWhenNoActiveSession: Boolean(
                dto.blockEntryWhenNoActiveSession,
              ),
            }
          : {}),
        ...(dto.minFaceMatchConfidence !== undefined
          ? { minFaceMatchConfidence: Number(dto.minFaceMatchConfidence) }
          : {}),
        ...(dto.requireLivenessDetection !== undefined
          ? { requireLivenessDetection: Boolean(dto.requireLivenessDetection) }
          : {}),
        ...(dto.deviceHeartbeatTimeoutSec !== undefined
          ? { deviceHeartbeatTimeoutSec: Number(dto.deviceHeartbeatTimeoutSec) }
          : {}),
        ...(dto.callbackReplayWindowSec !== undefined
          ? { callbackReplayWindowSec: Number(dto.callbackReplayWindowSec) }
          : {}),
        ...(dto.biometricRetentionDays !== undefined
          ? { biometricRetentionDays: Number(dto.biometricRetentionDays) }
          : {}),
        ...(dto.trainerCheckInAlertLeadMinutes !== undefined
          ? {
              trainerCheckInAlertLeadMinutes: Number(
                dto.trainerCheckInAlertLeadMinutes,
              ),
            }
          : {}),
        ...(dto.allowStaffManualOverride !== undefined
          ? { allowStaffManualOverride: Boolean(dto.allowStaffManualOverride) }
          : {}),
        ...(dto.emergencyEgressNote !== undefined
          ? { emergencyEgressNote: dto.emergencyEgressNote }
          : {}),
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'ACCESS_CONTROL_SETTINGS_UPDATED',
      entityType: 'AccessControlSettings',
      entityId: updated.id,
      summary: `Updated Smart Access Control settings (enforceGenderSessions=${updated.enforceGenderSessions}, requireFemaleTrainerPresence=${updated.requireFemaleTrainerPresence}).`,
    });

    return updated;
  }

  // ============================================================================
  // 2. GYM SESSION CONFIGURATION (MALE & FEMALE SESSIONS IN ASIA/DHAKA)
  // ============================================================================

  async listGymSessions(params?: {
    dayOfWeek?: DayOfWeek;
    sessionType?: GymSessionType;
    activeOnly?: boolean;
  }) {
    const where: Record<string, any> = {};
    if (params?.dayOfWeek) where.dayOfWeek = params.dayOfWeek;
    if (params?.sessionType) where.sessionType = params.sessionType;
    if (params?.activeOnly) where.isActive = true;

    const sessions = await this.prisma.gymSession.findMany({
      where,
      include: {
        trainerAssignments: {
          where: { isActive: true },
          include: {
            trainerProfile: {
              include: {
                user: { select: { fullName: true, email: true, phone: true } },
              },
            },
            replacementTrainer: {
              include: {
                user: { select: { fullName: true, email: true, phone: true } },
              },
            },
          },
        },
        exceptions: {
          orderBy: { exceptionDate: 'desc' },
          take: 5,
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return sessions;
  }

  async createGymSession(
    actor: AuthenticatedUser,
    dto: {
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
    if (!this.isAuthorizedAdminOnly(actor.role)) {
      throw new ForbiddenException(
        'Only ADMIN or SUPER_ADMIN can configure gym sessions.',
      );
    }

    const startMin = parseHHmmToMinutes(dto.startTime);
    const endMin = parseHHmmToMinutes(dto.endTime);
    if (endMin <= startMin) {
      throw new BadRequestException(
        'Session endTime must be strictly after startTime (HH:mm in Asia/Dhaka).',
      );
    }

    // Check overlapping active sessions on the same day of week unless explicitly permitted
    if (!dto.allowOverlap && dto.isActive !== false) {
      const existingSameDay = await this.prisma.gymSession.findMany({
        where: {
          dayOfWeek: dto.dayOfWeek,
          isActive: true,
        },
      });
      for (const existing of existingSameDay) {
        if (
          doTimeWindowsOverlap(
            dto.startTime,
            dto.endTime,
            existing.startTime,
            existing.endTime,
          )
        ) {
          throw new BadRequestException(
            `Session time ${dto.startTime}–${dto.endTime} on ${dto.dayOfWeek} overlaps with existing active session "${existing.name}" (${existing.startTime}–${existing.endTime}).`,
          );
        }
      }
    }

    const isFemaleSession = dto.sessionType === GymSessionType.FEMALE_SESSION;
    const code =
      dto.code ||
      `SES-${dto.dayOfWeek.slice(0, 3)}-${dto.sessionType === GymSessionType.FEMALE_SESSION ? 'FEM' : 'MALE'}-${dto.startTime.replace(':', '')}-${Math.floor(100 + Math.random() * 900)}`;

    const created = await this.prisma.gymSession.create({
      data: {
        name: dto.name,
        code,
        sessionType: dto.sessionType,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        timezone: 'Asia/Dhaka',
        requiresFemaleTrainer: isFemaleSession
          ? true
          : Boolean(dto.requiresFemaleTrainer),
        allowFemaleInMaleSession: isFemaleSession
          ? false
          : dto.allowFemaleInMaleSession ?? true,
        maxCapacity: dto.maxCapacity ? Number(dto.maxCapacity) : 60,
        gracePeriodMinutes:
          dto.gracePeriodMinutes !== undefined
            ? Number(dto.gracePeriodMinutes)
            : 10,
        accessRulesNotes:
          dto.accessRulesNotes ||
          (isFemaleSession
            ? 'Female Session: Only Female Members with active memberships may enter. Designated Female Trainer must be assigned and checked in.'
            : 'Male Session: Male and Female Members with active memberships may enter.'),
        isActive: dto.isActive ?? true,
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'GYM_SESSION_CREATED',
      entityType: 'GymSession',
      entityId: created.id,
      summary: `Created ${created.sessionType} "${created.name}" on ${created.dayOfWeek} (${created.startTime}–${created.endTime} Asia/Dhaka).`,
    });

    return created;
  }

  async updateGymSession(
    actor: AuthenticatedUser,
    sessionId: string,
    dto: Partial<{
      name: string;
      sessionType: GymSessionType;
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
      requiresFemaleTrainer: boolean;
      allowFemaleInMaleSession: boolean;
      maxCapacity: number;
      gracePeriodMinutes: number;
      accessRulesNotes: string;
      isActive: boolean;
      allowOverlap: boolean;
    }>,
  ) {
    if (!this.isAuthorizedAdminOnly(actor.role)) {
      throw new ForbiddenException(
        'Only ADMIN or SUPER_ADMIN can update gym sessions.',
      );
    }

    const existing = await this.prisma.gymSession.findUnique({
      where: { id: sessionId },
    });
    if (!existing) {
      throw new NotFoundException('Gym session not found.');
    }

    const nextStart = dto.startTime || existing.startTime;
    const nextEnd = dto.endTime || existing.endTime;
    const nextDay = dto.dayOfWeek || existing.dayOfWeek;
    const nextActive =
      dto.isActive !== undefined ? dto.isActive : existing.isActive;
    const nextType = dto.sessionType || existing.sessionType;

    if (parseHHmmToMinutes(nextEnd) <= parseHHmmToMinutes(nextStart)) {
      throw new BadRequestException(
        'Session endTime must be strictly after startTime.',
      );
    }

    if (!dto.allowOverlap && nextActive) {
      const others = await this.prisma.gymSession.findMany({
        where: {
          dayOfWeek: nextDay,
          isActive: true,
          id: { not: sessionId },
        },
      });
      for (const other of others) {
        if (
          doTimeWindowsOverlap(
            nextStart,
            nextEnd,
            other.startTime,
            other.endTime,
          )
        ) {
          throw new BadRequestException(
            `Updated time ${nextStart}–${nextEnd} on ${nextDay} overlaps with active session "${other.name}" (${other.startTime}–${other.endTime}).`,
          );
        }
      }
    }

    const isFemale = nextType === GymSessionType.FEMALE_SESSION;

    const updated = await this.prisma.gymSession.update({
      where: { id: sessionId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        sessionType: nextType,
        dayOfWeek: nextDay,
        startTime: nextStart,
        endTime: nextEnd,
        requiresFemaleTrainer: isFemale
          ? true
          : dto.requiresFemaleTrainer ?? existing.requiresFemaleTrainer,
        allowFemaleInMaleSession: isFemale
          ? false
          : dto.allowFemaleInMaleSession ?? existing.allowFemaleInMaleSession,
        ...(dto.maxCapacity !== undefined
          ? { maxCapacity: Number(dto.maxCapacity) }
          : {}),
        ...(dto.gracePeriodMinutes !== undefined
          ? { gracePeriodMinutes: Number(dto.gracePeriodMinutes) }
          : {}),
        ...(dto.accessRulesNotes !== undefined
          ? { accessRulesNotes: dto.accessRulesNotes }
          : {}),
        isActive: nextActive,
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'GYM_SESSION_UPDATED',
      entityType: 'GymSession',
      entityId: updated.id,
      summary: `Updated gym session "${updated.name}" (${updated.dayOfWeek} ${updated.startTime}–${updated.endTime}, isActive=${updated.isActive}).`,
    });

    return updated;
  }

  async createSessionException(
    actor: AuthenticatedUser,
    dto: {
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
    if (!this.isAuthorizedAdminOnly(actor.role)) {
      throw new ForbiddenException(
        'Only ADMIN or SUPER_ADMIN can configure holiday or session exceptions.',
      );
    }

    const dhakaParts = getDhakaTimeParts(new Date(dto.exceptionDate));
    const created = await this.prisma.gymSessionException.create({
      data: {
        gymSessionId: dto.gymSessionId || null,
        exceptionDate: dhakaParts.normalizedDayStartUtc,
        exceptionType: dto.exceptionType,
        title: dto.title,
        description: dto.description || null,
        overrideSessionType: dto.overrideSessionType || null,
        overrideStartTime: dto.overrideStartTime || null,
        overrideEndTime: dto.overrideEndTime || null,
        isGymClosed: Boolean(dto.isGymClosed),
        createdByUserId: actor.id,
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'GYM_SESSION_EXCEPTION_CREATED',
      entityType: 'GymSessionException',
      entityId: created.id,
      summary: `Created session exception "${created.title}" (${created.exceptionType}) for ${dhakaParts.dateKey}.`,
    });

    return created;
  }

  async listSessionExceptions() {
    return this.prisma.gymSessionException.findMany({
      include: { gymSession: true },
      orderBy: { exceptionDate: 'desc' },
    });
  }

  /**
   * Resolves the active GymSession at the given timestamp in Asia/Dhaka timezone.
   */
  async resolveCurrentGymSession(
    now: Date = new Date(),
    gymSessionIdOverride?: string,
  ) {
    const dhaka = getDhakaTimeParts(now);

    if (gymSessionIdOverride) {
      const explicitSession = await this.prisma.gymSession.findUnique({
        where: { id: gymSessionIdOverride },
        include: {
          trainerAssignments: {
            where: { isActive: true },
            include: {
              trainerProfile: { include: { user: true } },
              replacementTrainer: { include: { user: true } },
            },
          },
        },
      });
      return {
        dhaka,
        activeSession: explicitSession,
        isClosedByException: false,
        activeException: null,
      };
    }

    // Check if there is a date-specific closure or exception for today in Asia/Dhaka
    const dayExceptions = await this.prisma.gymSessionException.findMany({
      where: {
        exceptionDate: dhaka.normalizedDayStartUtc,
      },
    });

    const fullClosure = dayExceptions.find((ex) => ex.isGymClosed);
    if (fullClosure) {
      return {
        dhaka,
        activeSession: null,
        isClosedByException: true,
        activeException: fullClosure,
      };
    }

    const daySessions = await this.prisma.gymSession.findMany({
      where: {
        dayOfWeek: dhaka.dayOfWeek,
        isActive: true,
      },
      include: {
        trainerAssignments: {
          where: { isActive: true },
          include: {
            trainerProfile: { include: { user: true } },
            replacementTrainer: { include: { user: true } },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    const matchedSession =
      daySessions.find((s) =>
        isTimeWithinSessionWindow(dhaka.timeHHmm, s.startTime, s.endTime),
      ) || null;

    return {
      dhaka,
      activeSession: matchedSession,
      isClosedByException: false,
      activeException: dayExceptions[0] || null,
    };
  }

  // ============================================================================
  // 3. FEMALE TRAINER ASSIGNMENT & PRESENCE VERIFICATION (SECTION 4)
  // ============================================================================

  async assignTrainerToSession(
    actor: AuthenticatedUser,
    dto: {
      gymSessionId: string;
      trainerProfileId: string;
      replacementTrainerProfileId?: string;
      notes?: string;
    },
  ) {
    if (!this.isAuthorizedAdminOnly(actor.role)) {
      throw new ForbiddenException(
        'Only ADMIN or SUPER_ADMIN can assign trainers to gym sessions.',
      );
    }

    const [session, trainer] = await Promise.all([
      this.prisma.gymSession.findUnique({ where: { id: dto.gymSessionId } }),
      this.prisma.trainerProfile.findUnique({
        where: { id: dto.trainerProfileId },
        include: { user: true },
      }),
    ]);

    if (!session) throw new NotFoundException('Gym session not found.');
    if (!trainer) throw new NotFoundException('Trainer profile not found.');

    // Mandatory Rule: Female Sessions require a Female Trainer
    if (
      session.sessionType === GymSessionType.FEMALE_SESSION &&
      trainer.gender !== Gender.FEMALE
    ) {
      throw new BadRequestException(
        `Cannot assign trainer "${trainer.user.fullName}" (${trainer.gender}) to Female Session "${session.name}". Only a Female Trainer (gender: FEMALE) may be assigned to a Female Session.`,
      );
    }

    let replacementTrainer = null;
    if (dto.replacementTrainerProfileId) {
      replacementTrainer = await this.prisma.trainerProfile.findUnique({
        where: { id: dto.replacementTrainerProfileId },
        include: { user: true },
      });
      if (!replacementTrainer) {
        throw new NotFoundException('Replacement trainer profile not found.');
      }
      if (
        session.sessionType === GymSessionType.FEMALE_SESSION &&
        replacementTrainer.gender !== Gender.FEMALE
      ) {
        throw new BadRequestException(
          'Replacement trainer for a Female Session must also be a Female Trainer (gender: FEMALE).',
        );
      }
    }

    // Check for conflicting trainer assignments on the same dayOfWeek
    const existingTrainerAssignments =
      await this.prisma.sessionTrainerAssignment.findMany({
        where: {
          trainerProfileId: trainer.id,
          isActive: true,
          gymSessionId: { not: session.id },
        },
        include: { gymSession: true },
      });

    for (const assign of existingTrainerAssignments) {
      if (
        assign.gymSession.isActive &&
        assign.gymSession.dayOfWeek === session.dayOfWeek &&
        doTimeWindowsOverlap(
          session.startTime,
          session.endTime,
          assign.gymSession.startTime,
          assign.gymSession.endTime,
        )
      ) {
        throw new BadRequestException(
          `Trainer "${trainer.user.fullName}" already has a conflicting assignment on ${session.dayOfWeek} (${assign.gymSession.name}: ${assign.gymSession.startTime}–${assign.gymSession.endTime}).`,
        );
      }
    }

    // Deactivate prior active assignments for this session if replacing primary
    await this.prisma.sessionTrainerAssignment.updateMany({
      where: { gymSessionId: session.id, isActive: true },
      data: { isActive: false },
    });

    const created = await this.prisma.sessionTrainerAssignment.create({
      data: {
        gymSessionId: session.id,
        trainerProfileId: trainer.id,
        replacementTrainerProfileId: replacementTrainer?.id || null,
        isPrimary: true,
        isActive: true,
        notes: dto.notes || null,
        assignedByUserId: actor.id,
      },
      include: {
        gymSession: true,
        trainerProfile: {
          include: { user: { select: { fullName: true, email: true, phone: true } } },
        },
        replacementTrainer: {
          include: { user: { select: { fullName: true, email: true, phone: true } } },
        },
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'SESSION_TRAINER_ASSIGNED',
      entityType: 'SessionTrainerAssignment',
      entityId: created.id,
      summary: `Assigned trainer ${trainer.user.fullName} to ${session.sessionType} "${session.name}" (${session.dayOfWeek} ${session.startTime}–${session.endTime}).`,
    });

    return created;
  }

  async listTrainerAssignments() {
    return this.prisma.sessionTrainerAssignment.findMany({
      where: { isActive: true },
      include: {
        gymSession: true,
        trainerProfile: {
          include: {
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
        replacementTrainer: {
          include: {
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Records physical trainer check-in / check-out / presence status for a specific session date.
   * Important (Section 4): Schedule assignment alone NEVER proves physical presence.
   * Presence requires an explicit check-in record (`status === PRESENT` or `LATE` with `checkedInAt`).
   */
  async recordTrainerAttendance(
    actor: AuthenticatedUser,
    dto: {
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
    if (
      !([Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.TRAINER] as Role[]).includes(
        actor.role,
      )
    ) {
      throw new ForbiddenException(
        'Not authorized to record trainer attendance.',
      );
    }

    const [trainer, session] = await Promise.all([
      this.prisma.trainerProfile.findUnique({
        where: { id: dto.trainerProfileId },
        include: { user: true },
      }),
      this.prisma.gymSession.findUnique({ where: { id: dto.gymSessionId } }),
    ]);

    if (!trainer) throw new NotFoundException('Trainer profile not found.');
    if (!session) throw new NotFoundException('Gym session not found.');

    // If actor is a TRAINER, they can only check in/out for themselves
    if (actor.role === Role.TRAINER && trainer.userId !== actor.id) {
      throw new ForbiddenException(
        'Trainers may only check in or out for their own profile.',
      );
    }

    if (
      session.sessionType === GymSessionType.FEMALE_SESSION &&
      trainer.gender !== Gender.FEMALE
    ) {
      throw new BadRequestException(
        'Only a Female Trainer can check in as the designated trainer for a Female Session.',
      );
    }

    const now = new Date();
    const dhaka = getDhakaTimeParts(
      dto.sessionDate ? new Date(dto.sessionDate) : now,
    );

    const isPresentStatus =
      dto.status === TrainerPresenceStatus.PRESENT ||
      dto.status === TrainerPresenceStatus.LATE;

    const existing = await this.prisma.trainerAttendance.findUnique({
      where: {
        trainerProfileId_gymSessionId_sessionDate: {
          trainerProfileId: trainer.id,
          gymSessionId: session.id,
          sessionDate: dhaka.normalizedDayStartUtc,
        },
      },
    });

    const record = await this.prisma.trainerAttendance.upsert({
      where: {
        trainerProfileId_gymSessionId_sessionDate: {
          trainerProfileId: trainer.id,
          gymSessionId: session.id,
          sessionDate: dhaka.normalizedDayStartUtc,
        },
      },
      update: {
        status: dto.status,
        checkedInAt: isPresentStatus
          ? existing?.checkedInAt || now
          : existing?.checkedInAt || null,
        checkedOutAt: dto.checkOut ? now : null,
        verificationMethod:
          dto.verificationMethod ||
          VerificationMethod.MANUAL_STAFF_VERIFICATION,
        deviceId: dto.deviceId || null,
        verifiedByUserId: actor.id,
        replacementTrainerProfileId: dto.replacementTrainerProfileId || null,
        notes: dto.notes ?? existing?.notes ?? null,
      },
      create: {
        trainerProfileId: trainer.id,
        gymSessionId: session.id,
        sessionDate: dhaka.normalizedDayStartUtc,
        status: dto.status,
        checkedInAt: isPresentStatus ? now : null,
        checkedOutAt: dto.checkOut ? now : null,
        verificationMethod:
          dto.verificationMethod ||
          VerificationMethod.MANUAL_STAFF_VERIFICATION,
        deviceId: dto.deviceId || null,
        verifiedByUserId: actor.id,
        replacementTrainerProfileId: dto.replacementTrainerProfileId || null,
        notes: dto.notes || null,
      },
      include: {
        trainerProfile: {
          include: { user: { select: { fullName: true, email: true, phone: true } } },
        },
        replacementTrainer: {
          include: { user: { select: { fullName: true, email: true, phone: true } } },
        },
        gymSession: true,
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: dto.checkOut
        ? 'TRAINER_SESSION_CHECKED_OUT'
        : 'TRAINER_ATTENDANCE_RECORDED',
      entityType: 'TrainerAttendance',
      entityId: record.id,
      summary: `Trainer ${trainer.user.fullName} attendance for "${session.name}" (${dhaka.dateKey}) recorded as ${dto.status}${dto.checkOut ? ' (Checked Out)' : ''}.`,
    });

    return record;
  }

  async listTrainerAttendances(params?: {
    gymSessionId?: string;
    trainerProfileId?: string;
    date?: string;
  }) {
    const where: Record<string, any> = {};
    if (params?.gymSessionId) where.gymSessionId = params.gymSessionId;
    if (params?.trainerProfileId)
      where.trainerProfileId = params.trainerProfileId;
    if (params?.date) {
      const dhaka = getDhakaTimeParts(new Date(params.date));
      where.sessionDate = dhaka.normalizedDayStartUtc;
    }

    return this.prisma.trainerAttendance.findMany({
      where,
      include: {
        trainerProfile: {
          include: {
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
        replacementTrainer: {
          include: {
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
        gymSession: true,
        device: { select: { id: true, name: true, deviceCode: true } },
      },
      orderBy: [{ sessionDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Evaluates whether a designated Female Trainer is BOTH assigned AND physically present
   * (checked in and not checked out) for a given Female Session on the given Asia/Dhaka date.
   * Schedule assignment alone NEVER counts as physical presence.
   */
  async verifyFemaleTrainerPresenceForSession(
    gymSessionId: string,
    now: Date = new Date(),
  ): Promise<{
    hasAssignedFemaleTrainer: boolean;
    isFemaleTrainerPresent: boolean;
    assignedTrainerName: string | null;
    presentTrainerName: string | null;
    presenceStatus: TrainerPresenceStatus | 'UNASSIGNED';
    reason: string;
  }> {
    const dhaka = getDhakaTimeParts(now);

    const assignments = await this.prisma.sessionTrainerAssignment.findMany({
      where: {
        gymSessionId,
        isActive: true,
      },
      include: {
        trainerProfile: { include: { user: true } },
        replacementTrainer: { include: { user: true } },
      },
    });

    const validFemaleAssignments = assignments.filter(
      (a) =>
        (a.trainerProfile.gender === Gender.FEMALE &&
          a.trainerProfile.isActive) ||
        (a.replacementTrainer &&
          a.replacementTrainer.gender === Gender.FEMALE &&
          a.replacementTrainer.isActive),
    );

    if (validFemaleAssignments.length === 0) {
      return {
        hasAssignedFemaleTrainer: false,
        isFemaleTrainerPresent: false,
        assignedTrainerName: null,
        presentTrainerName: null,
        presenceStatus: 'UNASSIGNED',
        reason:
          'No active Female Trainer is assigned to this Female Session.',
      };
    }

    const candidateTrainerIds = new Set<string>();
    for (const a of validFemaleAssignments) {
      if (a.trainerProfile.gender === Gender.FEMALE) {
        candidateTrainerIds.add(a.trainerProfileId);
      }
      if (
        a.replacementTrainerProfileId &&
        a.replacementTrainer?.gender === Gender.FEMALE
      ) {
        candidateTrainerIds.add(a.replacementTrainerProfileId);
      }
    }

    const primaryAssignment = validFemaleAssignments[0];
    const assignedTrainerName =
      primaryAssignment.replacementTrainer?.user?.fullName ||
      primaryAssignment.trainerProfile.user.fullName;

    // Look up actual physical check-in records for today's Asia/Dhaka sessionDate
    const attendances = await this.prisma.trainerAttendance.findMany({
      where: {
        gymSessionId,
        sessionDate: dhaka.normalizedDayStartUtc,
        trainerProfileId: { in: Array.from(candidateTrainerIds) },
      },
      include: {
        trainerProfile: { include: { user: true } },
        replacementTrainer: { include: { user: true } },
      },
    });

    // Also check if a replacement Female Trainer checked in directly for this session today
    const presentRecord = attendances.find(
      (att) =>
        (att.status === TrainerPresenceStatus.PRESENT ||
          att.status === TrainerPresenceStatus.LATE) &&
        att.checkedInAt !== null &&
        att.checkedOutAt === null &&
        att.trainerProfile.gender === Gender.FEMALE,
    );

    if (presentRecord) {
      return {
        hasAssignedFemaleTrainer: true,
        isFemaleTrainerPresent: true,
        assignedTrainerName,
        presentTrainerName: presentRecord.trainerProfile.user.fullName,
        presenceStatus: presentRecord.status,
        reason: `Female Trainer ${presentRecord.trainerProfile.user.fullName} is checked in and present.`,
      };
    }

    // Check if primary record assigned a replacement trainer who is checked in
    for (const att of attendances) {
      if (
        att.replacementTrainerProfileId &&
        att.replacementTrainer?.gender === Gender.FEMALE
      ) {
        const repAtt = await this.prisma.trainerAttendance.findUnique({
          where: {
            trainerProfileId_gymSessionId_sessionDate: {
              trainerProfileId: att.replacementTrainerProfileId,
              gymSessionId,
              sessionDate: dhaka.normalizedDayStartUtc,
            },
          },
          include: { trainerProfile: { include: { user: true } } },
        });
        if (
          repAtt &&
          (repAtt.status === TrainerPresenceStatus.PRESENT ||
            repAtt.status === TrainerPresenceStatus.LATE) &&
          repAtt.checkedInAt !== null &&
          repAtt.checkedOutAt === null
        ) {
          return {
            hasAssignedFemaleTrainer: true,
            isFemaleTrainerPresent: true,
            assignedTrainerName,
            presentTrainerName: repAtt.trainerProfile.user.fullName,
            presenceStatus: repAtt.status,
            reason: `Replacement Female Trainer ${repAtt.trainerProfile.user.fullName} is checked in and present.`,
          };
        }
      }
    }

    const latestStatus = attendances[0]?.status || TrainerPresenceStatus.ASSIGNED;

    return {
      hasAssignedFemaleTrainer: true,
      isFemaleTrainerPresent: false,
      assignedTrainerName,
      presentTrainerName: null,
      presenceStatus: latestStatus,
      reason:
        latestStatus === TrainerPresenceStatus.ASSIGNED
          ? `Assigned Female Trainer (${assignedTrainerName}) has not checked in yet. Schedule assignment alone does not satisfy physical presence.`
          : `Assigned Female Trainer (${assignedTrainerName}) is marked ${latestStatus} and no replacement Female Trainer has checked in.`,
    };
  }

  // ============================================================================
  // 4. DEVICE MANAGEMENT & HEALTH MONITORING (SECTION 1.1)
  // ============================================================================

  async listDevices() {
    const settings = await this.getSettings();
    const devices = await this.prisma.accessDevice.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return devices.map((d) => {
      const { apiKeyHash, hmacSecretEncrypted, ...safeDevice } = d;
      const health = this.hardwareAdapter.evaluateDeviceHealth(
        d,
        settings.deviceHeartbeatTimeoutSec,
      );
      return {
        ...safeDevice,
        health,
      };
    });
  }

  async createDevice(
    actor: AuthenticatedUser,
    dto: {
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
    if (!this.isAuthorizedAdminOnly(actor.role)) {
      throw new ForbiddenException(
        'Only ADMIN or SUPER_ADMIN can register access control devices.',
      );
    }

    const rawApiKey =
      dto.apiKey || `IFG-DEV-KEY-${crypto.randomBytes(12).toString('hex')}`;
    const apiKeyHash = this.hardwareAdapter.hashDeviceApiKey(rawApiKey);

    const created = await this.prisma.accessDevice.create({
      data: {
        deviceCode: dto.deviceCode.trim().toUpperCase(),
        name: dto.name,
        locationZone: dto.locationZone || 'Ashkona Main Entrance',
        vendorType: dto.vendorType || DeviceVendorType.SIMULATED_TERMINAL,
        direction: dto.direction || AccessDirection.ENTRY,
        ipAddress: dto.ipAddress || null,
        doorControllerId: dto.doorControllerId || 'DOOR-CTRL-ASHKONA-01',
        doorUnlockDurationSec: dto.doorUnlockDurationSec
          ? Number(dto.doorUnlockDurationSec)
          : 5,
        apiKeyHash,
        isSimulated:
          dto.isSimulated !== undefined
            ? Boolean(dto.isSimulated)
            : (dto.vendorType || DeviceVendorType.SIMULATED_TERMINAL) ===
              DeviceVendorType.SIMULATED_TERMINAL,
        isActive: true,
        status: DeviceStatus.ONLINE,
        lastHeartbeatAt: new Date(),
        capabilitiesJson: {
          antiSpoofingLiveness: true,
          emergencyBreakGlassIndependent: true,
        },
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'ACCESS_DEVICE_REGISTERED',
      entityType: 'AccessDevice',
      entityId: created.id,
      summary: `Registered access device "${created.name}" (${created.deviceCode}, isSimulated=${created.isSimulated}).`,
    });

    const { apiKeyHash: _h, hmacSecretEncrypted: _s, ...safe } = created;
    return {
      ...safe,
      issuedDeviceApiKeyOnce: rawApiKey,
    };
  }

  async updateDeviceStatus(
    actor: AuthenticatedUser,
    deviceId: string,
    dto: Partial<{
      name: string;
      locationZone: string;
      status: DeviceStatus;
      isActive: boolean;
      isSimulated: boolean;
      doorUnlockDurationSec: number;
      ipAddress: string;
    }>,
  ) {
    if (!this.isAuthorizedAdminOnly(actor.role)) {
      throw new ForbiddenException(
        'Only ADMIN or SUPER_ADMIN can update access control devices.',
      );
    }

    const device = await this.prisma.accessDevice.findUnique({
      where: { id: deviceId },
    });
    if (!device) throw new NotFoundException('Access device not found.');

    const updated = await this.prisma.accessDevice.update({
      where: { id: deviceId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.locationZone !== undefined
          ? { locationZone: dto.locationZone }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.isActive !== undefined
          ? { isActive: Boolean(dto.isActive) }
          : {}),
        ...(dto.isSimulated !== undefined
          ? { isSimulated: Boolean(dto.isSimulated) }
          : {}),
        ...(dto.doorUnlockDurationSec !== undefined
          ? { doorUnlockDurationSec: Number(dto.doorUnlockDurationSec) }
          : {}),
        ...(dto.ipAddress !== undefined ? { ipAddress: dto.ipAddress } : {}),
        ...(dto.status === DeviceStatus.ONLINE
          ? { lastHeartbeatAt: new Date() }
          : {}),
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'ACCESS_DEVICE_STATUS_UPDATED',
      entityType: 'AccessDevice',
      entityId: updated.id,
      summary: `Updated device ${updated.deviceCode} status to ${updated.status} (isActive=${updated.isActive}).`,
    });

    const { apiKeyHash, hmacSecretEncrypted, ...safe } = updated;
    return safe;
  }

  async recordDeviceHeartbeat(deviceCode: string, apiKey?: string) {
    const device = await this.prisma.accessDevice.findUnique({
      where: { deviceCode },
    });
    if (!device) {
      throw new NotFoundException(`Device ${deviceCode} not found.`);
    }
    if (
      !apiKey ||
      !this.hardwareAdapter.verifyDeviceApiKey(apiKey, device.apiKeyHash)
    ) {
      throw new UnauthorizedException('Invalid device authentication credentials.');
    }

    const updated = await this.prisma.accessDevice.update({
      where: { id: device.id },
      data: {
        status: DeviceStatus.ONLINE,
        lastHeartbeatAt: new Date(),
      },
    });

    return {
      deviceCode: updated.deviceCode,
      status: updated.status,
      lastHeartbeatAt: updated.lastHeartbeatAt,
      emergencyExitIndependent: true,
    };
  }

  // ============================================================================
  // 5. CORE FACE VERIFICATION & ACCESS AUTHORIZATION ENGINE (SECTIONS 1, 2, 3, 4, 5)
  // ============================================================================

  /**
   * Authoritative backend evaluation for a Face Recognition / Biometric access attempt.
   * Never trusts frontend or device-side decisions.
   * Enforces:
   * - Replay & Idempotency protection
   * - Device authentication & online health
   * - Face recognition confidence & anti-spoofing liveness
   * - Member account status
   * - Real-time membership validity in Asia/Dhaka timezone (end-of-day 23:59:59.999+06:00 boundary)
   * - Payment verification status (PENDING payments never activate access)
   * - Gender-based session rules (Female Session -> Female Members only + checked-in Female Trainer)
   */
  async processAccessAttempt(
    input: FaceVerificationInput,
    authenticatedActor?: AuthenticatedUser,
  ) {
    const settings = await this.getSettings();
    const now = input.evaluationTimestamp
      ? new Date(input.evaluationTimestamp)
      : new Date();

    // 1. Replay Window Protection (if callbackTimestamp provided)
    if (input.callbackTimestamp) {
      const cbTime = new Date(input.callbackTimestamp);
      const driftSec = Math.abs(now.getTime() - cbTime.getTime()) / 1000;
      if (driftSec > settings.callbackReplayWindowSec) {
        throw new UnauthorizedException(
          `Device callback timestamp drift (${Math.round(driftSec)}s) exceeds replay protection window (${settings.callbackReplayWindowSec}s).`,
        );
      }
    }

    // 2. Idempotency Protection: Avoid duplicate attendance/access records from repeated device callbacks
    const idempotencyKey =
      input.idempotencyKey ||
      `EVT-${now.getTime()}-${crypto.randomBytes(6).toString('hex')}`;

    const existingEvent = await this.prisma.accessEvent.findUnique({
      where: { idempotencyKey },
      include: {
        memberProfile: {
          include: {
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
        device: {
          select: {
            id: true,
            deviceCode: true,
            name: true,
            locationZone: true,
            isSimulated: true,
          },
        },
        gymSession: true,
        doorControllerEvent: true,
      },
    });

    if (existingEvent) {
      return {
        ...existingEvent,
        idempotentReplay: true,
      };
    }

    // 3. Resolve & Authenticate Device
    const device = input.deviceId
      ? await this.prisma.accessDevice.findUnique({
          where: { id: input.deviceId },
        })
      : input.deviceCode
        ? await this.prisma.accessDevice.findUnique({
            where: { deviceCode: input.deviceCode },
          })
        : await this.prisma.accessDevice.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
          });

    if (!device) {
      throw new NotFoundException('Specified access device does not exist.');
    }

    // Authenticate non-admin hardware webhook calls using device API key
    const isAdminSimulatorCall =
      authenticatedActor &&
      this.isAuthorizedAdminOrStaff(authenticatedActor.role);

    if (!isAdminSimulatorCall) {
      if (
        !input.deviceApiKey ||
        !this.hardwareAdapter.verifyDeviceApiKey(
          input.deviceApiKey,
          device.apiKeyHash,
        )
      ) {
        await this.auditLogsService.log({
          action: 'UNAUTHORIZED_DEVICE_ACCESS_ATTEMPT',
          entityType: 'AccessDevice',
          entityId: device.id,
          summary: `Rejected unauthorized callback for device ${device.deviceCode} due to invalid or missing device API key.`,
        });
        throw new UnauthorizedException(
          'Unauthorized device request: invalid or missing device credentials.',
        );
      }
    }

    // Resolve current GymSession in Asia/Dhaka
    const sessionResolution = await this.resolveCurrentGymSession(
      now,
      input.gymSessionIdOverride,
    );
    const activeSession = sessionResolution.activeSession;

    // Helper to persist decision & door event atomically
    const recordOutcome = async (params: {
      memberProfileId?: string | null;
      membershipId?: string | null;
      decision: AccessDecision;
      denialCode?: AccessDenialCode | null;
      denialReason?: string | null;
      femaleTrainerPresent?: boolean | null;
      memberUserIdForNotification?: string | null;
      notificationTitle?: string;
      notificationMessage?: string;
    }) => {
      const doorResult =
        params.decision === AccessDecision.GRANTED
          ? await this.hardwareAdapter.executeDoorUnlock({
              device: device!,
              durationSeconds: device!.doorUnlockDurationSec,
              reason: 'Verified Member Access Granted',
              triggeredByUserId: authenticatedActor?.id,
            })
          : await this.hardwareAdapter.keepDoorLocked(
              device!,
              params.denialCode || 'DENIED',
            );

      // If hardware unlock failed due to offline device, downgrade decision to DENIED (fail-secure entry)
      const finalDecision =
        doorResult.status === DoorCommandStatus.DEVICE_TIMEOUT ||
        doorResult.status === DoorCommandStatus.CONTROLLER_ERROR
          ? AccessDecision.DENIED
          : params.decision;
      const finalDenialCode =
        finalDecision === AccessDecision.DENIED && !params.denialCode
          ? AccessDenialCode.DEVICE_UNAVAILABLE
          : params.denialCode || null;
      const finalDenialReason =
        finalDecision === AccessDecision.DENIED && !params.denialReason
          ? doorResult.errorMessage || 'Entrance device is offline or unreachable.'
          : params.denialReason || null;

      const isSim =
        Boolean(input.isSimulated) ||
        device!.isSimulated ||
        device!.vendorType === DeviceVendorType.SIMULATED_TERMINAL;

      const createdEvent = await this.prisma.accessEvent.create({
        data: {
          idempotencyKey,
          memberProfileId: params.memberProfileId || null,
          membershipId: params.membershipId || null,
          deviceId: device!.id,
          gymSessionId: activeSession?.id || null,
          direction: input.direction || device!.direction || AccessDirection.ENTRY,
          verificationMethod: isSim
            ? VerificationMethod.SIMULATED_BIOMETRIC
            : VerificationMethod.FACE_RECOGNITION,
          isSimulated: isSim,
          recognitionScore: input.recognitionScore ?? 0.96,
          livenessPassed: input.livenessPassed ?? true,
          accessDecision: finalDecision,
          denialCode: finalDenialCode,
          denialReason: finalDenialReason,
          doorCommandStatus: doorResult.status,
          sessionTypeSnapshot: activeSession?.sessionType || null,
          femaleTrainerPresentSnapshot: params.femaleTrainerPresent ?? null,
          authorizedByUserId: authenticatedActor?.id || null,
          eventTimestamp: now,
          metadataJson: {
            dhakaDate: sessionResolution.dhaka.dateKey,
            dhakaTime: sessionResolution.dhaka.timeHHmm,
            dhakaDayOfWeek: sessionResolution.dhaka.dayOfWeek,
            simulationDisclosure: doorResult.simulationDisclosure || null,
            emergencyExitIndependent: true,
          },
          doorControllerEvent: {
            create: {
              deviceId: device!.id,
              command: doorResult.command,
              status: doorResult.status,
              isSimulated: isSim,
              responseTimeMs: doorResult.responseTimeMs,
              controllerResponseCode: doorResult.controllerResponseCode,
              errorMessage: doorResult.errorMessage || null,
              triggeredByUserId: authenticatedActor?.id || null,
              emergencyExitIndependent: true,
            },
          },
        },
        include: {
          memberProfile: {
            include: {
              user: { select: { fullName: true, email: true, phone: true } },
            },
          },
          membership: { include: { plan: true } },
          device: {
            select: {
              id: true,
              deviceCode: true,
              name: true,
              locationZone: true,
              isSimulated: true,
            },
          },
          gymSession: true,
          doorControllerEvent: true,
        },
      });

      if (
        params.memberUserIdForNotification &&
        params.notificationTitle &&
        params.notificationMessage
      ) {
        await this.notificationsService.createNotification({
          userId: params.memberUserIdForNotification,
          type: NotificationType.ACCESS_CONTROL,
          title: params.notificationTitle,
          message: params.notificationMessage,
          linkUrl: '/member/access',
        });
      }

      await this.auditLogsService.log({
        actorUserId: authenticatedActor?.id,
        actorRole: authenticatedActor?.role,
        action:
          finalDecision === AccessDecision.GRANTED
            ? 'ACCESS_ENTRY_GRANTED'
            : 'ACCESS_ENTRY_DENIED',
        entityType: 'AccessEvent',
        entityId: createdEvent.id,
        summary:
          finalDecision === AccessDecision.GRANTED
            ? `Access GRANTED for ${createdEvent.memberProfile?.user?.fullName || 'Member'} at ${device!.name} (${sessionResolution.dhaka.timeHHmm} Asia/Dhaka)`
            : `Access DENIED (${finalDenialCode}) at ${device!.name}: ${finalDenialReason}`,
        metadata: {
          denialCode: finalDenialCode,
          isSimulated: isSim,
          deviceCode: device!.deviceCode,
          memberProfileId: params.memberProfileId,
        },
      });

      return {
        ...createdEvent,
        idempotentReplay: false,
      };
    };

    // 4. Check Device Availability / Disconnection (Section 1.1 & Section 10)
    const deviceHealth = this.hardwareAdapter.evaluateDeviceHealth(
      device,
      settings.deviceHeartbeatTimeoutSec,
      now,
    );
    if (!deviceHealth.isReachable) {
      return recordOutcome({
        decision: AccessDecision.DENIED,
        denialCode: AccessDenialCode.DEVICE_UNAVAILABLE,
        denialReason:
          'Facial recognition terminal is offline or disconnected. Physical entrance remains locked (fail-secure). Please see front-desk staff for manual verification. Emergency exits remain independently operable.',
      });
    }

    // 5. Check Liveness / Anti-Spoofing & Face Recognition Match (Section 1.2)
    if (settings.requireLivenessDetection && input.livenessPassed === false) {
      return recordOutcome({
        decision: AccessDecision.DENIED,
        denialCode: AccessDenialCode.SPOOF_DETECTED,
        denialReason:
          'Presentation / liveness check failed. Please stand directly in front of the terminal camera.',
      });
    }

    const score = input.recognitionScore ?? 0.96;
    if (
      input.faceRecognized === false ||
      score < settings.minFaceMatchConfidence
    ) {
      return recordOutcome({
        decision: AccessDecision.DENIED,
        denialCode: AccessDenialCode.FACE_NOT_RECOGNIZED,
        denialReason: `Facial recognition match confidence (${(score * 100).toFixed(1)}%) is below required threshold (${(settings.minFaceMatchConfidence * 100).toFixed(0)}%) or face was not recognized.`,
      });
    }

    // 6. Identify Member (by templateToken, memberProfileId, or memberCode)
    let member = null;
    if (input.templateToken) {
      const lookupHash = this.biometricSecurity.computeTemplateLookupHash(
        input.templateToken,
      );
      const enrollment = await this.prisma.biometricEnrollment.findUnique({
        where: { templateHash: lookupHash },
        include: {
          memberProfile: {
            include: {
              user: true,
              biometricEnrollment: true,
            },
          },
        },
      });
      member = enrollment?.memberProfile || null;
    } else if (input.memberProfileId) {
      member = await this.prisma.memberProfile.findUnique({
        where: { id: input.memberProfileId },
        include: {
          user: true,
          biometricEnrollment: true,
        },
      });
    } else if (input.memberCode) {
      member = await this.prisma.memberProfile.findUnique({
        where: { memberCode: input.memberCode },
        include: {
          user: true,
          biometricEnrollment: true,
        },
      });
    }

    if (!member) {
      return recordOutcome({
        decision: AccessDecision.DENIED,
        denialCode: AccessDenialCode.MEMBER_NOT_FOUND,
        denialReason:
          'No registered gym member matched the biometric recognition profile.',
      });
    }

    // Verify biometric enrollment consent if enrollment record exists and is revoked/deleted
    if (
      member.biometricEnrollment &&
      (member.biometricEnrollment.status ===
        BiometricEnrollmentStatus.REVOKED ||
        member.biometricEnrollment.status ===
          BiometricEnrollmentStatus.DELETED ||
        !member.biometricEnrollment.consentGranted)
    ) {
      return recordOutcome({
        memberProfileId: member.id,
        decision: AccessDecision.DENIED,
        denialCode: AccessDenialCode.BIOMETRIC_NOT_ENROLLED,
        denialReason:
          'Member biometric enrollment is not active or consent has been revoked. Please complete biometric consent or request staff verification.',
      });
    }

    // 7. Check Member Account Status
    if (
      member.user.status !== UserStatus.ACTIVE ||
      member.user.deletedAt !== null
    ) {
      return recordOutcome({
        memberProfileId: member.id,
        decision: AccessDecision.DENIED,
        denialCode: AccessDenialCode.ACCOUNT_INACTIVE,
        denialReason: `Member user account is ${member.user.status}. Please contact gym administration.`,
      });
    }

    // 8. Authoritative Real-Time Membership & Payment Check in Asia/Dhaka Timezone (Section 2)
    const memberships = await this.prisma.membership.findMany({
      where: { memberProfileId: member.id },
      include: {
        plan: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (memberships.length === 0) {
      return recordOutcome({
        memberProfileId: member.id,
        decision: AccessDecision.DENIED,
        denialCode: AccessDenialCode.MEMBERSHIP_NOT_ACTIVE,
        denialReason:
          'No membership package is assigned to your profile. Please select and activate a membership plan.',
      });
    }

    // Real-time expiration sync in Asia/Dhaka timezone (end of final valid day: 23:59:59.999+06:00)
    for (const m of memberships) {
      if (m.status === MembershipStatus.ACTIVE) {
        const validity = isMembershipValidAtDhakaTime(m.startDate, m.endDate, now);
        if (validity.isExpired) {
          await this.prisma.membership.update({
            where: { id: m.id },
            data: { status: MembershipStatus.EXPIRED },
          });
          m.status = MembershipStatus.EXPIRED;

          await this.notificationsService.createNotification({
            userId: member.userId,
            type: NotificationType.MEMBERSHIP,
            title: 'Membership Expired — Access Blocked',
            message: `Your "${m.plan.name}" membership expired on ${getDhakaTimeParts(m.endDate).dateKey} (23:59 Asia/Dhaka). Renew your plan to restore automatic gym entry.`,
            linkUrl: '/member/membership',
          });

          await this.auditLogsService.log({
            action: 'MEMBERSHIP_EXPIRED_AUTO_ENFORCED',
            entityType: 'Membership',
            entityId: m.id,
            summary: `Automatically marked expired membership (${m.plan.name}) for ${member.user.fullName} during real-time access evaluation.`,
          });
        }
      }
    }

    // Find an active, non-expired membership
    const validActiveMembership = memberships.find((m) => {
      if (m.status !== MembershipStatus.ACTIVE) return false;
      const v = isMembershipValidAtDhakaTime(m.startDate, m.endDate, now);
      return v.isValid;
    });

    if (!validActiveMembership) {
      // Determine exact denial reason from the member's memberships
      const latest = memberships[0];

      if (latest.status === MembershipStatus.SUSPENDED) {
        return recordOutcome({
          memberProfileId: member.id,
          membershipId: latest.id,
          decision: AccessDecision.DENIED,
          denialCode: AccessDenialCode.MEMBERSHIP_SUSPENDED,
          denialReason:
            'Your membership is currently SUSPENDED. Please visit the Ashkona front desk or contact administration.',
        });
      }

      if (latest.status === MembershipStatus.CANCELLED) {
        return recordOutcome({
          memberProfileId: member.id,
          membershipId: latest.id,
          decision: AccessDecision.DENIED,
          denialCode: AccessDenialCode.MEMBERSHIP_CANCELLED,
          denialReason:
            'Your membership has been CANCELLED. Please enroll in a new membership plan to enter.',
        });
      }

      if (latest.status === MembershipStatus.PENDING) {
        const hasPendingPayment = latest.payments.some(
          (p) => p.status === PaymentStatus.PENDING,
        );
        return recordOutcome({
          memberProfileId: member.id,
          membershipId: latest.id,
          decision: AccessDecision.DENIED,
          denialCode: hasPendingPayment
            ? AccessDenialCode.PAYMENT_PENDING
            : AccessDenialCode.MEMBERSHIP_NOT_ACTIVE,
          denialReason: hasPendingPayment
            ? 'Your membership payment is still PENDING staff verification. Pending payments or renewal requests do not unlock entry until verified.'
            : 'Your membership request is PENDING activation and payment verification.',
        });
      }

      if (
        latest.status === MembershipStatus.EXPIRED ||
        isMembershipValidAtDhakaTime(latest.startDate, latest.endDate, now)
          .isExpired
      ) {
        return recordOutcome({
          memberProfileId: member.id,
          membershipId: latest.id,
          decision: AccessDecision.DENIED,
          denialCode: AccessDenialCode.MEMBERSHIP_EXPIRED,
          denialReason: `Your "${latest.plan.name}" membership expired on ${getDhakaTimeParts(latest.endDate).dateKey}. Please renew your membership to restore access.`,
          memberUserIdForNotification: member.userId,
          notificationTitle: 'Entry Denied — Membership Expired',
          notificationMessage: `Entry attempt at ${device.name} was denied because your "${latest.plan.name}" membership has expired. Renew online or at the Ashkona front desk.`,
        });
      }

      return recordOutcome({
        memberProfileId: member.id,
        membershipId: latest.id,
        decision: AccessDecision.DENIED,
        denialCode: AccessDenialCode.MEMBERSHIP_NOT_ACTIVE,
        denialReason:
          'Your membership is not currently active for today’s date.',
      });
    }

    // Verify payment requirement on the active membership:
    // If payments exist on this membership and NONE are VERIFIED_PAID (e.g., only PENDING/FAILED), deny with PAYMENT_PENDING
    if (validActiveMembership.payments.length > 0) {
      const hasVerifiedPayment = validActiveMembership.payments.some(
        (p) => p.status === PaymentStatus.VERIFIED_PAID,
      );
      if (!hasVerifiedPayment) {
        return recordOutcome({
          memberProfileId: member.id,
          membershipId: validActiveMembership.id,
          decision: AccessDecision.DENIED,
          denialCode: AccessDenialCode.PAYMENT_PENDING,
          denialReason:
            'Payment for this membership is still PENDING verification. Entry requires a verified payment.',
        });
      }
    }

    // 9. Check Holiday / Closure Exceptions & Gender-Based Gym Session Rules (Sections 3 & 4)
    if (sessionResolution.isClosedByException) {
      return recordOutcome({
        memberProfileId: member.id,
        membershipId: validActiveMembership.id,
        decision: AccessDecision.DENIED,
        denialCode: AccessDenialCode.OUTSIDE_OPERATING_SESSION,
        denialReason: `Gym is currently closed due to scheduled exception: "${sessionResolution.activeException?.title}".`,
      });
    }

    let femaleTrainerPresentSnapshot: boolean | null = null;

    if (settings.enforceGenderSessions && activeSession) {
      if (activeSession.sessionType === GymSessionType.FEMALE_SESSION) {
        // Mandatory Rule 3.1: Only Female Members can enter during a Female Session.
        // Male Members must ALWAYS be denied entry, even with active membership and valid face recognition.
        if (member.gender !== Gender.FEMALE) {
          return recordOutcome({
            memberProfileId: member.id,
            membershipId: validActiveMembership.id,
            decision: AccessDecision.DENIED,
            denialCode: AccessDenialCode.FEMALE_SESSION_RESTRICTED,
            denialReason: `Current session "${activeSession.name}" (${activeSession.startTime}–${activeSession.endTime} Asia/Dhaka) is a dedicated Female Session. Male members are not permitted to enter during Female Sessions.`,
            femaleTrainerPresent: null,
          });
        }

        // Mandatory Rule 3.1 & Section 4: A designated Female Trainer must be assigned AND physically present (checked in).
        if (
          settings.requireFemaleTrainerPresence ||
          activeSession.requiresFemaleTrainer
        ) {
          const trainerPresence =
            await this.verifyFemaleTrainerPresenceForSession(
              activeSession.id,
              now,
            );
          femaleTrainerPresentSnapshot = trainerPresence.isFemaleTrainerPresent;

          if (!trainerPresence.isFemaleTrainerPresent) {
            return recordOutcome({
              memberProfileId: member.id,
              membershipId: validActiveMembership.id,
              decision: AccessDecision.DENIED,
              denialCode: AccessDenialCode.FEMALE_TRAINER_UNAVAILABLE,
              denialReason: `Female Session "${activeSession.name}" entry is temporarily paused because the designated Female Trainer is not checked in (${trainerPresence.reason}). Please wait for an administrator or Female Trainer check-in.`,
              femaleTrainerPresent: false,
            });
          }
        }
      } else if (activeSession.sessionType === GymSessionType.MALE_SESSION) {
        // Mandatory Rule 3.2: During a Male Session, Male Members may enter if membership is valid,
        // and Female Members may ALSO enter if their membership is valid.
        const allowFemale =
          activeSession.allowFemaleInMaleSession &&
          settings.allowFemaleInMaleSession;
        if (member.gender === Gender.FEMALE && !allowFemale) {
          return recordOutcome({
            memberProfileId: member.id,
            membershipId: validActiveMembership.id,
            decision: AccessDecision.DENIED,
            denialCode: AccessDenialCode.OUTSIDE_OPERATING_SESSION,
            denialReason:
              'Current session is restricted by administrative configuration.',
          });
        }
      }
    } else if (settings.blockEntryWhenNoActiveSession && !activeSession) {
      return recordOutcome({
        memberProfileId: member.id,
        membershipId: validActiveMembership.id,
        decision: AccessDecision.DENIED,
        denialCode: AccessDenialCode.OUTSIDE_OPERATING_SESSION,
        denialReason:
          'No active gym session is scheduled for the current time in Asia/Dhaka.',
      });
    }

    // 10. All Conditions Satisfied -> Authorize Door Unlock & Record Entry
    if (member.biometricEnrollment) {
      await this.prisma.biometricEnrollment.update({
        where: { id: member.biometricEnrollment.id },
        data: { lastVerifiedAt: now },
      });
    }

    return recordOutcome({
      memberProfileId: member.id,
      membershipId: validActiveMembership.id,
      decision: AccessDecision.GRANTED,
      denialCode: null,
      denialReason: null,
      femaleTrainerPresent: femaleTrainerPresentSnapshot,
    });
  }

  /**
   * Manual Staff Verification Process (Section 10).
   * Used when a member's biometric terminal is offline or being enrolled,
   * still enforcing membership validity and gender session rules, and logging the staff member.
   */
  async verifyManualStaffEntry(
    actor: AuthenticatedUser,
    dto: {
      memberProfileId: string;
      deviceId?: string;
      gymSessionIdOverride?: string;
      direction?: AccessDirection;
      notes: string;
    },
  ) {
    if (!this.isAuthorizedAdminOrStaff(actor.role)) {
      throw new ForbiddenException(
        'Only authorized staff (STAFF, ADMIN, SUPER_ADMIN) may perform manual entry verification.',
      );
    }

    const settings = await this.getSettings();
    if (!settings.allowStaffManualOverride) {
      throw new ForbiddenException(
        'Manual staff entry verification is currently disabled in Access Control Settings.',
      );
    }

    // Temporarily ensure we evaluate eligibility using the same authoritative rules
    const member = await this.prisma.memberProfile.findUnique({
      where: { id: dto.memberProfileId },
      include: { user: true },
    });
    if (!member) {
      throw new NotFoundException('Member profile not found.');
    }

    const result = await this.processAccessAttempt(
      {
        memberProfileId: member.id,
        deviceId: dto.deviceId,
        gymSessionIdOverride: dto.gymSessionIdOverride,
        direction: dto.direction || AccessDirection.ENTRY,
        faceRecognized: true,
        recognitionScore: 1.0,
        livenessPassed: true,
        isSimulated: true,
      },
      actor,
    );

    // Mark verificationMethod as MANUAL_STAFF_VERIFICATION
    const updatedEvent = await this.prisma.accessEvent.update({
      where: { id: result.id },
      data: {
        verificationMethod: VerificationMethod.MANUAL_STAFF_VERIFICATION,
        authorizedByUserId: actor.id,
        metadataJson: {
          ...((result.metadataJson as Record<string, any>) || {}),
          manualVerificationNotes: dto.notes,
          verifiedByStaffEmail: actor.email,
        },
      },
      include: {
        memberProfile: {
          include: {
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
        membership: { include: { plan: true } },
        device: {
          select: {
            id: true,
            deviceCode: true,
            name: true,
            locationZone: true,
            isSimulated: true,
          },
        },
        gymSession: true,
        doorControllerEvent: true,
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'MANUAL_STAFF_ACCESS_VERIFICATION',
      entityType: 'AccessEvent',
      entityId: updatedEvent.id,
      summary: `Staff ${actor.email} performed manual access verification for ${member.user.fullName} (${member.memberCode}) -> ${updatedEvent.accessDecision}. Notes: ${dto.notes}`,
    });

    return updatedEvent;
  }

  // ============================================================================
  // 6. OVERVIEW, LOGS, OCCUPANCY, ALERTS & MEMBER PORTAL ACCESS SUMMARY
  // ============================================================================

  /**
   * Returns complete real-time operational metrics and administrative alerts
   * for the Admin Smart Access Control Overview (Section 6).
   */
  async getAdminAccessOverview(now: Date = new Date()) {
    const dhaka = getDhakaTimeParts(now);
    const todayStartDhaka = new Date(`${dhaka.dateKey}T00:00:00.000+06:00`);
    const todayEndDhaka = new Date(`${dhaka.dateKey}T23:59:59.999+06:00`);

    // Sync any newly expired memberships
    const activeMemberships = await this.prisma.membership.findMany({
      where: { status: MembershipStatus.ACTIVE },
    });
    for (const m of activeMemberships) {
      if (isMembershipValidAtDhakaTime(m.startDate, m.endDate, now).isExpired) {
        await this.prisma.membership.update({
          where: { id: m.id },
          data: { status: MembershipStatus.EXPIRED },
        });
      }
    }

    const [
      todayGrantedEntries,
      todayDeniedAttempts,
      todayGrantedExits,
      activeEligibleMembershipsCount,
      expiredMembershipsCount,
      enrolledBiometricsCount,
      devices,
      currentSessionInfo,
      recentEvents,
      denialBreakdownRaw,
    ] = await Promise.all([
      this.prisma.accessEvent.count({
        where: {
          eventTimestamp: { gte: todayStartDhaka, lte: todayEndDhaka },
          accessDecision: AccessDecision.GRANTED,
          direction: AccessDirection.ENTRY,
        },
      }),
      this.prisma.accessEvent.count({
        where: {
          eventTimestamp: { gte: todayStartDhaka, lte: todayEndDhaka },
          accessDecision: AccessDecision.DENIED,
        },
      }),
      this.prisma.accessEvent.count({
        where: {
          eventTimestamp: { gte: todayStartDhaka, lte: todayEndDhaka },
          accessDecision: AccessDecision.GRANTED,
          direction: AccessDirection.EXIT,
        },
      }),
      this.prisma.membership.count({
        where: { status: MembershipStatus.ACTIVE },
      }),
      this.prisma.membership.count({
        where: { status: MembershipStatus.EXPIRED },
      }),
      this.prisma.biometricEnrollment.count({
        where: {
          status: BiometricEnrollmentStatus.ENROLLED,
          consentGranted: true,
        },
      }),
      this.listDevices(),
      this.resolveCurrentGymSession(now),
      this.prisma.accessEvent.findMany({
        take: 15,
        orderBy: { eventTimestamp: 'desc' },
        include: {
          memberProfile: {
            include: {
              user: { select: { fullName: true, email: true, phone: true } },
            },
          },
          device: {
            select: {
              id: true,
              deviceCode: true,
              name: true,
              locationZone: true,
              isSimulated: true,
            },
          },
          gymSession: true,
        },
      }),
      this.prisma.accessEvent.groupBy({
        by: ['denialCode'],
        where: {
          eventTimestamp: { gte: todayStartDhaka, lte: todayEndDhaka },
          accessDecision: AccessDecision.DENIED,
        },
        _count: { _all: true },
      }),
    ]);

    const currentOccupancy = Math.max(
      0,
      todayGrantedEntries - todayGrantedExits,
    );

    const onlineDevicesCount = devices.filter(
      (d) => d.health.isReachable,
    ).length;
    const offlineDevicesCount = devices.length - onlineDevicesCount;

    // Evaluate Female Session & Female Trainer status and administrative alerts
    const activeSession = currentSessionInfo.activeSession;
    let femaleTrainerPresence = null;
    if (activeSession?.sessionType === GymSessionType.FEMALE_SESSION) {
      femaleTrainerPresence =
        await this.verifyFemaleTrainerPresenceForSession(activeSession.id, now);
    }

    // Also inspect today's Female Sessions for upcoming/active trainer alerts (Section 4)
    const todayFemaleSessions = await this.prisma.gymSession.findMany({
      where: {
        dayOfWeek: dhaka.dayOfWeek,
        sessionType: GymSessionType.FEMALE_SESSION,
        isActive: true,
      },
    });

    const alerts: Array<{
      severity: 'CRITICAL' | 'WARNING' | 'INFO';
      code: string;
      title: string;
      message: string;
    }> = [];

    for (const femSes of todayFemaleSessions) {
      const presence = await this.verifyFemaleTrainerPresenceForSession(
        femSes.id,
        now,
      );
      if (!presence.hasAssignedFemaleTrainer) {
        alerts.push({
          severity: 'CRITICAL',
          code: 'FEMALE_SESSION_NO_ASSIGNED_TRAINER',
          title: `Unassigned Female Session: ${femSes.name}`,
          message: `Female Session "${femSes.name}" (${femSes.startTime}–${femSes.endTime} Asia/Dhaka) has no assigned Female Trainer. Entry will remain blocked until a Female Trainer is assigned and checked in.`,
        });
      } else if (!presence.isFemaleTrainerPresent) {
        alerts.push({
          severity: 'WARNING',
          code: 'FEMALE_TRAINER_NOT_CHECKED_IN',
          title: `Female Trainer Not Checked In: ${femSes.name}`,
          message: `${presence.reason} Assign a replacement or verify trainer check-in before "${femSes.name}" (${femSes.startTime}–${femSes.endTime}).`,
        });
      }
    }

    if (offlineDevicesCount > 0) {
      alerts.push({
        severity: 'CRITICAL',
        code: 'ACCESS_DEVICE_OFFLINE',
        title: `${offlineDevicesCount} Access Terminal(s) Offline`,
        message:
          'Offline terminals automatically fail-secure (keep entrance locked). Use Staff Manual Verification for legitimate active members.',
      });
    }

    return {
      dhakaTime: {
        dateKey: dhaka.dateKey,
        timeHHmm: dhaka.timeHHmm,
        dayOfWeek: dhaka.dayOfWeek,
        timezone: 'Asia/Dhaka (UTC+06:00)',
      },
      metrics: {
        todayGrantedEntries,
        todayDeniedAttempts,
        todayGrantedExits,
        currentOccupancy,
        activeEligibleMembershipsCount,
        expiredMembershipsCount,
        enrolledBiometricsCount,
        onlineDevicesCount,
        offlineDevicesCount,
      },
      currentSession: activeSession
        ? {
            id: activeSession.id,
            name: activeSession.name,
            code: activeSession.code,
            sessionType: activeSession.sessionType,
            dayOfWeek: activeSession.dayOfWeek,
            startTime: activeSession.startTime,
            endTime: activeSession.endTime,
            femaleTrainerPresence,
          }
        : null,
      alerts,
      devices,
      denialBreakdown: denialBreakdownRaw.map((item) => ({
        denialCode: item.denialCode || 'UNKNOWN',
        count: item._count._all,
      })),
      recentEvents,
      emergencySafetyStatus: this.getEmergencySafetyStatus(),
    };
  }

  /**
   * Paginated & filterable Access Event History (Section 5).
   */
  async listAccessEvents(params: {
    page?: number;
    limit?: number;
    decision?: AccessDecision;
    denialCode?: AccessDenialCode;
    sessionType?: GymSessionType;
    deviceId?: string;
    memberSearch?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = params.page && params.page > 0 ? Number(params.page) : 1;
    const limit = params.limit && params.limit > 0 ? Number(params.limit) : 25;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};
    if (params.decision) where.accessDecision = params.decision;
    if (params.denialCode) where.denialCode = params.denialCode;
    if (params.sessionType) where.sessionTypeSnapshot = params.sessionType;
    if (params.deviceId) where.deviceId = params.deviceId;

    if (params.startDate || params.endDate) {
      where.eventTimestamp = {};
      if (params.startDate) {
        where.eventTimestamp.gte = new Date(
          `${params.startDate}T00:00:00.000+06:00`,
        );
      }
      if (params.endDate) {
        where.eventTimestamp.lte = new Date(
          `${params.endDate}T23:59:59.999+06:00`,
        );
      }
    }

    if (params.memberSearch) {
      where.memberProfile = {
        OR: [
          {
            memberCode: {
              contains: params.memberSearch,
              mode: 'insensitive',
            },
          },
          {
            user: {
              fullName: {
                contains: params.memberSearch,
                mode: 'insensitive',
              },
            },
          },
          {
            user: {
              phone: {
                contains: params.memberSearch,
                mode: 'insensitive',
              },
            },
          },
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.accessEvent.findMany({
        where,
        include: {
          memberProfile: {
            include: {
              user: { select: { fullName: true, email: true, phone: true } },
            },
          },
          membership: {
            include: { plan: { select: { name: true } } },
          },
          device: {
            select: {
              id: true,
              deviceCode: true,
              name: true,
              locationZone: true,
              isSimulated: true,
            },
          },
          gymSession: true,
          doorControllerEvent: true,
        },
        orderBy: { eventTimestamp: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.accessEvent.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Exports filtered Access Events to CSV for authorized administrators (Section 5).
   */
  async exportAccessEventsCsv(
    actor: AuthenticatedUser,
    params: {
      decision?: AccessDecision;
      denialCode?: AccessDenialCode;
      sessionType?: GymSessionType;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<string> {
    if (!this.isAuthorizedAdminOnly(actor.role)) {
      throw new ForbiddenException(
        'Only ADMIN or SUPER_ADMIN can export access logs to CSV.',
      );
    }

    const res = await this.listAccessEvents({
      ...params,
      page: 1,
      limit: 1000,
    });

    const headers = [
      'Event ID',
      'Timestamp (ISO)',
      'Dhaka Time',
      'Member Code',
      'Member Name',
      'Gender',
      'Device Code',
      'Session Name',
      'Session Type',
      'Verification Method',
      'Simulated',
      'Decision',
      'Denial Code',
      'Denial Reason',
      'Door Status',
    ];

    const escapeCsv = (val: any) => {
      const s = val === null || val === undefined ? '' : String(val);
      return `"${s.replace(/"/g, '""')}"`;
    };

    const rows = res.items.map((ev) => {
      const dhaka = getDhakaTimeParts(ev.eventTimestamp);
      return [
        ev.id,
        ev.eventTimestamp.toISOString(),
        `${dhaka.dateKey} ${dhaka.timeHHmm}`,
        ev.memberProfile?.memberCode || 'UNIDENTIFIED',
        ev.memberProfile?.user?.fullName || 'Unidentified Person',
        ev.memberProfile?.gender || '',
        ev.device?.deviceCode || '',
        ev.gymSession?.name || '',
        ev.sessionTypeSnapshot || '',
        ev.verificationMethod,
        ev.isSimulated ? 'YES' : 'NO',
        ev.accessDecision,
        ev.denialCode || '',
        ev.denialReason || '',
        ev.doorCommandStatus,
      ]
        .map(escapeCsv)
        .join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  private async getExtendedVerificationDataMap(
    memberProfileIds: string[],
  ): Promise<
    Map<
      string,
      {
        appUsername: string | null;
        nidNumber: string | null;
        rfidCardNumber: string | null;
        facebookUrl: string | null;
        recentPhotoDataUrl: string | null;
        facePhotoUploadedAt: Date | null;
        verificationProfileJson: any;
      }
    >
  > {
    const result = new Map<string, any>();
    if (
      !memberProfileIds.length ||
      typeof (this.prisma as any).$queryRaw !== 'function'
    ) {
      return result;
    }

    const rows = await this.prisma.$queryRaw<
      Array<{
        memberProfileId: string;
        appUsername: string | null;
        nidNumber: string | null;
        rfidCardNumber: string | null;
        facebookUrl: string | null;
        recentPhotoDataUrl: string | null;
        facePhotoUploadedAt: Date | null;
        verificationProfileJson: any;
      }>
    >`
      SELECT
        mp."id" AS "memberProfileId",
        mp."appUsername",
        mp."nidNumber",
        mp."rfidCardNumber",
        mp."facebookUrl",
        be."recentPhotoDataUrl",
        be."facePhotoUploadedAt",
        be."verificationProfileJson"
      FROM "MemberProfile" mp
      LEFT JOIN "BiometricEnrollment" be ON be."memberProfileId" = mp."id"
      WHERE mp."id" = ANY(${memberProfileIds}::text[])
    `;

    for (const row of rows || []) {
      result.set(row.memberProfileId, row);
    }
    return result;
  }

  private mergeBiometricExtendedFields(
    enrollment: any,
    ext?: {
      recentPhotoDataUrl: string | null;
      facePhotoUploadedAt: Date | null;
      verificationProfileJson: any;
    },
  ) {
    if (!enrollment) return null;
    return {
      ...enrollment,
      recentPhotoDataUrl:
        ext?.recentPhotoDataUrl ?? enrollment.recentPhotoDataUrl ?? null,
      facePhotoUploadedAt:
        ext?.facePhotoUploadedAt ?? enrollment.facePhotoUploadedAt ?? null,
      verificationProfileJson:
        ext?.verificationProfileJson ??
        enrollment.verificationProfileJson ??
        null,
    };
  }

  /**
   * Lists all members with their sanitized biometric enrollment status and current access eligibility (Section 6.3).
   */
  async listMemberBiometricStatuses(search?: string) {
    const where: Record<string, any> = {};
    if (search) {
      where.OR = [
        { memberCode: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const members = await this.prisma.memberProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            status: true,
          },
        },
        biometricEnrollment: {
          include: {
            enrolledDevice: {
              select: { id: true, name: true, deviceCode: true },
            },
          },
        },
        memberships: {
          include: { plan: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const extendedMap = await this.getExtendedVerificationDataMap(
      members.map((m) => m.id),
    );

    return members.map((m) => {
      const latestMembership = m.memberships[0] || null;
      const validity = latestMembership
        ? isMembershipValidAtDhakaTime(
            latestMembership.startDate,
            latestMembership.endDate,
          )
        : null;

      const ext = extendedMap.get(m.id);
      const memberExtra = m as Record<string, any>;
      const mergedEnrollment = this.mergeBiometricExtendedFields(
        m.biometricEnrollment,
        ext,
      );

      return {
        memberProfileId: m.id,
        memberCode: m.memberCode,
        gender: m.gender,
        dateOfBirth: m.dateOfBirth,
        address: m.address,
        bloodGroup: m.bloodGroup,
        heightCm: m.heightCm,
        weightKg: m.weightKg,
        appUsername: ext?.appUsername ?? memberExtra.appUsername ?? null,
        nidNumber: ext?.nidNumber ?? memberExtra.nidNumber ?? null,
        rfidCardNumber: ext?.rfidCardNumber ?? memberExtra.rfidCardNumber ?? null,
        facebookUrl: ext?.facebookUrl ?? memberExtra.facebookUrl ?? null,
        user: m.user,
        biometricEnrollment: this.biometricSecurity.sanitizeEnrollmentForResponse(
          mergedEnrollment,
        ) || {
          status: BiometricEnrollmentStatus.NOT_ENROLLED,
          consentGranted: false,
          hasEncryptedTemplate: false,
        },
        latestMembership: latestMembership
          ? {
              id: latestMembership.id,
              planName: latestMembership.plan.name,
              status: latestMembership.status,
              startDate: latestMembership.startDate,
              endDate: latestMembership.endDate,
              effectiveExpiryDhaka: getDhakaEndOfDayCutoff(
                latestMembership.endDate,
              ),
              isCurrentlyValid:
                latestMembership.status === MembershipStatus.ACTIVE &&
                Boolean(validity?.isValid),
            }
          : null,
      };
    });
  }

  /**
   * Returns a member's own Smart Access Control portal view (Section 7).
   * Strictly scoped to the authenticated member's own userId (IDOR protected).
   */
  async getMyMemberAccessSummary(actor: AuthenticatedUser, targetMemberId?: string) {
    const member = await this.prisma.memberProfile.findUnique({
      where: targetMemberId ? { id: targetMemberId } : { userId: actor.id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            status: true,
          },
        },
        biometricEnrollment: {
          include: {
            enrolledDevice: {
              select: { id: true, name: true, deviceCode: true },
            },
          },
        },
        memberships: {
          include: {
            plan: true,
            payments: { orderBy: { createdAt: 'desc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member profile not found.');
    }

    // Strict IDOR protection: Members can NEVER access another member's biometric or access records
    if (actor.role === Role.MEMBER && member.userId !== actor.id) {
      throw new ForbiddenException(
        'You are not authorized to view another member’s access or biometric records.',
      );
    }

    const now = new Date();
    const dhaka = getDhakaTimeParts(now);

    const activeMembership =
      member.memberships.find(
        (m) =>
          m.status === MembershipStatus.ACTIVE &&
          isMembershipValidAtDhakaTime(m.startDate, m.endDate, now).isValid,
      ) || null;
    const latestMembership = activeMembership || member.memberships[0] || null;

    const allActiveSessions = await this.prisma.gymSession.findMany({
      where: { isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    // Filter sessions the member is permitted to attend based on their gender
    const permittedSessions = allActiveSessions.filter((s) => {
      if (s.sessionType === GymSessionType.FEMALE_SESSION) {
        return member.gender === Gender.FEMALE;
      }
      if (s.sessionType === GymSessionType.MALE_SESSION) {
        return member.gender === Gender.MALE || s.allowFemaleInMaleSession;
      }
      return true;
    });

    const myAccessEvents = await this.prisma.accessEvent.findMany({
      where: { memberProfileId: member.id },
      include: {
        device: {
          select: {
            id: true,
            deviceCode: true,
            name: true,
            locationZone: true,
            isSimulated: true,
          },
        },
        gymSession: true,
      },
      orderBy: { eventTimestamp: 'desc' },
      take: 30,
    });

    const hasVerifiedPayment = latestMembership?.payments?.some(
      (p) => p.status === PaymentStatus.VERIFIED_PAID,
    );

    const isBiometricEnrolled =
      member.biometricEnrollment?.status ===
        BiometricEnrollmentStatus.ENROLLED &&
      Boolean(member.biometricEnrollment?.consentGranted);

    const isEligibleForAutomaticEntry =
      member.user.status === UserStatus.ACTIVE &&
      Boolean(activeMembership) &&
      (activeMembership!.payments.length === 0 || Boolean(hasVerifiedPayment)) &&
      isBiometricEnrolled;

    let eligibilityReason = 'Eligible for automatic facial recognition entry during permitted sessions.';
    if (!isBiometricEnrolled) {
      eligibilityReason =
        'Biometric consent & enrollment required for automatic turnstile entry.';
    } else if (!activeMembership) {
      eligibilityReason =
        latestMembership?.status === MembershipStatus.EXPIRED
          ? 'Membership has expired. Renew your plan to restore access.'
          : latestMembership?.status === MembershipStatus.PENDING
            ? 'Membership is pending payment verification by staff.'
            : 'No active membership plan.';
    }

    const extendedMap = await this.getExtendedVerificationDataMap([member.id]);
    const ext = extendedMap.get(member.id);
    const mergedBiometricEnrollment = this.mergeBiometricExtendedFields(
      member.biometricEnrollment,
      ext,
    );

    return {
      dhakaTime: {
        dateKey: dhaka.dateKey,
        timeHHmm: dhaka.timeHHmm,
        dayOfWeek: dhaka.dayOfWeek,
        timezone: 'Asia/Dhaka (UTC+06:00)',
      },
      member: {
        id: member.id,
        memberCode: member.memberCode,
        gender: member.gender,
        fullName: member.user.fullName,
        email: member.user.email,
        phone: member.user.phone,
        avatarUrl: member.user.avatarUrl,
        appUsername: ext?.appUsername ?? (member as any).appUsername ?? null,
        address: member.address,
        dateOfBirth: member.dateOfBirth,
        bloodGroup: member.bloodGroup,
        heightCm: member.heightCm,
        weightKg: member.weightKg,
        nidNumber: ext?.nidNumber ?? (member as any).nidNumber ?? null,
        rfidCardNumber:
          ext?.rfidCardNumber ?? (member as any).rfidCardNumber ?? null,
        facebookUrl: ext?.facebookUrl ?? (member as any).facebookUrl ?? null,
        accountStatus: member.user.status,
      },
      biometricEnrollment:
        this.biometricSecurity.sanitizeEnrollmentForResponse(
          mergedBiometricEnrollment,
        ) || {
          status: BiometricEnrollmentStatus.NOT_ENROLLED,
          consentGranted: false,
          hasEncryptedTemplate: false,
        },
      membershipValidity: latestMembership
        ? {
            id: latestMembership.id,
            planName: latestMembership.plan.name,
            status: latestMembership.status,
            startDate: latestMembership.startDate,
            endDate: latestMembership.endDate,
            effectiveExpiryDhaka: getDhakaEndOfDayCutoff(
              latestMembership.endDate,
            ),
            daysRemaining: Math.max(
              0,
              Math.ceil(
                (getDhakaEndOfDayCutoff(latestMembership.endDate).getTime() -
                  now.getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
            ),
          }
        : null,
      accessEligibility: {
        isEligible: isEligibleForAutomaticEntry,
        statusLabel: isEligibleForAutomaticEntry ? 'ELIGIBLE' : 'BLOCKED',
        reason: eligibilityReason,
      },
      permittedSessions,
      accessHistory: myAccessEvents,
      recentDeniedAttempts: myAccessEvents.filter(
        (ev) => ev.accessDecision === AccessDecision.DENIED,
      ),
    };
  }

  /**
   * Emergency Exit & Life-Safety Independence Verification (Section 10).
   */
  getEmergencySafetyStatus() {
    return {
      emergencyExitIndependent: true,
      canSoftwareBlockEmergencyExit: false,
      failSecureEntranceOnDeviceOffline: true,
      manualStaffVerificationAvailable: true,
      safetyPolicy:
        'Fire safety, emergency egress, and mechanical break-glass door releases operate 100% independently of the application, database, internet connection, or facial recognition terminals.',
    };
  }
}


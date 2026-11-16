import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceStatus, BookingStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private normalizeDate(dateInput?: string | Date): Date {
    const d = dateInput ? new Date(dateInput) : new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  async findAll(
    actor: AuthenticatedUser,
    params: { classScheduleId?: string; memberProfileId?: string },
  ) {
    const where: Record<string, any> = {};
    if (params.classScheduleId) where.classScheduleId = params.classScheduleId;
    if (params.memberProfileId) where.memberProfileId = params.memberProfileId;

    if (actor.role === Role.TRAINER && actor.trainerProfileId) {
      where.classSchedule = { trainerProfileId: actor.trainerProfileId };
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        memberProfile: {
          include: {
            user: { select: { fullName: true, phone: true } },
          },
        },
        classSchedule: {
          include: { gymClass: true },
        },
        recordedByUser: {
          select: { fullName: true, role: true },
        },
      },
      orderBy: [{ sessionDate: 'desc' }, { recordedAt: 'desc' }],
      take: 100,
    });
  }

  async recordAttendance(
    actor: AuthenticatedUser,
    dto: {
      classScheduleId: string;
      memberProfileId: string;
      bookingId?: string;
      sessionDate?: string;
      status: AttendanceStatus;
      remarks?: string;
    },
  ) {
    const schedule = await this.prisma.classSchedule.findUnique({
      where: { id: dto.classScheduleId },
      include: { gymClass: true },
    });
    if (!schedule) {
      throw new NotFoundException('Class schedule not found.');
    }

    if (
      actor.role === Role.TRAINER &&
      schedule.trainerProfileId !== actor.trainerProfileId
    ) {
      throw new ForbiddenException(
        'Trainers can only record attendance for their own scheduled classes.',
      );
    }

    const sessionDate = this.normalizeDate(dto.sessionDate);

    const record = await this.prisma.attendance.upsert({
      where: {
        classScheduleId_memberProfileId_sessionDate: {
          classScheduleId: dto.classScheduleId,
          memberProfileId: dto.memberProfileId,
          sessionDate,
        },
      },
      update: {
        status: dto.status,
        recordedByUserId: actor.id,
        recordedAt: new Date(),
        remarks: dto.remarks || null,
      },
      create: {
        classScheduleId: dto.classScheduleId,
        memberProfileId: dto.memberProfileId,
        bookingId: dto.bookingId || null,
        sessionDate,
        status: dto.status,
        recordedByUserId: actor.id,
        remarks: dto.remarks || null,
      },
      include: {
        memberProfile: {
          include: { user: { select: { fullName: true } } },
        },
        classSchedule: { include: { gymClass: true } },
      },
    });

    if (dto.bookingId && dto.status === AttendanceStatus.PRESENT) {
      await this.prisma.booking.update({
        where: { id: dto.bookingId },
        data: {
          status: BookingStatus.COMPLETED,
          checkedInAt: new Date(),
        },
      });
    }

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'ATTENDANCE_RECORDED',
      entityType: 'Attendance',
      entityId: record.id,
      summary: `Marked ${record.memberProfile.user.fullName} as ${dto.status} for '${record.classSchedule.gymClass.title}'`,
    });

    return record;
  }
}


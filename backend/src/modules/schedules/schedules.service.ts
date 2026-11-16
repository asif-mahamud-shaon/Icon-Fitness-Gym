import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DayOfWeek } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class SchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findPublicSchedules(dayOfWeek?: DayOfWeek) {
    const schedules = await this.prisma.classSchedule.findMany({
      where: {
        isPublished: true,
        isCancelled: false,
        gymClass: { isPublished: true, isActive: true },
        ...(dayOfWeek ? { dayOfWeek } : {}),
      },
      include: {
        gymClass: true,
        trainerProfile: {
          include: {
            user: { select: { fullName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return schedules.map((s) => ({
      ...s,
      availableSeats: Math.max(0, s.capacity - s.bookedCount),
    }));
  }

  async findAllAdminOrTrainer(actor: AuthenticatedUser) {
    const where: Record<string, any> = {};
    if (actor.role === 'TRAINER' && actor.trainerProfileId) {
      where.trainerProfileId = actor.trainerProfileId;
    }

    const schedules = await this.prisma.classSchedule.findMany({
      where,
      include: {
        gymClass: true,
        trainerProfile: {
          include: {
            user: { select: { fullName: true, avatarUrl: true } },
          },
        },
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return schedules.map((s) => ({
      ...s,
      availableSeats: Math.max(0, s.capacity - s.bookedCount),
    }));
  }

  async createSchedule(
    actor: AuthenticatedUser,
    dto: {
      gymClassId: string;
      trainerProfileId: string;
      dayOfWeek: DayOfWeek;
      specificDate?: string;
      startTime: string;
      endTime: string;
      roomOrZone?: string;
      capacity?: number;
      cancellationCutoffHours?: number;
      isPublished?: boolean;
    },
  ) {
    const [gymClass, trainer] = await Promise.all([
      this.prisma.gymClass.findUnique({ where: { id: dto.gymClassId } }),
      this.prisma.trainerProfile.findUnique({
        where: { id: dto.trainerProfileId },
      }),
    ]);

    if (!gymClass) throw new NotFoundException('Gym class not found.');
    if (!trainer) throw new NotFoundException('Trainer not found.');

    const capacity = Number(dto.capacity ?? gymClass.defaultCapacity ?? 20);
    if (capacity <= 0) {
      throw new BadRequestException('Schedule capacity must be at least 1.');
    }

    const created = await this.prisma.classSchedule.create({
      data: {
        gymClassId: gymClass.id,
        trainerProfileId: trainer.id,
        dayOfWeek: dto.dayOfWeek,
        specificDate: dto.specificDate ? new Date(dto.specificDate) : null,
        startTime: dto.startTime,
        endTime: dto.endTime,
        roomOrZone: dto.roomOrZone || 'Main Studio',
        capacity,
        cancellationCutoffHours: Number(dto.cancellationCutoffHours ?? 2),
        isPublished: dto.isPublished ?? true,
      },
      include: {
        gymClass: true,
        trainerProfile: {
          include: { user: { select: { fullName: true } } },
        },
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'CLASS_SCHEDULE_CREATED',
      entityType: 'ClassSchedule',
      entityId: created.id,
      summary: `Scheduled '${gymClass.title}' on ${created.dayOfWeek} (${created.startTime}-${created.endTime})`,
    });

    return created;
  }

  async updateSchedule(
    actor: AuthenticatedUser,
    id: string,
    dto: Record<string, any>,
  ) {
    const existing = await this.prisma.classSchedule.findUnique({
      where: { id },
      include: { gymClass: true },
    });
    if (!existing) throw new NotFoundException('Class schedule not found.');

    if (
      dto.capacity !== undefined &&
      Number(dto.capacity) < existing.bookedCount
    ) {
      throw new BadRequestException(
        `Cannot reduce capacity below current confirmed bookings (${existing.bookedCount}).`,
      );
    }

    const updated = await this.prisma.classSchedule.update({
      where: { id },
      data: {
        ...(dto.gymClassId ? { gymClassId: dto.gymClassId } : {}),
        ...(dto.trainerProfileId
          ? { trainerProfileId: dto.trainerProfileId }
          : {}),
        ...(dto.dayOfWeek ? { dayOfWeek: dto.dayOfWeek } : {}),
        ...(dto.startTime ? { startTime: dto.startTime } : {}),
        ...(dto.endTime ? { endTime: dto.endTime } : {}),
        ...(dto.roomOrZone ? { roomOrZone: dto.roomOrZone } : {}),
        ...(dto.capacity !== undefined
          ? { capacity: Number(dto.capacity) }
          : {}),
        ...(dto.cancellationCutoffHours !== undefined
          ? { cancellationCutoffHours: Number(dto.cancellationCutoffHours) }
          : {}),
        ...(dto.isPublished !== undefined
          ? { isPublished: Boolean(dto.isPublished) }
          : {}),
        ...(dto.isCancelled !== undefined
          ? { isCancelled: Boolean(dto.isCancelled) }
          : {}),
      },
      include: {
        gymClass: true,
        trainerProfile: {
          include: { user: { select: { fullName: true } } },
        },
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'CLASS_SCHEDULE_UPDATED',
      entityType: 'ClassSchedule',
      entityId: id,
      summary: `Updated schedule for '${updated.gymClass.title}' (${updated.dayOfWeek} ${updated.startTime})`,
    });

    return updated;
  }
}


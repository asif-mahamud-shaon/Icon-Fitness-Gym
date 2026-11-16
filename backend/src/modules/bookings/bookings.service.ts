import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  MembershipStatus,
  NotificationType,
  Prisma,
  Role,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private normalizeSessionDate(dateInput?: string | Date): Date {
    const d = dateInput ? new Date(dateInput) : new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  async findMyBookings(userId: string) {
    const member = await this.prisma.memberProfile.findUnique({
      where: { userId },
    });
    if (!member) {
      throw new NotFoundException('Member profile not found.');
    }

    return this.prisma.booking.findMany({
      where: { memberProfileId: member.id },
      include: {
        classSchedule: {
          include: {
            gymClass: true,
            trainerProfile: {
              include: { user: { select: { fullName: true, avatarUrl: true } } },
            },
          },
        },
        attendance: true,
      },
      orderBy: [{ sessionDate: 'desc' }, { bookedAt: 'desc' }],
    });
  }

  async findAllAdminOrTrainer(
    actor: AuthenticatedUser,
    params: {
      page?: number;
      limit?: number;
      status?: BookingStatus;
      classScheduleId?: string;
      search?: string;
    },
  ) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 25;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};
    if (params.status) where.status = params.status;
    if (params.classScheduleId) where.classScheduleId = params.classScheduleId;

    if (actor.role === Role.TRAINER && actor.trainerProfileId) {
      where.classSchedule = { trainerProfileId: actor.trainerProfileId };
    }

    if (params.search) {
      where.OR = [
        {
          memberProfile: {
            memberCode: { contains: params.search, mode: 'insensitive' },
          },
        },
        {
          memberProfile: {
            user: { fullName: { contains: params.search, mode: 'insensitive' } },
          },
        },
        {
          classSchedule: {
            gymClass: {
              title: { contains: params.search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          memberProfile: {
            include: {
              user: { select: { fullName: true, email: true, phone: true } },
            },
          },
          classSchedule: {
            include: {
              gymClass: true,
              trainerProfile: {
                include: { user: { select: { fullName: true } } },
              },
            },
          },
          attendance: true,
        },
        orderBy: [{ sessionDate: 'desc' }, { bookedAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
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
   * Concurrency-Safe Class Booking:
   * 1. Verifies member has an ACTIVE, non-expired membership (unless overridden by staff).
   * 2. Prevents duplicate booking of the same classScheduleId + sessionDate.
   * 3. Uses an atomic conditional update inside an interactive transaction so concurrent
   *    requests can NEVER exceed ClassSchedule.capacity.
   */
  async createBooking(
    actor: AuthenticatedUser,
    dto: {
      classScheduleId: string;
      sessionDate?: string;
      memberProfileId?: string;
    },
  ) {
    let targetMemberProfileId = dto.memberProfileId;
    if (actor.role === Role.MEMBER) {
      if (!actor.memberProfileId) {
        throw new ForbiddenException('Member profile not found.');
      }
      targetMemberProfileId = actor.memberProfileId;
    }

    if (!targetMemberProfileId) {
      throw new BadRequestException('memberProfileId is required.');
    }

    const member = await this.prisma.memberProfile.findUnique({
      where: { id: targetMemberProfileId },
      include: { user: true },
    });
    if (!member) {
      throw new NotFoundException('Member profile not found.');
    }

    // Verify active membership when member self-books
    if (actor.role === Role.MEMBER) {
      const activeMembership = await this.prisma.membership.findFirst({
        where: {
          memberProfileId: member.id,
          status: MembershipStatus.ACTIVE,
          endDate: { gte: new Date() },
        },
      });

      if (!activeMembership) {
        throw new ForbiddenException(
          'An active, non-expired membership is required to book classes. Please renew or verify your membership.',
        );
      }
    }

    const normalizedDate = this.normalizeSessionDate(dto.sessionDate);

    const booking = await this.prisma.$transaction(
      async (tx) => {
        const schedule = await tx.classSchedule.findUnique({
          where: { id: dto.classScheduleId },
          include: { gymClass: true },
        });

        if (!schedule || schedule.isCancelled || !schedule.isPublished) {
          throw new BadRequestException(
            'This class session is unavailable or cancelled.',
          );
        }

        // Check existing booking for this member + schedule + sessionDate
        const existingBooking = await tx.booking.findUnique({
          where: {
            classScheduleId_memberProfileId_sessionDate: {
              classScheduleId: schedule.id,
              memberProfileId: member.id,
              sessionDate: normalizedDate,
            },
          },
        });

        if (
          existingBooking &&
          existingBooking.status === BookingStatus.CONFIRMED
        ) {
          throw new ConflictException(
            'You have already booked a seat in this class session.',
          );
        }

        // Atomic capacity check and increment: prevents overbooking under concurrent requests
        const updatedSchedule = await tx.classSchedule.updateMany({
          where: {
            id: schedule.id,
            isCancelled: false,
            bookedCount: { lt: schedule.capacity },
          },
          data: {
            bookedCount: { increment: 1 },
          },
        });

        if (updatedSchedule.count === 0) {
          throw new BadRequestException(
            `Class session '${schedule.gymClass.title}' has reached maximum capacity (${schedule.capacity}/${schedule.capacity}).`,
          );
        }

        if (existingBooking && existingBooking.status === BookingStatus.CANCELLED) {
          return tx.booking.update({
            where: { id: existingBooking.id },
            data: {
              status: BookingStatus.CONFIRMED,
              bookedAt: new Date(),
              cancelledAt: null,
              cancellationReason: null,
            },
            include: {
              classSchedule: { include: { gymClass: true } },
            },
          });
        }

        return tx.booking.create({
          data: {
            classScheduleId: schedule.id,
            memberProfileId: member.id,
            sessionDate: normalizedDate,
            status: BookingStatus.CONFIRMED,
          },
          include: {
            classSchedule: { include: { gymClass: true } },
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    await this.notificationsService.createNotification({
      userId: member.userId,
      type: NotificationType.BOOKING,
      title: 'Class Booking Confirmed',
      message: `Your seat for '${booking.classSchedule.gymClass.title}' on ${normalizedDate.toISOString().slice(0, 10)} at ${booking.classSchedule.startTime} is confirmed.`,
      linkUrl: '/member/bookings',
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'CLASS_BOOKING_CREATED',
      entityType: 'Booking',
      entityId: booking.id,
      summary: `${member.user.fullName} booked '${booking.classSchedule.gymClass.title}' (${normalizedDate.toISOString().slice(0, 10)})`,
    });

    return booking;
  }

  /**
   * Cancel Booking & Release Seat:
   * - Enforces ownership (member can only cancel their own booking).
   * - Enforces cancellation cutoff hours if sessionDate + startTime is within cutoff window for members.
   * - Atomically marks CANCELLED and decrements bookedCount.
   */
  async cancelBooking(
    actor: AuthenticatedUser,
    bookingId: string,
    cancellationReason?: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        memberProfile: { include: { user: true } },
        classSchedule: { include: { gymClass: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    // Prevent unauthorized booking access (IDOR protection)
    if (
      actor.role === Role.MEMBER &&
      booking.memberProfile.userId !== actor.id
    ) {
      throw new ForbiddenException(
        'You are not authorized to cancel another member’s booking.',
      );
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('This booking is already cancelled.');
    }

    // Check cancellation cutoff policy for members when session is in the future (Asia/Dhaka UTC+6)
    if (actor.role === Role.MEMBER) {
      const [hours, minutes] = (booking.classSchedule.startTime || '08:00')
        .split(':')
        .map(Number);
      const sd = new Date(booking.sessionDate);
      const dhakaUtcMs =
        Date.UTC(
          sd.getUTCFullYear(),
          sd.getUTCMonth(),
          sd.getUTCDate(),
          hours || 8,
          minutes || 0,
          0,
          0,
        ) -
        6 * 60 * 60 * 1000;

      const cutoffHours = booking.classSchedule.cancellationCutoffHours ?? 2;
      const msUntilSession = dhakaUtcMs - Date.now();
      const cutoffMs = cutoffHours * 60 * 60 * 1000;

      if (msUntilSession > 0 && msUntilSession < cutoffMs) {
        throw new BadRequestException(
          `Bookings must be cancelled at least ${cutoffHours} hours before the class starts.`,
        );
      }
    }

    const cancelled = await this.prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason:
            cancellationReason || `Cancelled by ${actor.role}`,
        },
        include: {
          classSchedule: { include: { gymClass: true } },
        },
      });

      if (booking.classSchedule.bookedCount > 0) {
        await tx.classSchedule.update({
          where: { id: booking.classScheduleId },
          data: {
            bookedCount: { decrement: 1 },
          },
        });
      }

      return updatedBooking;
    });

    await this.notificationsService.createNotification({
      userId: booking.memberProfile.userId,
      type: NotificationType.BOOKING,
      title: 'Class Booking Cancelled',
      message: `Your booking for '${booking.classSchedule.gymClass.title}' has been cancelled and the seat released.`,
      linkUrl: '/member/bookings',
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'CLASS_BOOKING_CANCELLED',
      entityType: 'Booking',
      entityId: bookingId,
      summary: `Cancelled booking for ${booking.memberProfile.user.fullName} in '${booking.classSchedule.gymClass.title}'`,
    });

    return cancelled;
  }
}


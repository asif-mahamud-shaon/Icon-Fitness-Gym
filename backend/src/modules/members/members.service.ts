import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import {
  BookingStatus,
  Gender,
  MembershipStatus,
  NotificationType,
  PaymentStatus,
  Role,
  UserStatus,
  WorkoutGoal,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async syncExpiredMembershipsForMember(memberProfileId: string) {
    await this.prisma.membership.updateMany({
      where: {
        memberProfileId,
        status: MembershipStatus.ACTIVE,
        endDate: { lt: new Date() },
      },
      data: {
        status: MembershipStatus.EXPIRED,
      },
    });
  }

  async getMyDashboard(userId: string) {
    const member = await this.prisma.memberProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            status: true,
            createdAt: true,
          },
        },
        assignedTrainer: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member profile not found for this account.');
    }

    await this.syncExpiredMembershipsForMember(member.id);

    const [
      activeMembership,
      latestMembership,
      upcomingBookings,
      recentPayments,
      workoutAssignments,
      notifications,
    ] = await Promise.all([
      this.prisma.membership.findFirst({
        where: {
          memberProfileId: member.id,
          status: MembershipStatus.ACTIVE,
          endDate: { gte: new Date() },
        },
        include: { plan: true },
        orderBy: { endDate: 'desc' },
      }),
      this.prisma.membership.findFirst({
        where: { memberProfileId: member.id },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.findMany({
        where: {
          memberProfileId: member.id,
          status: BookingStatus.CONFIRMED,
        },
        include: {
          classSchedule: {
            include: {
              gymClass: true,
              trainerProfile: {
                include: {
                  user: { select: { fullName: true } },
                },
              },
            },
          },
        },
        orderBy: { sessionDate: 'asc' },
        take: 10,
      }),
      this.prisma.payment.findMany({
        where: { memberProfileId: member.id },
        include: {
          receipt: true,
          membership: { include: { plan: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.memberWorkoutAssignment.findMany({
        where: { memberProfileId: member.id, isActive: true },
        include: {
          workoutProgram: {
            include: {
              exercises: {
                include: { exercise: true },
                orderBy: [{ dayNumber: 'asc' }, { orderIndex: 'asc' }],
              },
            },
          },
          assignedByTrainer: {
            include: { user: { select: { fullName: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
    ]);

    const extendedFields = await this.getExtendedMemberFields(member.id);

    return {
      member: {
        ...member,
        ...extendedFields,
      },
      currentMembership: activeMembership || latestMembership || null,
      upcomingBookings,
      recentPayments,
      workoutAssignments,
      notifications,
    };
  }

  private async getExtendedMemberFields(
    memberId: string,
  ): Promise<Record<string, any>> {
    if (typeof (this.prisma as any).$queryRaw !== 'function') {
      return {};
    }
    const rows = await this.prisma.$queryRaw<
      Array<{
        appUsername: string | null;
        nidNumber: string | null;
        rfidCardNumber: string | null;
        facebookUrl: string | null;
      }>
    >`
      SELECT "appUsername", "nidNumber", "rfidCardNumber", "facebookUrl"
      FROM "MemberProfile"
      WHERE "id" = ${memberId}
      LIMIT 1
    `;
    return rows?.[0] || {};
  }

  async updateMyProfile(
    userId: string,
    dto: {
      fullName?: string;
      phone?: string;
      avatarUrl?: string;
      dateOfBirth?: string;
      gender?: Gender;
      address?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      bloodGroup?: string;
      heightCm?: number;
      weightKg?: number;
      appUsername?: string;
      nidNumber?: string;
      rfidCardNumber?: string;
      facebookUrl?: string;
      fitnessGoal?: WorkoutGoal;
      medicalConditions?: string;
    },
  ) {
    const member = await this.prisma.memberProfile.findUnique({
      where: { userId },
    });
    if (!member) {
      throw new NotFoundException('Member profile not found.');
    }

    const safeAvatarUrl =
      dto.avatarUrl === ''
        ? null
        : dto.avatarUrl !== undefined
          ? this.sanitizeAvatarUrl(dto.avatarUrl)
          : undefined;

    if (dto.fullName || dto.phone || safeAvatarUrl !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.fullName ? { fullName: dto.fullName.trim() } : {}),
          ...(dto.phone ? { phone: dto.phone.trim() } : {}),
          ...(safeAvatarUrl !== undefined ? { avatarUrl: safeAvatarUrl } : {}),
        },
      });
    }

    const updatedProfile = await this.prisma.memberProfile.update({
      where: { id: member.id },
      data: {
        ...(dto.dateOfBirth ? { dateOfBirth: new Date(dto.dateOfBirth) } : {}),
        ...(dto.gender ? { gender: dto.gender } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.emergencyContactName !== undefined
          ? { emergencyContactName: dto.emergencyContactName }
          : {}),
        ...(dto.emergencyContactPhone !== undefined
          ? { emergencyContactPhone: dto.emergencyContactPhone }
          : {}),
        ...(dto.bloodGroup !== undefined ? { bloodGroup: dto.bloodGroup } : {}),
        ...(dto.heightCm !== undefined ? { heightCm: Number(dto.heightCm) } : {}),
        ...(dto.weightKg !== undefined ? { weightKg: Number(dto.weightKg) } : {}),
        ...(dto.fitnessGoal ? { fitnessGoal: dto.fitnessGoal } : {}),
        ...(dto.medicalConditions !== undefined
          ? { medicalConditions: dto.medicalConditions }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (
      typeof (this.prisma as any).$executeRaw === 'function' &&
      (dto.appUsername !== undefined ||
        dto.nidNumber !== undefined ||
        dto.rfidCardNumber !== undefined ||
        dto.facebookUrl !== undefined)
    ) {
      const updateAppUsername = dto.appUsername !== undefined;
      const appUsernameVal = updateAppUsername
        ? dto.appUsername!.trim() || null
        : null;
      const updateNid = dto.nidNumber !== undefined;
      const nidVal = updateNid ? dto.nidNumber!.trim() || null : null;
      const updateRfid = dto.rfidCardNumber !== undefined;
      const rfidVal = updateRfid ? dto.rfidCardNumber!.trim() || null : null;
      const updateFacebook = dto.facebookUrl !== undefined;
      const facebookVal = updateFacebook
        ? dto.facebookUrl!.trim() || null
        : null;

      await this.prisma.$executeRaw`
        UPDATE "MemberProfile"
        SET
          "appUsername" = CASE WHEN ${updateAppUsername}::boolean THEN ${appUsernameVal}::text ELSE "appUsername" END,
          "nidNumber" = CASE WHEN ${updateNid}::boolean THEN ${nidVal}::text ELSE "nidNumber" END,
          "rfidCardNumber" = CASE WHEN ${updateRfid}::boolean THEN ${rfidVal}::text ELSE "rfidCardNumber" END,
          "facebookUrl" = CASE WHEN ${updateFacebook}::boolean THEN ${facebookVal}::text ELSE "facebookUrl" END,
          "updatedAt" = NOW()
        WHERE "id" = ${member.id}
      `;
    }

    const extendedFields = await this.getExtendedMemberFields(member.id);

    return {
      ...updatedProfile,
      ...extendedFields,
    };
  }

  async findAll(
    actor: AuthenticatedUser,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: UserStatus;
      trainerProfileId?: string;
      joinMonth?: string;
      paymentStatus?: string;
    },
  ) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};
    const andConditions: any[] = [];

    if (actor.role === Role.TRAINER) {
      where.assignedTrainerId = actor.trainerProfileId;
    } else if (params.trainerProfileId) {
      where.assignedTrainerId = params.trainerProfileId;
    }

    if (params.status) {
      where.user = { status: params.status };
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      andConditions.push({
        OR: [
          { memberCode: { contains: q, mode: 'insensitive' } },
          { user: { fullName: { contains: q, mode: 'insensitive' } } },
          { user: { email: { contains: q, mode: 'insensitive' } } },
          { user: { phone: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }

    if (params.joinMonth && /^\d{4}-\d{2}$/.test(params.joinMonth.trim())) {
      const [yStr, mStr] = params.joinMonth.trim().split('-');
      const year = Number(yStr);
      const month = Number(mStr);
      // Dhaka timezone UTC+6 month boundaries converted safely to UTC
      const monthStart = new Date(Date.UTC(year, month - 1, 1, -6, 0, 0));
      const nextMonthStart = new Date(Date.UTC(year, month, 1, -6, 0, 0));
      andConditions.push({
        OR: [
          { joinedAt: { gte: monthStart, lt: nextMonthStart } },
          { createdAt: { gte: monthStart, lt: nextMonthStart } },
        ],
      });
    }

    if (params.paymentStatus === 'PAID') {
      andConditions.push({
        payments: { some: { status: 'VERIFIED_PAID' } },
      });
    } else if (params.paymentStatus === 'PENDING') {
      andConditions.push({
        payments: { some: { status: 'PENDING' } },
      });
    } else if (params.paymentStatus === 'UNPAID') {
      andConditions.push({
        payments: { none: { status: 'VERIFIED_PAID' } },
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [items, total] = await Promise.all([
      this.prisma.memberProfile.findMany({
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
              createdAt: true,
            },
          },
          assignedTrainer: {
            include: {
              user: { select: { fullName: true } },
            },
          },
          memberships: {
            include: {
              plan: { select: { name: true, priceBdt: true, admissionFeeBdt: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          payments: {
            select: {
              id: true,
              netAmountBdt: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.memberProfile.count({ where }),
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

  private sanitizeAvatarUrl(url?: string | null): string | undefined {
    if (!url || typeof url !== 'string') return undefined;
    const trimmed = url.trim();
    if (!trimmed) return undefined;
    if (
      /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed) &&
      trimmed.length <= 4_000_000
    ) {
      return trimmed;
    }
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
      return trimmed.slice(0, 1024);
    }
    return undefined;
  }

  async findById(actor: AuthenticatedUser, id: string) {
    const member = await this.prisma.memberProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            status: true,
            createdAt: true,
          },
        },
        assignedTrainer: {
          include: { user: { select: { fullName: true, email: true, phone: true } } },
        },
        biometricEnrollment: {
          select: {
            id: true,
            status: true,
            consentGranted: true,
            consentVersion: true,
            livenessVerified: true,
            qualityScore: true,
            enrolledAt: true,
            lastVerifiedAt: true,
          },
        },
        accessEvents: {
          orderBy: { eventTimestamp: 'desc' },
          take: 5,
          select: {
            id: true,
            accessDecision: true,
            verificationMethod: true,
            denialReason: true,
            eventTimestamp: true,
          },
        },
        memberships: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
        payments:
          actor.role === Role.TRAINER
            ? false
            : {
                include: {
                  receipt: {
                    include: {
                      issuedByUser: {
                        select: { fullName: true, role: true },
                      },
                    },
                  },
                  verifiedByUser: {
                    select: { fullName: true, role: true },
                  },
                },
                orderBy: { createdAt: 'desc' },
              },
        bookings: {
          include: {
            classSchedule: {
              include: { gymClass: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 25,
        },
        workoutAssignments: {
          include: {
            workoutProgram: true,
            assignedByTrainer: {
              include: { user: { select: { fullName: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member profile not found.');
    }

    if (
      actor.role === Role.TRAINER &&
      member.assignedTrainerId !== actor.trainerProfileId
    ) {
      throw new ForbiddenException('You can only access members assigned to you.');
    }

    if (actor.role === Role.MEMBER && member.userId !== actor.id) {
      throw new ForbiddenException('You can only access your own member profile.');
    }

    const isTrainerViewer = actor.role === Role.TRAINER;
    const extendedFields = isTrainerViewer
      ? {}
      : await this.getExtendedMemberFields(member.id);

    let recentPhotoDataUrl: string | null = null;
    if (
      !isTrainerViewer &&
      member.biometricEnrollment &&
      typeof (this.prisma as any).$queryRaw === 'function'
    ) {
      try {
        const photoRows = await this.prisma.$queryRaw<
          Array<{ recentPhotoDataUrl: string | null }>
        >`
          SELECT "recentPhotoDataUrl"
          FROM "BiometricEnrollment"
          WHERE "memberProfileId" = ${member.id}
          LIMIT 1
        `;
        recentPhotoDataUrl = photoRows?.[0]?.recentPhotoDataUrl || null;
      } catch {
        recentPhotoDataUrl = null;
      }
    }

    return {
      ...member,
      ...extendedFields,
      biometricEnrollment:
        isTrainerViewer || !member.biometricEnrollment
          ? null
          : {
              ...member.biometricEnrollment,
              recentPhotoDataUrl,
            },
      accessEvents: isTrainerViewer ? [] : member.accessEvents,
    };
  }

  async createByStaff(
    actor: AuthenticatedUser,
    dto: {
      fullName: string;
      email: string;
      phone: string;
      password?: string;
      avatarUrl?: string;
      gender?: Gender;
      dateOfBirth?: string;
      bloodGroup?: string;
      fitnessGoal?: WorkoutGoal;
      address?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      assignedTrainerId?: string;
      notes?: string;
    },
  ) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { phone: dto.phone.trim() }],
      },
    });
    if (existing) {
      throw new ConflictException('A user with this email or phone already exists.');
    }

    const safeAvatarUrl = this.sanitizeAvatarUrl(dto.avatarUrl);
    const rawPassword =
      dto.password?.trim() || crypto.randomBytes(12).toString('base64url');
    const passwordHash = await bcrypt.hash(rawPassword, 12);
    const year = new Date().getFullYear();
    const count = await this.prisma.memberProfile.count();
    const memberCode = `IFG-${year}-${String(count + 1).padStart(4, '0')}-${Math.floor(100 + Math.random() * 900)}`;

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: dto.fullName.trim(),
          email: normalizedEmail,
          phone: dto.phone.trim(),
          ...(safeAvatarUrl ? { avatarUrl: safeAvatarUrl } : {}),
          passwordHash,
          role: Role.MEMBER,
          status: UserStatus.ACTIVE,
          emailVerified: true,
        },
      });

      return tx.memberProfile.create({
        data: {
          userId: user.id,
          memberCode,
          gender: dto.gender,
          ...(dto.dateOfBirth ? { dateOfBirth: new Date(dto.dateOfBirth) } : {}),
          ...(dto.bloodGroup ? { bloodGroup: dto.bloodGroup.trim() } : {}),
          fitnessGoal: dto.fitnessGoal || WorkoutGoal.FITNESS_IMPROVEMENT,
          address: dto.address,
          emergencyContactName: dto.emergencyContactName,
          emergencyContactPhone: dto.emergencyContactPhone,
          assignedTrainerId: dto.assignedTrainerId || null,
          notes: dto.notes,
        },
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
        },
      });
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'MEMBER_CREATED_BY_STAFF',
      entityType: 'MemberProfile',
      entityId: created.id,
      summary: `Created member ${created.user.fullName} (${created.memberCode})`,
    });

    return created;
  }

  async updateMemberByStaff(
    actor: AuthenticatedUser,
    id: string,
    dto: {
      fullName?: string;
      phone?: string;
      avatarUrl?: string;
      status?: UserStatus;
      gender?: Gender;
      bloodGroup?: string;
      fitnessGoal?: WorkoutGoal;
      address?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      assignedTrainerId?: string | null;
      medicalConditions?: string;
      notes?: string;
    },
  ) {
    const member = await this.prisma.memberProfile.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    const safeAvatarUrl = this.sanitizeAvatarUrl(dto.avatarUrl);
    if (dto.fullName || dto.phone || dto.status || safeAvatarUrl) {
      await this.prisma.user.update({
        where: { id: member.userId },
        data: {
          ...(dto.fullName ? { fullName: dto.fullName.trim() } : {}),
          ...(dto.phone ? { phone: dto.phone.trim() } : {}),
          ...(dto.status ? { status: dto.status } : {}),
          ...(safeAvatarUrl ? { avatarUrl: safeAvatarUrl } : {}),
        },
      });
    }

    const updated = await this.prisma.memberProfile.update({
      where: { id },
      data: {
        ...(dto.gender ? { gender: dto.gender } : {}),
        ...(dto.bloodGroup !== undefined ? { bloodGroup: dto.bloodGroup } : {}),
        ...(dto.fitnessGoal ? { fitnessGoal: dto.fitnessGoal } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.emergencyContactName !== undefined
          ? { emergencyContactName: dto.emergencyContactName }
          : {}),
        ...(dto.emergencyContactPhone !== undefined
          ? { emergencyContactPhone: dto.emergencyContactPhone }
          : {}),
        ...(dto.assignedTrainerId !== undefined
          ? { assignedTrainerId: dto.assignedTrainerId || null }
          : {}),
        ...(dto.medicalConditions !== undefined
          ? { medicalConditions: dto.medicalConditions }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
          },
        },
        assignedTrainer: {
          include: { user: { select: { fullName: true } } },
        },
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'MEMBER_UPDATED',
      entityType: 'MemberProfile',
      entityId: id,
      summary: `Updated member profile for ${updated.user.fullName} (${updated.memberCode})`,
    });

    return updated;
  }

  async approveRegistration(actor: AuthenticatedUser, id: string) {
    const member = await this.prisma.memberProfile.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: member.userId },
        data: { status: UserStatus.ACTIVE },
      });

      // If member already has a verified payment, activate their pending membership cleanly
      if (typeof tx.membership?.findFirst === 'function') {
        let paidPendingMembership = await tx.membership.findFirst({
          where: {
            memberProfileId: member.id,
            status: MembershipStatus.PENDING,
            payments: {
              some: { status: PaymentStatus.VERIFIED_PAID },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        if (!paidPendingMembership && typeof tx.payment?.findFirst === 'function') {
          const verifiedPayment = await tx.payment.findFirst({
            where: {
              memberProfileId: member.id,
              status: PaymentStatus.VERIFIED_PAID,
            },
            orderBy: { createdAt: 'desc' },
          });
          if (verifiedPayment) {
            paidPendingMembership = await tx.membership.findFirst({
              where: {
                memberProfileId: member.id,
                status: MembershipStatus.PENDING,
              },
              orderBy: { createdAt: 'desc' },
            });
          }
        }
        if (paidPendingMembership) {
          await tx.membership.update({
            where: { id: paidPendingMembership.id },
            data: {
              status: MembershipStatus.ACTIVE,
              activatedByUserId: actor.id,
              activationDate: now,
            },
          });
        }
      }
    });

    await this.notificationsService.createNotification({
      userId: member.userId,
      type: NotificationType.MEMBERSHIP,
      title: 'Registration Approved',
      message: 'Your Icon Fitness Gym registration has been approved.',
      linkUrl: '/member/dashboard',
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'MEMBER_REGISTRATION_APPROVED',
      entityType: 'MemberProfile',
      entityId: id,
      summary: `Approved registration for ${member.user.fullName}`,
    });

    return { message: 'Member registration approved.' };
  }
}


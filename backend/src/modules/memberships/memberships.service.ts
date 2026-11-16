import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MembershipStatus,
  NotificationType,
  Role,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { getDhakaEndOfDayCutoff } from '../access-control/timezone.util';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async syncExpiredMemberships() {
    const activeList = await this.prisma.membership.findMany({
      where: {
        status: MembershipStatus.ACTIVE,
      },
    });
    const now = new Date();
    const expiredIds = activeList
      .filter((m) => getDhakaEndOfDayCutoff(m.endDate) < now)
      .map((m) => m.id);

    if (expiredIds.length > 0) {
      await this.prisma.membership.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: MembershipStatus.EXPIRED },
      });
    }
  }

  async findMyMemberships(userId: string) {
    const member = await this.prisma.memberProfile.findUnique({
      where: { userId },
    });
    if (!member) {
      throw new NotFoundException('Member profile not found.');
    }

    await this.syncExpiredMemberships();

    const memberships = await this.prisma.membership.findMany({
      where: { memberProfileId: member.id },
      include: {
        plan: true,
        payments: {
          include: { receipt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const activeMembership =
      memberships.find(
        (m) =>
          m.status === MembershipStatus.ACTIVE &&
          getDhakaEndOfDayCutoff(m.endDate) >= new Date(),
      ) || null;

    return {
      activeMembership,
      history: memberships,
    };
  }

  async requestRenewal(
    userId: string,
    dto: {
      planId: string;
      renewalNotes?: string;
    },
  ) {
    const member = await this.prisma.memberProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!member) {
      throw new NotFoundException('Member profile not found.');
    }

    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan || !plan.isActive) {
      throw new BadRequestException('Selected membership plan is not available.');
    }

    const latestMembership = await this.prisma.membership.findFirst({
      where: { memberProfileId: member.id },
      orderBy: { endDate: 'desc' },
    });

    const startDate =
      latestMembership && latestMembership.endDate > new Date()
        ? new Date(latestMembership.endDate)
        : new Date();
    const endDate = new Date(
      startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000,
    );

    const created = await this.prisma.membership.create({
      data: {
        memberProfileId: member.id,
        planId: plan.id,
        previousMembershipId: latestMembership?.id ?? null,
        startDate,
        endDate,
        status: MembershipStatus.PENDING,
        autoRenewRequested: true,
        renewalNotes:
          dto.renewalNotes ||
          `Member requested renewal/plan (${plan.name}). Pending payment verification.`,
      },
      include: { plan: true },
    });

    await this.auditLogsService.log({
      actorUserId: userId,
      actorRole: Role.MEMBER,
      action: 'MEMBERSHIP_RENEWAL_REQUESTED',
      entityType: 'Membership',
      entityId: created.id,
      summary: `${member.user.fullName} requested membership plan '${plan.name}'`,
    });

    return created;
  }

  async findAllAdmin(params: {
    page?: number;
    limit?: number;
    status?: MembershipStatus;
    search?: string;
  }) {
    await this.syncExpiredMemberships();

    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};
    if (params.status) {
      where.status = params.status;
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
          plan: { name: { contains: params.search, mode: 'insensitive' } },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.membership.findMany({
        where,
        include: {
          memberProfile: {
            include: {
              user: {
                select: { fullName: true, email: true, phone: true },
              },
            },
          },
          plan: true,
          payments: {
            select: {
              id: true,
              status: true,
              netAmountBdt: true,
              paymentMethod: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.membership.count({ where }),
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

  private isAuthorizedStaff(role: Role): boolean {
    return ([Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF] as Role[]).includes(role);
  }

  async createByStaff(
    actor: AuthenticatedUser,
    dto: {
      memberProfileId: string;
      planId: string;
      startDate?: string;
      endDate?: string;
      status?: MembershipStatus;
      renewalNotes?: string;
    },
  ) {
    if (!this.isAuthorizedStaff(actor.role)) {
      throw new ForbiddenException(
        'Only authorized staff can create or assign memberships.',
      );
    }

    const [member, plan] = await Promise.all([
      this.prisma.memberProfile.findUnique({
        where: { id: dto.memberProfileId },
        include: { user: true },
      }),
      this.prisma.membershipPlan.findUnique({ where: { id: dto.planId } }),
    ]);

    if (!member) throw new NotFoundException('Member profile not found.');
    if (!plan) throw new NotFoundException('Membership plan not found.');

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate = dto.endDate
      ? new Date(dto.endDate)
      : new Date(
          startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000,
        );

    if (endDate <= startDate) {
      throw new BadRequestException('Expiry date must be after start date.');
    }

    const latestMembership = await this.prisma.membership.findFirst({
      where: { memberProfileId: member.id },
      orderBy: { createdAt: 'desc' },
    });

    const targetStatus = dto.status || MembershipStatus.PENDING;

    const created = await this.prisma.membership.create({
      data: {
        memberProfileId: member.id,
        planId: plan.id,
        previousMembershipId: latestMembership?.id ?? null,
        startDate,
        endDate,
        status: targetStatus,
        renewalNotes: dto.renewalNotes,
        activatedByUserId:
          targetStatus === MembershipStatus.ACTIVE ? actor.id : null,
        activationDate:
          targetStatus === MembershipStatus.ACTIVE ? new Date() : null,
      },
      include: {
        plan: true,
        memberProfile: {
          include: { user: { select: { fullName: true, email: true } } },
        },
      },
    });

    await this.notificationsService.createNotification({
      userId: member.userId,
      type: NotificationType.MEMBERSHIP,
      title: `Membership ${targetStatus === MembershipStatus.ACTIVE ? 'Activated' : 'Assigned'}`,
      message: `Your '${plan.name}' membership (${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}) is now ${targetStatus}.`,
      linkUrl: '/member/membership',
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'MEMBERSHIP_CREATED',
      entityType: 'Membership',
      entityId: created.id,
      summary: `Assigned plan '${plan.name}' to ${member.user.fullName} with status ${targetStatus}`,
    });

    return created;
  }

  async updateStatusByStaff(
    actor: AuthenticatedUser,
    id: string,
    dto: {
      status: MembershipStatus;
      cancellationReason?: string;
      renewalNotes?: string;
    },
  ) {
    if (!this.isAuthorizedStaff(actor.role)) {
      throw new ForbiddenException(
        'Only authorized staff can modify membership status.',
      );
    }

    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: {
        plan: true,
        memberProfile: { include: { user: true } },
      },
    });
    if (!membership) {
      throw new NotFoundException('Membership record not found.');
    }

    if (
      dto.status === MembershipStatus.ACTIVE &&
      getDhakaEndOfDayCutoff(membership.endDate) < new Date()
    ) {
      throw new BadRequestException(
        'Cannot activate an already expired membership. Please renew instead.',
      );
    }

    const updated = await this.prisma.membership.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.status === MembershipStatus.ACTIVE
          ? {
              activatedByUserId: actor.id,
              activationDate: new Date(),
            }
          : {}),
        ...(dto.cancellationReason !== undefined
          ? { cancellationReason: dto.cancellationReason }
          : {}),
        ...(dto.renewalNotes !== undefined
          ? { renewalNotes: dto.renewalNotes }
          : {}),
      },
      include: { plan: true },
    });

    if (
      dto.status === MembershipStatus.ACTIVE &&
      membership.memberProfile.user.status === UserStatus.PENDING_APPROVAL
    ) {
      await this.prisma.user.update({
        where: { id: membership.memberProfile.userId },
        data: { status: UserStatus.ACTIVE },
      });
    }

    await this.notificationsService.createNotification({
      userId: membership.memberProfile.userId,
      type: NotificationType.MEMBERSHIP,
      title: 'Membership Status Updated',
      message: `Your '${membership.plan.name}' membership status is now ${dto.status}.`,
      linkUrl: '/member/membership',
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'MEMBERSHIP_STATUS_UPDATED',
      entityType: 'Membership',
      entityId: id,
      summary: `Changed membership status for ${membership.memberProfile.user.fullName} from ${membership.status} to ${dto.status}`,
    });

    return updated;
  }

  async renewMembershipByStaff(
    actor: AuthenticatedUser,
    previousMembershipId: string,
    dto: {
      planId?: string;
      startDate?: string;
      status?: MembershipStatus;
      renewalNotes?: string;
    },
  ) {
    if (!this.isAuthorizedStaff(actor.role)) {
      throw new ForbiddenException(
        'Only authorized staff can process membership renewals.',
      );
    }

    const previous = await this.prisma.membership.findUnique({
      where: { id: previousMembershipId },
      include: {
        plan: true,
        memberProfile: { include: { user: true } },
      },
    });
    if (!previous) {
      throw new NotFoundException('Previous membership not found.');
    }

    const targetPlanId = dto.planId || previous.planId;
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: targetPlanId },
    });
    if (!plan) {
      throw new NotFoundException('Target membership plan not found.');
    }

    const baseStart = dto.startDate
      ? new Date(dto.startDate)
      : previous.endDate > new Date()
        ? new Date(previous.endDate)
        : new Date();
    const endDate = new Date(
      baseStart.getTime() + plan.durationDays * 24 * 60 * 60 * 1000,
    );

    const status = dto.status || MembershipStatus.PENDING;

    const renewed = await this.prisma.membership.create({
      data: {
        memberProfileId: previous.memberProfileId,
        planId: plan.id,
        previousMembershipId: previous.id,
        startDate: baseStart,
        endDate,
        status,
        renewalNotes:
          dto.renewalNotes ||
          `Renewed from membership ${previous.id.slice(0, 8)} (${previous.plan.name} -> ${plan.name})`,
        activatedByUserId: status === MembershipStatus.ACTIVE ? actor.id : null,
        activationDate: status === MembershipStatus.ACTIVE ? new Date() : null,
      },
      include: { plan: true },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'MEMBERSHIP_RENEWED',
      entityType: 'Membership',
      entityId: renewed.id,
      summary: `Renewed membership for ${previous.memberProfile.user.fullName} with plan '${plan.name}' (preserving history from ${previous.id})`,
    });

    return renewed;
  }
}

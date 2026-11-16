import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccessDecision,
  AttendanceStatus,
  CrmActivityChannel,
  CrmActivityOutcome,
  CrmLeadSource,
  CrmLeadStage,
  InquiryStatus,
  MembershipStatus,
  Role,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import {
  CreateCrmLeadDto,
  LogCrmActivityDto,
  UpdateCrmLeadDto,
} from './dto/crm.dto';

const OPEN_STAGES = new Set<CrmLeadStage>([
  CrmLeadStage.NEW,
  CrmLeadStage.TRIAL_BOOKED,
  CrmLeadStage.FOLLOW_UP,
  CrmLeadStage.NEGOTIATION,
]);

@Injectable()
export class CrmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private async resolveStaffName(userId?: string | null): Promise<{
    assignedToUserId: string | null;
    assignedStaffName: string | null;
  }> {
    if (!userId) {
      return { assignedToUserId: null, assignedStaffName: null };
    }
    const staff = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, role: true },
    });
    if (!staff || staff.role === Role.MEMBER) {
      throw new BadRequestException('Selected assignee must be an active staff/trainer user.');
    }
    return { assignedToUserId: staff.id, assignedStaffName: staff.fullName };
  }

  private async nextLeadCode(): Promise<string> {
    const count = await this.prisma.crmLead.count();
    const rand = Math.floor(10 + Math.random() * 90);
    return `IFG-LEAD-${String(count + 1).padStart(4, '0')}-${rand}`;
  }

  async findStaffOptions() {
    return this.prisma.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        role: { in: [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.TRAINER] },
      },
      select: {
        id: true,
        fullName: true,
        role: true,
        phone: true,
      },
      orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
    });
  }

  async getOverview() {
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [leads, activities30d, retention] = await Promise.all([
      this.prisma.crmLead.findMany({
        select: {
          id: true,
          stage: true,
          source: true,
          nextFollowUpAt: true,
        },
      }),
      this.prisma.crmActivity.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      this.findRetentionQueue(),
    ]);

    const activeLeadsCount = leads.filter((l) => OPEN_STAGES.has(l.stage)).length;
    const convertedCount = leads.filter(
      (l) => l.stage === CrmLeadStage.CONVERTED,
    ).length;
    const closedTotal = leads.filter(
      (l) => l.stage === CrmLeadStage.CONVERTED || l.stage === CrmLeadStage.LOST,
    ).length;

    const overdueFollowUpsCount = leads.filter(
      (l) =>
        OPEN_STAGES.has(l.stage) &&
        l.nextFollowUpAt &&
        l.nextFollowUpAt.getTime() < now.getTime(),
    ).length;

    const dueTodayCount = leads.filter(
      (l) =>
        OPEN_STAGES.has(l.stage) &&
        l.nextFollowUpAt &&
        l.nextFollowUpAt.getTime() <= endOfToday.getTime(),
    ).length;

    const conversionRatePct =
      closedTotal > 0 ? Math.round((convertedCount / closedTotal) * 100) : 0;

    return {
      totalLeads: leads.length,
      activeLeadsCount,
      convertedCount,
      conversionRatePct,
      overdueFollowUpsCount,
      dueTodayCount,
      activities30d,
      expiringSoonCount: retention.expiringSoon.length,
      expiredRecentCount: retention.expiredRecent.length,
      absentMembersCount: retention.absentMembers.length,
    };
  }

  async findLeads(params: {
    stage?: CrmLeadStage;
    source?: CrmLeadSource;
    assignedToUserId?: string;
    overdueOnly?: boolean;
    search?: string;
  }) {
    const where: Record<string, any> = {};
    if (params.stage) {
      where.stage = params.stage;
    }
    if (params.source) {
      where.source = params.source;
    }
    if (params.assignedToUserId) {
      where.assignedToUserId = params.assignedToUserId;
    }
    if (params.overdueOnly) {
      where.stage = {
        in: [
          CrmLeadStage.NEW,
          CrmLeadStage.TRIAL_BOOKED,
          CrmLeadStage.FOLLOW_UP,
          CrmLeadStage.NEGOTIATION,
        ],
      };
      where.nextFollowUpAt = { lt: new Date() };
    }
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { leadCode: { contains: q, mode: 'insensitive' } },
        { interestedPlan: { contains: q, mode: 'insensitive' } },
      ];
    }

    const nowMs = Date.now();
    const leads = await this.prisma.crmLead.findMany({
      where,
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: [{ nextFollowUpAt: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    });

    return leads.map((lead) => ({
      ...lead,
      isOverdue:
        OPEN_STAGES.has(lead.stage) &&
        Boolean(lead.nextFollowUpAt) &&
        (lead.nextFollowUpAt as Date).getTime() < nowMs,
    }));
  }

  async createLead(actor: AuthenticatedUser, dto: CreateCrmLeadDto) {
    const assignee = dto.assignedToUserId
      ? await this.resolveStaffName(dto.assignedToUserId)
      : { assignedToUserId: actor.id, assignedStaffName: actor.fullName || 'Front Desk' };

    const leadCode = await this.nextLeadCode();
    const nextFollowUpAt = dto.nextFollowUpAt
      ? new Date(dto.nextFollowUpAt)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const lead = await this.prisma.crmLead.create({
      data: {
        leadCode,
        fullName: dto.fullName.trim(),
        phone: dto.phone.trim(),
        email: dto.email?.trim().toLowerCase() || null,
        source: dto.source,
        stage: dto.stage ?? CrmLeadStage.NEW,
        fitnessGoal: dto.fitnessGoal?.trim() || null,
        interestedPlan: dto.interestedPlan?.trim() || null,
        assignedToUserId: assignee.assignedToUserId,
        assignedStaffName: assignee.assignedStaffName,
        referralMemberCode: dto.referralMemberCode?.trim() || null,
        nextFollowUpAt,
        notes: dto.notes?.trim() || null,
        activities: {
          create: {
            channel: CrmActivityChannel.SYSTEM_SYNC,
            outcome: CrmActivityOutcome.LEFT_NOTE,
            summary: `Lead created from ${dto.source.replace(/_/g, ' ')} and assigned to ${assignee.assignedStaffName || 'Front Desk'}.`,
            nextFollowUpAt,
            actorUserId: actor.id,
            actorName: actor.fullName || 'Staff',
          },
        },
      },
      include: { activities: true },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'CRM_LEAD_CREATED',
      entityType: 'CrmLead',
      entityId: lead.id,
      summary: `Created CRM lead ${lead.leadCode} for "${lead.fullName}" (${lead.source})`,
    });

    return lead;
  }

  async updateLead(actor: AuthenticatedUser, id: string, dto: UpdateCrmLeadDto) {
    const existing = await this.prisma.crmLead.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('CRM lead not found.');
    }

    let assigneeUpdate: { assignedToUserId?: string | null; assignedStaffName?: string | null } = {};
    if (dto.assignedToUserId !== undefined) {
      assigneeUpdate = await this.resolveStaffName(dto.assignedToUserId);
    }

    const updated = await this.prisma.crmLead.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined ? { fullName: dto.fullName.trim() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone.trim() } : {}),
        ...(dto.email !== undefined
          ? { email: dto.email.trim().toLowerCase() || null }
          : {}),
        ...(dto.source !== undefined ? { source: dto.source } : {}),
        ...(dto.stage !== undefined ? { stage: dto.stage } : {}),
        ...(dto.fitnessGoal !== undefined
          ? { fitnessGoal: dto.fitnessGoal.trim() || null }
          : {}),
        ...(dto.interestedPlan !== undefined
          ? { interestedPlan: dto.interestedPlan.trim() || null }
          : {}),
        ...assigneeUpdate,
        ...(dto.referralMemberCode !== undefined
          ? { referralMemberCode: dto.referralMemberCode.trim() || null }
          : {}),
        ...(dto.nextFollowUpAt !== undefined
          ? {
              nextFollowUpAt: dto.nextFollowUpAt
                ? new Date(dto.nextFollowUpAt)
                : null,
            }
          : {}),
        ...(dto.lostReason !== undefined
          ? { lostReason: dto.lostReason.trim() || null }
          : {}),
        ...(dto.convertedMemberId !== undefined
          ? { convertedMemberId: dto.convertedMemberId || null }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes.trim() || null } : {}),
      },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'CRM_LEAD_UPDATED',
      entityType: 'CrmLead',
      entityId: id,
      summary: `Updated CRM lead ${updated.leadCode} (${updated.fullName}) -> Stage: ${updated.stage}`,
    });

    return updated;
  }

  async deleteLead(actor: AuthenticatedUser, id: string) {
    if (!([Role.SUPER_ADMIN, Role.ADMIN] as Role[]).includes(actor.role)) {
      throw new ForbiddenException('Only ADMIN or SUPER_ADMIN can delete CRM leads.');
    }
    const existing = await this.prisma.crmLead.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('CRM lead not found.');
    }
    await this.prisma.crmLead.delete({ where: { id } });
    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'CRM_LEAD_DELETED',
      entityType: 'CrmLead',
      entityId: id,
      summary: `Deleted CRM lead ${existing.leadCode} (${existing.fullName})`,
    });
    return { deleted: true };
  }

  async importWebsiteInquiries(actor: AuthenticatedUser) {
    const inquiries = await this.prisma.contactInquiry.findMany({
      where: {
        status: {
          in: [InquiryStatus.NEW, InquiryStatus.IN_PROGRESS, InquiryStatus.CONTACTED],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    let importedCount = 0;
    for (const inq of inquiries) {
      const exists = await this.prisma.crmLead.findUnique({
        where: { sourceInquiryId: inq.id },
      });
      if (exists) continue;

      const leadCode = await this.nextLeadCode();
      const followUp = new Date(Date.now() + 12 * 60 * 60 * 1000);
      await this.prisma.crmLead.create({
        data: {
          leadCode,
          fullName: inq.fullName,
          phone: inq.phone,
          email: inq.email,
          source: CrmLeadSource.WEBSITE_INQUIRY,
          stage:
            inq.status === InquiryStatus.CONTACTED
              ? CrmLeadStage.FOLLOW_UP
              : CrmLeadStage.NEW,
          interestedPlan: inq.interestedPlan || null,
          assignedToUserId: actor.id,
          assignedStaffName: actor.fullName || 'Front Desk',
          sourceInquiryId: inq.id,
          nextFollowUpAt: followUp,
          notes: `${inq.subject}: ${inq.message}`.slice(0, 500),
          activities: {
            create: {
              channel: CrmActivityChannel.SYSTEM_SYNC,
              outcome: CrmActivityOutcome.LEFT_NOTE,
              summary: `Imported website inquiry ("${inq.subject}") for CRM follow-up.`,
              nextFollowUpAt: followUp,
              actorUserId: actor.id,
              actorName: actor.fullName || 'System',
            },
          },
        },
      });
      importedCount += 1;
    }

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'CRM_INQUIRIES_SYNCED',
      entityType: 'CrmLead',
      summary: `Synced ${importedCount} website inquiry lead(s) into CRM pipeline`,
    });

    return { importedCount };
  }

  async findRetentionQueue() {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);

    const members = await this.prisma.memberProfile.findMany({
      include: {
        user: {
          select: { id: true, fullName: true, phone: true, email: true, status: true },
        },
        memberships: {
          include: { plan: { select: { name: true, priceBdt: true } } },
          orderBy: { endDate: 'desc' },
          take: 3,
        },
        accessEvents: {
          where: { accessDecision: AccessDecision.GRANTED },
          orderBy: { eventTimestamp: 'desc' },
          take: 1,
        },
        attendances: {
          where: { status: AttendanceStatus.PRESENT },
          orderBy: { sessionDate: 'desc' },
          take: 1,
        },
        crmActivities: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });

    const expiringSoon: any[] = [];
    const expiredRecent: any[] = [];
    const absentMembers: any[] = [];

    for (const m of members) {
      if (m.user.status !== UserStatus.ACTIVE) continue;
      const activeMs = m.memberships.find((ms) => ms.status === MembershipStatus.ACTIVE);
      const latestMs = m.memberships[0];
      const lastAccess = m.accessEvents[0]?.eventTimestamp || null;
      const lastAttendance = m.attendances[0]?.sessionDate || null;
      const lastVisitAt =
        lastAccess && lastAttendance
          ? lastAccess > lastAttendance
            ? lastAccess
            : lastAttendance
          : lastAccess || lastAttendance;

      const lastCall = m.crmActivities[0] || null;
      const baseItem = {
        memberProfileId: m.id,
        memberCode: m.memberCode,
        fullName: m.user.fullName,
        phone: m.user.phone,
        email: m.user.email,
        planName: (activeMs || latestMs)?.plan?.name || 'No Plan',
        endDate: (activeMs || latestMs)?.endDate || null,
        lastVisitAt,
        lastCall,
        recentActivities: m.crmActivities,
      };

      if (activeMs) {
        const endTs = activeMs.endDate.getTime();
        if (endTs >= now.getTime() && endTs <= sevenDaysLater.getTime()) {
          const daysLeft = Math.max(
            0,
            Math.ceil((endTs - now.getTime()) / (24 * 60 * 60 * 1000)),
          );
          expiringSoon.push({ ...baseItem, daysLeft });
        }

        // Absent check: started >=10d ago AND no recent granted access/attendance in 10 days
        if (
          activeMs.startDate.getTime() <= tenDaysAgo.getTime() &&
          (!lastVisitAt || lastVisitAt.getTime() < tenDaysAgo.getTime())
        ) {
          const daysAbsent = lastVisitAt
            ? Math.floor((now.getTime() - lastVisitAt.getTime()) / (24 * 60 * 60 * 1000))
            : Math.floor((now.getTime() - activeMs.startDate.getTime()) / (24 * 60 * 60 * 1000));
          absentMembers.push({ ...baseItem, daysAbsent });
        }
      } else if (
        latestMs &&
        latestMs.status === MembershipStatus.EXPIRED &&
        latestMs.endDate.getTime() >= fortyFiveDaysAgo.getTime()
      ) {
        const daysExpired = Math.max(
          1,
          Math.floor((now.getTime() - latestMs.endDate.getTime()) / (24 * 60 * 60 * 1000)),
        );
        expiredRecent.push({ ...baseItem, daysExpired });
      }
    }

    return {
      expiringSoon: expiringSoon.sort((a, b) => a.daysLeft - b.daysLeft),
      expiredRecent: expiredRecent.sort((a, b) => a.daysExpired - b.daysExpired),
      absentMembers: absentMembers.sort((a, b) => b.daysAbsent - a.daysAbsent),
    };
  }

  async logActivity(actor: AuthenticatedUser, dto: LogCrmActivityDto) {
    if (!dto.leadId && !dto.memberProfileId) {
      throw new BadRequestException(
        'Activity must reference either a CRM leadId or memberProfileId.',
      );
    }

    const now = new Date();
    const nextFollowUpAt = dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : null;

    const activity = await this.prisma.$transaction(async (tx) => {
      if (dto.leadId) {
        const lead = await tx.crmLead.findUnique({ where: { id: dto.leadId } });
        if (!lead) throw new NotFoundException('CRM lead not found.');

        let nextStage = lead.stage;
        if (dto.outcome === CrmActivityOutcome.CONVERTED_OR_RENEWED) {
          nextStage = CrmLeadStage.CONVERTED;
        } else if (dto.outcome === CrmActivityOutcome.NOT_INTERESTED) {
          nextStage = CrmLeadStage.LOST;
        } else if (dto.outcome === CrmActivityOutcome.BOOKED_TRIAL) {
          nextStage = CrmLeadStage.TRIAL_BOOKED;
        } else if (lead.stage === CrmLeadStage.NEW) {
          nextStage = CrmLeadStage.FOLLOW_UP;
        }

        await tx.crmLead.update({
          where: { id: dto.leadId },
          data: {
            lastContactedAt: now,
            stage: nextStage,
            ...(nextFollowUpAt ? { nextFollowUpAt } : {}),
            ...(nextStage === CrmLeadStage.CONVERTED || nextStage === CrmLeadStage.LOST
              ? { nextFollowUpAt: null }
              : {}),
          },
        });
      }

      if (dto.memberProfileId) {
        const member = await tx.memberProfile.findUnique({
          where: { id: dto.memberProfileId },
        });
        if (!member) throw new NotFoundException('Member profile not found.');
      }

      return tx.crmActivity.create({
        data: {
          leadId: dto.leadId || null,
          memberProfileId: dto.memberProfileId || null,
          channel: dto.channel,
          outcome: dto.outcome,
          summary: dto.summary.trim(),
          nextFollowUpAt,
          actorUserId: actor.id,
          actorName: actor.fullName || 'Staff',
        },
        include: {
          lead: { select: { leadCode: true, fullName: true } },
          memberProfile: {
            select: {
              memberCode: true,
              user: { select: { fullName: true } },
            },
          },
        },
      });
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'CRM_ACTIVITY_LOGGED',
      entityType: 'CrmActivity',
      entityId: activity.id,
      summary: `${actor.fullName} logged ${dto.channel} (${dto.outcome}): ${dto.summary.slice(0, 80)}`,
    });

    return activity;
  }

  async findActivities() {
    return this.prisma.crmActivity.findMany({
      include: {
        lead: { select: { id: true, leadCode: true, fullName: true, phone: true } },
        memberProfile: {
          select: {
            id: true,
            memberCode: true,
            user: { select: { fullName: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getScorecard() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [staffUsers, leads, activities] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          status: UserStatus.ACTIVE,
          role: { in: [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.TRAINER] },
        },
        select: { id: true, fullName: true, role: true, phone: true },
        orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
      }),
      this.prisma.crmLead.findMany({
        select: {
          id: true,
          assignedToUserId: true,
          stage: true,
          nextFollowUpAt: true,
        },
      }),
      this.prisma.crmActivity.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: {
          id: true,
          actorUserId: true,
          leadId: true,
          memberProfileId: true,
        },
      }),
    ]);

    return staffUsers.map((staff) => {
      const myLeads = leads.filter((l) => l.assignedToUserId === staff.id);
      const activePipelineCount = myLeads.filter((l) => OPEN_STAGES.has(l.stage)).length;
      const convertedCount = myLeads.filter(
        (l) => l.stage === CrmLeadStage.CONVERTED,
      ).length;
      const overdueFollowUpsCount = myLeads.filter(
        (l) =>
          OPEN_STAGES.has(l.stage) &&
          l.nextFollowUpAt &&
          l.nextFollowUpAt.getTime() < now.getTime(),
      ).length;
      const myActs = activities.filter((a) => a.actorUserId === staff.id);
      const retentionCallsLogged = myActs.filter((a) => Boolean(a.memberProfileId)).length;
      const closedCount = myLeads.filter(
        (l) => l.stage === CrmLeadStage.CONVERTED || l.stage === CrmLeadStage.LOST,
      ).length;

      return {
        userId: staff.id,
        fullName: staff.fullName,
        role: staff.role,
        phone: staff.phone,
        assignedLeadsCount: myLeads.length,
        activePipelineCount,
        convertedCount,
        conversionRatePct:
          closedCount > 0 ? Math.round((convertedCount / closedCount) * 100) : 0,
        activitiesLogged30d: myActs.length,
        retentionCallsLogged,
        overdueFollowUpsCount,
      };
    });
  }
}

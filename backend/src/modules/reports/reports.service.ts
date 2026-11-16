import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AccessDecision,
  BiometricEnrollmentStatus,
  BookingStatus,
  DeviceStatus,
  InquiryStatus,
  MembershipStatus,
  PaymentStatus,
  Role,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getExecutiveOverview() {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const fourteenDaysFromNow = new Date(
      now.getTime() + 14 * 24 * 60 * 60 * 1000,
    );

    // Sync any expired memberships first so metrics reflect live reality
    await this.prisma.membership.updateMany({
      where: {
        status: MembershipStatus.ACTIVE,
        endDate: { lt: now },
      },
      data: {
        status: MembershipStatus.EXPIRED,
      },
    });

    const [
      totalMembers,
      activeMembershipsCount,
      pendingRegistrations,
      expiredMembershipsCount,
      monthlyPaymentsAgg,
      outstandingPaymentsAgg,
      upcomingSchedules,
      recentAuditLogs,
      allPayments,
      allMembers,
      allMembershipsWithPlan,
      allBookings,
      todayGrantedCount,
      recentAccessEvents,
      operationalPulse,
    ] = await Promise.all([
      this.prisma.memberProfile.count(),
      this.prisma.membership.count({
        where: { status: MembershipStatus.ACTIVE, endDate: { gte: now } },
      }),
      this.prisma.user.count({
        where: { role: Role.MEMBER, status: UserStatus.PENDING_APPROVAL },
      }),
      this.prisma.membership.count({
        where: { status: MembershipStatus.EXPIRED },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.VERIFIED_PAID,
          paidAt: { gte: startOfMonth },
        },
        _sum: { netAmountBdt: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PENDING,
        },
        _sum: { netAmountBdt: true },
      }),
      this.prisma.classSchedule.findMany({
        where: { isPublished: true, isCancelled: false },
        include: {
          gymClass: true,
          trainerProfile: {
            include: { user: { select: { fullName: true } } },
          },
        },
        take: 6,
      }),
      this.prisma.auditLog.findMany({
        include: {
          actorUser: { select: { fullName: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.payment.findMany({
        where: {
          status: PaymentStatus.VERIFIED_PAID,
          OR: [
            { paidAt: { gte: sixMonthsAgo } },
            { createdAt: { gte: sixMonthsAgo } },
          ],
        },
        select: { netAmountBdt: true, paidAt: true, createdAt: true },
      }),
      this.prisma.memberProfile.findMany({
        where: {
          OR: [
            { joinedAt: { gte: sixMonthsAgo } },
            { createdAt: { gte: sixMonthsAgo } },
          ],
        },
        select: { joinedAt: true, createdAt: true },
      }),
      this.prisma.membership.findMany({
        include: { plan: { select: { name: true } } },
      }),
      this.prisma.booking.findMany({
        include: {
          classSchedule: {
            include: { gymClass: { select: { title: true } } },
          },
        },
      }),
      this.prisma.accessEvent.count({
        where: {
          accessDecision: AccessDecision.GRANTED,
          eventTimestamp: {
            gte: startOfToday,
          },
        },
      }),
      this.prisma.accessEvent.findMany({
        where: { accessDecision: AccessDecision.GRANTED },
        select: { eventTimestamp: true },
        orderBy: { eventTimestamp: 'desc' },
        take: 250,
      }),
      this.getOperationalPulse(now, startOfToday, fourteenDaysFromNow),
    ]);

    // Build 6-month series for Revenue Trends, Membership Growth, and Registration Trends
    const monthLabels: Array<{ key: string; label: string }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', {
        month: 'short',
        year: '2-digit',
      });
      monthLabels.push({ key, label });
    }

    const revenueTrends = monthLabels.map(({ key, label }) => {
      const monthSum = allPayments
        .filter((p) => {
          const dt = p.paidAt || p.createdAt;
          const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
          return k === key;
        })
        .reduce((acc, p) => acc + Number(p.netAmountBdt), 0);

      return { month: label, revenueBdt: monthSum };
    });

    let cumulativeMembers = 0;
    const registrationTrends = monthLabels.map(({ key, label }) => {
      const newRegistrations = allMembers.filter((m) => {
        const dt = m.joinedAt || m.createdAt;
        const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
        return k === key;
      }).length;
      cumulativeMembers += newRegistrations;
      return {
        month: label,
        registrations: newRegistrations,
        activeTotal: cumulativeMembers,
      };
    });

    // Membership distribution by plan name
    const planMap = new Map<string, number>();
    for (const m of allMembershipsWithPlan) {
      const name = m.plan?.name || 'Unassigned';
      planMap.set(name, (planMap.get(name) || 0) + 1);
    }
    const membershipDistribution = Array.from(planMap.entries()).map(
      ([name, value]) => ({ name, value }),
    );

    // Booking statistics by class title and status
    const classBookingMap = new Map<
      string,
      { className: string; confirmed: number; cancelled: number; completed: number }
    >();
    for (const b of allBookings) {
      const className = b.classSchedule?.gymClass?.title || 'Class Session';
      const entry = classBookingMap.get(className) || {
        className,
        confirmed: 0,
        cancelled: 0,
        completed: 0,
      };
      if (b.status === BookingStatus.CONFIRMED) entry.confirmed += 1;
      if (b.status === BookingStatus.CANCELLED) entry.cancelled += 1;
      if (b.status === BookingStatus.COMPLETED) entry.completed += 1;
      classBookingMap.set(className, entry);
    }
    const bookingStatistics = Array.from(classBookingMap.values());

    const newMembersThisMonth = allMembers.filter((m) => {
      const dt = m.joinedAt || m.createdAt;
      return dt >= startOfMonth;
    }).length;

    const activityBuckets = {
      morning: 0,
      ladies: 0,
      evening: 0,
      late: 0,
    };
    for (const ev of recentAccessEvents) {
      const h = new Date(ev.eventTimestamp).getHours();
      if (h >= 7 && h < 13) activityBuckets.morning += 1;
      else if (h >= 13 && h < 16) activityBuckets.ladies += 1;
      else if (h >= 16 && h < 20) activityBuckets.evening += 1;
      else activityBuckets.late += 1;
    }
    const maxBucket = Math.max(
      1,
      activityBuckets.morning,
      activityBuckets.ladies,
      activityBuckets.evening,
      activityBuckets.late,
    );
    const activityWindows = [
      {
        label: '07:00–13:00',
        name: 'Morning Floor',
        count: activityBuckets.morning,
        pct: recentAccessEvents.length
          ? Math.max(25, Math.round((activityBuckets.morning / maxBucket) * 92))
          : 88,
      },
      {
        label: '01:00–03:30',
        name: 'Ladies Only',
        count: activityBuckets.ladies,
        pct: recentAccessEvents.length
          ? Math.max(25, Math.round((activityBuckets.ladies / maxBucket) * 92))
          : 78,
      },
      {
        label: '04:00–08:00',
        name: 'Evening Peak',
        count: activityBuckets.evening,
        pct: recentAccessEvents.length
          ? Math.max(25, Math.round((activityBuckets.evening / maxBucket) * 92))
          : 94,
      },
      {
        label: '08:00–11:00',
        name: 'Night Session',
        count: activityBuckets.late,
        pct: recentAccessEvents.length
          ? Math.max(20, Math.round((activityBuckets.late / maxBucket) * 92))
          : 64,
      },
    ];

    return {
      kpis: {
        totalMembers,
        activeMembers: activeMembershipsCount,
        newMembersThisMonth,
        todayVisitors: todayGrantedCount,
        pendingRegistrations,
        expiredMemberships: expiredMembershipsCount,
        monthlyRevenueBdt: Number(monthlyPaymentsAgg._sum.netAmountBdt || 0),
        outstandingPaymentsBdt: Number(
          outstandingPaymentsAgg._sum.netAmountBdt || 0,
        ),
        upcomingClassesCount: upcomingSchedules.length,
      },
      operations: operationalPulse.operations,
      expiringSoon: operationalPulse.expiringSoon,
      pendingPaymentsQueue: operationalPulse.pendingPaymentsQueue,
      charts: {
        revenueTrends,
        membershipGrowth: registrationTrends,
        registrationTrends,
        membershipDistribution,
        bookingStatistics,
        activityWindows,
      },
      upcomingClasses: upcomingSchedules,
      recentActivities: recentAuditLogs,
    };
  }

  private async getOperationalPulse(
    now: Date,
    startOfToday: Date,
    fourteenDaysFromNow: Date,
  ) {
    const [
      todayDeniedCount,
      pendingPaymentsCount,
      openInquiriesCount,
      biometricEnrolledCount,
      totalDevicesCount,
      onlineDevicesCount,
      activeTrainersCount,
      expiringSoonRaw,
      pendingPaymentsRaw,
    ] = await Promise.all([
      this.prisma.accessEvent.count({
        where: {
          accessDecision: AccessDecision.DENIED,
          eventTimestamp: { gte: startOfToday },
        },
      }),
      this.prisma.payment.count({
        where: { status: PaymentStatus.PENDING },
      }),
      this.prisma.contactInquiry.count({
        where: {
          status: { in: [InquiryStatus.NEW, InquiryStatus.IN_PROGRESS] },
        },
      }),
      this.prisma.biometricEnrollment.count({
        where: { status: BiometricEnrollmentStatus.ENROLLED },
      }),
      this.prisma.accessDevice.count({
        where: { isActive: true },
      }),
      this.prisma.accessDevice.count({
        where: { isActive: true, status: DeviceStatus.ONLINE },
      }),
      this.prisma.trainerProfile.count({
        where: { isActive: true, user: { status: UserStatus.ACTIVE } },
      }),
      this.prisma.membership.findMany({
        where: {
          status: MembershipStatus.ACTIVE,
          endDate: { gte: now, lte: fourteenDaysFromNow },
        },
        include: {
          memberProfile: {
            select: {
              memberCode: true,
              user: { select: { fullName: true } },
            },
          },
          plan: { select: { name: true } },
        },
        orderBy: { endDate: 'asc' },
        take: 4,
      }),
      this.prisma.payment.findMany({
        where: { status: PaymentStatus.PENDING },
        include: {
          memberProfile: {
            select: {
              memberCode: true,
              user: { select: { fullName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ]);

    const expiringSoon = expiringSoonRaw.map((m) => {
      const msLeft = Math.max(0, m.endDate.getTime() - now.getTime());
      const daysLeft = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
      return {
        id: m.id,
        memberName: m.memberProfile?.user?.fullName || 'Member',
        membershipCode: m.memberProfile?.memberCode || 'IFG',
        planName: m.plan?.name || 'Membership Plan',
        endDate: m.endDate,
        daysLeft,
      };
    });

    const pendingPaymentsQueue = pendingPaymentsRaw.map((p) => ({
      id: p.id,
      memberName: p.memberProfile?.user?.fullName || 'Member',
      membershipCode: p.memberProfile?.memberCode || 'IFG',
      netAmountBdt: Number(p.netAmountBdt || 0),
      paymentMethod: p.paymentMethod,
      transactionReference: p.transactionReference,
      createdAt: p.createdAt,
    }));

    return {
      operations: {
        pendingPaymentsCount,
        openInquiriesCount,
        biometricEnrolledCount,
        todayDeniedCount,
        totalDevicesCount,
        onlineDevicesCount,
        activeTrainersCount,
        expiringSoonCount: expiringSoon.length,
      },
      expiringSoon,
      pendingPaymentsQueue,
    };
  }

  private escapeCsv(val: unknown): string {
    if (val === null || val === undefined) return '';
    let str = String(val);
    // Neutralize spreadsheet formula injection (=, +, -, @, tab, CR)
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private toCsv(headers: string[], rows: Array<Array<unknown>>): string {
    const headerLine = headers.map((h) => this.escapeCsv(h)).join(',');
    const bodyLines = rows.map((r) =>
      r.map((cell) => this.escapeCsv(cell)).join(','),
    );
    return [headerLine, ...bodyLines].join('\n');
  }

  async exportReportCsv(type: string): Promise<{ filename: string; csv: string }> {
    const dateStamp = new Date().toISOString().slice(0, 10);

    switch (type) {
      case 'memberships': {
        const items = await this.prisma.membership.findMany({
          include: {
            memberProfile: { include: { user: true } },
            plan: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        const csv = this.toCsv(
          [
            'Membership ID',
            'Member Code',
            'Member Name',
            'Email',
            'Phone',
            'Plan Name',
            'Status',
            'Start Date',
            'End Date',
            'Price (BDT)',
          ],
          items.map((m) => [
            m.id,
            m.memberProfile.memberCode,
            m.memberProfile.user.fullName,
            m.memberProfile.user.email,
            m.memberProfile.user.phone,
            m.plan.name,
            m.status,
            m.startDate.toISOString().slice(0, 10),
            m.endDate.toISOString().slice(0, 10),
            m.plan.priceBdt,
          ]),
        );
        return { filename: `icon-fitness-memberships-${dateStamp}.csv`, csv };
      }

      case 'revenue': {
        const items = await this.prisma.payment.findMany({
          include: {
            memberProfile: { include: { user: true } },
            membership: { include: { plan: true } },
            receipt: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        const csv = this.toCsv(
          [
            'Payment ID',
            'Receipt Number',
            'Member Code',
            'Member Name',
            'Plan',
            'Amount (BDT)',
            'Discount (BDT)',
            'Net Amount (BDT)',
            'Method',
            'Status',
            'Transaction Reference',
            'Paid At',
          ],
          items.map((p) => [
            p.id,
            p.receipt?.receiptNumber || '',
            p.memberProfile.memberCode,
            p.memberProfile.user.fullName,
            p.membership?.plan?.name || '',
            p.amountBdt,
            p.discountBdt,
            p.netAmountBdt,
            p.paymentMethod,
            p.status,
            p.transactionReference || '',
            p.paidAt ? p.paidAt.toISOString() : '',
          ]),
        );
        return { filename: `icon-fitness-revenue-${dateStamp}.csv`, csv };
      }

      case 'registrations': {
        const items = await this.prisma.memberProfile.findMany({
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        });
        const csv = this.toCsv(
          [
            'Member Code',
            'Full Name',
            'Email',
            'Phone',
            'Status',
            'Gender',
            'Fitness Goal',
            'Joined Date',
          ],
          items.map((m) => [
            m.memberCode,
            m.user.fullName,
            m.user.email,
            m.user.phone,
            m.user.status,
            m.gender || '',
            m.fitnessGoal || '',
            m.joinedAt.toISOString().slice(0, 10),
          ]),
        );
        return { filename: `icon-fitness-registrations-${dateStamp}.csv`, csv };
      }

      case 'expiries': {
        const items = await this.prisma.membership.findMany({
          where: {
            OR: [
              { status: MembershipStatus.EXPIRED },
              {
                status: MembershipStatus.ACTIVE,
                endDate: {
                  lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                },
              },
            ],
          },
          include: {
            memberProfile: { include: { user: true } },
            plan: true,
          },
          orderBy: { endDate: 'asc' },
        });
        const csv = this.toCsv(
          [
            'Member Code',
            'Member Name',
            'Phone',
            'Plan',
            'Status',
            'Expiry Date',
          ],
          items.map((m) => [
            m.memberProfile.memberCode,
            m.memberProfile.user.fullName,
            m.memberProfile.user.phone,
            m.plan.name,
            m.status,
            m.endDate.toISOString().slice(0, 10),
          ]),
        );
        return { filename: `icon-fitness-expiries-${dateStamp}.csv`, csv };
      }

      case 'bookings': {
        const items = await this.prisma.booking.findMany({
          include: {
            memberProfile: { include: { user: true } },
            classSchedule: { include: { gymClass: true } },
          },
          orderBy: { sessionDate: 'desc' },
        });
        const csv = this.toCsv(
          [
            'Booking ID',
            'Member Code',
            'Member Name',
            'Class Title',
            'Day of Week',
            'Start Time',
            'Session Date',
            'Status',
          ],
          items.map((b) => [
            b.id,
            b.memberProfile.memberCode,
            b.memberProfile.user.fullName,
            b.classSchedule.gymClass.title,
            b.classSchedule.dayOfWeek,
            b.classSchedule.startTime,
            b.sessionDate.toISOString().slice(0, 10),
            b.status,
          ]),
        );
        return { filename: `icon-fitness-bookings-${dateStamp}.csv`, csv };
      }

      default:
        throw new BadRequestException(
          `Unsupported report export type '${type}'. Supported: memberships, revenue, registrations, expiries, bookings.`,
        );
    }
  }
}


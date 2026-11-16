import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MembershipStatus,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  Role,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private computePlanDiscount(plan: {
    priceBdt: any;
    discountPercent?: number | null;
    discountBdt?: any;
  }): number {
    const price = Number(plan?.priceBdt || 0);
    const pct = Math.min(100, Math.max(0, Number(plan?.discountPercent || 0)));
    const pctAmount = Math.round((price * pct) / 100);
    const flatAmount = Math.max(0, Number(plan?.discountBdt || 0));
    return Math.min(price, pctAmount + flatAmount);
  }

  private async generateReceiptNumber(): Promise<string> {
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.prisma.paymentReceipt.count();
    const seq = String(count + 1).padStart(4, '0');
    const rand = Math.floor(100 + Math.random() * 900);
    return `RCP-${ym}-${seq}-${rand}`;
  }

  private async enrichPaymentsWithEdits<T extends { id: string }>(
    payments: T[],
  ) {
    if (!payments.length) {
      return payments.map((p) => ({
        ...p,
        editCount: 0,
        isEdited: false,
        editedAt: null,
        latestEdit: null,
        editHistory: [],
      }));
    }

    const editLogs = await this.prisma.auditLog.findMany({
      where: {
        entityType: 'Payment',
        entityId: { in: payments.map((p) => p.id) },
        action: 'PAYMENT_EDITED_BY_MEMBER',
      },
      orderBy: { createdAt: 'desc' },
    });

    const grouped = new Map<string, typeof editLogs>();
    for (const log of editLogs) {
      if (!log.entityId) continue;
      const list = grouped.get(log.entityId) || [];
      list.push(log);
      grouped.set(log.entityId, list);
    }

    return payments.map((payment) => {
      const logs = grouped.get(payment.id) || [];
      const history = logs.map((l) => {
        const meta = (l.metadata || {}) as Record<string, any>;
        return {
          id: l.id,
          editedAt: l.createdAt,
          summary: l.summary,
          previous: meta.previous || null,
          updated: meta.updated || null,
        };
      });
      return {
        ...payment,
        editCount: history.length,
        isEdited: history.length > 0,
        editedAt: history[0]?.editedAt || null,
        latestEdit: history[0] || null,
        editHistory: history,
      };
    });
  }

  async findMyPayments(userId: string) {
    const member = await this.prisma.memberProfile.findUnique({
      where: { userId },
    });
    if (!member) {
      throw new NotFoundException('Member profile not found.');
    }

    const payments = await this.prisma.payment.findMany({
      where: { memberProfileId: member.id },
      include: {
        receipt: {
          include: {
            issuedByUser: {
              select: { fullName: true, role: true },
            },
          },
        },
        membership: {
          include: { plan: { select: { id: true, name: true, durationDays: true } } },
        },
        verifiedByUser: {
          select: { fullName: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.enrichPaymentsWithEdits(payments);
  }

  async findAllAdmin(params: {
    page?: number;
    limit?: number;
    status?: PaymentStatus;
    paymentMethod?: PaymentMethod;
    search?: string;
  }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};
    if (params.status) where.status = params.status;
    if (params.paymentMethod) where.paymentMethod = params.paymentMethod;
    if (params.search) {
      where.OR = [
        {
          transactionReference: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
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
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          memberProfile: {
            include: {
              user: { select: { fullName: true, email: true, phone: true } },
            },
          },
          membership: {
            include: { plan: { select: { name: true, durationDays: true } } },
          },
          verifiedByUser: {
            select: { fullName: true, role: true },
          },
          receipt: {
            include: {
              issuedByUser: {
                select: { fullName: true, role: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    const enrichedItems = await this.enrichPaymentsWithEdits(items);

    return {
      items: enrichedItems,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Business Rule:
   * - Payment status and membership status are separate.
   * - Pending payment NEVER automatically activates a membership.
   * - Never store raw card details.
   */
  async createPayment(
    actor: AuthenticatedUser,
    dto: {
      memberProfileId?: string;
      membershipId?: string;
      amountBdt: number;
      discountBdt?: number;
      paymentMethod: PaymentMethod;
      transactionReference?: string;
      senderPhone?: string;
      dueDate?: string;
      notes?: string;
    },
  ) {
    let targetMemberProfileId = dto.memberProfileId;

    if (actor.role === Role.MEMBER) {
      if (!actor.memberProfileId) {
        throw new ForbiddenException('Member profile missing.');
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

    const amount = Number(dto.amountBdt);
    let discount = Number(dto.discountBdt ?? 0);
    if (
      dto.membershipId &&
      typeof this.prisma.membership?.findUnique === 'function'
    ) {
      const linkedMembership = await this.prisma.membership.findUnique({
        where: { id: dto.membershipId },
        include: { plan: true },
      });
      if (!linkedMembership || linkedMembership.memberProfileId !== member.id) {
        throw new ForbiddenException(
          'Referenced membership does not belong to this member.',
        );
      }
      if (linkedMembership?.plan) {
        const maxPlanDiscount = this.computePlanDiscount(linkedMembership.plan);
        if (actor.role === Role.MEMBER) {
          const minPlanPrice = Number(linkedMembership.plan.priceBdt || 0);
          if (amount < minPlanPrice) {
            throw new BadRequestException(
              'Payment amount cannot be less than the selected plan fee.',
            );
          }
          discount = Math.min(amount, maxPlanDiscount);
        } else if (dto.discountBdt === undefined) {
          discount = Math.min(amount, maxPlanDiscount);
        }
      }
    } else if (actor.role === Role.MEMBER) {
      discount = 0;
    }
    if (amount <= 0 || discount < 0 || discount > amount) {
      throw new BadRequestException('Invalid payment or discount amount.');
    }
    const netAmount = amount - discount;

    if (actor.role === Role.MEMBER) {
      const existingPending = await this.prisma.payment.findFirst({
        where: {
          memberProfileId: member.id,
          status: PaymentStatus.PENDING,
        },
      });
      if (existingPending) {
        throw new ConflictException(
          'You have already submitted a pending payment for this Member ID. You may edit your submitted payment once instead of submitting again.',
        );
      }

      if (dto.membershipId) {
        const existingForMembership = await this.prisma.payment.findFirst({
          where: {
            memberProfileId: member.id,
            membershipId: dto.membershipId,
            status: { in: [PaymentStatus.PENDING, PaymentStatus.VERIFIED_PAID] },
          },
        });
        if (existingForMembership) {
          throw new ConflictException(
            'A payment has already been submitted for this membership.',
          );
        }
      }
    }

    const trimmedRef = dto.transactionReference?.trim() || null;
    if (trimmedRef) {
      const duplicateRef = await this.prisma.payment.findFirst({
        where: {
          transactionReference: trimmedRef,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.VERIFIED_PAID] },
        },
      });
      if (duplicateRef) {
        throw new ConflictException(
          'This transaction reference has already been submitted.',
        );
      }
    }

    // Newly created payments always start as PENDING until explicitly verified by authorized staff
    const created = await this.prisma.payment.create({
      data: {
        memberProfileId: member.id,
        membershipId: dto.membershipId || null,
        amountBdt: amount,
        discountBdt: discount,
        netAmountBdt: netAmount,
        paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
        transactionReference: trimmedRef,
        senderPhone: dto.senderPhone?.trim() || null,
        status: PaymentStatus.PENDING,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        notes: dto.notes?.trim() || null,
      },
      include: {
        memberProfile: {
          include: { user: { select: { fullName: true, email: true } } },
        },
        membership: { include: { plan: true } },
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'PAYMENT_RECORD_CREATED',
      entityType: 'Payment',
      entityId: created.id,
      summary: `Recorded PENDING payment of ${netAmount} BDT (${dto.paymentMethod}) for ${member.user.fullName}`,
    });

    const [enrichedCreated] = await this.enrichPaymentsWithEdits([created]);
    return enrichedCreated;
  }

  /**
   * Member may edit their own PENDING payment AT MOST ONCE (1/1).
   * Records before/after snapshots in AuditLog so Admin Panel highlights the edited version.
   */
  async editMyPendingPayment(
    actor: AuthenticatedUser,
    paymentId: string,
    dto: {
      planId?: string;
      paymentMethod?: PaymentMethod;
      transactionReference?: string;
      senderPhone?: string;
      notes?: string;
    },
  ) {
    if (actor.role !== Role.MEMBER || !actor.memberProfileId) {
      throw new ForbiddenException('Only members can edit their own pending payment.');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        memberProfile: { include: { user: { select: { fullName: true, email: true } } } },
        membership: { include: { plan: true } },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found.');
    }

    if (payment.memberProfileId !== actor.memberProfileId) {
      throw new ForbiddenException('You can only edit your own payment record.');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        'Only PENDING payment submissions can be edited.',
      );
    }

    const priorEdits = await this.prisma.auditLog.count({
      where: {
        entityType: 'Payment',
        entityId: payment.id,
        action: 'PAYMENT_EDITED_BY_MEMBER',
      },
    });

    if (priorEdits >= 1) {
      throw new ForbiddenException(
        'One-time edit limit reached (1/1). You cannot edit this payment submission again.',
      );
    }

    const nextRef =
      dto.transactionReference !== undefined
        ? dto.transactionReference.trim() || null
        : payment.transactionReference;

    if (nextRef && nextRef !== payment.transactionReference) {
      const duplicateRef = await this.prisma.payment.findFirst({
        where: {
          id: { not: payment.id },
          transactionReference: nextRef,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.VERIFIED_PAID] },
        },
      });
      if (duplicateRef) {
        throw new ConflictException(
          'This transaction reference has already been submitted.',
        );
      }
    }

    let nextAmountBdt = Number(payment.amountBdt);
    let nextDiscountBdt = Number(payment.discountBdt);
    let nextNetAmountBdt = Number(payment.netAmountBdt);
    let targetPlan: { id: string; name: string; durationDays: number } | null = null;

    if (
      dto.planId &&
      payment.membershipId &&
      payment.membership &&
      payment.membership.status === MembershipStatus.PENDING &&
      dto.planId !== payment.membership.planId
    ) {
      const plan = await this.prisma.membershipPlan.findUnique({
        where: { id: dto.planId },
      });
      if (!plan || !plan.isActive) {
        throw new BadRequestException('Selected membership plan is not available.');
      }
      targetPlan = {
        id: plan.id,
        name: plan.name,
        durationDays: plan.durationDays,
      };
      nextAmountBdt = Number(plan.priceBdt) + Number(plan.admissionFeeBdt || 0);
      nextDiscountBdt = Math.min(nextAmountBdt, this.computePlanDiscount(plan));
      nextNetAmountBdt = Math.max(0, nextAmountBdt - nextDiscountBdt);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (targetPlan && payment.membershipId && payment.membership) {
        const nextEndDate = new Date(
          payment.membership.startDate.getTime() +
            targetPlan.durationDays * 24 * 60 * 60 * 1000,
        );
        await tx.membership.update({
          where: { id: payment.membershipId },
          data: {
            planId: targetPlan.id,
            endDate: nextEndDate,
            renewalNotes: `Updated during 1-time member payment edit to ${targetPlan.name}. Pending payment verification.`,
          },
        });
      }

      return tx.payment.update({
        where: { id: payment.id },
        data: {
          paymentMethod: dto.paymentMethod ?? payment.paymentMethod,
          transactionReference: nextRef,
          senderPhone:
            dto.senderPhone !== undefined
              ? dto.senderPhone.trim() || null
              : payment.senderPhone,
          notes:
            dto.notes !== undefined
              ? dto.notes.trim() || null
              : payment.notes,
          amountBdt: nextAmountBdt,
          discountBdt: nextDiscountBdt,
          netAmountBdt: nextNetAmountBdt,
        },
        include: {
          receipt: true,
          memberProfile: {
            include: { user: { select: { fullName: true, email: true } } },
          },
          membership: { include: { plan: true } },
        },
      });
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'PAYMENT_EDITED_BY_MEMBER',
      entityType: 'Payment',
      entityId: payment.id,
      summary: `Edited pending payment (1/1) for ${payment.memberProfile.user.fullName}`,
      metadata: {
        editNumber: 1,
        editedAt: new Date().toISOString(),
        previous: {
          planId: payment.membership?.planId ?? null,
          planName: payment.membership?.plan?.name ?? null,
          amountBdt: Number(payment.netAmountBdt),
          paymentMethod: payment.paymentMethod,
          transactionReference: payment.transactionReference,
          senderPhone: payment.senderPhone,
          notes: payment.notes,
        },
        updated: {
          planId: updated.membership?.planId ?? null,
          planName: updated.membership?.plan?.name ?? null,
          amountBdt: Number(updated.netAmountBdt),
          paymentMethod: updated.paymentMethod,
          transactionReference: updated.transactionReference,
          senderPhone: updated.senderPhone,
          notes: updated.notes,
        },
      },
    });

    const [enriched] = await this.enrichPaymentsWithEdits([updated]);
    return enriched;
  }

  /**
   * Manually verify payment by authorized staff (STAFF, ADMIN, SUPER_ADMIN).
   * Atomically marks payment VERIFIED_PAID, generates PaymentReceipt,
   * optionally activates linked membership if requested, and writes AuditLog.
   */
  async verifyPaymentByStaff(
    actor: AuthenticatedUser,
    paymentId: string,
    dto: {
      transactionReference?: string;
      notes?: string;
      activateLinkedMembership?: boolean;
    },
  ) {
    if (!([Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF] as Role[]).includes(actor.role)) {
      throw new ForbiddenException(
        'Only authorized staff can verify payments.',
      );
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        memberProfile: { include: { user: true } },
        membership: { include: { plan: true } },
        receipt: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found.');
    }

    if (payment.status === PaymentStatus.VERIFIED_PAID && payment.receipt) {
      return payment;
    }

    const receiptNumber = await this.generateReceiptNumber();
    const now = new Date();

    const verified = await this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.VERIFIED_PAID,
          paidAt: now,
          verifiedByUserId: actor.id,
          verifiedAt: now,
          ...(dto.transactionReference
            ? { transactionReference: dto.transactionReference }
            : {}),
          ...(dto.notes ? { notes: dto.notes } : {}),
        },
      });

      const receipt = await tx.paymentReceipt.create({
        data: {
          paymentId: updatedPayment.id,
          receiptNumber,
          issuedToName: payment.memberProfile.user.fullName,
          issuedToEmail: payment.memberProfile.user.email,
          issuedToPhone: payment.memberProfile.user.phone,
          planName: payment.membership?.plan?.name ?? 'Gym Membership / Service',
          amountPaidBdt: updatedPayment.netAmountBdt,
          paymentMethod: updatedPayment.paymentMethod,
          issuedByUserId: actor.id,
          issuedAt: now,
          receiptDataJson: {
            gymName: 'Icon Fitness Gym',
            ownerName: 'Saddam Hoisan',
            location: 'Ashkona, Dakshinkhan, Dhaka, Bangladesh',
            memberCode: payment.memberProfile.memberCode,
            transactionReference: updatedPayment.transactionReference,
          },
        },
      });

      const shouldActivateMembership = dto.activateLinkedMembership !== false;
      let membershipIdToActivate = payment.membershipId;
      if (
        shouldActivateMembership &&
        !membershipIdToActivate &&
        typeof tx.membership?.findFirst === 'function'
      ) {
        const pendingMembership = await tx.membership.findFirst({
          where: {
            memberProfileId: payment.memberProfileId,
            status: MembershipStatus.PENDING,
          },
          orderBy: { createdAt: 'desc' },
        });
        if (pendingMembership) {
          membershipIdToActivate = pendingMembership.id;
          await tx.payment.update({
            where: { id: updatedPayment.id },
            data: { membershipId: pendingMembership.id },
          });
        }
      }

      if (shouldActivateMembership && membershipIdToActivate) {
        await tx.membership.update({
          where: { id: membershipIdToActivate },
          data: {
            status: MembershipStatus.ACTIVE,
            activatedByUserId: actor.id,
            activationDate: now,
          },
        });
        if (payment.memberProfile.user.status === UserStatus.PENDING_APPROVAL) {
          await tx.user.update({
            where: { id: payment.memberProfile.userId },
            data: { status: UserStatus.ACTIVE },
          });
        }
      }

      return { updatedPayment, receipt, membershipActivated: Boolean(shouldActivateMembership && membershipIdToActivate) };
    });

    await this.notificationsService.createNotification({
      userId: payment.memberProfile.userId,
      type: NotificationType.PAYMENT,
      title: verified.membershipActivated
        ? 'Payment Verified & Portal Unlocked'
        : 'Payment Verified & Receipt Issued',
      message: verified.membershipActivated
        ? `Your payment of ৳${payment.netAmountBdt} has been approved (Receipt #${verified.receipt.receiptNumber}). Your membership is now ACTIVE and full Member Portal access is unlocked.`
        : `Your payment of ৳${payment.netAmountBdt} has been verified. Receipt #${verified.receipt.receiptNumber}.`,
      linkUrl: verified.membershipActivated ? '/member/dashboard' : '/member/membership',
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'PAYMENT_VERIFIED',
      entityType: 'Payment',
      entityId: paymentId,
      summary: `Verified payment of ${payment.netAmountBdt} BDT for ${payment.memberProfile.user.fullName} (Receipt ${verified.receipt.receiptNumber})`,
      metadata: {
        receiptNumber: verified.receipt.receiptNumber,
        activateLinkedMembership: verified.membershipActivated,
      },
    });

    return this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        memberProfile: { include: { user: { select: { fullName: true, email: true, phone: true } } } },
        membership: { include: { plan: true } },
        receipt: true,
        verifiedByUser: { select: { fullName: true } },
      },
    });
  }

  async refundPayment(
    actor: AuthenticatedUser,
    paymentId: string,
    dto: { refundedAmountBdt?: number; refundReason: string },
  ) {
    if (!([Role.SUPER_ADMIN, Role.ADMIN] as Role[]).includes(actor.role)) {
      throw new ForbiddenException('Only ADMIN or SUPER_ADMIN can record refunds.');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { memberProfile: { include: { user: true } } },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }

    if (payment.status !== PaymentStatus.VERIFIED_PAID) {
      throw new BadRequestException(
        'Only verified paid transactions can be refunded.',
      );
    }

    const netPaid = Number(payment.netAmountBdt);
    const refundAmount =
      dto.refundedAmountBdt !== undefined
        ? Number(dto.refundedAmountBdt)
        : netPaid;

    if (!Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > netPaid) {
      throw new BadRequestException(
        `Refund amount must be between ৳1 and ৳${netPaid.toLocaleString()}.`,
      );
    }

    const cleanReason = String(dto.refundReason || '').trim();
    if (cleanReason.length < 3) {
      throw new BadRequestException('A valid refund reason is required.');
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
        refundedAmountBdt: refundAmount,
        refundReason: cleanReason,
      },
      include: { receipt: true },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'PAYMENT_REFUNDED',
      entityType: 'Payment',
      entityId: paymentId,
      summary: `Refunded ${refundAmount} BDT to ${payment.memberProfile.user.fullName}. Reason: ${dto.refundReason}`,
    });

    return updated;
  }

  async getReceipt(actor: AuthenticatedUser, paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        receipt: {
          include: {
            issuedByUser: {
              select: { fullName: true, role: true },
            },
          },
        },
        memberProfile: { include: { user: true } },
        membership: { include: { plan: true } },
      },
    });

    if (!payment || !payment.receipt) {
      throw new NotFoundException('Payment receipt not found.');
    }

    // Ownership check against IDOR
    if (
      actor.role === Role.MEMBER &&
      payment.memberProfile.userId !== actor.id
    ) {
      throw new ForbiddenException(
        'You are not authorized to access another member’s payment receipt.',
      );
    }

    return payment.receipt;
  }

  async verifyReceiptPublic(rawCode: string) {
    const clean = String(rawCode || '').trim();
    if (!clean) {
      throw new NotFoundException('Receipt code is required.');
    }

    const receipt = await this.prisma.paymentReceipt.findFirst({
      where: {
        OR: [
          { receiptNumber: { equals: clean, mode: 'insensitive' } },
          { paymentId: clean },
        ],
      },
      include: {
        issuedByUser: { select: { fullName: true, role: true } },
        payment: {
          include: {
            memberProfile: { select: { memberCode: true } },
            membership: { include: { plan: { select: { name: true, durationDays: true } } } },
          },
        },
      },
    });

    if (!receipt || !receipt.payment) {
      throw new NotFoundException(`Receipt "${clean}" was not found.`);
    }

    const phone = String(receipt.issuedToPhone || '');
    const maskedPhone =
      phone.length >= 7 ? `${phone.slice(0, 5)}****${phone.slice(-3)}` : phone;

    return {
      verified: true,
      receiptNumber: receipt.receiptNumber,
      status: receipt.payment.status,
      issuedToName: receipt.issuedToName,
      maskedPhone,
      memberCode: receipt.payment.memberProfile?.memberCode || null,
      planName:
        receipt.planName || receipt.payment.membership?.plan?.name || 'Membership Fee',
      amountBdt: Number(receipt.payment.amountBdt || receipt.amountPaidBdt),
      discountBdt: Number(receipt.payment.discountBdt || 0),
      netAmountBdt: Number(receipt.payment.netAmountBdt || receipt.amountPaidBdt),
      paymentMethod: receipt.paymentMethod,
      transactionReference: receipt.payment.transactionReference
        ? String(receipt.payment.transactionReference).length <= 4
          ? '****'
          : `****${String(receipt.payment.transactionReference).slice(-4)}`
        : null,
      periodStart: receipt.payment.membership?.startDate || null,
      periodEnd: receipt.payment.membership?.endDate || null,
      issuedAt: receipt.issuedAt,
      issuedBy: receipt.issuedByUser || null,
    };
  }
}

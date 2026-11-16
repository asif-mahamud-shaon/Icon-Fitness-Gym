import { Injectable, NotFoundException } from '@nestjs/common';
import { InquiryStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class InquiriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async createPublicInquiry(dto: {
    fullName: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    interestedPlan?: string;
  }) {
    const created = await this.prisma.contactInquiry.create({
      data: {
        fullName: dto.fullName.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone.trim(),
        subject: dto.subject.trim(),
        message: dto.message.trim(),
        interestedPlan: dto.interestedPlan || null,
        status: InquiryStatus.NEW,
      },
    });

    await this.auditLogsService.log({
      action: 'PUBLIC_INQUIRY_SUBMITTED',
      entityType: 'ContactInquiry',
      entityId: created.id,
      summary: `Website inquiry from ${created.fullName} (${created.subject})`,
    });

    return created;
  }

  async findAllAdmin(status?: InquiryStatus) {
    return this.prisma.contactInquiry.findMany({
      where: {
        ...(status ? { status } : {}),
      },
      include: {
        assignedToUser: {
          select: { id: true, fullName: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateInquiry(
    actor: AuthenticatedUser,
    id: string,
    dto: {
      status?: InquiryStatus;
      assignedToUserId?: string | null;
      internalNotes?: string;
    },
  ) {
    const existing = await this.prisma.contactInquiry.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Inquiry not found.');

    const updated = await this.prisma.contactInquiry.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.status === InquiryStatus.RESOLVED
          ? { resolvedAt: new Date() }
          : {}),
        ...(dto.assignedToUserId !== undefined
          ? { assignedToUserId: dto.assignedToUserId || null }
          : {}),
        ...(dto.internalNotes !== undefined
          ? { internalNotes: dto.internalNotes }
          : {}),
      },
      include: {
        assignedToUser: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'INQUIRY_UPDATED',
      entityType: 'ContactInquiry',
      entityId: id,
      summary: `Updated inquiry from ${updated.fullName} to status ${updated.status}`,
    });

    return updated;
  }
}


import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class TestimonialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findPublic() {
    return this.prisma.testimonial.findMany({
      where: { isApproved: true, isPublished: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllAdmin() {
    return this.prisma.testimonial.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    actor: AuthenticatedUser,
    dto: {
      authorName: string;
      authorRole?: string;
      rating?: number;
      content: string;
      avatarUrl?: string;
      isApproved?: boolean;
      isPublished?: boolean;
    },
  ) {
    const isStaff = ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(actor.role);
    const created = await this.prisma.testimonial.create({
      data: {
        authorName: dto.authorName.trim(),
        authorRole: dto.authorRole || 'Gym Member',
        memberProfileId: actor.memberProfileId ?? null,
        rating: Math.max(1, Math.min(5, Number(dto.rating ?? 5))),
        content: dto.content.trim(),
        avatarUrl: dto.avatarUrl,
        isApproved: isStaff ? Boolean(dto.isApproved ?? true) : false,
        isPublished: isStaff ? Boolean(dto.isPublished ?? true) : false,
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'TESTIMONIAL_CREATED',
      entityType: 'Testimonial',
      entityId: created.id,
      summary: `Created testimonial by ${created.authorName}`,
    });

    return created;
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: Record<string, any>,
  ) {
    const existing = await this.prisma.testimonial.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Testimonial not found.');

    const updated = await this.prisma.testimonial.update({
      where: { id },
      data: {
        ...(dto.authorName ? { authorName: dto.authorName.trim() } : {}),
        ...(dto.authorRole !== undefined ? { authorRole: dto.authorRole } : {}),
        ...(dto.rating !== undefined
          ? { rating: Math.max(1, Math.min(5, Number(dto.rating))) }
          : {}),
        ...(dto.content ? { content: dto.content.trim() } : {}),
        ...(dto.isApproved !== undefined
          ? { isApproved: Boolean(dto.isApproved) }
          : {}),
        ...(dto.isPublished !== undefined
          ? { isPublished: Boolean(dto.isPublished) }
          : {}),
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'TESTIMONIAL_UPDATED',
      entityType: 'Testimonial',
      entityId: id,
      summary: `Updated testimonial by ${updated.authorName} (approved=${updated.isApproved}, published=${updated.isPublished})`,
    });

    return updated;
  }

  async remove(actor: AuthenticatedUser, id: string) {
    await this.prisma.testimonial.delete({ where: { id } });
    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'TESTIMONIAL_DELETED',
      entityType: 'Testimonial',
      entityId: id,
      summary: `Deleted testimonial ${id}`,
    });
    return { deleted: true };
  }
}


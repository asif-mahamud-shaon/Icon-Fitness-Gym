import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlanDurationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class MembershipPlansService {
  private publicPlansCache: { data: any; expiresAt: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private invalidatePublicPlansCache() {
    this.publicPlansCache = null;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async findPublic() {
    if (
      process.env.NODE_ENV !== 'test' &&
      this.publicPlansCache &&
      this.publicPlansCache.expiresAt > Date.now()
    ) {
      return this.publicPlansCache.data;
    }

    const plans = await this.prisma.membershipPlan.findMany({
      where: {
        isActive: true,
        isPublic: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { priceBdt: 'asc' }],
    });

    if (process.env.NODE_ENV !== 'test') {
      this.publicPlansCache = {
        data: plans,
        expiresAt: Date.now() + 15000,
      };
    }
    return plans;
  }

  async findAllAdmin() {
    return this.prisma.membershipPlan.findMany({
      include: {
        _count: {
          select: { memberships: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(
    actor: AuthenticatedUser,
    dto: {
      name: string;
      description: string;
      durationDays: number;
      durationType?: PlanDurationType;
      priceBdt: number;
      admissionFeeBdt?: number;
      discountPercent?: number;
      discountBdt?: number;
      discountLabel?: string;
      benefits: string[];
      eligibilityConditions?: string;
      renewalRules?: string;
      maxClassesPerWeek?: number;
      includesPersonalTrainer?: boolean;
      isFeatured?: boolean;
      isActive?: boolean;
      isPublic?: boolean;
      sortOrder?: number;
    },
  ) {
    const slug = this.slugify(dto.name);
    const existing = await this.prisma.membershipPlan.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException(`A plan with slug '${slug}' already exists.`);
    }

    const priceBdt = Number(dto.priceBdt);
    const discountPercent = Math.min(
      100,
      Math.max(0, Math.round(Number(dto.discountPercent ?? 0))),
    );
    const discountBdt = Math.max(0, Number(dto.discountBdt ?? 0));

    const created = await this.prisma.membershipPlan.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description,
        durationDays: Number(dto.durationDays),
        durationType: dto.durationType || PlanDurationType.MONTHLY,
        priceBdt,
        admissionFeeBdt: Number(dto.admissionFeeBdt ?? 0),
        discountPercent,
        discountBdt,
        discountLabel: dto.discountLabel?.trim() || null,
        benefits: dto.benefits || [],
        eligibilityConditions: dto.eligibilityConditions,
        renewalRules: dto.renewalRules,
        maxClassesPerWeek: Number(dto.maxClassesPerWeek ?? 6),
        includesPersonalTrainer: Boolean(dto.includesPersonalTrainer),
        isFeatured: Boolean(dto.isFeatured),
        isActive: dto.isActive ?? true,
        isPublic: dto.isPublic ?? true,
        sortOrder: Number(dto.sortOrder ?? 0),
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'MEMBERSHIP_PLAN_CREATED',
      entityType: 'MembershipPlan',
      entityId: created.id,
      summary: `Created membership plan '${created.name}' (${created.priceBdt} BDT / ${created.durationDays} days)`,
    });

    this.invalidatePublicPlansCache();
    return created;
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: Record<string, any>,
  ) {
    const plan = await this.prisma.membershipPlan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Membership plan not found.');
    }

    const updated = await this.prisma.membershipPlan.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.durationDays !== undefined
          ? { durationDays: Number(dto.durationDays) }
          : {}),
        ...(dto.durationType ? { durationType: dto.durationType } : {}),
        ...(dto.priceBdt !== undefined ? { priceBdt: Number(dto.priceBdt) } : {}),
        ...(dto.admissionFeeBdt !== undefined
          ? { admissionFeeBdt: Number(dto.admissionFeeBdt) }
          : {}),
        ...(dto.discountPercent !== undefined
          ? {
              discountPercent: Math.min(
                100,
                Math.max(0, Math.round(Number(dto.discountPercent))),
              ),
            }
          : {}),
        ...(dto.discountBdt !== undefined
          ? { discountBdt: Math.max(0, Number(dto.discountBdt)) }
          : {}),
        ...(dto.discountLabel !== undefined
          ? { discountLabel: dto.discountLabel ? String(dto.discountLabel).trim() : null }
          : {}),
        ...(dto.benefits !== undefined ? { benefits: dto.benefits } : {}),
        ...(dto.eligibilityConditions !== undefined
          ? { eligibilityConditions: dto.eligibilityConditions }
          : {}),
        ...(dto.renewalRules !== undefined
          ? { renewalRules: dto.renewalRules }
          : {}),
        ...(dto.maxClassesPerWeek !== undefined
          ? { maxClassesPerWeek: Number(dto.maxClassesPerWeek) }
          : {}),
        ...(dto.includesPersonalTrainer !== undefined
          ? { includesPersonalTrainer: Boolean(dto.includesPersonalTrainer) }
          : {}),
        ...(dto.isFeatured !== undefined
          ? { isFeatured: Boolean(dto.isFeatured) }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: Boolean(dto.isActive) } : {}),
        ...(dto.isPublic !== undefined ? { isPublic: Boolean(dto.isPublic) } : {}),
        ...(dto.sortOrder !== undefined
          ? { sortOrder: Number(dto.sortOrder) }
          : {}),
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'MEMBERSHIP_PLAN_UPDATED',
      entityType: 'MembershipPlan',
      entityId: id,
      summary: `Updated membership plan '${updated.name}'`,
    });

    this.invalidatePublicPlansCache();
    return updated;
  }
}


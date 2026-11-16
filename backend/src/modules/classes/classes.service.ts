import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DifficultyLevel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async findPublicClasses() {
    return this.prisma.gymClass.findMany({
      where: { isPublished: true, isActive: true },
      include: {
        schedules: {
          where: { isPublished: true, isCancelled: false },
          include: {
            trainerProfile: {
              include: { user: { select: { fullName: true, avatarUrl: true } } },
            },
          },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
      orderBy: { title: 'asc' },
    });
  }

  async findAllAdmin() {
    return this.prisma.gymClass.findMany({
      include: {
        schedules: {
          include: {
            trainerProfile: {
              include: { user: { select: { fullName: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createClass(
    actor: AuthenticatedUser,
    dto: {
      title: string;
      description: string;
      category: string;
      durationMinutes?: number;
      defaultCapacity?: number;
      difficulty?: DifficultyLevel;
      coverImageUrl?: string;
      isPublished?: boolean;
      isActive?: boolean;
    },
  ) {
    const slug = this.slugify(dto.title);
    const existing = await this.prisma.gymClass.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Class '${dto.title}' already exists.`);
    }

    const created = await this.prisma.gymClass.create({
      data: {
        title: dto.title.trim(),
        slug,
        description: dto.description,
        category: dto.category || 'Strength & Conditioning',
        durationMinutes: Number(dto.durationMinutes ?? 60),
        defaultCapacity: Number(dto.defaultCapacity ?? 20),
        difficulty: dto.difficulty || DifficultyLevel.ALL_LEVELS,
        coverImageUrl: dto.coverImageUrl,
        isPublished: dto.isPublished ?? true,
        isActive: dto.isActive ?? true,
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'GYM_CLASS_CREATED',
      entityType: 'GymClass',
      entityId: created.id,
      summary: `Created gym class '${created.title}'`,
    });

    return created;
  }

  async updateClass(
    actor: AuthenticatedUser,
    id: string,
    dto: Record<string, any>,
  ) {
    const existing = await this.prisma.gymClass.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Gym class not found.');

    const updated = await this.prisma.gymClass.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.durationMinutes !== undefined
          ? { durationMinutes: Number(dto.durationMinutes) }
          : {}),
        ...(dto.defaultCapacity !== undefined
          ? { defaultCapacity: Number(dto.defaultCapacity) }
          : {}),
        ...(dto.difficulty ? { difficulty: dto.difficulty } : {}),
        ...(dto.coverImageUrl !== undefined
          ? { coverImageUrl: dto.coverImageUrl }
          : {}),
        ...(dto.isPublished !== undefined
          ? { isPublished: Boolean(dto.isPublished) }
          : {}),
        ...(dto.isActive !== undefined
          ? { isActive: Boolean(dto.isActive) }
          : {}),
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'GYM_CLASS_UPDATED',
      entityType: 'GymClass',
      entityId: id,
      summary: `Updated gym class '${updated.title}'`,
    });

    return updated;
  }

  // Facilities CRUD (Public + Admin Configurable)
  async findPublicFacilities() {
    return this.prisma.facility.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findAllFacilitiesAdmin() {
    return this.prisma.facility.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createFacility(
    actor: AuthenticatedUser,
    dto: {
      name: string;
      category: string;
      description: string;
      features?: string[];
      imageUrl?: string;
      isPublished?: boolean;
      sortOrder?: number;
    },
  ) {
    const slug = `${this.slugify(dto.name)}-${Date.now().toString().slice(-4)}`;
    const created = await this.prisma.facility.create({
      data: {
        name: dto.name.trim(),
        slug,
        category: dto.category,
        description: dto.description,
        features: dto.features || [],
        imageUrl: dto.imageUrl,
        isPublished: dto.isPublished ?? true,
        sortOrder: Number(dto.sortOrder ?? 0),
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'FACILITY_CREATED',
      entityType: 'Facility',
      entityId: created.id,
      summary: `Created facility '${created.name}'`,
    });

    return created;
  }

  async updateFacility(
    actor: AuthenticatedUser,
    id: string,
    dto: Record<string, any>,
  ) {
    const updated = await this.prisma.facility.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.features !== undefined ? { features: dto.features } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
        ...(dto.isPublished !== undefined
          ? { isPublished: Boolean(dto.isPublished) }
          : {}),
        ...(dto.sortOrder !== undefined
          ? { sortOrder: Number(dto.sortOrder) }
          : {}),
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'FACILITY_UPDATED',
      entityType: 'Facility',
      entityId: id,
      summary: `Updated facility '${updated.name}'`,
    });

    return updated;
  }
}


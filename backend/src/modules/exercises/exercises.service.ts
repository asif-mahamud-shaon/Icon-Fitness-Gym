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
export class ExercisesService {
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

  async findAll(muscleGroup?: string) {
    return this.prisma.exercise.findMany({
      where: {
        ...(muscleGroup
          ? { targetMuscleGroup: { contains: muscleGroup, mode: 'insensitive' } }
          : {}),
      },
      orderBy: [{ targetMuscleGroup: 'asc' }, { name: 'asc' }],
    });
  }

  async create(
    actor: AuthenticatedUser,
    dto: {
      name: string;
      targetMuscleGroup: string;
      equipmentRequired?: string;
      difficulty?: DifficultyLevel;
      instructions: string;
      videoUrl?: string;
      imageUrl?: string;
      isActive?: boolean;
    },
  ) {
    const slug = this.slugify(dto.name);
    const existing = await this.prisma.exercise.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Exercise '${dto.name}' already exists.`);
    }

    const created = await this.prisma.exercise.create({
      data: {
        name: dto.name.trim(),
        slug,
        targetMuscleGroup: dto.targetMuscleGroup,
        equipmentRequired: dto.equipmentRequired || 'Barbell / Dumbbell',
        difficulty: dto.difficulty || DifficultyLevel.INTERMEDIATE,
        instructions: dto.instructions,
        videoUrl: dto.videoUrl,
        imageUrl: dto.imageUrl,
        isActive: dto.isActive ?? true,
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'EXERCISE_CREATED',
      entityType: 'Exercise',
      entityId: created.id,
      summary: `Created exercise '${created.name}' (${created.targetMuscleGroup})`,
    });

    return created;
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: Record<string, any>,
  ) {
    const existing = await this.prisma.exercise.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Exercise not found.');

    const updated = await this.prisma.exercise.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.targetMuscleGroup
          ? { targetMuscleGroup: dto.targetMuscleGroup }
          : {}),
        ...(dto.equipmentRequired !== undefined
          ? { equipmentRequired: dto.equipmentRequired }
          : {}),
        ...(dto.difficulty ? { difficulty: dto.difficulty } : {}),
        ...(dto.instructions !== undefined
          ? { instructions: dto.instructions }
          : {}),
        ...(dto.videoUrl !== undefined ? { videoUrl: dto.videoUrl } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
        ...(dto.isActive !== undefined ? { isActive: Boolean(dto.isActive) } : {}),
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'EXERCISE_UPDATED',
      entityType: 'Exercise',
      entityId: id,
      summary: `Updated exercise '${updated.name}'`,
    });

    return updated;
  }
}


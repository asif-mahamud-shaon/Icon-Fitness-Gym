import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DifficultyLevel,
  NotificationType,
  Role,
  WorkoutGoal,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class WorkoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async findPublic(goal?: WorkoutGoal) {
    return this.prisma.workoutProgram.findMany({
      where: {
        isPublic: true,
        isActive: true,
        ...(goal ? { goal } : {}),
      },
      include: {
        createdByTrainer: {
          include: { user: { select: { fullName: true, avatarUrl: true } } },
        },
        exercises: {
          include: { exercise: true },
          orderBy: [{ dayNumber: 'asc' }, { orderIndex: 'asc' }],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPublicBySlug(slug: string) {
    const program = await this.prisma.workoutProgram.findUnique({
      where: { slug },
      include: {
        createdByTrainer: {
          include: {
            user: { select: { fullName: true, avatarUrl: true } },
          },
        },
        exercises: {
          include: { exercise: true },
          orderBy: [{ dayNumber: 'asc' }, { orderIndex: 'asc' }],
        },
      },
    });

    if (!program || !program.isActive) {
      throw new NotFoundException('Workout program not found.');
    }

    return program;
  }

  async findMyAssignedWorkouts(userId: string) {
    const member = await this.prisma.memberProfile.findUnique({
      where: { userId },
    });
    if (!member) {
      throw new NotFoundException('Member profile not found.');
    }

    return this.prisma.memberWorkoutAssignment.findMany({
      where: { memberProfileId: member.id },
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
          include: {
            user: { select: { fullName: true, email: true, phone: true, avatarUrl: true } },
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findAllAdminOrTrainer() {
    return this.prisma.workoutProgram.findMany({
      include: {
        createdByTrainer: {
          include: { user: { select: { fullName: true } } },
        },
        exercises: {
          include: { exercise: true },
          orderBy: [{ dayNumber: 'asc' }, { orderIndex: 'asc' }],
        },
        _count: {
          select: { assignments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProgram(
    actor: AuthenticatedUser,
    dto: {
      title: string;
      description: string;
      goal?: WorkoutGoal;
      difficulty?: DifficultyLevel;
      durationWeeks?: number;
      daysPerWeek?: number;
      isPublic?: boolean;
      isActive?: boolean;
      coverImageUrl?: string;
      exercises?: Array<{
        exerciseId: string;
        dayNumber?: number;
        orderIndex?: number;
        sets?: number;
        reps?: string;
        restSeconds?: number;
        tempo?: string;
        notes?: string;
      }>;
    },
  ) {
    const baseSlug = this.slugify(dto.title);
    const count = await this.prisma.workoutProgram.count();
    const slug = `${baseSlug}-${count + 1}`;

    const created = await this.prisma.workoutProgram.create({
      data: {
        title: dto.title.trim(),
        slug,
        description: dto.description,
        goal: dto.goal || WorkoutGoal.FITNESS_IMPROVEMENT,
        difficulty: dto.difficulty || DifficultyLevel.INTERMEDIATE,
        durationWeeks: Number(dto.durationWeeks ?? 8),
        daysPerWeek: Number(dto.daysPerWeek ?? 4),
        isPublic: dto.isPublic ?? true,
        isActive: dto.isActive ?? true,
        coverImageUrl: dto.coverImageUrl,
        createdByTrainerId: actor.trainerProfileId ?? null,
        exercises: dto.exercises?.length
          ? {
              create: dto.exercises.map((item, idx) => ({
                exerciseId: item.exerciseId,
                dayNumber: Number(item.dayNumber ?? 1),
                orderIndex: Number(item.orderIndex ?? idx + 1),
                sets: Number(item.sets ?? 3),
                reps: String(item.reps ?? '10-12'),
                restSeconds: Number(item.restSeconds ?? 60),
                tempo: item.tempo,
                notes: item.notes,
              })),
            }
          : undefined,
      },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: [{ dayNumber: 'asc' }, { orderIndex: 'asc' }],
        },
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'WORKOUT_PROGRAM_CREATED',
      entityType: 'WorkoutProgram',
      entityId: created.id,
      summary: `Created workout program '${created.title}'`,
    });

    return created;
  }

  async updateProgram(
    actor: AuthenticatedUser,
    id: string,
    dto: Record<string, any>,
  ) {
    const program = await this.prisma.workoutProgram.findUnique({
      where: { id },
    });
    if (!program) throw new NotFoundException('Workout program not found.');

    if (
      actor.role === Role.TRAINER &&
      program.createdByTrainerId !== actor.trainerProfileId
    ) {
      throw new ForbiddenException(
        'Trainers can only modify workout programs they authored.',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (Array.isArray(dto.exercises)) {
        await tx.workoutExercise.deleteMany({
          where: { workoutProgramId: id },
        });
        if (dto.exercises.length > 0) {
          await tx.workoutExercise.createMany({
            data: dto.exercises.map((item: any, idx: number) => ({
              workoutProgramId: id,
              exerciseId: item.exerciseId,
              dayNumber: Number(item.dayNumber ?? 1),
              orderIndex: Number(item.orderIndex ?? idx + 1),
              sets: Number(item.sets ?? 3),
              reps: String(item.reps ?? '10-12'),
              restSeconds: Number(item.restSeconds ?? 60),
              tempo: item.tempo || null,
              notes: item.notes || null,
            })),
          });
        }
      }

      return tx.workoutProgram.update({
        where: { id },
        data: {
          ...(dto.title ? { title: dto.title.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.goal ? { goal: dto.goal } : {}),
          ...(dto.difficulty ? { difficulty: dto.difficulty } : {}),
          ...(dto.durationWeeks !== undefined
            ? { durationWeeks: Number(dto.durationWeeks) }
            : {}),
          ...(dto.daysPerWeek !== undefined
            ? { daysPerWeek: Number(dto.daysPerWeek) }
            : {}),
          ...(dto.isPublic !== undefined
            ? { isPublic: Boolean(dto.isPublic) }
            : {}),
          ...(dto.isActive !== undefined
            ? { isActive: Boolean(dto.isActive) }
            : {}),
          ...(dto.coverImageUrl !== undefined
            ? { coverImageUrl: dto.coverImageUrl }
            : {}),
        },
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: [{ dayNumber: 'asc' }, { orderIndex: 'asc' }],
          },
        },
      });
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'WORKOUT_PROGRAM_UPDATED',
      entityType: 'WorkoutProgram',
      entityId: id,
      summary: `Updated workout program '${updated.title}'`,
    });

    return updated;
  }

  async assignProgramToMember(
    actor: AuthenticatedUser,
    dto: {
      memberProfileId: string;
      workoutProgramId: string;
      trainerNotes?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const [member, program] = await Promise.all([
      this.prisma.memberProfile.findUnique({
        where: { id: dto.memberProfileId },
        include: { user: true },
      }),
      this.prisma.workoutProgram.findUnique({
        where: { id: dto.workoutProgramId },
      }),
    ]);

    if (!member) throw new NotFoundException('Member profile not found.');
    if (!program) throw new NotFoundException('Workout program not found.');

    if (
      actor.role === Role.TRAINER &&
      member.assignedTrainerId !== actor.trainerProfileId
    ) {
      throw new ForbiddenException(
        'Trainers can only assign workout programs to their assigned members.',
      );
    }

    const assignment = await this.prisma.memberWorkoutAssignment.create({
      data: {
        memberProfileId: member.id,
        workoutProgramId: program.id,
        assignedByTrainerId: actor.trainerProfileId ?? null,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: true,
        trainerNotes: dto.trainerNotes || null,
      },
      include: {
        workoutProgram: true,
        memberProfile: {
          include: { user: { select: { fullName: true } } },
        },
      },
    });

    await this.notificationsService.createNotification({
      userId: member.userId,
      type: NotificationType.WORKOUT,
      title: 'New Workout Program Assigned',
      message: `You have been assigned the '${program.title}' workout program.`,
      linkUrl: '/member/workouts',
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'WORKOUT_ASSIGNED_TO_MEMBER',
      entityType: 'MemberWorkoutAssignment',
      entityId: assignment.id,
      summary: `Assigned workout '${program.title}' to ${member.user.fullName}`,
    });

    return assignment;
  }

  async updateAssignmentProgress(
    actor: AuthenticatedUser,
    assignmentId: string,
    dto: {
      trainerNotes?: string;
      memberProgressNotes?: string;
      completionPercentage?: number;
      isActive?: boolean;
    },
  ) {
    const assignment = await this.prisma.memberWorkoutAssignment.findUnique({
      where: { id: assignmentId },
      include: { memberProfile: true },
    });
    if (!assignment) {
      throw new NotFoundException('Workout assignment not found.');
    }

    if (
      actor.role === Role.MEMBER &&
      assignment.memberProfile.userId !== actor.id
    ) {
      throw new ForbiddenException(
        'You can only update your own workout progress.',
      );
    }

    if (
      actor.role === Role.TRAINER &&
      assignment.memberProfile.assignedTrainerId !== actor.trainerProfileId
    ) {
      throw new ForbiddenException(
        'Trainers can only update progress for assigned members.',
      );
    }

    return this.prisma.memberWorkoutAssignment.update({
      where: { id: assignmentId },
      data: {
        ...(actor.role !== Role.MEMBER && dto.trainerNotes !== undefined
          ? { trainerNotes: dto.trainerNotes }
          : {}),
        ...(dto.memberProgressNotes !== undefined
          ? { memberProgressNotes: dto.memberProgressNotes }
          : {}),
        ...(dto.completionPercentage !== undefined
          ? {
              completionPercentage: Math.max(
                0,
                Math.min(100, Number(dto.completionPercentage)),
              ),
            }
          : {}),
        ...(actor.role !== Role.MEMBER && dto.isActive !== undefined
          ? { isActive: Boolean(dto.isActive) }
          : {}),
      },
      include: {
        workoutProgram: true,
      },
    });
  }
}


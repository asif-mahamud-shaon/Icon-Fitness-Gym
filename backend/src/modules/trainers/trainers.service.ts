import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Gender, Role, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class TrainersService {
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

  async findPublic() {
    return this.prisma.trainerProfile.findMany({
      where: {
        isActive: true,
        user: { status: UserStatus.ACTIVE, deletedAt: null },
      },
      include: {
        user: {
          select: {
            fullName: true,
            avatarUrl: true,
          },
        },
        classSchedules: {
          where: { isPublished: true, isCancelled: false },
          include: { gymClass: true },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { experienceYears: 'desc' }],
    });
  }

  async findPublicBySlug(slug: string) {
    const trainer = await this.prisma.trainerProfile.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            fullName: true,
            avatarUrl: true,
          },
        },
        classSchedules: {
          where: { isPublished: true, isCancelled: false },
          include: { gymClass: true },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        workoutPrograms: {
          where: { isPublic: true, isActive: true },
        },
      },
    });

    if (!trainer || !trainer.isActive) {
      throw new NotFoundException('Trainer profile not found.');
    }

    return trainer;
  }

  async getMyTrainerDashboard(userId: string) {
    const trainer = await this.prisma.trainerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        assignedMembers: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true,
                avatarUrl: true,
              },
            },
            memberships: {
              where: { status: 'ACTIVE' },
              include: { plan: { select: { name: true } } },
              take: 1,
            },
            workoutAssignments: {
              where: { isActive: true },
              include: { workoutProgram: true },
            },
          },
        },
        classSchedules: {
          where: { isCancelled: false },
          include: {
            gymClass: true,
            bookings: {
              where: { status: 'CONFIRMED' },
              include: {
                memberProfile: {
                  include: {
                    user: { select: { fullName: true, phone: true } },
                  },
                },
              },
            },
          },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        workoutPrograms: {
          include: {
            exercises: {
              include: { exercise: true },
              orderBy: [{ dayNumber: 'asc' }, { orderIndex: 'asc' }],
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!trainer) {
      throw new NotFoundException('Trainer profile not found for this account.');
    }

    return {
      trainer,
      stats: {
        assignedMembersCount: trainer.assignedMembers.length,
        scheduledClassesCount: trainer.classSchedules.length,
        authoredWorkoutsCount: trainer.workoutPrograms.length,
      },
    };
  }

  async findAllAdmin() {
    return this.prisma.trainerProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            status: true,
          },
        },
        _count: {
          select: {
            assignedMembers: true,
            classSchedules: true,
            workoutPrograms: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAdminDetails(actor: AuthenticatedUser, id: string) {
    const trainer = await this.prisma.trainerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            status: true,
            createdAt: true,
          },
        },
        assignedMembers: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true,
                avatarUrl: true,
                status: true,
              },
            },
            memberships: {
              include: { plan: { select: { name: true } } },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        classSchedules: {
          where: { isCancelled: false },
          include: {
            gymClass: true,
            _count: {
              select: { bookings: true },
            },
          },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        workoutPrograms: {
          orderBy: { createdAt: 'desc' },
        },
        trainerAttendances: {
          orderBy: { sessionDate: 'desc' },
          take: 40,
        },
      },
    });

    if (!trainer) {
      throw new NotFoundException('Trainer profile not found.');
    }

    if (actor.role === Role.TRAINER && trainer.userId !== actor.id) {
      throw new ForbiddenException(
        'Trainers may only inspect their own trainer details.',
      );
    }

    return {
      trainer,
      stats: {
        assignedMembersCount: trainer.assignedMembers.length,
        scheduledClassesCount: trainer.classSchedules.length,
        authoredWorkoutsCount: trainer.workoutPrograms.length,
        attendanceSessionsCount: trainer.trainerAttendances.length,
      },
    };
  }

  async createTrainer(
    actor: AuthenticatedUser,
    dto: {
      fullName: string;
      email: string;
      phone: string;
      password?: string;
      avatarUrl?: string;
      headline: string;
      bio: string;
      specializations: string[];
      qualifications: string[];
      experienceYears?: number;
      availabilityJson?: Record<string, any>;
      isFeatured?: boolean;
      isActive?: boolean;
      instagramUrl?: string;
      facebookUrl?: string;
    },
  ) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { phone: dto.phone.trim() }],
      },
    });
    if (existing) {
      throw new ConflictException('Email or phone already in use.');
    }

    const rawPassword =
      dto.password?.trim() || crypto.randomBytes(12).toString('base64url');
    const passwordHash = await bcrypt.hash(rawPassword, 12);
    const baseSlug = this.slugify(dto.fullName);
    const count = await this.prisma.trainerProfile.count();
    const slug = `${baseSlug}-${count + 1}`;

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: dto.fullName.trim(),
          email: normalizedEmail,
          phone: dto.phone.trim(),
          passwordHash,
          avatarUrl: dto.avatarUrl,
          role: Role.TRAINER,
          status: UserStatus.ACTIVE,
          emailVerified: true,
        },
      });

      return tx.trainerProfile.create({
        data: {
          userId: user.id,
          slug,
          gender: (dto as any).gender || Gender.MALE,
          headline: dto.headline,
          bio: dto.bio,
          specializations: dto.specializations || [],
          qualifications: dto.qualifications || [],
          experienceYears: dto.experienceYears ?? 2,
          availabilityJson: dto.availabilityJson ?? {
            days: ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'],
            hours: '07:00 - 21:00',
          },
          isFeatured: dto.isFeatured ?? false,
          isActive: dto.isActive ?? true,
          instagramUrl: dto.instagramUrl,
          facebookUrl: dto.facebookUrl,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              avatarUrl: true,
            },
          },
        },
      });
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'TRAINER_CREATED',
      entityType: 'TrainerProfile',
      entityId: created.id,
      summary: `Created trainer profile for ${created.user.fullName}`,
    });

    return created;
  }

  private sanitizeImageUrl(url?: string | null): string | undefined {
    if (!url || typeof url !== 'string') return undefined;
    const trimmed = url.trim();
    if (!trimmed) return undefined;
    if (
      /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed) &&
      trimmed.length <= 4_000_000
    ) {
      return trimmed;
    }
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
      return trimmed.slice(0, 1024);
    }
    return undefined;
  }

  private sanitizeExternalLink(url?: string | null): string | null | undefined {
    if (url === undefined) return undefined;
    if (url === null) return null;
    const trimmed = String(url).trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed.slice(0, 512);
    }
    return null;
  }

  async updateTrainer(
    actor: AuthenticatedUser,
    id: string,
    dto: Record<string, any>,
  ) {
    const trainer = await this.prisma.trainerProfile.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!trainer) {
      throw new NotFoundException('Trainer not found.');
    }

    if (actor.role === Role.TRAINER && trainer.userId !== actor.id) {
      throw new ForbiddenException('You can only update your own trainer profile.');
    }

    const isAdminActor = ([Role.SUPER_ADMIN, Role.ADMIN] as Role[]).includes(
      actor.role,
    );
    const safeAvatarUrl =
      dto.avatarUrl === ''
        ? null
        : dto.avatarUrl !== undefined
          ? this.sanitizeImageUrl(dto.avatarUrl)
          : undefined;
    const safeInstagram = this.sanitizeExternalLink(dto.instagramUrl);
    const safeFacebook = this.sanitizeExternalLink(dto.facebookUrl);

    if (dto.fullName || dto.phone || safeAvatarUrl !== undefined) {
      await this.prisma.user.update({
        where: { id: trainer.userId },
        data: {
          ...(dto.fullName ? { fullName: String(dto.fullName).trim() } : {}),
          ...(dto.phone ? { phone: String(dto.phone).trim() } : {}),
          ...(safeAvatarUrl !== undefined ? { avatarUrl: safeAvatarUrl } : {}),
        },
      });
    }

    const updated = await this.prisma.trainerProfile.update({
      where: { id },
      data: {
        ...(isAdminActor && dto.gender !== undefined
          ? { gender: dto.gender as Gender }
          : {}),
        ...(dto.headline !== undefined ? { headline: dto.headline } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        ...(dto.specializations !== undefined
          ? { specializations: dto.specializations }
          : {}),
        ...(dto.qualifications !== undefined
          ? { qualifications: dto.qualifications }
          : {}),
        ...(dto.experienceYears !== undefined
          ? { experienceYears: Math.max(0, Math.min(60, Number(dto.experienceYears))) }
          : {}),
        ...(dto.availabilityJson !== undefined
          ? { availabilityJson: dto.availabilityJson }
          : {}),
        ...(isAdminActor && dto.isFeatured !== undefined
          ? { isFeatured: Boolean(dto.isFeatured) }
          : {}),
        ...(isAdminActor && dto.isActive !== undefined
          ? { isActive: Boolean(dto.isActive) }
          : {}),
        ...(safeInstagram !== undefined ? { instagramUrl: safeInstagram } : {}),
        ...(safeFacebook !== undefined ? { facebookUrl: safeFacebook } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'TRAINER_UPDATED',
      entityType: 'TrainerProfile',
      entityId: id,
      summary: `Updated trainer profile for ${updated.user.fullName}`,
    });

    return updated;
  }
}


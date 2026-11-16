import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma, Role, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import {
  DEFAULT_ROLE_PERMISSIONS,
  normalizePermissionOverride,
  PERMISSION_DEFINITIONS,
  PermissionKey,
  resolveEffectivePermissions,
} from '../../common/permissions/permissions.constants';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: Role;
    status?: UserStatus;
  }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = { deletedAt: null };
    if (params.role) where.role = params.role;
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          fullName: true,
          avatarUrl: true,
          role: true,
          status: true,
          permissionsJson: true,
          lastLoginAt: true,
          createdAt: true,
          memberProfile: { select: { id: true, memberCode: true } },
          trainerProfile: { select: { id: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((item) => {
        const { permissionsJson, ...rest } = item;
        return {
          ...rest,
          permissions: resolveEffectivePermissions(item.role, permissionsJson),
          permissionsConfig: normalizePermissionOverride(permissionsJson),
        };
      }),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createAdminOrStaffUser(
    actor: AuthenticatedUser,
    dto: {
      fullName: string;
      email: string;
      phone: string;
      password: string;
      role: Role;
    },
  ) {
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only SUPER_ADMIN can create administrative or staff users.',
      );
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { phone: dto.phone.trim() }],
      },
    });
    if (existing) {
      throw new ConflictException('Email or phone already in use.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const created = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        email: normalizedEmail,
        phone: dto.phone.trim(),
        passwordHash,
        role: dto.role,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'ADMIN_USER_CREATED',
      entityType: 'User',
      entityId: created.id,
      summary: `Created user ${created.fullName} with role ${created.role}`,
    });

    return created;
  }

  async updateUserRole(
    actor: AuthenticatedUser,
    targetUserId: string,
    newRole: Role,
  ) {
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can modify user roles.');
    }
    if (actor.id === targetUserId) {
      throw new BadRequestException('You cannot change your own SUPER_ADMIN role.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) throw new NotFoundException('User not found.');

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'USER_ROLE_UPDATED',
      entityType: 'User',
      entityId: targetUserId,
      summary: `Updated role for ${user.fullName} from ${user.role} to ${newRole}`,
    });

    return updated;
  }

  async updateUserStatus(
    actor: AuthenticatedUser,
    targetUserId: string,
    status: UserStatus,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) throw new NotFoundException('User not found.');

    if (user.role === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot modify a SUPER_ADMIN account.');
    }
    if (actor.id === targetUserId && status !== UserStatus.ACTIVE) {
      throw new BadRequestException('You cannot deactivate your own account.');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (status === UserStatus.SUSPENDED || status === UserStatus.DEACTIVATED) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: targetUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'USER_STATUS_UPDATED',
      entityType: 'User',
      entityId: targetUserId,
      summary: `Updated status for ${user.fullName} to ${status}`,
    });

    return updated;
  }

  getPermissionsCatalog() {
    return {
      definitions: PERMISSION_DEFINITIONS,
      defaults: DEFAULT_ROLE_PERMISSIONS,
    };
  }

  async updateUserPermissions(
    actor: AuthenticatedUser,
    targetUserId: string,
    dto: {
      granted?: PermissionKey[];
      revoked?: PermissionKey[];
      reset?: boolean;
    },
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target || target.deletedAt) {
      throw new NotFoundException('User not found.');
    }
    if (target.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('SUPER_ADMIN has unrestricted access and cannot be overridden.');
    }
    if (target.role === Role.MEMBER) {
      throw new BadRequestException(
        'Module permissions only apply to employees (Admin, Staff, Trainer).',
      );
    }
    if (actor.id === targetUserId) {
      throw new ForbiddenException('You cannot modify your own permission overrides.');
    }
    if (target.role === Role.ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can modify an ADMIN account permissions.');
    }

    const normalized = dto.reset
      ? { granted: [], revoked: [] }
      : normalizePermissionOverride({
          granted: dto.granted ?? [],
          revoked: dto.revoked ?? [],
        });

    const isEmpty = normalized.granted.length === 0 && normalized.revoked.length === 0;

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        permissionsJson: isEmpty ? Prisma.DbNull : (normalized as unknown as Prisma.InputJsonValue),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        permissionsJson: true,
      },
    });

    const effective = resolveEffectivePermissions(updated.role, updated.permissionsJson);

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'USER_PERMISSIONS_UPDATED',
      entityType: 'User',
      entityId: targetUserId,
      summary: dto.reset
        ? `Reset module permissions to ${target.role} defaults for ${target.fullName}`
        : `Updated module permissions for ${target.fullName} (+${normalized.granted.length} granted, -${normalized.revoked.length} restricted)`,
    });

    return {
      id: updated.id,
      fullName: updated.fullName,
      email: updated.email,
      role: updated.role,
      status: updated.status,
      permissions: effective,
      permissionsConfig: normalizePermissionOverride(updated.permissionsJson),
    };
  }
}


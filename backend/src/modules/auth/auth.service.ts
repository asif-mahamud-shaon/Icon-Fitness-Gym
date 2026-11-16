import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import {
  MembershipStatus,
  NotificationType,
  Role,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  normalizePermissionOverride,
  resolveEffectivePermissions,
} from '../../common/permissions/permissions.constants';
import { resolveRequiredSecret } from '../../common/security/secrets.util';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly failedLoginAttempts = new Map<
    string,
    { count: number; firstAttemptAt: number; lockedUntil: number }
  >();
  private readonly MAX_LOGIN_FAILURES = 5;
  private readonly LOGIN_WINDOW_MS = 15 * 60 * 1000;
  private readonly LOGIN_LOCKOUT_MS = 5 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private assertLoginNotLocked(normalizedEmail: string) {
    const record = this.failedLoginAttempts.get(normalizedEmail);
    if (!record) return;
    const now = Date.now();
    if (record.lockedUntil > now) {
      const waitSec = Math.ceil((record.lockedUntil - now) / 1000);
      throw new HttpException(
        `Too many failed login attempts for this account. Please retry in ${waitSec} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (now - record.firstAttemptAt > this.LOGIN_WINDOW_MS) {
      this.failedLoginAttempts.delete(normalizedEmail);
    }
  }

  private recordFailedLogin(normalizedEmail: string): boolean {
    const now = Date.now();
    const existing = this.failedLoginAttempts.get(normalizedEmail);
    if (!existing || now - existing.firstAttemptAt > this.LOGIN_WINDOW_MS) {
      this.failedLoginAttempts.set(normalizedEmail, {
        count: 1,
        firstAttemptAt: now,
        lockedUntil: 0,
      });
      return false;
    }
    const nextCount = existing.count + 1;
    const lockedUntil =
      nextCount >= this.MAX_LOGIN_FAILURES ? now + this.LOGIN_LOCKOUT_MS : 0;
    this.failedLoginAttempts.set(normalizedEmail, {
      count: nextCount,
      firstAttemptAt: existing.firstAttemptAt,
      lockedUntil,
    });
    return lockedUntil > 0;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private getSaltRounds(): number {
    const val = Number(this.configService.get('BCRYPT_SALT_ROUNDS', 12));
    return Number.isNaN(val) ? 12 : Math.max(12, Math.min(14, val));
  }

  private async generateMemberCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.memberProfile.count();
    const seq = String(count + 1).padStart(4, '0');
    const rand = crypto.randomInt(100, 1000);
    return `IFG-${year}-${seq}-${rand}`;
  }

  private async issueTokens(
    user: { id: string; email: string; role: Role },
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const accessSecret = resolveRequiredSecret(
      'JWT_ACCESS_SECRET',
      this.configService.get<string>('JWT_ACCESS_SECRET'),
    );
    const refreshSecret = resolveRequiredSecret(
      'JWT_REFRESH_SECRET',
      this.configService.get<string>('JWT_REFRESH_SECRET'),
    );

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: crypto.randomUUID(),
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        ipAddress: meta?.ipAddress ?? null,
        userAgent: meta?.userAgent ?? null,
        expiresAt,
      },
    });

    return { accessToken, refreshToken, tokenHash };
  }

  async register(
    dto: RegisterDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedPhone = dto.phone.trim();

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { phone: normalizedPhone }],
      },
    });

    if (existing) {
      throw new ConflictException(
        'An account with this email or phone number already exists.',
      );
    }

    const settings = await this.prisma.gymSettings.findFirst();
    if (settings && !settings.allowSelfRegistration) {
      throw new ForbiddenException(
        'Public online self-registration is currently disabled. Please visit our front desk in Ashkona.',
      );
    }

    const requireApproval = settings?.requireManualApproval ?? false;
    const initialStatus = requireApproval
      ? UserStatus.PENDING_APPROVAL
      : UserStatus.ACTIVE;

    const passwordHash = await bcrypt.hash(dto.password, this.getSaltRounds());
    const memberCode = await this.generateMemberCode();

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          phone: normalizedPhone,
          passwordHash,
          fullName: dto.fullName.trim(),
          role: Role.MEMBER,
          status: initialStatus,
          lastLoginAt: new Date(),
        },
      });

      const memberProfile = await tx.memberProfile.create({
        data: {
          userId: user.id,
          memberCode,
          gender: dto.gender,
          fitnessGoal: dto.fitnessGoal,
          address: dto.address,
          emergencyContactName: dto.emergencyContactName,
          emergencyContactPhone: dto.emergencyContactPhone,
        },
      });

      if (dto.selectedPlanId) {
        const plan = await tx.membershipPlan.findUnique({
          where: { id: dto.selectedPlanId },
        });
        if (plan && plan.isActive) {
          const startDate = new Date();
          const endDate = new Date(
            startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000,
          );
          await tx.membership.create({
            data: {
              memberProfileId: memberProfile.id,
              planId: plan.id,
              startDate,
              endDate,
              status: MembershipStatus.PENDING,
              renewalNotes:
                'Selected during member self-registration. Pending payment verification.',
            },
          });
        }
      }

      return { user, memberProfile };
    });

    await this.notificationsService.createNotification({
      userId: result.user.id,
      type: NotificationType.SYSTEM,
      title: 'Welcome to Icon Fitness Gym!',
      message: `Your member profile (${result.memberProfile.memberCode}) has been created. Visit our Ashkona front desk or your Membership portal to activate your plan.`,
      linkUrl: '/member/membership',
    });

    await this.auditLogsService.log({
      actorUserId: result.user.id,
      actorRole: Role.MEMBER,
      action: 'MEMBER_REGISTERED',
      entityType: 'User',
      entityId: result.user.id,
      summary: `New member registered: ${result.user.fullName} (${result.memberProfile.memberCode})`,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    const tokens = await this.issueTokens(result.user, meta);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        phone: result.user.phone,
        fullName: result.user.fullName,
        role: result.user.role,
        status: result.user.status,
        memberProfileId: result.memberProfile.id,
        memberCode: result.memberProfile.memberCode,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(
    dto: LoginDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    this.assertLoginNotLocked(normalizedEmail);

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        memberProfile: { select: { id: true, memberCode: true } },
        trainerProfile: { select: { id: true, slug: true } },
      },
    });

    if (!user || user.deletedAt) {
      this.recordFailedLogin(normalizedEmail);
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      const triggeredLock = this.recordFailedLogin(normalizedEmail);
      if (triggeredLock) {
        await this.auditLogsService.log({
          actorUserId: user.id,
          actorRole: user.role,
          action: 'USER_LOGIN_BRUTEFORCE_LOCKED',
          entityType: 'User',
          entityId: user.id,
          summary: `Temporarily locked login for ${user.email} after repeated failed attempts`,
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
        });
      }
      throw new UnauthorizedException('Invalid email or password.');
    }

    this.failedLoginAttempts.delete(normalizedEmail);

    if (
      user.status === UserStatus.SUSPENDED ||
      user.status === UserStatus.DEACTIVATED
    ) {
      throw new ForbiddenException(
        `Your account is currently ${user.status.toLowerCase()}. Please contact Icon Fitness Gym administration.`,
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(user, meta);

    await this.auditLogsService.log({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      summary: `${user.fullName} (${user.role}) logged in`,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
        memberProfileId: user.memberProfile?.id ?? null,
        memberCode: user.memberProfile?.memberCode ?? null,
        trainerProfileId: user.trainerProfile?.id ?? null,
        trainerSlug: user.trainerProfile?.slug ?? null,
        permissions: resolveEffectivePermissions(user.role, user.permissionsJson),
        permissionsConfig: normalizePermissionOverride(user.permissionsJson),
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refreshTokens(
    refreshToken: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const refreshSecret = resolveRequiredSecret(
      'JWT_REFRESH_SECRET',
      this.configService.get<string>('JWT_REFRESH_SECRET'),
    );

    try {
      await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not recognized.');
    }

    // Reuse detection: if token was already revoked, revoke all tokens for this user
    if (storedToken.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException(
        'Refresh token reuse detected. All sessions have been revoked for security.',
      );
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired.');
    }

    if (
      storedToken.user.deletedAt ||
      storedToken.user.status === UserStatus.SUSPENDED ||
      storedToken.user.status === UserStatus.DEACTIVATED
    ) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException(
        'Account is suspended or deactivated. Sessions revoked.',
      );
    }

    const newTokens = await this.issueTokens(storedToken.user, meta);

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        revokedAt: new Date(),
        replacedByTokenHash: newTokens.tokenHash,
      },
    });

    return {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    };
  }

  async logout(refreshToken?: string, userId?: string) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else if (userId) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return { message: 'Logged out successfully.' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return non-enumerating response message, plus reset token instructions when configured
    if (!user || user.deletedAt) {
      return {
        message:
          'If an account exists for that email, password reset instructions have been generated.',
      };
    }

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordTokenHash = this.hashToken(rawResetToken);
    const resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordTokenHash,
        resetPasswordExpiresAt,
      },
    });

    await this.auditLogsService.log({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'User',
      entityId: user.id,
      summary: `Password reset requested for ${user.email}`,
    });

    const allowDevTokenExpose =
      this.configService.get('NODE_ENV') === 'development' &&
      this.configService.get('ALLOW_DEV_RESET_TOKEN') === 'true';

    return {
      message:
        'If an account exists for that email, a password reset request has been registered. Please contact gym administration if external email delivery is unavailable.',
      ...(allowDevTokenExpose ? { developmentResetToken: rawResetToken } : {}),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token.trim());
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    const passwordHash = await bcrypt.hash(
      dto.newPassword,
      this.getSaltRounds(),
    );

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetPasswordTokenHash: null,
          resetPasswordExpiresAt: null,
        },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.auditLogsService.log({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'User',
      entityId: user.id,
      summary: `Password reset completed for ${user.email}`,
    });

    return { message: 'Password has been reset successfully. You may now log in.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestException('Current password is incorrect.');
    }

    const passwordHash = await bcrypt.hash(
      dto.newPassword,
      this.getSaltRounds(),
    );

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.auditLogsService.log({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user.id,
      summary: `${user.fullName} changed their account password`,
    });

    return { message: 'Password updated successfully.' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberProfile: {
          include: {
            assignedTrainer: {
              include: {
                user: {
                  select: { fullName: true, email: true, phone: true, avatarUrl: true },
                },
              },
            },
          },
        },
        trainerProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const {
      passwordHash,
      resetPasswordTokenHash,
      resetPasswordExpiresAt,
      deletedAt,
      permissionsJson,
      ...safeUser
    } = user;
    return {
      ...safeUser,
      permissions: resolveEffectivePermissions(user.role, permissionsJson),
      permissionsConfig: normalizePermissionOverride(permissionsJson),
    };
  }
}


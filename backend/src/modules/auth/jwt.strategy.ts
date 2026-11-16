import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { UserStatus } from '@prisma/client';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { resolveRequiredSecret } from '../../common/security/secrets.util';
import {
  normalizePermissionOverride,
  resolveEffectivePermissions,
} from '../../common/permissions/permissions.constants';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: resolveRequiredSecret(
        'JWT_ACCESS_SECRET',
        configService.get<string>('JWT_ACCESS_SECRET'),
      ),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        memberProfile: { select: { id: true } },
        trainerProfile: { select: { id: true } },
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User account no longer exists.');
    }

    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DEACTIVATED) {
      throw new UnauthorizedException(`Account is currently ${user.status.toLowerCase()}.`);
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      memberProfileId: user.memberProfile?.id ?? null,
      trainerProfileId: user.trainerProfile?.id ?? null,
      permissions: resolveEffectivePermissions(user.role, user.permissionsJson),
      permissionsConfig: normalizePermissionOverride(user.permissionsJson),
    };
  }
}


import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  DeviceStatus,
  DiscountType,
  Gender,
  PaymentMethod,
  PaymentStatus,
  Role,
  UserStatus,
} from '@prisma/client';
import { RolesGuard } from './common/guards/roles.guard';
import { ROLES_KEY } from './common/decorators/roles.decorator';
import { IS_PUBLIC_KEY } from './common/decorators/public.decorator';
import { PERMISSION_KEY } from './common/decorators/require-permission.decorator';
import { STRICT_ROLES_KEY } from './common/decorators/strict-roles.decorator';
import { resolveEffectivePermissions } from './common/permissions/permissions.constants';
import { SanitizeInputPipe } from './common/pipes/sanitize-input.pipe';
import { AuthenticatedUser } from './common/decorators/current-user.decorator';
import { StoreService } from './modules/store/store.service';
import { AuthService } from './modules/auth/auth.service';
import { MembersService } from './modules/members/members.service';
import { WorkoutsService } from './modules/workouts/workouts.service';
import { TrainersService } from './modules/trainers/trainers.service';
import { PaymentsService } from './modules/payments/payments.service';
import { UsersService } from './modules/users/users.service';
import { AccessControlService } from './modules/access-control/access-control.service';
import { HardwareAdapterService } from './modules/access-control/hardware-adapter.service';
import { GalleryService } from './modules/gallery/gallery.service';
import { HealthController } from './modules/health/health.controller';

describe('Icon Fitness Gym — Security Hardening & Regression Suite', () => {
  const superAdminActor: AuthenticatedUser = {
    id: 'user-sa',
    email: 'sa@iconfitnessgym.com',
    fullName: 'Super Admin',
    role: Role.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    permissions: resolveEffectivePermissions(Role.SUPER_ADMIN),
  };

  const adminActor: AuthenticatedUser = {
    id: 'user-adm',
    email: 'admin@iconfitnessgym.com',
    fullName: 'Admin User',
    role: Role.ADMIN,
    status: UserStatus.ACTIVE,
    permissions: resolveEffectivePermissions(Role.ADMIN),
  };

  const staffActor: AuthenticatedUser = {
    id: 'user-staff',
    email: 'staff@iconfitnessgym.com',
    fullName: 'Desk Staff',
    role: Role.STAFF,
    status: UserStatus.ACTIVE,
    permissions: resolveEffectivePermissions(Role.STAFF),
  };

  const trainerActor: AuthenticatedUser = {
    id: 'user-trainer-1',
    email: 'trainer1@iconfitnessgym.com',
    fullName: 'Trainer One',
    role: Role.TRAINER,
    status: UserStatus.ACTIVE,
    trainerProfileId: 'trainer-prof-1',
    permissions: resolveEffectivePermissions(Role.TRAINER),
  };

  const memberActor: AuthenticatedUser = {
    id: 'user-member-1',
    email: 'member1@iconfitnessgym.com',
    fullName: 'Member One',
    role: Role.MEMBER,
    status: UserStatus.ACTIVE,
    memberProfileId: 'member-prof-1',
    permissions: [],
  };

  const mockAuditLogs = {
    log: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  };

  const mockNotifications = {
    createNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. StrictRoles + RBAC / BFLA Prevention
  // --------------------------------------------------------------------------
  describe('StrictRoles & BFLA Prevention', () => {
    const buildContext = (user?: AuthenticatedUser) =>
      ({
        getHandler: () => 'handler',
        getClass: () => 'class',
        switchToHttp: () => ({
          getRequest: () => ({ user }),
        }),
      }) as unknown as ExecutionContext;

    it('blocks STAFF from @StrictRoles() ADMIN-only actions even when holding module permission', () => {
      const reflector = {
        getAllAndOverride: (key: string) => {
          if (key === IS_PUBLIC_KEY) return false;
          if (key === ROLES_KEY) return [Role.SUPER_ADMIN, Role.ADMIN];
          if (key === STRICT_ROLES_KEY) return true;
          if (key === PERMISSION_KEY) return ['store', 'payments'];
          return undefined;
        },
      } as unknown as Reflector;

      const guard = new RolesGuard(reflector);

      expect(() => guard.canActivate(buildContext(staffActor))).toThrow(
        ForbiddenException,
      );
      expect(() => guard.canActivate(buildContext(memberActor))).toThrow(
        ForbiddenException,
      );
      expect(guard.canActivate(buildContext(adminActor))).toBe(true);
      expect(guard.canActivate(buildContext(superAdminActor))).toBe(true);

      // ADMIN with revoked 'store'/'payments' is still blocked
      expect(() =>
        guard.canActivate(
          buildContext({
            ...adminActor,
            permissions: resolveEffectivePermissions(Role.ADMIN, {
              revoked: ['store', 'payments'],
            }),
          }),
        ),
      ).toThrow(ForbiddenException);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Store PII Protection & Guest Student Impersonation Prevention
  // --------------------------------------------------------------------------
  describe('Store PII Redaction & Advance-Waiver Spoofing Defense', () => {
    const mockMemberRecord = {
      id: 'member-prof-1',
      memberCode: 'IFG-2026-0001-123',
      address: 'House 12, Road 4, Ashkona, Dhaka',
      user: {
        id: 'user-member-1',
        fullName: 'Verified Student',
        phone: '+8801711112222',
        email: 'student@iconfitnessgym.com',
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
      memberships: [
        {
          id: 'mem-1',
          endDate: new Date(Date.now() + 86400000),
          plan: { name: 'Annual Elite' },
        },
      ],
    };

    it('redacts phone, email, address, and IDs from public member verification', async () => {
      const mockPrisma: any = {
        memberProfile: { findFirst: jest.fn().mockResolvedValue(mockMemberRecord) },
      };
      const service = new StoreService(mockPrisma, mockAuditLogs as any);

      const res: any = await service.verifyRunningMemberCode('IFG-2026-0001-123');
      expect(res.verified).toBe(true);
      expect(res.maskedPhone).toBe('+8801****222');
      expect(res.phone).toBeUndefined();
      expect(res.email).toBeUndefined();
      expect(res.address).toBeUndefined();
      expect(res.userId).toBeUndefined();
      expect(res.memberProfileId).toBeUndefined();
    });

    it('blocks a MEMBER from using /verify-auth on another member ID (IDOR)', async () => {
      const mockPrisma: any = {
        memberProfile: { findFirst: jest.fn().mockResolvedValue(mockMemberRecord) },
      };
      const service = new StoreService(mockPrisma, mockAuditLogs as any);

      await expect(
        service.verifyRunningMemberCodeAuthenticated(
          { ...memberActor, id: 'other-user-id' },
          'IFG-2026-0001-123',
        ),
      ).rejects.toThrow(ForbiddenException);

      const ownRes: any = await service.verifyRunningMemberCodeAuthenticated(
        memberActor,
        'IFG-2026-0001-123',
      );
      expect(ownRes.verified).toBe(true);
      expect(ownRes.phone).toBe('+8801711112222');
    });

    it('rejects unauthenticated guest order claiming another student ID with mismatched phone', async () => {
      const txMock: any = {
        memberProfile: { findFirst: jest.fn().mockResolvedValue(mockMemberRecord) },
      };
      const mockPrisma: any = {
        $transaction: jest.fn(async (cb) => cb(txMock)),
      };
      const service = new StoreService(mockPrisma, mockAuditLogs as any);

      await expect(
        service.createOrder({
          customerName: 'Attacker',
          customerPhone: '+8801999999999',
          memberCode: 'IFG-2026-0001-123',
          paymentMethod: PaymentMethod.CASH,
          items: [{ productId: 'prod-1', quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('blocks STAFF from creating store discount codes at service boundary', async () => {
      const service = new StoreService({} as any, mockAuditLogs as any);
      await expect(
        service.createDiscountCode(staffActor, {
          discountType: DiscountType.PERCENTAGE,
          discountValue: 90,
          validDays: 7,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Authentication Lockout & Session Revocation Boundaries
  // --------------------------------------------------------------------------
  describe('Auth Lockout, Suspended Token Rejection & Password Change Revocation', () => {
    const makeAuthService = (mockPrisma: any) => {
      const mockJwt: any = {
        signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
        verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-1' }),
      };
      const mockConfig: any = {
        get: jest.fn((key: string, def?: any) => {
          if (key === 'JWT_ACCESS_SECRET') return 'test_access_secret_32_characters_minimum_len';
          if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret_32_characters_minimum_len';
          return def;
        }),
      };
      return new AuthService(
        mockPrisma,
        mockJwt,
        mockConfig,
        mockAuditLogs as any,
        mockNotifications as any,
      );
    };

    it('enforces progressive account lockout after 5 repeated failed login attempts', async () => {
      const mockPrisma: any = {
        user: { findUnique: jest.fn().mockResolvedValue(null) },
      };
      const service = makeAuthService(mockPrisma);

      for (let i = 0; i < 5; i += 1) {
        await expect(
          service.login({
            email: 'victim@iconfitnessgym.com',
            password: 'WrongPassword1',
          }),
        ).rejects.toThrow(UnauthorizedException);
      }

      // 6th attempt is blocked with 429 rate-lock even before password verify
      await expect(
        service.login({
          email: 'victim@iconfitnessgym.com',
          password: 'WrongPassword1',
        }),
      ).rejects.toThrow(HttpException);
    });

    it('rejects refresh tokens and revokes sessions if user is suspended or deleted', async () => {
      const mockUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
      const mockPrisma: any = {
        refreshToken: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'rt-1',
            userId: 'user-1',
            revokedAt: null,
            expiresAt: new Date(Date.now() + 3600_000),
            user: {
              id: 'user-1',
              status: UserStatus.SUSPENDED,
              deletedAt: null,
            },
          }),
          updateMany: mockUpdateMany,
        },
      };
      const service = makeAuthService(mockPrisma);

      await expect(service.refreshTokens('valid-raw-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUpdateMany).toHaveBeenCalled();
    });

    it('revokes active refresh tokens when user status is changed to SUSPENDED', async () => {
      const mockRefreshRevoke = jest.fn().mockResolvedValue({ count: 2 });
      const mockPrisma: any = {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'target-1',
            fullName: 'Bad Actor',
            role: Role.MEMBER,
          }),
          update: jest.fn().mockResolvedValue({
            id: 'target-1',
            fullName: 'Bad Actor',
            email: 'bad@example.com',
            role: Role.MEMBER,
            status: UserStatus.SUSPENDED,
          }),
        },
        refreshToken: { updateMany: mockRefreshRevoke },
      };
      const service = new UsersService(mockPrisma, mockAuditLogs as any);

      await service.updateUserStatus(
        adminActor,
        'target-1',
        UserStatus.SUSPENDED,
      );
      expect(mockRefreshRevoke).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // 4. Least-Privilege PII, Ownership, Financial & Device Auth Checks
  // --------------------------------------------------------------------------
  describe('PII Redaction, Ownership, Refund Bounds & Device Auth', () => {
    it('redacts sensitive KYC and biometric/access fields when TRAINER reads assigned member', async () => {
      const mockPrisma: any = {
        memberProfile: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'member-prof-1',
            userId: 'user-member-1',
            assignedTrainerId: 'trainer-prof-1',
            user: { id: 'user-member-1', fullName: 'Member One' },
            biometricEnrollment: { id: 'bio-1', status: 'ENROLLED' },
            accessEvents: [{ id: 'ev-1' }],
            memberships: [],
            bookings: [],
            workoutAssignments: [],
          }),
        },
      };
      const service = new MembersService(
        mockPrisma,
        mockAuditLogs as any,
        mockNotifications as any,
      );

      const res: any = await service.findById(trainerActor, 'member-prof-1');
      expect(res.biometricEnrollment).toBeNull();
      expect(res.accessEvents).toEqual([]);
    });

    it('blocks TRAINER from modifying admin-authored workout programs (createdByTrainerId: null)', async () => {
      const mockPrisma: any = {
        workoutProgram: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'wp-admin-1',
            title: 'Official Gym Program',
            createdByTrainerId: null,
          }),
        },
      };
      const service = new WorkoutsService(
        mockPrisma,
        mockAuditLogs as any,
        mockNotifications as any,
      );

      await expect(
        service.updateProgram(trainerActor, 'wp-admin-1', { title: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('prevents TRAINER from elevating their own profile to isFeatured/isActive', async () => {
      const mockUpdateProfile = jest.fn().mockResolvedValue({
        id: 'trainer-prof-1',
        user: { fullName: 'Trainer One' },
      });
      const mockPrisma: any = {
        trainerProfile: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'trainer-prof-1',
            userId: 'user-trainer-1',
            gender: Gender.MALE,
            user: { id: 'user-trainer-1' },
          }),
          update: mockUpdateProfile,
        },
      };
      const service = new TrainersService(mockPrisma, mockAuditLogs as any);

      await service.updateTrainer(trainerActor, 'trainer-prof-1', {
        headline: 'Certified Coach',
        isFeatured: true,
        isActive: false,
      });

      const updateArg = mockUpdateProfile.mock.calls[0][0].data;
      expect(updateArg.isFeatured).toBeUndefined();
      expect(updateArg.isActive).toBeUndefined();
    });

    it('blocks invalid payment refunds (PENDING payments or amount exceeding netAmountBdt)', async () => {
      const mockPrisma: any = {
        payment: {
          findUnique: jest
            .fn()
            .mockResolvedValueOnce({
              id: 'pay-pending',
              status: PaymentStatus.PENDING,
              netAmountBdt: 1500,
              memberProfile: { user: { fullName: 'M1' } },
            })
            .mockResolvedValueOnce({
              id: 'pay-paid',
              status: PaymentStatus.VERIFIED_PAID,
              netAmountBdt: 1500,
              memberProfile: { user: { fullName: 'M1' } },
            }),
        },
      };
      const service = new PaymentsService(
        mockPrisma,
        mockAuditLogs as any,
        mockNotifications as any,
      );

      await expect(
        service.refundPayment(adminActor, 'pay-pending', {
          refundReason: 'Test refund',
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.refundPayment(adminActor, 'pay-paid', {
          refundedAmountBdt: 9999,
          refundReason: 'Over-refund attempt',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('requires valid device API key on heartbeat even for simulated devices', async () => {
      const adapter = new HardwareAdapterService();
      const apiKeyHash = adapter.hashDeviceApiKey('secret-device-key-2026');
      const mockPrisma: any = {
        accessDevice: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'dev-1',
            deviceCode: 'DEV-SIM-01',
            isSimulated: true,
            status: DeviceStatus.ONLINE,
            apiKeyHash,
          }),
          update: jest.fn().mockResolvedValue({
            deviceCode: 'DEV-SIM-01',
            status: DeviceStatus.ONLINE,
            lastHeartbeatAt: new Date(),
          }),
        },
      };

      const service = new AccessControlService(
        mockPrisma,
        mockAuditLogs as any,
        mockNotifications as any,
        adapter,
        {} as any,
      );

      await expect(
        service.recordDeviceHeartbeat('DEV-SIM-01', undefined),
      ).rejects.toThrow(UnauthorizedException);

      const ok = await service.recordDeviceHeartbeat(
        'DEV-SIM-01',
        'secret-device-key-2026',
      );
      expect(ok.deviceCode).toBe('DEV-SIM-01');
    });

    it('blocks unsafe XSS payloads and prototype pollution in SanitizeInputPipe and GalleryService', async () => {
      const pipe = new SanitizeInputPipe();

      expect(() =>
        pipe.transform('javascript:alert(1)', { type: 'body' } as any),
      ).toThrow(BadRequestException);

      expect(() =>
        pipe.transform('data:image/svg+xml;base64,PHN2Zz4=', {
          type: 'body',
        } as any),
      ).toThrow(BadRequestException);

      const cleanObj = pipe.transform(
        { name: 'Safe <script>alert(1)</script>Name', __proto__: { admin: true } },
        { type: 'body' } as any,
      ) as Record<string, any>;
      expect(cleanObj.name).not.toContain('<script>');
      expect(Object.prototype.hasOwnProperty.call(cleanObj, '__proto__')).toBe(
        false,
      );

      const gallery = new GalleryService(
        {} as any,
        { get: jest.fn() } as any,
        mockAuditLogs as any,
      );
      await expect(
        gallery.create(adminActor, {
          title: 'Malicious',
          mediaUrl: 'ftp://evil.example/payload.exe',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('reports ok from /health when DB responds and 503 ServiceUnavailableException when DB is down', async () => {
      const okHealth = new HealthController({
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      } as any);
      const okRes = await okHealth.check();
      expect(okRes.status).toBe('ok');
      expect(okRes.database).toBe('connected');

      const downHealth = new HealthController({
        $queryRaw: jest.fn().mockRejectedValue(new Error('Connection refused')),
      } as any);
      await expect(downHealth.check()).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('normalizes pasted "ID: IFG-..." prefixes and honors Asia/Dhaka end-of-day membership validity', async () => {
      const mockFindFirst = jest.fn().mockResolvedValue({
        id: 'mp-new-1',
        memberCode: 'IFG-2026-0006-253',
        address: 'Ashkona, Dhaka',
        user: {
          id: 'user-member-1',
          fullName: 'New Verified Student',
          phone: '+8801712345678',
          email: 'newstudent@example.com',
          status: UserStatus.ACTIVE,
          deletedAt: null,
        },
        memberships: [
          {
            id: 'mem-1',
            status: 'ACTIVE',
            endDate: new Date(),
            plan: { name: 'Monthly Pro' },
          },
        ],
      });
      const storeService = new StoreService(
        { memberProfile: { findFirst: mockFindFirst } } as any,
        mockAuditLogs as any,
      );

      const res = await storeService.verifyRunningMemberCodeAuthenticated(
        memberActor,
        '  ID: IFG-2026-0006-253  ',
      );

      expect(res.verified).toBe(true);
      expect(res.memberCode).toBe('IFG-2026-0006-253');
      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { memberCode: { equals: 'IFG-2026-0006-253', mode: 'insensitive' } },
        }),
      );
    });
  });
});

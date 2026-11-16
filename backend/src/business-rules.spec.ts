import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  BookingStatus,
  MembershipStatus,
  PaymentMethod,
  PaymentStatus,
  Role,
  UserStatus,
} from '@prisma/client';
import { MembershipsService } from './modules/memberships/memberships.service';
import { PaymentsService } from './modules/payments/payments.service';
import { BookingsService } from './modules/bookings/bookings.service';
import { UsersService } from './modules/users/users.service';
import { AuthenticatedUser } from './common/decorators/current-user.decorator';

describe('Icon Fitness Gym — Core Business Rules & RBAC Verification', () => {
  const superAdminActor: AuthenticatedUser = {
    id: 'user-super-admin',
    email: 'superadmin@iconfitnessgym.com',
    fullName: 'Super Admin',
    role: Role.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
  };

  const staffActor: AuthenticatedUser = {
    id: 'user-staff',
    email: 'staff@iconfitnessgym.com',
    fullName: 'Front Desk Staff',
    role: Role.STAFF,
    status: UserStatus.ACTIVE,
  };

  const trainerActor: AuthenticatedUser = {
    id: 'user-trainer',
    email: 'trainer@iconfitnessgym.com',
    fullName: 'Coach',
    role: Role.TRAINER,
    status: UserStatus.ACTIVE,
    trainerProfileId: 'trainer-profile-1',
  };

  const memberActor: AuthenticatedUser = {
    id: 'user-member-1',
    email: 'member1@iconfitnessgym.com',
    fullName: 'Member One',
    role: Role.MEMBER,
    status: UserStatus.ACTIVE,
    memberProfileId: 'member-profile-1',
  };

  const otherMemberActor: AuthenticatedUser = {
    id: 'user-member-2',
    email: 'member2@iconfitnessgym.com',
    fullName: 'Member Two',
    role: Role.MEMBER,
    status: UserStatus.ACTIVE,
    memberProfileId: 'member-profile-2',
  };

  const mockAuditLogs = {
    log: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  };

  const mockNotifications = {
    createNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  };

  // ==========================================================================
  // 1. MEMBERSHIP BUSINESS RULES
  // ==========================================================================
  describe('MembershipsService Business Rules', () => {
    it('prevents non-staff (MEMBER / TRAINER) from activating or modifying membership status', async () => {
      const mockPrisma: any = {};
      const service = new MembershipsService(
        mockPrisma,
        mockAuditLogs as any,
        mockNotifications as any,
      );

      await expect(
        service.updateStatusByStaff(memberActor, 'membership-1', {
          status: MembershipStatus.ACTIVE,
        }),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.updateStatusByStaff(trainerActor, 'membership-1', {
          status: MembershipStatus.ACTIVE,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects activating an already expired membership', async () => {
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const mockPrisma: any = {
        membership: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'membership-expired',
            status: MembershipStatus.EXPIRED,
            endDate: pastDate,
            plan: { name: 'Monthly Plan' },
            memberProfile: {
              userId: 'user-member-1',
              user: { fullName: 'Member One' },
            },
          }),
        },
      };

      const service = new MembershipsService(
        mockPrisma,
        mockAuditLogs as any,
        mockNotifications as any,
      );

      await expect(
        service.updateStatusByStaff(staffActor, 'membership-expired', {
          status: MembershipStatus.ACTIVE,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('preserves membership history by linking previousMembershipId upon renewal', async () => {
      const mockCreate = jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({ id: 'membership-new', ...data }),
      );
      const mockPrisma: any = {
        membership: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'membership-old-1',
            memberProfileId: 'member-profile-1',
            planId: 'plan-1',
            endDate: new Date(),
            plan: { id: 'plan-1', name: 'Monthly', durationDays: 30 },
            memberProfile: {
              userId: 'user-member-1',
              user: { fullName: 'Member One' },
            },
          }),
          create: mockCreate,
        },
        membershipPlan: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'plan-2',
            name: 'Quarterly',
            durationDays: 90,
          }),
        },
      };

      const service = new MembershipsService(
        mockPrisma,
        mockAuditLogs as any,
        mockNotifications as any,
      );

      const renewed = await service.renewMembershipByStaff(
        staffActor,
        'membership-old-1',
        { planId: 'plan-2', status: MembershipStatus.ACTIVE },
      );

      expect(renewed.previousMembershipId).toBe('membership-old-1');
      expect(renewed.planId).toBe('plan-2');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // 2. PAYMENT & RECEIPT BUSINESS RULES
  // ==========================================================================
  describe('PaymentsService Business Rules', () => {
    it('creates new payment with PENDING status and does NOT auto-activate membership', async () => {
      const mockMembershipUpdate = jest.fn();
      const mockPrisma: any = {
        memberProfile: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'member-profile-1',
            userId: 'user-member-1',
            user: { fullName: 'Member One', email: 'm1@example.com' },
          }),
        },
        payment: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockImplementation(({ data }) =>
            Promise.resolve({
              id: 'payment-1',
              ...data,
              memberProfile: { user: { fullName: 'Member One' } },
            }),
          ),
        },
        auditLog: {
          findMany: jest.fn().mockResolvedValue([]),
        },
        membership: {
          update: mockMembershipUpdate,
        },
      };

      const service = new PaymentsService(
        mockPrisma,
        mockAuditLogs as any,
        mockNotifications as any,
      );

      const created = await service.createPayment(memberActor, {
        membershipId: 'membership-1',
        amountBdt: 5200,
        paymentMethod: PaymentMethod.BKASH,
        transactionReference: 'TXN12345',
      });

      expect(created.status).toBe(PaymentStatus.PENDING);
      expect(mockMembershipUpdate).not.toHaveBeenCalled();
    });

    it('blocks duplicate member payment submissions when a PENDING payment already exists for that ID', async () => {
      const mockPrisma: any = {
        memberProfile: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'member-profile-1',
            userId: 'user-member-1',
            user: { fullName: 'Member One', email: 'm1@example.com' },
          }),
        },
        payment: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'payment-existing',
            status: PaymentStatus.PENDING,
          }),
        },
      };

      const service = new PaymentsService(
        mockPrisma,
        mockAuditLogs as any,
        mockNotifications as any,
      );

      await expect(
        service.createPayment(memberActor, {
          membershipId: 'membership-1',
          amountBdt: 5200,
          paymentMethod: PaymentMethod.BKASH,
          transactionReference: 'TXN12345',
        }),
      ).rejects.toThrow(/already submitted/i);
    });

    it('allows editing a pending payment once and blocks a second edit', async () => {
      const basePayment = {
        id: 'payment-1',
        memberProfileId: 'member-profile-1',
        membershipId: 'membership-1',
        amountBdt: 5200,
        discountBdt: 0,
        netAmountBdt: 5200,
        paymentMethod: PaymentMethod.BKASH,
        transactionReference: 'OLD-TRX-1',
        senderPhone: '01700000001',
        notes: 'Initial note',
        status: PaymentStatus.PENDING,
        memberProfile: { user: { fullName: 'Member One', email: 'm1@example.com' } },
        membership: { planId: 'plan-1', status: MembershipStatus.PENDING, plan: { name: 'Monthly' } },
      };

      const mockPrisma: any = {
        payment: {
          findUnique: jest.fn().mockResolvedValue(basePayment),
          findFirst: jest.fn().mockResolvedValue(null),
          update: jest.fn().mockImplementation(({ data }) =>
            Promise.resolve({ ...basePayment, ...data }),
          ),
        },
        auditLog: {
          count: jest.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(1),
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'audit-1',
              entityId: 'payment-1',
              createdAt: new Date(),
              summary: 'Edited pending payment (1/1)',
              metadata: {
                previous: { transactionReference: 'OLD-TRX-1' },
                updated: { transactionReference: 'NEW-TRX-2' },
              },
            },
          ]),
        },
        $transaction: jest.fn((cb: any) =>
          cb({
            payment: {
              update: jest.fn().mockImplementation(({ data }) =>
                Promise.resolve({ ...basePayment, ...data }),
              ),
            },
            membership: { update: jest.fn() },
          }),
        ),
      };

      const service = new PaymentsService(
        mockPrisma,
        mockAuditLogs as any,
        mockNotifications as any,
      );

      const edited = await service.editMyPendingPayment(memberActor, 'payment-1', {
        paymentMethod: PaymentMethod.NAGAD,
        transactionReference: 'NEW-TRX-2',
      });

      expect(edited.transactionReference).toBe('NEW-TRX-2');
      expect(edited.isEdited).toBe(true);
      expect(edited.editCount).toBe(1);

      await expect(
        service.editMyPendingPayment(memberActor, 'payment-1', {
          transactionReference: 'THIRD-TRX-3',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('forbids members from verifying their own payments', async () => {
      const service = new PaymentsService(
        {} as any,
        mockAuditLogs as any,
        mockNotifications as any,
      );

      await expect(
        service.verifyPaymentByStaff(memberActor, 'payment-1', {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('prevents IDOR when a member attempts to view another member’s payment receipt', async () => {
      const mockPrisma: any = {
        payment: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'payment-1',
            receipt: { id: 'rcp-1', receiptNumber: 'RCP-202611-0001' },
            memberProfile: {
              id: 'member-profile-1',
              userId: 'user-member-1',
              user: { fullName: 'Member One' },
            },
          }),
        },
      };

      const service = new PaymentsService(
        mockPrisma,
        mockAuditLogs as any,
        mockNotifications as any,
      );

      await expect(
        service.getReceipt(otherMemberActor, 'payment-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ==========================================================================
  // 3. CLASS BOOKING CAPACITY, DUPLICATE & IDOR RULES
  // ==========================================================================
  describe('BookingsService Business Rules', () => {
    it('blocks booking if member does not have an ACTIVE non-expired membership', async () => {
      const mockPrisma: any = {
        memberProfile: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'member-profile-1',
            userId: 'user-member-1',
            user: { fullName: 'Member One' },
          }),
        },
        membership: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };

      const service = new BookingsService(
        mockPrisma,
        mockAuditLogs as any,
        mockNotifications as any,
      );

      await expect(
        service.createBooking(memberActor, {
          classScheduleId: 'schedule-1',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('blocks duplicate booking for the same class session', async () => {
      const txMock = {
        classSchedule: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'schedule-1',
            capacity: 20,
            bookedCount: 5,
            isCancelled: false,
            isPublished: true,
            gymClass: { title: 'Barbell Strength' },
          }),
        },
        booking: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'existing-booking',
            status: BookingStatus.CONFIRMED,
          }),
        },
      };

      const mockPrisma: any = {
        memberProfile: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'member-profile-1',
            userId: 'user-member-1',
            user: { fullName: 'Member One' },
          }),
        },
        membership: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'membership-active',
            status: MembershipStatus.ACTIVE,
          }),
        },
        $transaction: jest.fn().mockImplementation((cb) => cb(txMock)),
      };

      const service = new BookingsService(
        mockPrisma,
        mockAuditLogs as any,
        mockNotifications as any,
      );

      await expect(
        service.createBooking(memberActor, {
          classScheduleId: 'schedule-1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('prevents overbooking when class capacity is reached under concurrency', async () => {
      const txMock = {
        classSchedule: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'schedule-full',
            capacity: 16,
            bookedCount: 16,
            isCancelled: false,
            isPublished: true,
            gymClass: { title: 'Barbell Strength' },
          }),
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
        booking: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      const mockPrisma: any = {
        memberProfile: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'member-profile-1',
            userId: 'user-member-1',
            user: { fullName: 'Member One' },
          }),
        },
        membership: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'membership-active',
            status: MembershipStatus.ACTIVE,
          }),
        },
        $transaction: jest.fn().mockImplementation((cb) => cb(txMock)),
      };

      const service = new BookingsService(
        mockPrisma,
        mockAuditLogs as any,
        mockNotifications as any,
      );

      await expect(
        service.createBooking(memberActor, {
          classScheduleId: 'schedule-full',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('prevents a member from cancelling another member’s booking (IDOR protection)', async () => {
      const mockPrisma: any = {
        booking: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'booking-1',
            status: BookingStatus.CONFIRMED,
            memberProfile: {
              id: 'member-profile-1',
              userId: 'user-member-1',
              user: { fullName: 'Member One' },
            },
            classSchedule: {
              id: 'schedule-1',
              startTime: '18:00',
              cancellationCutoffHours: 2,
              bookedCount: 4,
              gymClass: { title: 'HIIT' },
            },
          }),
        },
      };

      const service = new BookingsService(
        mockPrisma,
        mockAuditLogs as any,
        mockNotifications as any,
      );

      await expect(
        service.cancelBooking(otherMemberActor, 'booking-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ==========================================================================
  // 4. SUPER_ADMIN PRIVILEGE ISOLATION
  // ==========================================================================
  describe('UsersService Privilege Isolation', () => {
    it('prevents STAFF from creating admin users or updating roles', async () => {
      const service = new UsersService({} as any, mockAuditLogs as any);

      await expect(
        service.createAdminOrStaffUser(staffActor, {
          fullName: 'Unauthorized Admin',
          email: 'unauth@example.com',
          phone: '+8801900000000',
          password: 'Password#123',
          role: Role.ADMIN,
        }),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.updateUserRole(staffActor, 'user-member-1', Role.SUPER_ADMIN),
      ).rejects.toThrow(ForbiddenException);
    });

    it('prevents SUPER_ADMIN from demoting their own account role', async () => {
      const service = new UsersService({} as any, mockAuditLogs as any);

      await expect(
        service.updateUserRole(superAdminActor, superAdminActor.id, Role.STAFF),
      ).rejects.toThrow(BadRequestException);
    });
  });
});


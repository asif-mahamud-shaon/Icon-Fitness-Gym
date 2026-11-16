import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AccessDecision,
  AccessDenialCode,
  AccessDirection,
  BiometricEnrollmentStatus,
  DayOfWeek,
  DeviceStatus,
  DeviceVendorType,
  DoorCommandStatus,
  Gender,
  GymSessionType,
  MembershipStatus,
  PaymentStatus,
  Role,
  TrainerPresenceStatus,
  UserStatus,
} from '@prisma/client';
import { AccessControlService } from './modules/access-control/access-control.service';
import { HardwareAdapterService } from './modules/access-control/hardware-adapter.service';
import { BiometricSecurityService } from './modules/access-control/biometric-security.service';
import {
  getDhakaEndOfDayCutoff,
  isMembershipValidAtDhakaTime,
} from './modules/access-control/timezone.util';
import { AuthenticatedUser } from './common/decorators/current-user.decorator';

describe('Icon Fitness Gym — Smart Face Recognition, Membership Access Control & Gender Session Suite (17 Scenarios)', () => {
  const adminActor: AuthenticatedUser = {
    id: 'user-admin',
    email: 'admin@iconfitnessgym.com',
    fullName: 'Gym Admin',
    role: Role.ADMIN,
    status: UserStatus.ACTIVE,
  };

  const maleMemberActor: AuthenticatedUser = {
    id: 'user-male-member',
    email: 'male.member@iconfitnessgym.com',
    fullName: 'Tanvir Ahmed',
    role: Role.MEMBER,
    status: UserStatus.ACTIVE,
    memberProfileId: 'member-male-1',
  };

  const femaleMemberActor: AuthenticatedUser = {
    id: 'user-female-member',
    email: 'female.member@iconfitnessgym.com',
    fullName: 'Nusrat Jahan',
    role: Role.MEMBER,
    status: UserStatus.ACTIVE,
    memberProfileId: 'member-female-1',
  };

  const mockAuditLogs = {
    log: jest.fn().mockResolvedValue({ id: 'audit-log-1' }),
  };

  const mockNotifications = {
    createNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  };

  const hardwareAdapter = new HardwareAdapterService();
  const rawDeviceApiKey = 'IFG-TEST-DEVICE-SECRET-KEY-2026';
  const validDeviceApiKeyHash =
    hardwareAdapter.hashDeviceApiKey(rawDeviceApiKey);

  const defaultSettings = {
    id: 'settings-1',
    singletonKey: 'DEFAULT',
    timezone: 'Asia/Dhaka',
    enforceGenderSessions: true,
    requireFemaleTrainerPresence: true,
    allowFemaleInMaleSession: true,
    blockEntryWhenNoActiveSession: false,
    minFaceMatchConfidence: 0.85,
    requireLivenessDetection: true,
    deviceHeartbeatTimeoutSec: 90,
    callbackReplayWindowSec: 60,
    biometricRetentionDays: 365,
    trainerCheckInAlertLeadMinutes: 20,
    allowStaffManualOverride: true,
    emergencyEgressNote:
      'Emergency break-glass exits operate independently of software.',
  };

  const makeOnlineDevice = (overrides: Record<string, any> = {}) => ({
    id: 'device-entry-1',
    deviceCode: 'DEV-ASHKONA-ENTRY-01',
    name: 'Ashkona Main Entrance Face Terminal',
    locationZone: 'Main Lobby Turnstile — Ashkona',
    vendorType: DeviceVendorType.SIMULATED_TERMINAL,
    direction: AccessDirection.ENTRY,
    status: DeviceStatus.ONLINE,
    isActive: true,
    isSimulated: true,
    apiKeyHash: validDeviceApiKeyHash,
    doorControllerId: 'DOOR-CTRL-01',
    doorUnlockDurationSec: 5,
    lastHeartbeatAt: new Date('2026-11-11T10:00:00.000+06:00'),
    ...overrides,
  });

  const maleSessionMorning = {
    id: 'session-male-morning',
    name: 'Morning General / Male Session',
    code: 'SES-WED-MALE-0600',
    sessionType: GymSessionType.MALE_SESSION,
    dayOfWeek: DayOfWeek.WEDNESDAY,
    startTime: '06:00',
    endTime: '14:00',
    timezone: 'Asia/Dhaka',
    requiresFemaleTrainer: false,
    allowFemaleInMaleSession: true,
    maxCapacity: 65,
    gracePeriodMinutes: 10,
    isActive: true,
    trainerAssignments: [],
  };

  const femaleSessionAfternoon = {
    id: 'session-female-afternoon',
    name: 'Dedicated Ladies Session',
    code: 'SES-WED-FEM-1400',
    sessionType: GymSessionType.FEMALE_SESSION,
    dayOfWeek: DayOfWeek.WEDNESDAY,
    startTime: '14:00',
    endTime: '17:30',
    timezone: 'Asia/Dhaka',
    requiresFemaleTrainer: true,
    allowFemaleInMaleSession: false,
    maxCapacity: 40,
    gracePeriodMinutes: 10,
    isActive: true,
    trainerAssignments: [],
  };

  const makeMemberProfile = (
    gender: Gender,
    overrides: Record<string, any> = {},
  ) => ({
    id: gender === Gender.FEMALE ? 'member-female-1' : 'member-male-1',
    userId:
      gender === Gender.FEMALE ? 'user-female-member' : 'user-male-member',
    memberCode: gender === Gender.FEMALE ? 'IFG-2026-0002' : 'IFG-2026-0001',
    gender,
    user: {
      id: gender === Gender.FEMALE ? 'user-female-member' : 'user-male-member',
      fullName: gender === Gender.FEMALE ? 'Nusrat Jahan' : 'Tanvir Ahmed',
      email:
        gender === Gender.FEMALE
          ? 'female.member@iconfitnessgym.com'
          : 'male.member@iconfitnessgym.com',
      phone: '+8801711000001',
      status: UserStatus.ACTIVE,
      deletedAt: null,
    },
    biometricEnrollment: {
      id: 'bio-1',
      status: BiometricEnrollmentStatus.ENROLLED,
      consentGranted: true,
    },
    ...overrides,
  });

  const createServiceWithMockPrisma = (prismaOverrides: Record<string, any>) => {
    const basePrisma: any = {
      accessControlSettings: {
        findUnique: jest.fn().mockResolvedValue(defaultSettings),
      },
      accessEvent: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'access-event-created-1',
            ...data,
            memberProfile: {
              user: { fullName: 'Test Member' },
            },
            doorControllerEvent: data.doorControllerEvent?.create || null,
          }),
        ),
        findMany: jest.fn().mockResolvedValue([]),
      },
      accessDevice: {
        findUnique: jest.fn().mockResolvedValue(makeOnlineDevice()),
        findFirst: jest.fn().mockResolvedValue(makeOnlineDevice()),
      },
      gymSessionException: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      gymSession: {
        findUnique: jest.fn().mockResolvedValue(maleSessionMorning),
        findMany: jest
          .fn()
          .mockResolvedValue([maleSessionMorning, femaleSessionAfternoon]),
      },
      memberProfile: {
        findUnique: jest
          .fn()
          .mockResolvedValue(makeMemberProfile(Gender.MALE)),
      },
      membership: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'membership-active-1',
            status: MembershipStatus.ACTIVE,
            startDate: new Date('2026-11-01T00:00:00.000+06:00'),
            endDate: new Date('2026-11-30T00:00:00.000+06:00'),
            plan: { id: 'plan-1', name: 'Quarterly Transformation' },
            payments: [
              { id: 'pay-1', status: PaymentStatus.VERIFIED_PAID, amountBdt: 5200 },
            ],
          },
        ]),
        update: jest.fn().mockResolvedValue({}),
      },
      biometricEnrollment: {
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      sessionTrainerAssignment: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      trainerAttendance: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      ...prismaOverrides,
    };

    const biometricSecurity = new BiometricSecurityService(
      basePrisma,
      mockAuditLogs as any,
    );

    const service = new AccessControlService(
      basePrisma,
      mockAuditLogs as any,
      mockNotifications as any,
      hardwareAdapter,
      biometricSecurity,
    );

    return { service, basePrisma, biometricSecurity };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // SCENARIO 1: Active membership with successful recognition
  // ==========================================================================
  it('Scenario 1: grants entry and unlocks door for an active member with verified payment and valid biometrics', async () => {
    const { service } = createServiceWithMockPrisma({});

    const res = await service.processAccessAttempt(
      {
        memberProfileId: 'member-male-1',
        deviceCode: 'DEV-ASHKONA-ENTRY-01',
        recognitionScore: 0.98,
        livenessPassed: true,
        evaluationTimestamp: '2026-11-11T10:15:00.000+06:00',
      },
      adminActor,
    );

    expect(res.accessDecision).toBe(AccessDecision.GRANTED);
    expect(res.denialCode).toBeNull();
    expect(res.doorCommandStatus).toBe(DoorCommandStatus.UNLOCK_CONFIRMED);
    expect(res.doorControllerEvent?.emergencyExitIndependent).toBe(true);
  });

  // ==========================================================================
  // SCENARIO 2: Expired membership with denied access & automatic status transition
  // ==========================================================================
  it('Scenario 2: immediately denies access and transitions status to EXPIRED when membership is past its final valid day in Asia/Dhaka', async () => {
    const mockMembershipUpdate = jest.fn().mockResolvedValue({});
    const { service } = createServiceWithMockPrisma({
      membership: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'membership-expired-1',
            status: MembershipStatus.ACTIVE, // Still marked ACTIVE in DB until real-time check
            startDate: new Date('2026-10-01T00:00:00.000+06:00'),
            endDate: new Date('2026-11-10T00:00:00.000+06:00'), // Final valid day was Nov 10
            plan: { id: 'plan-1', name: 'Monthly Standard' },
            payments: [{ id: 'pay-1', status: PaymentStatus.VERIFIED_PAID }],
          },
        ]),
        update: mockMembershipUpdate,
      },
    });

    const res = await service.processAccessAttempt(
      {
        memberProfileId: 'member-male-1',
        evaluationTimestamp: '2026-11-11T10:15:00.000+06:00',
      },
      adminActor,
    );

    expect(res.accessDecision).toBe(AccessDecision.DENIED);
    expect(res.denialCode).toBe(AccessDenialCode.MEMBERSHIP_EXPIRED);
    expect(res.doorCommandStatus).toBe(DoorCommandStatus.LOCKED_DENIED);
    expect(mockMembershipUpdate).toHaveBeenCalledWith({
      where: { id: 'membership-expired-1' },
      data: { status: MembershipStatus.EXPIRED },
    });
  });

  // ==========================================================================
  // SCENARIO 3: Pending payment with denied access
  // ==========================================================================
  it('Scenario 3: denies entry with PAYMENT_PENDING when membership or renewal payment is still pending staff verification', async () => {
    const { service } = createServiceWithMockPrisma({
      membership: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'membership-pending-1',
            status: MembershipStatus.PENDING,
            startDate: new Date('2026-11-01T00:00:00.000+06:00'),
            endDate: new Date('2026-12-01T00:00:00.000+06:00'),
            plan: { id: 'plan-1', name: 'Monthly Standard' },
            payments: [{ id: 'pay-pending-1', status: PaymentStatus.PENDING }],
          },
        ]),
        update: jest.fn(),
      },
    });

    const res = await service.processAccessAttempt(
      {
        memberProfileId: 'member-male-1',
        evaluationTimestamp: '2026-11-11T10:15:00.000+06:00',
      },
      adminActor,
    );

    expect(res.accessDecision).toBe(AccessDecision.DENIED);
    expect(res.denialCode).toBe(AccessDenialCode.PAYMENT_PENDING);
    expect(res.doorCommandStatus).toBe(DoorCommandStatus.LOCKED_DENIED);
  });

  // ==========================================================================
  // SCENARIO 4: Successful renewal + verified payment restoring access
  // ==========================================================================
  it('Scenario 4: automatically restores access once a renewed membership is ACTIVE and payment is VERIFIED_PAID', async () => {
    const { service } = createServiceWithMockPrisma({
      membership: {
        findMany: jest.fn().mockResolvedValue([
          // Newer renewed active membership
          {
            id: 'membership-renewed-active',
            status: MembershipStatus.ACTIVE,
            startDate: new Date('2026-11-11T00:00:00.000+06:00'),
            endDate: new Date('2026-12-11T00:00:00.000+06:00'),
            plan: { id: 'plan-1', name: 'Monthly Standard' },
            payments: [
              { id: 'pay-renewed-verified', status: PaymentStatus.VERIFIED_PAID },
            ],
          },
          // Older expired membership preserved in history
          {
            id: 'membership-old-expired',
            status: MembershipStatus.EXPIRED,
            startDate: new Date('2026-10-01T00:00:00.000+06:00'),
            endDate: new Date('2026-11-01T00:00:00.000+06:00'),
            plan: { id: 'plan-1', name: 'Monthly Standard' },
            payments: [{ id: 'pay-old', status: PaymentStatus.VERIFIED_PAID }],
          },
        ]),
        update: jest.fn(),
      },
    });

    const res = await service.processAccessAttempt(
      {
        memberProfileId: 'member-male-1',
        evaluationTimestamp: '2026-11-11T10:15:00.000+06:00',
      },
      adminActor,
    );

    expect(res.accessDecision).toBe(AccessDecision.GRANTED);
    expect(res.membershipId).toBe('membership-renewed-active');
    expect(res.denialCode).toBeNull();
  });

  // ==========================================================================
  // SCENARIO 5: Suspended membership with denied access
  // ==========================================================================
  it('Scenario 5: denies entry with MEMBERSHIP_SUSPENDED when member package is suspended', async () => {
    const { service } = createServiceWithMockPrisma({
      membership: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'membership-suspended-1',
            status: MembershipStatus.SUSPENDED,
            startDate: new Date('2026-11-01T00:00:00.000+06:00'),
            endDate: new Date('2026-12-01T00:00:00.000+06:00'),
            plan: { id: 'plan-1', name: 'Monthly Standard' },
            payments: [{ id: 'pay-1', status: PaymentStatus.VERIFIED_PAID }],
          },
        ]),
        update: jest.fn(),
      },
    });

    const res = await service.processAccessAttempt(
      {
        memberProfileId: 'member-male-1',
        evaluationTimestamp: '2026-11-11T10:15:00.000+06:00',
      },
      adminActor,
    );

    expect(res.accessDecision).toBe(AccessDecision.DENIED);
    expect(res.denialCode).toBe(AccessDenialCode.MEMBERSHIP_SUSPENDED);
    expect(res.doorCommandStatus).toBe(DoorCommandStatus.LOCKED_DENIED);
  });

  // ==========================================================================
  // SCENARIO 6: Male Member attempting entry during Female Session
  // ==========================================================================
  it('Scenario 6: strictly denies a Male Member attempting entry during a Female Session (FEMALE_SESSION_RESTRICTED) even with an active membership', async () => {
    const { service } = createServiceWithMockPrisma({
      memberProfile: {
        findUnique: jest
          .fn()
          .mockResolvedValue(makeMemberProfile(Gender.MALE)),
      },
    });

    // 15:00 Asia/Dhaka on Wednesday falls inside femaleSessionAfternoon (14:00–17:30)
    const res = await service.processAccessAttempt(
      {
        memberProfileId: 'member-male-1',
        evaluationTimestamp: '2026-11-11T15:00:00.000+06:00',
      },
      adminActor,
    );

    expect(res.accessDecision).toBe(AccessDecision.DENIED);
    expect(res.denialCode).toBe(AccessDenialCode.FEMALE_SESSION_RESTRICTED);
    expect(res.sessionTypeSnapshot).toBe(GymSessionType.FEMALE_SESSION);
    expect(res.doorCommandStatus).toBe(DoorCommandStatus.LOCKED_DENIED);
  });

  // ==========================================================================
  // SCENARIO 7: Female Member entering during Female Session with checked-in Female Trainer
  // ==========================================================================
  it('Scenario 7: grants entry to a Female Member during a Female Session when a designated Female Trainer is both assigned and physically checked in', async () => {
    const { service } = createServiceWithMockPrisma({
      memberProfile: {
        findUnique: jest
          .fn()
          .mockResolvedValue(makeMemberProfile(Gender.FEMALE)),
      },
      sessionTrainerAssignment: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'assign-1',
            gymSessionId: 'session-female-afternoon',
            trainerProfileId: 'trainer-female-1',
            isActive: true,
            trainerProfile: {
              id: 'trainer-female-1',
              gender: Gender.FEMALE,
              isActive: true,
              user: { fullName: 'Sabrina Rahman' },
            },
            replacementTrainer: null,
          },
        ]),
      },
      trainerAttendance: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'att-1',
            trainerProfileId: 'trainer-female-1',
            gymSessionId: 'session-female-afternoon',
            status: TrainerPresenceStatus.PRESENT,
            checkedInAt: new Date('2026-11-11T13:50:00.000+06:00'),
            checkedOutAt: null,
            trainerProfile: {
              id: 'trainer-female-1',
              gender: Gender.FEMALE,
              user: { fullName: 'Sabrina Rahman' },
            },
          },
        ]),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    });

    const res = await service.processAccessAttempt(
      {
        memberProfileId: 'member-female-1',
        evaluationTimestamp: '2026-11-11T15:00:00.000+06:00',
      },
      adminActor,
    );

    expect(res.accessDecision).toBe(AccessDecision.GRANTED);
    expect(res.sessionTypeSnapshot).toBe(GymSessionType.FEMALE_SESSION);
    expect(res.femaleTrainerPresentSnapshot).toBe(true);
    expect(res.denialCode).toBeNull();
  });

  // ==========================================================================
  // SCENARIO 8: Female Member entering during Male Session
  // ==========================================================================
  it('Scenario 8: grants entry to a Female Member during a Male Session when her membership is valid', async () => {
    const { service } = createServiceWithMockPrisma({
      memberProfile: {
        findUnique: jest
          .fn()
          .mockResolvedValue(makeMemberProfile(Gender.FEMALE)),
      },
    });

    // 10:00 Asia/Dhaka on Wednesday falls inside maleSessionMorning (06:00–14:00)
    const res = await service.processAccessAttempt(
      {
        memberProfileId: 'member-female-1',
        evaluationTimestamp: '2026-11-11T10:00:00.000+06:00',
      },
      adminActor,
    );

    expect(res.accessDecision).toBe(AccessDecision.GRANTED);
    expect(res.sessionTypeSnapshot).toBe(GymSessionType.MALE_SESSION);
    expect(res.denialCode).toBeNull();
  });

  // ==========================================================================
  // SCENARIO 9: Male Member entering during Male Session
  // ==========================================================================
  it('Scenario 9: grants entry to a Male Member during a Male Session when his membership is valid', async () => {
    const { service } = createServiceWithMockPrisma({
      memberProfile: {
        findUnique: jest
          .fn()
          .mockResolvedValue(makeMemberProfile(Gender.MALE)),
      },
    });

    const res = await service.processAccessAttempt(
      {
        memberProfileId: 'member-male-1',
        evaluationTimestamp: '2026-11-11T10:00:00.000+06:00',
      },
      adminActor,
    );

    expect(res.accessDecision).toBe(AccessDecision.GRANTED);
    expect(res.sessionTypeSnapshot).toBe(GymSessionType.MALE_SESSION);
    expect(res.denialCode).toBeNull();
  });

  // ==========================================================================
  // SCENARIO 10: Female Session with no available / assigned Female Trainer
  // ==========================================================================
  it('Scenario 10: denies entry during a Female Session with FEMALE_TRAINER_UNAVAILABLE when no Female Trainer is assigned', async () => {
    const { service } = createServiceWithMockPrisma({
      memberProfile: {
        findUnique: jest
          .fn()
          .mockResolvedValue(makeMemberProfile(Gender.FEMALE)),
      },
      sessionTrainerAssignment: {
        findMany: jest.fn().mockResolvedValue([]), // No assigned trainer
      },
    });

    const res = await service.processAccessAttempt(
      {
        memberProfileId: 'member-female-1',
        evaluationTimestamp: '2026-11-11T15:00:00.000+06:00',
      },
      adminActor,
    );

    expect(res.accessDecision).toBe(AccessDecision.DENIED);
    expect(res.denialCode).toBe(AccessDenialCode.FEMALE_TRAINER_UNAVAILABLE);
    expect(res.femaleTrainerPresentSnapshot).toBe(false);
    expect(res.doorCommandStatus).toBe(DoorCommandStatus.LOCKED_DENIED);
  });

  // ==========================================================================
  // SCENARIO 11: Female Trainer assigned on schedule but absent / not checked in
  // ==========================================================================
  it('Scenario 11: denies entry during a Female Session with FEMALE_TRAINER_UNAVAILABLE when a Female Trainer is assigned on the schedule but has NOT physically checked in or is marked ABSENT', async () => {
    const { service } = createServiceWithMockPrisma({
      memberProfile: {
        findUnique: jest
          .fn()
          .mockResolvedValue(makeMemberProfile(Gender.FEMALE)),
      },
      sessionTrainerAssignment: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'assign-1',
            gymSessionId: 'session-female-afternoon',
            trainerProfileId: 'trainer-female-1',
            isActive: true,
            trainerProfile: {
              id: 'trainer-female-1',
              gender: Gender.FEMALE,
              isActive: true,
              user: { fullName: 'Sabrina Rahman' },
            },
            replacementTrainer: null,
          },
        ]),
      },
      trainerAttendance: {
        // Assigned on schedule, but marked ABSENT (or no check-in record)
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'att-absent',
            trainerProfileId: 'trainer-female-1',
            gymSessionId: 'session-female-afternoon',
            status: TrainerPresenceStatus.ABSENT,
            checkedInAt: null,
            checkedOutAt: null,
            trainerProfile: {
              id: 'trainer-female-1',
              gender: Gender.FEMALE,
              user: { fullName: 'Sabrina Rahman' },
            },
          },
        ]),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    });

    const res = await service.processAccessAttempt(
      {
        memberProfileId: 'member-female-1',
        evaluationTimestamp: '2026-11-11T15:00:00.000+06:00',
      },
      adminActor,
    );

    expect(res.accessDecision).toBe(AccessDecision.DENIED);
    expect(res.denialCode).toBe(AccessDenialCode.FEMALE_TRAINER_UNAVAILABLE);
    expect(res.femaleTrainerPresentSnapshot).toBe(false);
    expect(res.denialReason).toContain('Sabrina Rahman');
  });

  // ==========================================================================
  // SCENARIO 12: Device disconnection / offline terminal (fail-secure entry)
  // ==========================================================================
  it('Scenario 12: fails secure (keeps entrance locked and returns DEVICE_UNAVAILABLE) when the facial recognition device is offline', async () => {
    const offlineDevice = makeOnlineDevice({
      status: DeviceStatus.OFFLINE,
      lastHeartbeatAt: new Date('2026-11-11T08:00:00.000+06:00'),
    });

    const { service } = createServiceWithMockPrisma({
      accessDevice: {
        findUnique: jest.fn().mockResolvedValue(offlineDevice),
        findFirst: jest.fn().mockResolvedValue(offlineDevice),
      },
    });

    const res = await service.processAccessAttempt(
      {
        memberProfileId: 'member-male-1',
        deviceCode: 'DEV-ASHKONA-ENTRY-01',
        evaluationTimestamp: '2026-11-11T10:15:00.000+06:00',
      },
      adminActor,
    );

    expect(res.accessDecision).toBe(AccessDecision.DENIED);
    expect(res.denialCode).toBe(AccessDenialCode.DEVICE_UNAVAILABLE);
    expect(res.doorCommandStatus).toBe(DoorCommandStatus.LOCKED_DENIED);
  });

  // ==========================================================================
  // SCENARIO 13: Duplicate device callbacks with identical idempotencyKey
  // ==========================================================================
  it('Scenario 13: deduplicates repeated device callbacks with the same idempotencyKey without creating duplicate AccessEvent records', async () => {
    const existingAccessEvent = {
      id: 'existing-access-event-999',
      idempotencyKey: 'IDEMP-KEY-2026-001',
      accessDecision: AccessDecision.GRANTED,
      denialCode: null,
      doorCommandStatus: DoorCommandStatus.UNLOCK_CONFIRMED,
    };

    const { service, basePrisma } = createServiceWithMockPrisma({
      accessEvent: {
        findUnique: jest.fn().mockResolvedValue(existingAccessEvent),
        create: jest.fn(),
      },
    });

    const res = await service.processAccessAttempt(
      {
        idempotencyKey: 'IDEMP-KEY-2026-001',
        memberProfileId: 'member-male-1',
        evaluationTimestamp: '2026-11-11T10:15:00.000+06:00',
      },
      adminActor,
    );

    expect(res.id).toBe('existing-access-event-999');
    expect(res.idempotentReplay).toBe(true);
    expect(basePrisma.accessEvent.create).not.toHaveBeenCalled();
  });

  // ==========================================================================
  // SCENARIO 14: Unauthorized device requests with invalid/missing API key
  // ==========================================================================
  it('Scenario 14: rejects unauthenticated hardware webhook requests that have a missing or invalid deviceApiKey', async () => {
    const { service } = createServiceWithMockPrisma({});

    // Call without authenticatedActor (representing external hardware webhook) and with wrong API key
    await expect(
      service.processAccessAttempt({
        deviceCode: 'DEV-ASHKONA-ENTRY-01',
        deviceApiKey: 'INVALID-FORGED-DEVICE-KEY',
        memberProfileId: 'member-male-1',
        evaluationTimestamp: '2026-11-11T10:15:00.000+06:00',
      }),
    ).rejects.toThrow(UnauthorizedException);

    // Confirm valid device API key succeeds without authenticatedActor
    const validRes = await service.processAccessAttempt({
      deviceCode: 'DEV-ASHKONA-ENTRY-01',
      deviceApiKey: rawDeviceApiKey,
      memberProfileId: 'member-male-1',
      evaluationTimestamp: '2026-11-11T10:15:00.000+06:00',
    });
    expect(validRes.accessDecision).toBe(AccessDecision.GRANTED);
  });

  // ==========================================================================
  // SCENARIO 15: Membership expiry boundary and Asia/Dhaka timezone handling
  // ==========================================================================
  it('Scenario 15: keeps membership valid until 23:59:59.999+06:00 of its final valid day in Asia/Dhaka and expires it immediately after midnight', async () => {
    const startDate = new Date('2026-10-12T00:00:00.000+06:00');
    // Suppose endDate was stored as midnight UTC/Dhaka on 2026-11-11
    const endDate = new Date('2026-11-11T00:00:00.000+06:00');

    const cutoff = getDhakaEndOfDayCutoff(endDate);
    expect(cutoff.toISOString()).toBe(
      new Date('2026-11-11T23:59:59.999+06:00').toISOString(),
    );

    // At 23:58:00 Asia/Dhaka on the final valid day (2026-11-11), membership MUST still be valid!
    const lateEveningOnFinalDay = new Date('2026-11-11T23:58:00.000+06:00');
    const checkOnFinalDay = isMembershipValidAtDhakaTime(
      startDate,
      endDate,
      lateEveningOnFinalDay,
    );
    expect(checkOnFinalDay.isValid).toBe(true);
    expect(checkOnFinalDay.isExpired).toBe(false);

    // 5 seconds after midnight on 2026-11-12 Asia/Dhaka, membership MUST be expired!
    const justAfterMidnightNextDay = new Date('2026-11-12T00:00:05.000+06:00');
    const checkNextDay = isMembershipValidAtDhakaTime(
      startDate,
      endDate,
      justAfterMidnightNextDay,
    );
    expect(checkNextDay.isValid).toBe(false);
    expect(checkNextDay.isExpired).toBe(true);
  });

  // ==========================================================================
  // SCENARIO 16: Unauthorized access to another member's biometric or access records (IDOR + Privacy)
  // ==========================================================================
  it('Scenario 16: prevents IDOR access to another member’s biometric/access records and never exposes encrypted biometric templates', async () => {
    const { service, biometricSecurity } = createServiceWithMockPrisma({
      memberProfile: {
        findUnique: jest
          .fn()
          .mockResolvedValue(makeMemberProfile(Gender.FEMALE)),
      },
    });

    // Male member attempting to view Female member's access summary -> ForbiddenException
    await expect(
      service.getMyMemberAccessSummary(maleMemberActor, 'member-female-1'),
    ).rejects.toThrow(ForbiddenException);

    // Male member attempting to enroll biometrics for Female member's profile -> ForbiddenException (IDOR blocked)
    await expect(
      biometricSecurity.enrollMemberBiometrics(maleMemberActor, {
        memberProfileId: 'member-female-1',
        consentGranted: true,
      }),
    ).rejects.toThrow(ForbiddenException);

    // Female member attempting to enroll own biometrics without explicit consent -> BadRequestException
    await expect(
      biometricSecurity.enrollMemberBiometrics(femaleMemberActor, {
        memberProfileId: 'member-female-1',
        consentGranted: false,
      }),
    ).rejects.toThrow(BadRequestException);

    // Sanitization check: encryptedTemplateCipher and templateHash must NEVER leak in API responses
    const rawEnrollmentRecord = {
      id: 'bio-secret-1',
      memberProfileId: 'member-male-1',
      status: BiometricEnrollmentStatus.ENROLLED,
      consentGranted: true,
      encryptedTemplateCipher: 'v1:SECRET_IV:SECRET_TAG:SECRET_CIPHERTEXT',
      templateHash: 'deadbeef1234567890',
      templateVersion: 'IFG-BIO-AES256GCM-V1',
    };

    const sanitized =
      biometricSecurity.sanitizeEnrollmentForResponse(rawEnrollmentRecord);
    expect(sanitized).toBeDefined();
    expect(sanitized!.hasEncryptedTemplate).toBe(true);
    expect((sanitized as any).encryptedTemplateCipher).toBeUndefined();
    expect((sanitized as any).templateHash).toBeUndefined();
  });

  // ==========================================================================
  // SCENARIO 17: Emergency exit independence from software controls
  // ==========================================================================
  it('Scenario 17: guarantees physical emergency exits operate 100% independently of software, database, network, or facial recognition', () => {
    const { service } = createServiceWithMockPrisma({});
    const safety = service.getEmergencySafetyStatus();

    expect(safety.emergencyExitIndependent).toBe(true);
    expect(safety.canSoftwareBlockEmergencyExit).toBe(false);
    expect(safety.failSecureEntranceOnDeviceOffline).toBe(true);
    expect(safety.manualStaffVerificationAvailable).toBe(true);
  });
});

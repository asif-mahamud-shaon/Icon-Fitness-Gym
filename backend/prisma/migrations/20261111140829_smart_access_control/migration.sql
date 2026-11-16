-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ONLINE', 'OFFLINE', 'MAINTENANCE', 'DEGRADED');

-- CreateEnum
CREATE TYPE "DeviceVendorType" AS ENUM ('SIMULATED_TERMINAL', 'GENERIC_REST_WEBHOOK', 'ZKTECO_COMPATIBLE', 'HIKVISION_ISAPI_COMPATIBLE', 'SUPREMA_COMPATIBLE');

-- CreateEnum
CREATE TYPE "BiometricEnrollmentStatus" AS ENUM ('NOT_ENROLLED', 'PENDING_CONSENT', 'ENROLLED', 'REVOKED', 'DELETED');

-- CreateEnum
CREATE TYPE "GymSessionType" AS ENUM ('MALE_SESSION', 'FEMALE_SESSION');

-- CreateEnum
CREATE TYPE "SessionExceptionType" AS ENUM ('HOLIDAY', 'TEMPORARY_CLOSURE', 'SPECIAL_EVENT', 'MODIFIED_HOURS');

-- CreateEnum
CREATE TYPE "TrainerPresenceStatus" AS ENUM ('ASSIGNED', 'PRESENT', 'ABSENT', 'LATE', 'UNAVAILABLE', 'REPLACED');

-- CreateEnum
CREATE TYPE "AccessDecision" AS ENUM ('GRANTED', 'DENIED');

-- CreateEnum
CREATE TYPE "AccessDenialCode" AS ENUM ('FACE_NOT_RECOGNIZED', 'MEMBER_NOT_FOUND', 'ACCOUNT_INACTIVE', 'MEMBERSHIP_EXPIRED', 'MEMBERSHIP_NOT_ACTIVE', 'PAYMENT_PENDING', 'MEMBERSHIP_SUSPENDED', 'MEMBERSHIP_CANCELLED', 'FEMALE_SESSION_RESTRICTED', 'FEMALE_TRAINER_UNAVAILABLE', 'OUTSIDE_OPERATING_SESSION', 'BIOMETRIC_NOT_ENROLLED', 'SPOOF_DETECTED', 'DEVICE_UNAVAILABLE', 'SYSTEM_ERROR');

-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('FACE_RECOGNITION', 'SIMULATED_BIOMETRIC', 'MANUAL_STAFF_VERIFICATION');

-- CreateEnum
CREATE TYPE "AccessDirection" AS ENUM ('ENTRY', 'EXIT');

-- CreateEnum
CREATE TYPE "DoorCommandStatus" AS ENUM ('UNLOCK_SENT', 'UNLOCK_CONFIRMED', 'LOCKED_DENIED', 'MANUAL_OVERRIDE', 'DEVICE_TIMEOUT', 'CONTROLLER_ERROR', 'EMERGENCY_EGRESS_INDEPENDENT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'ACCESS_CONTROL';
ALTER TYPE "NotificationType" ADD VALUE 'SECURITY_ALERT';

-- AlterTable
ALTER TABLE "TrainerProfile" ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'MALE';

-- CreateTable
CREATE TABLE "AccessDevice" (
    "id" TEXT NOT NULL,
    "deviceCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationZone" TEXT NOT NULL DEFAULT 'Ashkona Main Entrance',
    "vendorType" "DeviceVendorType" NOT NULL DEFAULT 'SIMULATED_TERMINAL',
    "direction" "AccessDirection" NOT NULL DEFAULT 'ENTRY',
    "ipAddress" TEXT,
    "doorControllerId" TEXT,
    "doorUnlockDurationSec" INTEGER NOT NULL DEFAULT 5,
    "apiKeyHash" TEXT NOT NULL,
    "hmacSecretEncrypted" TEXT,
    "isSimulated" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" "DeviceStatus" NOT NULL DEFAULT 'ONLINE',
    "lastHeartbeatAt" TIMESTAMP(3),
    "firmwareVersion" TEXT DEFAULT 'SIM-FW-1.0.0',
    "capabilitiesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiometricEnrollment" (
    "id" TEXT NOT NULL,
    "memberProfileId" TEXT NOT NULL,
    "status" "BiometricEnrollmentStatus" NOT NULL DEFAULT 'NOT_ENROLLED',
    "consentGranted" BOOLEAN NOT NULL DEFAULT false,
    "consentGrantedAt" TIMESTAMP(3),
    "consentVersion" TEXT NOT NULL DEFAULT 'v1.0-BD-BIOMETRIC-POLICY',
    "consentIpAddress" TEXT,
    "encryptedTemplateCipher" TEXT,
    "templateHash" TEXT,
    "templateVersion" TEXT NOT NULL DEFAULT 'FACENET-512-V1',
    "livenessVerified" BOOLEAN NOT NULL DEFAULT false,
    "qualityScore" DOUBLE PRECISION,
    "enrolledByUserId" TEXT,
    "enrolledDeviceId" TEXT,
    "enrolledAt" TIMESTAMP(3),
    "lastVerifiedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "retentionExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiometricEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymSession" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "sessionType" "GymSessionType" NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    "requiresFemaleTrainer" BOOLEAN NOT NULL DEFAULT false,
    "allowFemaleInMaleSession" BOOLEAN NOT NULL DEFAULT true,
    "maxCapacity" INTEGER NOT NULL DEFAULT 60,
    "gracePeriodMinutes" INTEGER NOT NULL DEFAULT 10,
    "accessRulesNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymSessionException" (
    "id" TEXT NOT NULL,
    "gymSessionId" TEXT,
    "exceptionDate" TIMESTAMP(3) NOT NULL,
    "exceptionType" "SessionExceptionType" NOT NULL DEFAULT 'MODIFIED_HOURS',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "overrideSessionType" "GymSessionType",
    "overrideStartTime" TEXT,
    "overrideEndTime" TEXT,
    "isGymClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymSessionException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionTrainerAssignment" (
    "id" TEXT NOT NULL,
    "gymSessionId" TEXT NOT NULL,
    "trainerProfileId" TEXT NOT NULL,
    "replacementTrainerProfileId" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "assignedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionTrainerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainerAttendance" (
    "id" TEXT NOT NULL,
    "trainerProfileId" TEXT NOT NULL,
    "gymSessionId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "status" "TrainerPresenceStatus" NOT NULL DEFAULT 'ASSIGNED',
    "checkedInAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "verificationMethod" "VerificationMethod" NOT NULL DEFAULT 'MANUAL_STAFF_VERIFICATION',
    "deviceId" TEXT,
    "verifiedByUserId" TEXT,
    "replacementTrainerProfileId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainerAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessEvent" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "memberProfileId" TEXT,
    "membershipId" TEXT,
    "deviceId" TEXT,
    "gymSessionId" TEXT,
    "direction" "AccessDirection" NOT NULL DEFAULT 'ENTRY',
    "verificationMethod" "VerificationMethod" NOT NULL DEFAULT 'FACE_RECOGNITION',
    "isSimulated" BOOLEAN NOT NULL DEFAULT false,
    "recognitionScore" DOUBLE PRECISION,
    "livenessPassed" BOOLEAN NOT NULL DEFAULT true,
    "accessDecision" "AccessDecision" NOT NULL,
    "denialCode" "AccessDenialCode",
    "denialReason" TEXT,
    "doorCommandStatus" "DoorCommandStatus" NOT NULL,
    "sessionTypeSnapshot" "GymSessionType",
    "femaleTrainerPresentSnapshot" BOOLEAN,
    "authorizedByUserId" TEXT,
    "eventTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoorControllerEvent" (
    "id" TEXT NOT NULL,
    "accessEventId" TEXT,
    "deviceId" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "status" "DoorCommandStatus" NOT NULL,
    "isSimulated" BOOLEAN NOT NULL DEFAULT true,
    "responseTimeMs" INTEGER,
    "controllerResponseCode" TEXT,
    "errorMessage" TEXT,
    "triggeredByUserId" TEXT,
    "emergencyExitIndependent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoorControllerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessControlSettings" (
    "id" TEXT NOT NULL,
    "singletonKey" TEXT NOT NULL DEFAULT 'DEFAULT',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    "enforceGenderSessions" BOOLEAN NOT NULL DEFAULT true,
    "requireFemaleTrainerPresence" BOOLEAN NOT NULL DEFAULT true,
    "allowFemaleInMaleSession" BOOLEAN NOT NULL DEFAULT true,
    "blockEntryWhenNoActiveSession" BOOLEAN NOT NULL DEFAULT false,
    "minFaceMatchConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
    "requireLivenessDetection" BOOLEAN NOT NULL DEFAULT true,
    "deviceHeartbeatTimeoutSec" INTEGER NOT NULL DEFAULT 90,
    "callbackReplayWindowSec" INTEGER NOT NULL DEFAULT 60,
    "biometricRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "trainerCheckInAlertLeadMinutes" INTEGER NOT NULL DEFAULT 15,
    "allowStaffManualOverride" BOOLEAN NOT NULL DEFAULT true,
    "emergencyEgressNote" TEXT NOT NULL DEFAULT 'Physical emergency exits and break-glass releases operate independently of software, database, network, or facial recognition status.',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessControlSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccessDevice_deviceCode_key" ON "AccessDevice"("deviceCode");

-- CreateIndex
CREATE INDEX "AccessDevice_status_isActive_idx" ON "AccessDevice"("status", "isActive");

-- CreateIndex
CREATE INDEX "AccessDevice_deviceCode_idx" ON "AccessDevice"("deviceCode");

-- CreateIndex
CREATE UNIQUE INDEX "BiometricEnrollment_memberProfileId_key" ON "BiometricEnrollment"("memberProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "BiometricEnrollment_templateHash_key" ON "BiometricEnrollment"("templateHash");

-- CreateIndex
CREATE INDEX "BiometricEnrollment_status_idx" ON "BiometricEnrollment"("status");

-- CreateIndex
CREATE INDEX "BiometricEnrollment_templateHash_idx" ON "BiometricEnrollment"("templateHash");

-- CreateIndex
CREATE UNIQUE INDEX "GymSession_code_key" ON "GymSession"("code");

-- CreateIndex
CREATE INDEX "GymSession_dayOfWeek_sessionType_isActive_idx" ON "GymSession"("dayOfWeek", "sessionType", "isActive");

-- CreateIndex
CREATE INDEX "GymSessionException_exceptionDate_isGymClosed_idx" ON "GymSessionException"("exceptionDate", "isGymClosed");

-- CreateIndex
CREATE INDEX "SessionTrainerAssignment_gymSessionId_isActive_idx" ON "SessionTrainerAssignment"("gymSessionId", "isActive");

-- CreateIndex
CREATE INDEX "SessionTrainerAssignment_trainerProfileId_isActive_idx" ON "SessionTrainerAssignment"("trainerProfileId", "isActive");

-- CreateIndex
CREATE INDEX "TrainerAttendance_gymSessionId_sessionDate_status_idx" ON "TrainerAttendance"("gymSessionId", "sessionDate", "status");

-- CreateIndex
CREATE INDEX "TrainerAttendance_trainerProfileId_sessionDate_idx" ON "TrainerAttendance"("trainerProfileId", "sessionDate");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerAttendance_trainerProfileId_gymSessionId_sessionDate_key" ON "TrainerAttendance"("trainerProfileId", "gymSessionId", "sessionDate");

-- CreateIndex
CREATE UNIQUE INDEX "AccessEvent_idempotencyKey_key" ON "AccessEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AccessEvent_eventTimestamp_accessDecision_idx" ON "AccessEvent"("eventTimestamp", "accessDecision");

-- CreateIndex
CREATE INDEX "AccessEvent_memberProfileId_eventTimestamp_idx" ON "AccessEvent"("memberProfileId", "eventTimestamp");

-- CreateIndex
CREATE INDEX "AccessEvent_denialCode_eventTimestamp_idx" ON "AccessEvent"("denialCode", "eventTimestamp");

-- CreateIndex
CREATE INDEX "AccessEvent_gymSessionId_eventTimestamp_idx" ON "AccessEvent"("gymSessionId", "eventTimestamp");

-- CreateIndex
CREATE INDEX "AccessEvent_deviceId_eventTimestamp_idx" ON "AccessEvent"("deviceId", "eventTimestamp");

-- CreateIndex
CREATE UNIQUE INDEX "DoorControllerEvent_accessEventId_key" ON "DoorControllerEvent"("accessEventId");

-- CreateIndex
CREATE INDEX "DoorControllerEvent_deviceId_createdAt_idx" ON "DoorControllerEvent"("deviceId", "createdAt");

-- CreateIndex
CREATE INDEX "DoorControllerEvent_status_createdAt_idx" ON "DoorControllerEvent"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AccessControlSettings_singletonKey_key" ON "AccessControlSettings"("singletonKey");

-- CreateIndex
CREATE INDEX "TrainerProfile_gender_isActive_idx" ON "TrainerProfile"("gender", "isActive");

-- AddForeignKey
ALTER TABLE "BiometricEnrollment" ADD CONSTRAINT "BiometricEnrollment_memberProfileId_fkey" FOREIGN KEY ("memberProfileId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiometricEnrollment" ADD CONSTRAINT "BiometricEnrollment_enrolledDeviceId_fkey" FOREIGN KEY ("enrolledDeviceId") REFERENCES "AccessDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymSessionException" ADD CONSTRAINT "GymSessionException_gymSessionId_fkey" FOREIGN KEY ("gymSessionId") REFERENCES "GymSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionTrainerAssignment" ADD CONSTRAINT "SessionTrainerAssignment_gymSessionId_fkey" FOREIGN KEY ("gymSessionId") REFERENCES "GymSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionTrainerAssignment" ADD CONSTRAINT "SessionTrainerAssignment_trainerProfileId_fkey" FOREIGN KEY ("trainerProfileId") REFERENCES "TrainerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionTrainerAssignment" ADD CONSTRAINT "SessionTrainerAssignment_replacementTrainerProfileId_fkey" FOREIGN KEY ("replacementTrainerProfileId") REFERENCES "TrainerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerAttendance" ADD CONSTRAINT "TrainerAttendance_trainerProfileId_fkey" FOREIGN KEY ("trainerProfileId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerAttendance" ADD CONSTRAINT "TrainerAttendance_replacementTrainerProfileId_fkey" FOREIGN KEY ("replacementTrainerProfileId") REFERENCES "TrainerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerAttendance" ADD CONSTRAINT "TrainerAttendance_gymSessionId_fkey" FOREIGN KEY ("gymSessionId") REFERENCES "GymSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerAttendance" ADD CONSTRAINT "TrainerAttendance_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "AccessDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessEvent" ADD CONSTRAINT "AccessEvent_memberProfileId_fkey" FOREIGN KEY ("memberProfileId") REFERENCES "MemberProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessEvent" ADD CONSTRAINT "AccessEvent_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessEvent" ADD CONSTRAINT "AccessEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "AccessDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessEvent" ADD CONSTRAINT "AccessEvent_gymSessionId_fkey" FOREIGN KEY ("gymSessionId") REFERENCES "GymSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoorControllerEvent" ADD CONSTRAINT "DoorControllerEvent_accessEventId_fkey" FOREIGN KEY ("accessEventId") REFERENCES "AccessEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoorControllerEvent" ADD CONSTRAINT "DoorControllerEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "AccessDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

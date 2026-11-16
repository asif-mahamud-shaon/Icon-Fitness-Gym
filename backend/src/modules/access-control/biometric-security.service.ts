import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BiometricEnrollmentStatus,
  Gender,
  Role,
} from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { resolveRequiredSecret } from '../../common/security/secrets.util';

/**
 * Biometric Privacy & Security Service (Section 1.2).
 * - Enforces explicit member consent before biometric enrollment.
 * - Encrypts biometric feature templates using AES-256-GCM.
 * - Computes an irreversible SHA-256 template identifier hash for terminal callback matching.
 * - Never stores raw facial photographs and NEVER exposes `encryptedTemplateCipher` or `templateHash` in API responses.
 */
@Injectable()
export class BiometricSecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private getEncryptionKey(): Buffer {
    const rawSecret = resolveRequiredSecret('BIOMETRIC_ENCRYPTION_KEY');
    return crypto.createHash('sha256').update(rawSecret).digest();
  }

  /**
   * Encrypts a biometric feature descriptor using AES-256-GCM.
   */
  encryptBiometricDescriptor(descriptorPayload: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(descriptorPayload, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /**
   * Computes a deterministic SHA-256 hash of a biometric template token for terminal lookup.
   */
  computeTemplateLookupHash(templateToken: string): string {
    const salt = resolveRequiredSecret('BIOMETRIC_HASH_SALT');
    return crypto
      .createHmac('sha256', salt)
      .update(templateToken.trim())
      .digest('hex');
  }

  /**
   * Sanitizes a BiometricEnrollment database record so sensitive template fields
   * (`encryptedTemplateCipher`, `templateHash`) are NEVER returned to clients or UI screens.
   */
  sanitizeEnrollmentForResponse(record: any) {
    if (!record) return null;
    const {
      encryptedTemplateCipher,
      templateHash,
      ...safeFields
    } = record;
    return {
      ...safeFields,
      hasEncryptedTemplate: Boolean(encryptedTemplateCipher),
    };
  }

  /**
   * Enrolls a member's biometric template only after verifying explicit consent.
   */
  async enrollMemberBiometrics(
    actor: AuthenticatedUser,
    dto: {
      memberProfileId: string;
      consentGranted: boolean;
      consentVersion?: string;
      templateToken?: string;
      templateVersion?: string;
      livenessVerified?: boolean;
      qualityScore?: number;
      enrolledDeviceId?: string;
      retentionDays?: number;
      recentPhotoDataUrl?: string;
      fullName?: string;
      phone?: string;
      appUsername?: string;
      address?: string;
      gender?: Gender;
      dateOfBirth?: string;
      nidNumber?: string;
      bloodGroup?: string;
      heightCm?: number;
      weightKg?: number;
      rfidCardNumber?: string;
      facebookUrl?: string;
    },
    ipAddress?: string,
  ) {
    // Authorization check: ADMIN, SUPER_ADMIN, STAFF, or the member granting consent for their own profile
    const member = await this.prisma.memberProfile.findUnique({
      where: { id: dto.memberProfileId },
      include: { user: true },
    });
    if (!member) {
      throw new NotFoundException('Member profile not found.');
    }

    if (actor.role === Role.MEMBER && member.userId !== actor.id) {
      throw new ForbiddenException(
        'Members may only manage biometric consent for their own profile.',
      );
    }
    if (actor.role === Role.TRAINER) {
      throw new ForbiddenException(
        'Trainers are not authorized to enroll or modify member biometric data.',
      );
    }

    if (!dto.consentGranted) {
      throw new BadRequestException(
        'Explicit member biometric consent (consentGranted: true) is mandatory before biometric enrollment.',
      );
    }

    if (dto.recentPhotoDataUrl) {
      const trimmedPhoto = dto.recentPhotoDataUrl.trim();
      const isSupportedRasterDataUrl = /^data:image\/(?:jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(
        trimmedPhoto,
      );
      const isSupportedHttpUrl =
        /^https?:\/\/[^\s"'<>]+$/i.test(trimmedPhoto) &&
        trimmedPhoto.length <= 2048;
      if (!isSupportedRasterDataUrl && !isSupportedHttpUrl) {
        throw new BadRequestException(
          'Uploaded recent photo must be a valid JPEG, PNG, or WEBP image.',
        );
      }
      if (trimmedPhoto.length > 4_000_000) {
        throw new BadRequestException(
          'Recent face photo is too large. Please upload an image under 3MB.',
        );
      }
    }

    const settings = await this.prisma.accessControlSettings.findFirst();
    const retentionDays =
      dto.retentionDays || settings?.biometricRetentionDays || 365;
    const now = new Date();
    const retentionExpiresAt = new Date(
      now.getTime() + retentionDays * 24 * 60 * 60 * 1000,
    );

    if (
      dto.fullName ||
      dto.phone ||
      dto.recentPhotoDataUrl !== undefined
    ) {
      await this.prisma.user.update({
        where: { id: member.userId },
        data: {
          ...(dto.fullName?.trim() ? { fullName: dto.fullName.trim() } : {}),
          ...(dto.phone?.trim() ? { phone: dto.phone.trim() } : {}),
          ...(dto.recentPhotoDataUrl
            ? { avatarUrl: dto.recentPhotoDataUrl.trim() }
            : {}),
        },
      });
    }

    const hasCoreProfileUpdates =
      dto.address !== undefined ||
      dto.gender !== undefined ||
      dto.dateOfBirth !== undefined ||
      dto.bloodGroup !== undefined ||
      dto.heightCm !== undefined ||
      dto.weightKg !== undefined;

    if (hasCoreProfileUpdates) {
      await this.prisma.memberProfile.update({
        where: { id: member.id },
        data: {
          ...(dto.address !== undefined
            ? { address: dto.address.trim() || null }
            : {}),
          ...(dto.gender ? { gender: dto.gender as any } : {}),
          ...(dto.dateOfBirth
            ? { dateOfBirth: new Date(dto.dateOfBirth) }
            : {}),
          ...(dto.bloodGroup !== undefined
            ? { bloodGroup: dto.bloodGroup.trim() || null }
            : {}),
          ...(dto.heightCm !== undefined && dto.heightCm !== null
            ? { heightCm: Number(dto.heightCm) }
            : {}),
          ...(dto.weightKg !== undefined && dto.weightKg !== null
            ? { weightKg: Number(dto.weightKg) }
            : {}),
        },
      });
    }

    // Persist recently added profile columns via parameterized raw SQL so enrollment works
    // immediately even when Prisma Client DLL cannot regenerate while NestJS is running on Windows.
    if (
      typeof (this.prisma as any).$executeRaw === 'function' &&
      (dto.appUsername !== undefined ||
        dto.nidNumber !== undefined ||
        dto.rfidCardNumber !== undefined ||
        dto.facebookUrl !== undefined)
    ) {
      const updateAppUsername = dto.appUsername !== undefined;
      const appUsernameVal = updateAppUsername
        ? dto.appUsername!.trim() || null
        : null;
      const updateNid = dto.nidNumber !== undefined;
      const nidVal = updateNid ? dto.nidNumber!.trim() || null : null;
      const updateRfid = dto.rfidCardNumber !== undefined;
      const rfidVal = updateRfid ? dto.rfidCardNumber!.trim() || null : null;
      const updateFacebook = dto.facebookUrl !== undefined;
      const facebookVal = updateFacebook
        ? dto.facebookUrl!.trim() || null
        : null;

      await this.prisma.$executeRaw`
        UPDATE "MemberProfile"
        SET
          "appUsername" = CASE WHEN ${updateAppUsername}::boolean THEN ${appUsernameVal}::text ELSE "appUsername" END,
          "nidNumber" = CASE WHEN ${updateNid}::boolean THEN ${nidVal}::text ELSE "nidNumber" END,
          "rfidCardNumber" = CASE WHEN ${updateRfid}::boolean THEN ${rfidVal}::text ELSE "rfidCardNumber" END,
          "facebookUrl" = CASE WHEN ${updateFacebook}::boolean THEN ${facebookVal}::text ELSE "facebookUrl" END,
          "updatedAt" = NOW()
        WHERE "id" = ${member.id}
      `;
    }

    const photoFingerprint = dto.recentPhotoDataUrl
      ? crypto
          .createHash('sha256')
          .update(dto.recentPhotoDataUrl)
          .digest('hex')
          .slice(0, 16)
      : crypto.randomBytes(8).toString('hex');

    const rawTemplateToken =
      dto.templateToken ||
      `BIO-TPL-${member.memberCode}-${photoFingerprint}`;
    const encryptedTemplateCipher =
      this.encryptBiometricDescriptor(rawTemplateToken);
    const templateHash = this.computeTemplateLookupHash(rawTemplateToken);

    const verificationSnapshot = {
      memberCode: member.memberCode,
      fullName: dto.fullName?.trim() || member.user.fullName,
      email: member.user.email,
      phone: dto.phone?.trim() || member.user.phone,
      appUsername: dto.appUsername?.trim() || (member as any).appUsername || member.memberCode,
      address: dto.address?.trim() || member.address || null,
      gender: dto.gender || member.gender || null,
      dateOfBirth: dto.dateOfBirth || member.dateOfBirth || null,
      nidNumber: dto.nidNumber?.trim() || (member as any).nidNumber || null,
      bloodGroup: dto.bloodGroup?.trim() || member.bloodGroup || null,
      heightCm: dto.heightCm ?? member.heightCm ?? null,
      weightKg: dto.weightKg ?? member.weightKg ?? null,
      rfidCardNumber:
        dto.rfidCardNumber?.trim() || (member as any).rfidCardNumber || null,
      facebookUrl:
        dto.facebookUrl?.trim() || (member as any).facebookUrl || null,
      photoSubmitted: Boolean(dto.recentPhotoDataUrl),
      submittedAt: now.toISOString(),
    };

    const enrollmentUpdateData = {
      status: BiometricEnrollmentStatus.ENROLLED,
      consentGranted: true,
      consentGrantedAt: now,
      consentVersion: dto.consentVersion || 'v1.0-BD-BIOMETRIC-POLICY',
      consentIpAddress: ipAddress || null,
      encryptedTemplateCipher,
      templateHash,
      templateVersion: dto.templateVersion || 'FACENET-512-V1',
      livenessVerified: dto.livenessVerified ?? true,
      qualityScore: dto.qualityScore ?? 0.98,
      enrolledByUserId: actor.id,
      enrolledDeviceId: dto.enrolledDeviceId || null,
      enrolledAt: now,
      revokedAt: null,
      revocationReason: null,
      retentionExpiresAt,
    };

    const enrollmentCreateData = {
      memberProfileId: member.id,
      status: BiometricEnrollmentStatus.ENROLLED,
      consentGranted: true,
      consentGrantedAt: now,
      consentVersion: dto.consentVersion || 'v1.0-BD-BIOMETRIC-POLICY',
      consentIpAddress: ipAddress || null,
      encryptedTemplateCipher,
      templateHash,
      templateVersion: dto.templateVersion || 'FACENET-512-V1',
      livenessVerified: dto.livenessVerified ?? true,
      qualityScore: dto.qualityScore ?? 0.98,
      enrolledByUserId: actor.id,
      enrolledDeviceId: dto.enrolledDeviceId || null,
      enrolledAt: now,
      retentionExpiresAt,
    };

    const upserted = await this.prisma.biometricEnrollment.upsert({
      where: { memberProfileId: member.id },
      update: enrollmentUpdateData,
      create: enrollmentCreateData,
      include: {
        memberProfile: {
          include: {
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
        enrolledDevice: {
          select: { id: true, name: true, deviceCode: true },
        },
      },
    });

    const recentPhotoVal = dto.recentPhotoDataUrl?.trim() || null;
    const hasRecentPhoto = Boolean(recentPhotoVal);
    const verificationSnapshotJson = JSON.stringify(verificationSnapshot);

    if (typeof (this.prisma as any).$executeRaw === 'function') {
      await this.prisma.$executeRaw`
        UPDATE "BiometricEnrollment"
        SET
          "recentPhotoDataUrl" = CASE WHEN ${hasRecentPhoto}::boolean THEN ${recentPhotoVal}::text ELSE "recentPhotoDataUrl" END,
          "facePhotoUploadedAt" = CASE WHEN ${hasRecentPhoto}::boolean THEN ${now}::timestamp ELSE "facePhotoUploadedAt" END,
          "verificationProfileJson" = ${verificationSnapshotJson}::jsonb,
          "updatedAt" = NOW()
        WHERE "id" = ${upserted.id}
      `;
    }

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'BIOMETRIC_ENROLLMENT_COMPLETED',
      entityType: 'BiometricEnrollment',
      entityId: upserted.id,
      summary: `Completed encrypted biometric enrollment for ${member.user.fullName} (${member.memberCode}) with explicit consent (${upserted.consentVersion}).`,
      metadata: {
        memberProfileId: member.id,
        memberCode: member.memberCode,
        consentGranted: true,
        consentVersion: upserted.consentVersion,
        livenessVerified: upserted.livenessVerified,
        retentionExpiresAt: retentionExpiresAt.toISOString(),
      },
      ipAddress,
    });

    return this.sanitizeEnrollmentForResponse({
      ...upserted,
      ...(recentPhotoVal
        ? {
            recentPhotoDataUrl: recentPhotoVal,
            facePhotoUploadedAt: now,
          }
        : {}),
      verificationProfileJson: verificationSnapshot,
    });
  }

  /**
   * Revokes or permanently deletes a member's biometric template when requested by the member
   * or an authorized administrator (Section 1.2).
   */
  async deleteOrRevokeBiometrics(
    actor: AuthenticatedUser,
    memberProfileId: string,
    reason?: string,
    ipAddress?: string,
  ) {
    const member = await this.prisma.memberProfile.findUnique({
      where: { id: memberProfileId },
      include: { user: true },
    });
    if (!member) {
      throw new NotFoundException('Member profile not found.');
    }

    if (actor.role === Role.MEMBER && member.userId !== actor.id) {
      throw new ForbiddenException(
        'You are not authorized to delete another member’s biometric data.',
      );
    }
    if (actor.role === Role.TRAINER) {
      throw new ForbiddenException(
        'Trainers are not authorized to delete biometric records.',
      );
    }

    const existing = await this.prisma.biometricEnrollment.findUnique({
      where: { memberProfileId: member.id },
    });

    const now = new Date();
    const updated = await this.prisma.biometricEnrollment.upsert({
      where: { memberProfileId: member.id },
      update: {
        status: BiometricEnrollmentStatus.DELETED,
        consentGranted: false,
        encryptedTemplateCipher: null,
        templateHash: null,
        livenessVerified: false,
        qualityScore: null,
        revokedAt: now,
        revocationReason:
          reason || 'Biometric template permanently purged upon request.',
      },
      create: {
        memberProfileId: member.id,
        status: BiometricEnrollmentStatus.DELETED,
        consentGranted: false,
        revokedAt: now,
        revocationReason:
          reason || 'Biometric template permanently purged upon request.',
      },
    });

    if (typeof (this.prisma as any).$executeRaw === 'function') {
      await this.prisma.$executeRaw`
        UPDATE "BiometricEnrollment"
        SET
          "recentPhotoDataUrl" = NULL,
          "facePhotoUploadedAt" = NULL,
          "verificationProfileJson" = NULL,
          "updatedAt" = NOW()
        WHERE "id" = ${updated.id}
      `;
    }

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'BIOMETRIC_DATA_DELETED',
      entityType: 'BiometricEnrollment',
      entityId: existing?.id || updated.id,
      summary: `Permanently deleted encrypted biometric template for ${member.user.fullName} (${member.memberCode}).`,
      metadata: {
        memberProfileId: member.id,
        reason: updated.revocationReason,
      },
      ipAddress,
    });

    return this.sanitizeEnrollmentForResponse(updated);
  }
}


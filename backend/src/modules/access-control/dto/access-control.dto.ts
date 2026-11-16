import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AccessDirection, Gender } from '@prisma/client';

export class EnrollBiometricsDto {
  @IsString()
  @MaxLength(64)
  memberProfileId!: string;

  @IsBoolean()
  consentGranted!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  consentVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  templateToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  templateVersion?: string;

  @IsOptional()
  @IsBoolean()
  livenessVerified?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  qualityScore?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  enrolledDeviceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4_000_000)
  recentPhotoDataUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  appUsername?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  nidNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  bloodGroup?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(40)
  @Max(300)
  heightCm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(15)
  @Max(400)
  weightKg?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  rfidCardNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  facebookUrl?: string;
}

export class DeviceHeartbeatDto {
  @IsString()
  @MaxLength(64)
  deviceCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  apiKey?: string;
}

export class DeviceVerifyCallbackDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  deviceCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  deviceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  deviceApiKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  memberProfileId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  memberCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  templateToken?: string;

  @IsOptional()
  @IsBoolean()
  faceRecognized?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  recognitionScore?: number;

  @IsOptional()
  @IsBoolean()
  livenessPassed?: boolean;

  @IsOptional()
  @IsEnum(AccessDirection)
  direction?: AccessDirection;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  callbackTimestamp?: string;
}


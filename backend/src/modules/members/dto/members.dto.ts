import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Gender, WorkoutGoal } from '@prisma/client';

export class UpdateMyProfileDto {
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
  @MaxLength(4_000_000)
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  appUsername?: string;

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
  @MaxLength(512)
  facebookUrl?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

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
  @IsEnum(WorkoutGoal)
  fitnessGoal?: WorkoutGoal;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  medicalConditions?: string;
}


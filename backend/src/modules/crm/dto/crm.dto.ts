import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  CrmActivityChannel,
  CrmActivityOutcome,
  CrmLeadSource,
  CrmLeadStage,
} from '@prisma/client';

export class CreateCrmLeadDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(30)
  phone!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(140)
  email?: string;

  @IsEnum(CrmLeadSource)
  source!: CrmLeadSource;

  @IsOptional()
  @IsEnum(CrmLeadStage)
  stage?: CrmLeadStage;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fitnessGoal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  interestedPlan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  assignedToUserId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  referralMemberCode?: string;

  @IsOptional()
  @IsDateString()
  nextFollowUpAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  notes?: string;
}

export class UpdateCrmLeadDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(140)
  email?: string;

  @IsOptional()
  @IsEnum(CrmLeadSource)
  source?: CrmLeadSource;

  @IsOptional()
  @IsEnum(CrmLeadStage)
  stage?: CrmLeadStage;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fitnessGoal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  interestedPlan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  assignedToUserId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  referralMemberCode?: string;

  @IsOptional()
  @IsDateString()
  nextFollowUpAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  lostReason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  convertedMemberId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  notes?: string;
}

export class LogCrmActivityDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  leadId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  memberProfileId?: string;

  @IsEnum(CrmActivityChannel)
  channel!: CrmActivityChannel;

  @IsEnum(CrmActivityOutcome)
  outcome!: CrmActivityOutcome;

  @IsString()
  @MinLength(3)
  @MaxLength(600)
  summary!: string;

  @IsOptional()
  @IsDateString()
  nextFollowUpAt?: string;
}

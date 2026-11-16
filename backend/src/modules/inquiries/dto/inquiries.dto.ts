import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePublicInquiryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(32)
  phone!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(180)
  subject!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(3000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  interestedPlan?: string;
}


import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @MaxLength(64)
  classScheduleId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  memberProfileId?: string;
}

export class CancelBookingDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancellationReason?: string;
}


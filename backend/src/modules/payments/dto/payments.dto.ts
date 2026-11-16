import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  memberProfileId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  membershipId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5_000_000)
  amountBdt!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5_000_000)
  discountBdt?: number;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  transactionReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  senderPhone?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class EditMyPaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  planId?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  transactionReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  senderPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class VerifyPaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  transactionReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  activateLinkedMembership?: boolean;
}

export class RefundPaymentDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5_000_000)
  refundedAmountBdt?: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(500)
  refundReason!: string;
}


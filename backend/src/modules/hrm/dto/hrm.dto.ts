import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  GymExpenseCategory,
  HrmDepartment,
  HrmEmployeeStatus,
  LedgerPaymentStatus,
  PaymentMethod,
} from '@prisma/client';

export class CreateHrmEmployeeDto {
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

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  designation!: string;

  @IsEnum(HrmDepartment)
  department!: HrmDepartment;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000000)
  baseSalaryBdt!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(500000)
  defaultAllowanceBdt?: number;

  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  payoutAccount?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  nidLast4?: string;

  @IsOptional()
  @IsEnum(HrmEmployeeStatus)
  status?: HrmEmployeeStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateHrmEmployeeDto {
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
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  designation?: string;

  @IsOptional()
  @IsEnum(HrmDepartment)
  department?: HrmDepartment;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000000)
  baseSalaryBdt?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(500000)
  defaultAllowanceBdt?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  payoutAccount?: string;

  @IsOptional()
  @IsEnum(HrmEmployeeStatus)
  status?: HrmEmployeeStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CreateHrmSalaryPaymentDto {
  @IsString()
  @MinLength(4)
  @MaxLength(100)
  employeeId!: string;

  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'monthKey must follow YYYY-MM format (e.g. 2026-11).',
  })
  monthKey!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000000)
  baseSalaryBdt!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(500000)
  bonusBdt?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(500000)
  overtimeBdt?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(500000)
  deductionBdt?: number;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  paymentRef?: string;

  @IsOptional()
  @IsEnum(LedgerPaymentStatus)
  status?: LedgerPaymentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateHrmSalaryStatusDto {
  @IsEnum(LedgerPaymentStatus)
  status!: LedgerPaymentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  paymentRef?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CreateGymExpenseDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @IsEnum(GymExpenseCategory)
  category!: GymExpenseCategory;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  vendorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  billReference?: string;

  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'monthKey must follow YYYY-MM format (e.g. 2026-11).',
  })
  monthKey!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5000000)
  amountBdt!: number;

  @IsOptional()
  @IsEnum(LedgerPaymentStatus)
  status?: LedgerPaymentStatus;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateGymExpenseDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsEnum(GymExpenseCategory)
  category?: GymExpenseCategory;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  vendorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  billReference?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5000000)
  amountBdt?: number;

  @IsOptional()
  @IsEnum(LedgerPaymentStatus)
  status?: LedgerPaymentStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

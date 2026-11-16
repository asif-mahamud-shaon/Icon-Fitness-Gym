import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  DiscountType,
  PaymentMethod,
  StoreOrderStatus,
} from '@prisma/client';

export class CreateStoreProductDto {
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sku?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(64)
  category!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  brand?: string;

  @IsString()
  @MinLength(5)
  @MaxLength(1200)
  description!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(500000)
  buyingPriceBdt?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500000)
  priceBdt!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500000)
  compareAtBdt?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  stockQty!: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  unitLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4_000_000)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  badgeText?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateStoreProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(500000)
  buyingPriceBdt?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500000)
  priceBdt?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500000)
  compareAtBdt?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  stockQty?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  unitLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4_000_000)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  badgeText?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class StoreOrderItemDto {
  @IsString()
  @MinLength(4)
  @MaxLength(100)
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  quantity!: number;
}

export class CreateStoreOrderDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  customerName!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(32)
  customerPhone!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  customerEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  memberCode?: string;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  transactionReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  pickupNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  discountCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5000000)
  advanceAmountBdt?: number;

  @IsOptional()
  @IsIn(['PICKUP', 'DELIVERY'])
  fulfillmentType?: 'PICKUP' | 'DELIVERY';

  @IsOptional()
  @IsIn(['DHAKA_METRO', 'OUTSIDE_DHAKA'])
  deliveryArea?: 'DHAKA_METRO' | 'OUTSIDE_DHAKA';

  @IsOptional()
  @IsString()
  @MaxLength(350)
  deliveryAddress?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(25)
  @ValidateNested({ each: true })
  @Type(() => StoreOrderItemDto)
  items!: StoreOrderItemDto[];
}

export class UpdateStoreOrderStatusDto {
  @IsEnum(StoreOrderStatus)
  status!: StoreOrderStatus;
}

export class ValidateStoreDiscountDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  code!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5000000)
  subtotalBdt!: number;
}

export class CreateStoreDiscountCodeDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  description?: string;

  @IsEnum(DiscountType)
  discountType!: DiscountType;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500000)
  discountValue!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3650)
  validDays!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(500000)
  minOrderBdt?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500000)
  maxDiscountBdt?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  maxUses?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateStoreDiscountCodeDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3650)
  validDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  maxUses?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  description?: string;
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role, StoreOrderStatus } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { StrictRoles } from '../../common/decorators/strict-roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { StoreService } from './store.service';
import {
  CreateStoreDiscountCodeDto,
  CreateStoreOrderDto,
  CreateStoreProductDto,
  UpdateStoreDiscountCodeDto,
  UpdateStoreOrderStatusDto,
  UpdateStoreProductDto,
  ValidateStoreDiscountDto,
} from './dto/store.dto';

@ApiTags('Gym Gear & Supplements Store')
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Public()
  @Get('products')
  @ApiOperation({ summary: 'List active gym gear & supplements catalog (public)' })
  async findPublicProducts(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.storeService.findPublicProducts({ category, search });
  }

  @Public()
  @Get('products/:slug')
  @ApiOperation({ summary: 'Get single store product detail & related items by slug or ID (public)' })
  async findPublicProductBySlug(@Param('slug') slug: string) {
    return this.storeService.findPublicProductBySlug(slug);
  }

  @Public()
  @Get('members/verify')
  @Throttle({ default: { limit: 12, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify Gym Member ID against active running student memberships (public, PII-redacted)' })
  async verifyRunningMemberCode(@Query('code') code?: string) {
    return this.storeService.verifyRunningMemberCode(code);
  }

  @ApiBearerAuth()
  @Get('members/verify-auth')
  @Roles(Role.MEMBER, Role.TRAINER, Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify own or staff-assisted Gym Member ID with profile auto-fill (ownership-checked)' })
  async verifyRunningMemberCodeAuth(
    @CurrentUser() user: AuthenticatedUser,
    @Query('code') code?: string,
  ) {
    return this.storeService.verifyRunningMemberCodeAuthenticated(user, code);
  }

  @Public()
  @Get('orders/verify/:code')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify a Store Order or Sales Slip QR code (public)' })
  async verifyOrderByCode(@Param('code') code: string) {
    return this.storeService.verifyOrderByCode(code);
  }

  @Public()
  @Post('orders')
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @ApiOperation({ summary: 'Place a gym gear order (public walk-in / online checkout)' })
  async placeGuestOrder(@Body() dto: CreateStoreOrderDto) {
    return this.storeService.createOrder(dto);
  }

  @ApiBearerAuth()
  @Post('orders/member')
  @Roles(Role.MEMBER, Role.TRAINER, Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Place a gym gear order linked to authenticated account' })
  async placeMemberOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStoreOrderDto,
  ) {
    return this.storeService.createOrder(dto, user);
  }

  @ApiBearerAuth()
  @Get('orders/my')
  @Roles(Role.MEMBER, Role.TRAINER, Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get authenticated member or staff store orders' })
  async findMyOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.storeService.findMyOrders(user.id);
  }

  @ApiBearerAuth()
  @Get('admin/products')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('store')
  @ApiOperation({ summary: 'List all store inventory items including archived' })
  async findAllAdmin(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.storeService.findAllAdmin({ category, search });
  }

  @ApiBearerAuth()
  @Post('admin/products')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('store')
  @ApiOperation({ summary: 'Add new gear or supplement item to store inventory' })
  async createProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStoreProductDto,
  ) {
    return this.storeService.createProduct(user, dto);
  }

  @ApiBearerAuth()
  @Patch('admin/products/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('store')
  @ApiOperation({ summary: 'Update store item details, price, or stock quantity' })
  async updateProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateStoreProductDto,
  ) {
    return this.storeService.updateProduct(user, id, dto);
  }

  @ApiBearerAuth()
  @Delete('admin/products/:id')
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('store')
  @ApiOperation({ summary: 'Remove or archive a store product' })
  async removeProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.storeService.removeProduct(user, id);
  }

  @Public()
  @Post('discount-codes/validate')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Validate a store promo/discount code against cart subtotal (public)' })
  async validateDiscountCode(@Body() dto: ValidateStoreDiscountDto) {
    return this.storeService.validateDiscountCode(dto);
  }

  @ApiBearerAuth()
  @Get('admin/orders')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('store')
  @ApiOperation({ summary: 'List all gym store orders for front desk fulfillment' })
  async findAllOrdersAdmin(
    @Query('status') status?: StoreOrderStatus,
    @Query('search') search?: string,
  ) {
    return this.storeService.findAllOrdersAdmin({ status, search });
  }

  @ApiBearerAuth()
  @Get('admin/orders/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('store')
  @ApiOperation({ summary: 'Get single store order details for inspection & slip generation' })
  async findOrderByIdAdmin(@Param('id') id: string) {
    return this.storeService.findOrderByIdAdmin(id);
  }

  @ApiBearerAuth()
  @Patch('admin/orders/:id/status')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('store')
  @ApiOperation({ summary: 'Update store order fulfillment status' })
  async updateOrderStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateStoreOrderStatusDto,
  ) {
    return this.storeService.updateOrderStatus(user, id, dto.status);
  }

  @ApiBearerAuth()
  @Get('admin/discount-codes')
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('payments', 'store')
  @ApiOperation({ summary: 'List all store discount/promo codes (Admin & Super Admin only)' })
  async findAllDiscountCodesAdmin(@CurrentUser() user: AuthenticatedUser) {
    return this.storeService.findAllDiscountCodesAdmin(user);
  }

  @ApiBearerAuth()
  @Post('admin/discount-codes')
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('payments', 'store')
  @ApiOperation({ summary: 'Generate a new store promo code with validity duration in days (Admin & Super Admin only)' })
  async createDiscountCode(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStoreDiscountCodeDto,
  ) {
    return this.storeService.createDiscountCode(user, dto);
  }

  @ApiBearerAuth()
  @Patch('admin/discount-codes/:id')
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('payments', 'store')
  @ApiOperation({ summary: 'Update or extend a store promo code (Admin & Super Admin only)' })
  async updateDiscountCode(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateStoreDiscountCodeDto,
  ) {
    return this.storeService.updateDiscountCode(user, id, dto);
  }

  @ApiBearerAuth()
  @Delete('admin/discount-codes/:id')
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Delete a store promo code (Admin & Super Admin only)' })
  async deleteDiscountCode(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.storeService.deleteDiscountCode(user, id);
  }
}

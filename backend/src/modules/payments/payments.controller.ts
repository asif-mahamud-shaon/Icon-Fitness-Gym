import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus, Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { StrictRoles } from '../../common/decorators/strict-roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentDto,
  EditMyPaymentDto,
  RefundPaymentDto,
  VerifyPaymentDto,
} from './dto/payments.dto';

@ApiTags('Payments & Receipts')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Get('receipts/verify/:code')
  @ApiOperation({ summary: 'Verify official gym membership payment receipt via QR code (public)' })
  async verifyReceiptPublic(@Param('code') code: string) {
    return this.paymentsService.verifyReceiptPublic(code);
  }

  @Get('my')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Get authenticated member payment and receipt records' })
  async findMy(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.findMyPayments(user.id);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('payments')
  @ApiOperation({ summary: 'List all payments with status and method filters' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: PaymentStatus,
    @Query('paymentMethod') paymentMethod?: PaymentMethod,
    @Query('search') search?: string,
  ) {
    return this.paymentsService.findAllAdmin({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
      paymentMethod,
      search,
    });
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.MEMBER)
  @ApiOperation({ summary: 'Record a payment (starts as PENDING until staff verification)' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreatePaymentDto,
  ) {
    return this.paymentsService.createPayment(user, body);
  }

  @Patch(':id/my')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Member one-time edit of their pending payment submission' })
  async editMyPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: EditMyPaymentDto,
  ) {
    return this.paymentsService.editMyPendingPayment(user, id, body);
  }

  @Patch(':id/verify')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('payments')
  @ApiOperation({ summary: 'Manually verify payment, issue receipt, and optionally activate membership' })
  async verifyPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyPaymentByStaff(user, id, body);
  }

  @Patch(':id/refund')
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('payments')
  @ApiOperation({ summary: 'Record refund for a payment' })
  async refundPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: RefundPaymentDto,
  ) {
    return this.paymentsService.refundPayment(user, id, body);
  }

  @Get(':id/receipt')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.MEMBER)
  @ApiOperation({ summary: 'Get payment receipt details (with ownership protection)' })
  async getReceipt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.paymentsService.getReceipt(user, id);
  }
}


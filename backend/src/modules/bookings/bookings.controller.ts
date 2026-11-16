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
import { BookingStatus, Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { BookingsService } from './bookings.service';
import { CancelBookingDto, CreateBookingDto } from './dto/bookings.dto';

@ApiTags('Class Bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('my')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Get authenticated member class bookings' })
  async findMy(@CurrentUser() user: AuthenticatedUser) {
    return this.bookingsService.findMyBookings(user.id);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.TRAINER)
  @RequirePermission('classes')
  @ApiOperation({ summary: 'List bookings with filters for Admin/Trainer' })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: BookingStatus,
    @Query('classScheduleId') classScheduleId?: string,
    @Query('search') search?: string,
  ) {
    return this.bookingsService.findAllAdminOrTrainer(user, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
      status,
      classScheduleId,
      search,
    });
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.MEMBER)
  @ApiOperation({ summary: 'Book a class session seat (with concurrency lock)' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(user, body);
  }

  @Patch(':id/cancel')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.MEMBER)
  @ApiOperation({ summary: 'Cancel a booking and release seat capacity' })
  async cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: CancelBookingDto,
  ) {
    return this.bookingsService.cancelBooking(
      user,
      id,
      body?.cancellationReason,
    );
  }
}


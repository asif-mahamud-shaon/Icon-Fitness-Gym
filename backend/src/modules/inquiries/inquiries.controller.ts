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
import { Throttle } from '@nestjs/throttler';
import { InquiryStatus, Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { InquiriesService } from './inquiries.service';
import { CreatePublicInquiryDto } from './dto/inquiries.dto';

@ApiTags('Contact Inquiries')
@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Public()
  @Throttle({ default: { limit: 6, ttl: 60000 } })
  @Post('public')
  @ApiOperation({ summary: 'Submit a public contact inquiry from the website' })
  async createPublic(@Body() body: CreatePublicInquiryDto) {
    return this.inquiriesService.createPublicInquiry(body);
  }

  @ApiBearerAuth()
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('content', 'crm')
  @ApiOperation({ summary: 'List website inquiries for Admin/Staff follow-up' })
  async findAll(@Query('status') status?: InquiryStatus) {
    return this.inquiriesService.findAllAdmin(status);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('content', 'crm')
  @ApiOperation({ summary: 'Update inquiry status, assignee, or internal notes' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body()
    body: {
      status?: InquiryStatus;
      assignedToUserId?: string | null;
      internalNotes?: string;
    },
  ) {
    return this.inquiriesService.updateInquiry(user, id, body);
  }
}


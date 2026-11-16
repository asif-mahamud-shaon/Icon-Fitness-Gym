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
import { DayOfWeek, Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { StrictRoles } from '../../common/decorators/strict-roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { SchedulesService } from './schedules.service';

@ApiTags('Class Schedules')
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Get weekly class timetable with real-time available seats' })
  async findPublic(@Query('dayOfWeek') dayOfWeek?: DayOfWeek) {
    return this.schedulesService.findPublicSchedules(dayOfWeek);
  }

  @ApiBearerAuth()
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.TRAINER)
  @RequirePermission('classes')
  @ApiOperation({ summary: 'List class schedules for Admin/Trainer' })
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.schedulesService.findAllAdminOrTrainer(user);
  }

  @ApiBearerAuth()
  @Post()
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('classes')
  @ApiOperation({ summary: 'Create a class schedule slot' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.schedulesService.createSchedule(user, body);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('classes')
  @ApiOperation({ summary: 'Update class schedule slot, capacity, or status' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.schedulesService.updateSchedule(user, id, body);
  }
}


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
import { Role, WorkoutGoal } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { WorkoutsService } from './workouts.service';

@ApiTags('Workouts & Programs')
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'List active public workout programs' })
  async findPublic(@Query('goal') goal?: WorkoutGoal) {
    return this.workoutsService.findPublic(goal);
  }

  @Public()
  @Get('public/:slug')
  @ApiOperation({ summary: 'Get public workout program detail by slug' })
  async findPublicBySlug(@Param('slug') slug: string) {
    return this.workoutsService.findPublicBySlug(slug);
  }

  @ApiBearerAuth()
  @Get('my')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Get authenticated member assigned workout programs' })
  async findMy(@CurrentUser() user: AuthenticatedUser) {
    return this.workoutsService.findMyAssignedWorkouts(user.id);
  }

  @ApiBearerAuth()
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.TRAINER)
  @RequirePermission('workouts')
  @ApiOperation({ summary: 'List all workout programs for Admin/Trainer' })
  async findAll() {
    return this.workoutsService.findAllAdminOrTrainer();
  }

  @ApiBearerAuth()
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)
  @RequirePermission('workouts')
  @ApiOperation({ summary: 'Create a workout program with ordered exercises' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.workoutsService.createProgram(user, body);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)
  @RequirePermission('workouts')
  @ApiOperation({ summary: 'Update workout program and exercise configuration' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.workoutsService.updateProgram(user, id, body);
  }

  @ApiBearerAuth()
  @Post('assign')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)
  @RequirePermission('workouts')
  @ApiOperation({ summary: 'Assign a workout program to a member' })
  async assignToMember(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.workoutsService.assignProgramToMember(user, body);
  }

  @ApiBearerAuth()
  @Patch('assignments/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER, Role.MEMBER)
  @ApiOperation({ summary: 'Update trainer notes or member progress on an assigned workout' })
  async updateAssignment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.workoutsService.updateAssignmentProgress(user, id, body);
  }
}


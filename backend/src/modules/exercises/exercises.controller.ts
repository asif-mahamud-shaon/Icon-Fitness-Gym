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
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { ExercisesService } from './exercises.service';

@ApiTags('Exercises')
@ApiBearerAuth()
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  @ApiOperation({ summary: 'List exercises in the training catalog' })
  async findAll(@Query('muscleGroup') muscleGroup?: string) {
    return this.exercisesService.findAll(muscleGroup);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)
  @RequirePermission('workouts')
  @ApiOperation({ summary: 'Create a new exercise' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.exercisesService.create(user, body);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)
  @RequirePermission('workouts')
  @ApiOperation({ summary: 'Update exercise instructions or metadata' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.exercisesService.update(user, id, body);
  }
}


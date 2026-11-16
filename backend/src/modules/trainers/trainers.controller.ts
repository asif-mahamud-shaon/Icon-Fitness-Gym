import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { TrainersService } from './trainers.service';

@ApiTags('Trainers')
@Controller('trainers')
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'List active public trainers' })
  async findPublic() {
    return this.trainersService.findPublic();
  }

  @Public()
  @Get('public/:slug')
  @ApiOperation({ summary: 'Get public trainer detail by slug' })
  async findPublicBySlug(@Param('slug') slug: string) {
    return this.trainersService.findPublicBySlug(slug);
  }

  @ApiBearerAuth()
  @Get('me/dashboard')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Get authenticated trainer portal dashboard and assigned members' })
  async getMyDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.trainersService.getMyTrainerDashboard(user.id);
  }

  @ApiBearerAuth()
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('trainers')
  @ApiOperation({ summary: 'List all trainers for Admin management' })
  async findAllAdmin() {
    return this.trainersService.findAllAdmin();
  }

  @ApiBearerAuth()
  @Get(':id/details')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Get rich Admin Trainer Details view with schedules, attendance, and assigned members' })
  async findAdminDetails(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.trainersService.findAdminDetails(user, id);
  }

  @ApiBearerAuth()
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('trainers')
  @ApiOperation({ summary: 'Create a new trainer profile and account' })
  async createTrainer(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.trainersService.createTrainer(user, body);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Update trainer profile details' })
  async updateTrainer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.trainersService.updateTrainer(user, id, body);
  }
}


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
import { StrictRoles } from '../../common/decorators/strict-roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { ClassesService } from './classes.service';

@ApiTags('Classes & Facilities')
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'List published gym classes and schedules' })
  async findPublicClasses() {
    return this.classesService.findPublicClasses();
  }

  @Public()
  @Get('facilities/public')
  @ApiOperation({ summary: 'List published gym facilities' })
  async findPublicFacilities() {
    return this.classesService.findPublicFacilities();
  }

  @ApiBearerAuth()
  @Get('facilities')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('classes')
  @ApiOperation({ summary: 'List all facilities for Admin management' })
  async findAllFacilitiesAdmin() {
    return this.classesService.findAllFacilitiesAdmin();
  }

  @ApiBearerAuth()
  @Post('facilities')
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('classes')
  @ApiOperation({ summary: 'Create a configurable gym facility' })
  async createFacility(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.classesService.createFacility(user, body);
  }

  @ApiBearerAuth()
  @Patch('facilities/:id')
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('classes')
  @ApiOperation({ summary: 'Update a configurable gym facility' })
  async updateFacility(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.classesService.updateFacility(user, id, body);
  }

  @ApiBearerAuth()
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.TRAINER)
  @RequirePermission('classes')
  @ApiOperation({ summary: 'List all gym classes for Admin/Trainer' })
  async findAllAdmin() {
    return this.classesService.findAllAdmin();
  }

  @ApiBearerAuth()
  @Post()
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('classes')
  @ApiOperation({ summary: 'Create a new gym class' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.classesService.createClass(user, body);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('classes')
  @ApiOperation({ summary: 'Update gym class details or publishing status' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.classesService.updateClass(user, id, body);
  }
}


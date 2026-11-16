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
import { GalleryCategory, Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { StrictRoles } from '../../common/decorators/strict-roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { GalleryService } from './gallery.service';

@ApiTags('Gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'List published gallery photographs and videos' })
  async findPublic(@Query('category') category?: GalleryCategory) {
    return this.galleryService.findPublic(category);
  }

  @ApiBearerAuth()
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('content')
  @ApiOperation({ summary: 'List all gallery media for Admin management' })
  async findAllAdmin() {
    return this.galleryService.findAllAdmin();
  }

  @ApiBearerAuth()
  @Post()
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('content')
  @ApiOperation({ summary: 'Add new gallery media item' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.galleryService.create(user, body);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('content')
  @ApiOperation({ summary: 'Update gallery item caption, category, or published status' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.galleryService.update(user, id, body);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('content')
  @ApiOperation({ summary: 'Delete gallery media item' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.galleryService.remove(user, id);
  }
}


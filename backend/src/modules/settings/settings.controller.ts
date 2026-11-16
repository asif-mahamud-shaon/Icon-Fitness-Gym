import { Body, Controller, Get, Patch } from '@nestjs/common';
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
import { SettingsService } from './settings.service';

@ApiTags('Gym Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Get public gym branding, location, hours, and policies' })
  async getPublicSettings() {
    return this.settingsService.getOrCreateSettings();
  }

  @ApiBearerAuth()
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('website_cms')
  @ApiOperation({ summary: 'Get complete gym configuration settings' })
  async getAdminSettings() {
    return this.settingsService.getOrCreateSettings();
  }

  @ApiBearerAuth()
  @Patch()
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('website_cms')
  @ApiOperation({ summary: 'Update gym branding, website CMS, contact info, hours, and booking policies' })
  async updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: Record<string, any>,
  ) {
    return this.settingsService.updateSettings(user, body);
  }
}


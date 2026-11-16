import {
  Body,
  Controller,
  Delete,
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
import { TestimonialsService } from './testimonials.service';

@ApiTags('Testimonials')
@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'List approved and published member testimonials' })
  async findPublic() {
    return this.testimonialsService.findPublic();
  }

  @ApiBearerAuth()
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermission('content')
  @ApiOperation({ summary: 'List all testimonials for moderation' })
  async findAllAdmin() {
    return this.testimonialsService.findAllAdmin();
  }

  @ApiBearerAuth()
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.MEMBER)
  @ApiOperation({ summary: 'Create a member testimonial' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.testimonialsService.create(user, body);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('content')
  @ApiOperation({ summary: 'Approve, publish, or edit a testimonial' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.testimonialsService.update(user, id, body);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @StrictRoles()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermission('content')
  @ApiOperation({ summary: 'Delete a testimonial' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.testimonialsService.remove(user, id);
  }
}


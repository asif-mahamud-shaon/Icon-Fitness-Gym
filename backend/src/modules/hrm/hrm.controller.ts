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
import { GymExpenseCategory, Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { HrmService } from './hrm.service';
import {
  CreateGymExpenseDto,
  CreateHrmEmployeeDto,
  CreateHrmSalaryPaymentDto,
  UpdateGymExpenseDto,
  UpdateHrmEmployeeDto,
  UpdateHrmSalaryStatusDto,
} from './dto/hrm.dto';

@ApiTags('Gym HRM, Payroll & Utility Accounting')
@ApiBearerAuth()
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
@RequirePermission('hrm')
@Controller('hrm')
export class HrmController {
  constructor(private readonly hrmService: HrmService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get unified gym financial, payroll, store profit & utility accounting overview' })
  async getOverview(@Query('month') month?: string) {
    return this.hrmService.getOverview(month);
  }

  @Get('employees')
  @ApiOperation({ summary: 'List all gym staff & trainer HRM profiles' })
  async findEmployees() {
    return this.hrmService.findEmployees();
  }

  @Post('employees')
  @ApiOperation({ summary: 'Add a new gym employee profile' })
  async createEmployee(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHrmEmployeeDto,
  ) {
    return this.hrmService.createEmployee(user, dto);
  }

  @Patch('employees/:id')
  @ApiOperation({ summary: 'Update employee salary, role, or status' })
  async updateEmployee(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateHrmEmployeeDto,
  ) {
    return this.hrmService.updateEmployee(user, id, dto);
  }

  @Delete('employees/:id')
  @ApiOperation({ summary: 'Delete an employee profile' })
  async removeEmployee(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.hrmService.removeEmployee(user, id);
  }

  @Get('salaries')
  @ApiOperation({ summary: 'List staff monthly salary payments' })
  async findSalaryPayments(@Query('month') month?: string) {
    return this.hrmService.findSalaryPayments(month);
  }

  @Post('salaries')
  @ApiOperation({ summary: 'Record a monthly salary payment for a staff member' })
  async createSalaryPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHrmSalaryPaymentDto,
  ) {
    return this.hrmService.createSalaryPayment(user, dto);
  }

  @Patch('salaries/:id/status')
  @ApiOperation({ summary: 'Update salary payment status' })
  async updateSalaryStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateHrmSalaryStatusDto,
  ) {
    return this.hrmService.updateSalaryStatus(user, id, dto);
  }

  @Delete('salaries/:id')
  @ApiOperation({ summary: 'Remove a salary payment entry' })
  async deleteSalaryPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.hrmService.deleteSalaryPayment(user, id);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'List utility bills and gym operating costs' })
  async findExpenses(
    @Query('month') month?: string,
    @Query('category') category?: GymExpenseCategory,
  ) {
    return this.hrmService.findExpenses({ monthKey: month, category });
  }

  @Post('expenses')
  @ApiOperation({ summary: 'Log a new utility bill or operational expense' })
  async createExpense(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateGymExpenseDto,
  ) {
    return this.hrmService.createExpense(user, dto);
  }

  @Patch('expenses/:id')
  @ApiOperation({ summary: 'Update utility bill or expense entry' })
  async updateExpense(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateGymExpenseDto,
  ) {
    return this.hrmService.updateExpense(user, id, dto);
  }

  @Delete('expenses/:id')
  @ApiOperation({ summary: 'Delete an expense entry' })
  async deleteExpense(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.hrmService.deleteExpense(user, id);
  }
}

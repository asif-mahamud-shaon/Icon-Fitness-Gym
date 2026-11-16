import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GymExpenseCategory,
  LedgerPaymentStatus,
  PaymentStatus,
  StoreOrderStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import {
  CreateGymExpenseDto,
  CreateHrmEmployeeDto,
  CreateHrmSalaryPaymentDto,
  UpdateGymExpenseDto,
  UpdateHrmEmployeeDto,
  UpdateHrmSalaryStatusDto,
} from './dto/hrm.dto';

const UTILITY_CATEGORIES = new Set<GymExpenseCategory>([
  GymExpenseCategory.ELECTRICITY,
  GymExpenseCategory.WATER,
  GymExpenseCategory.GAS,
  GymExpenseCategory.INTERNET,
  GymExpenseCategory.RENT,
]);

@Injectable()
export class HrmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private getCurrentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private getMonthDateWindow(monthKey?: string): {
    isAll: boolean;
    normalizedMonth: string;
    start?: Date;
    end?: Date;
  } {
    if (!monthKey || monthKey.toUpperCase() === 'ALL') {
      if (monthKey?.toUpperCase() === 'ALL') {
        return { isAll: true, normalizedMonth: 'ALL' };
      }
      const cur = this.getCurrentMonthKey();
      const [y, m] = cur.split('-').map(Number);
      return {
        isAll: false,
        normalizedMonth: cur,
        start: new Date(Date.UTC(y, m - 1, 1, 0, 0, 0)),
        end: new Date(Date.UTC(y, m, 1, 0, 0, 0)),
      };
    }

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey)) {
      throw new BadRequestException('Invalid month format. Expected YYYY-MM or ALL.');
    }

    const [y, m] = monthKey.split('-').map(Number);
    return {
      isAll: false,
      normalizedMonth: monthKey,
      start: new Date(Date.UTC(y, m - 1, 1, 0, 0, 0)),
      end: new Date(Date.UTC(y, m, 1, 0, 0, 0)),
    };
  }

  async getOverview(monthParam?: string) {
    const window = this.getMonthDateWindow(monthParam);

    const paymentWhere: Record<string, any> = {
      status: PaymentStatus.VERIFIED_PAID,
    };
    const storeOrderWhere: Record<string, any> = {
      status: { not: StoreOrderStatus.CANCELLED },
    };
    const monthFilter = window.isAll ? {} : { monthKey: window.normalizedMonth };

    if (!window.isAll && window.start && window.end) {
      paymentWhere.OR = [
        { paidAt: { gte: window.start, lt: window.end } },
        { AND: [{ paidAt: null }, { createdAt: { gte: window.start, lt: window.end } }] },
      ];
      storeOrderWhere.createdAt = { gte: window.start, lt: window.end };
    }

    const [
      verifiedPayments,
      storeOrders,
      employees,
      salaryPayments,
      expenses,
    ] = await Promise.all([
      this.prisma.payment.findMany({
        where: paymentWhere,
        select: { amountBdt: true },
      }),
      this.prisma.storeOrder.findMany({
        where: storeOrderWhere,
        include: { items: true },
      }),
      this.prisma.hrmEmployee.findMany({
        orderBy: [{ status: 'asc' }, { fullName: 'asc' }],
      }),
      this.prisma.hrmSalaryPayment.findMany({
        where: monthFilter,
        include: { employee: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.gymExpense.findMany({
        where: monthFilter,
        orderBy: [{ createdAt: 'desc' }],
      }),
    ]);

    const membershipRevenueBdt = verifiedPayments.reduce(
      (sum, p) => sum + Number(p.amountBdt || 0),
      0,
    );

    let storeRevenueBdt = 0;
    let storeCostBdt = 0;
    let storeProfitBdt = 0;

    for (const order of storeOrders) {
      storeRevenueBdt += Number(order.totalAmountBdt || 0);
      for (const item of order.items) {
        const itemCost = Number(item.unitCostBdt || 0) * item.quantity;
        const itemProfit =
          item.profitBdt !== null && item.profitBdt !== undefined
            ? Number(item.profitBdt)
            : Number(item.subtotalBdt || 0) - itemCost;
        storeCostBdt += itemCost;
        storeProfitBdt += itemProfit;
      }
    }

    const salaryPaidBdt = salaryPayments
      .filter((s) => s.status === LedgerPaymentStatus.PAID)
      .reduce((sum, s) => sum + Number(s.netPaidBdt || 0), 0);

    const salaryPendingBdt = salaryPayments
      .filter((s) => s.status === LedgerPaymentStatus.PENDING)
      .reduce((sum, s) => sum + Number(s.netPaidBdt || 0), 0);

    const utilityBillsBdt = expenses
      .filter(
        (e) =>
          e.status === LedgerPaymentStatus.PAID &&
          UTILITY_CATEGORIES.has(e.category),
      )
      .reduce((sum, e) => sum + Number(e.amountBdt || 0), 0);

    const utilityPendingBdt = expenses
      .filter((e) => e.status === LedgerPaymentStatus.PENDING)
      .reduce((sum, e) => sum + Number(e.amountBdt || 0), 0);

    const operationsAndMiscBdt = expenses
      .filter(
        (e) =>
          e.status === LedgerPaymentStatus.PAID &&
          !UTILITY_CATEGORIES.has(e.category),
      )
      .reduce((sum, e) => sum + Number(e.amountBdt || 0), 0);

    const totalExpensesPaidBdt =
      salaryPaidBdt + utilityBillsBdt + operationsAndMiscBdt;
    const grossIncomeBdt = membershipRevenueBdt + storeRevenueBdt;
    const netGymProfitBdt =
      membershipRevenueBdt + storeProfitBdt - totalExpensesPaidBdt;

    const categoryTotals: Record<string, number> = {
      SALARIES: salaryPaidBdt,
      STORE_STOCK_COST: storeCostBdt,
    };
    for (const exp of expenses) {
      if (exp.status === LedgerPaymentStatus.PAID) {
        categoryTotals[exp.category] =
          (categoryTotals[exp.category] || 0) + Number(exp.amountBdt || 0);
      }
    }

    const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');
    const paidEmployeeIds = new Set(salaryPayments.map((s) => s.employeeId));
    const unpaidActiveStaffCount = window.isAll
      ? 0
      : activeEmployees.filter((e) => !paidEmployeeIds.has(e.id)).length;

    return {
      monthKey: window.normalizedMonth,
      membershipRevenueBdt,
      membershipPaymentsCount: verifiedPayments.length,
      storeRevenueBdt,
      storeCostBdt,
      storeProfitBdt,
      storeOrdersCount: storeOrders.length,
      grossIncomeBdt,
      salaryPaidBdt,
      salaryPendingBdt,
      utilityBillsBdt,
      utilityPendingBdt,
      operationsAndMiscBdt,
      totalExpensesPaidBdt,
      netGymProfitBdt,
      activeStaffCount: activeEmployees.length,
      totalStaffCount: employees.length,
      unpaidActiveStaffCount,
      estimatedMonthlyPayrollBdt: activeEmployees.reduce(
        (sum, e) =>
          sum + Number(e.baseSalaryBdt || 0) + Number(e.defaultAllowanceBdt || 0),
        0,
      ),
      expenseBreakdown: categoryTotals,
    };
  }

  async findEmployees() {
    return this.prisma.hrmEmployee.findMany({
      include: {
        salaryPayments: {
          orderBy: { monthKey: 'desc' },
          take: 6,
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createEmployee(actor: AuthenticatedUser, dto: CreateHrmEmployeeDto) {
    const count = await this.prisma.hrmEmployee.count();
    const code = `IFG-EMP-${String(count + 1).padStart(3, '0')}`;

    const employee = await this.prisma.hrmEmployee.create({
      data: {
        employeeCode: code,
        fullName: dto.fullName.trim(),
        phone: dto.phone.trim(),
        email: dto.email?.trim().toLowerCase() || null,
        designation: dto.designation.trim(),
        department: dto.department,
        baseSalaryBdt: dto.baseSalaryBdt,
        defaultAllowanceBdt: dto.defaultAllowanceBdt ?? 0,
        joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : new Date(),
        payoutAccount: dto.payoutAccount?.trim() || null,
        nidLast4: dto.nidLast4?.trim() || null,
        status: dto.status ?? 'ACTIVE',
        notes: dto.notes?.trim() || null,
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'HRM_EMPLOYEE_CREATED',
      entityType: 'HrmEmployee',
      entityId: employee.id,
      summary: `Added staff "${employee.fullName}" (${employee.designation}) at base salary ৳${employee.baseSalaryBdt}`,
    });

    return employee;
  }

  async updateEmployee(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateHrmEmployeeDto,
  ) {
    const existing = await this.prisma.hrmEmployee.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Employee record not found.');
    }

    const updated = await this.prisma.hrmEmployee.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined ? { fullName: dto.fullName.trim() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone.trim() } : {}),
        ...(dto.email !== undefined
          ? { email: dto.email.trim().toLowerCase() || null }
          : {}),
        ...(dto.designation !== undefined
          ? { designation: dto.designation.trim() }
          : {}),
        ...(dto.department !== undefined ? { department: dto.department } : {}),
        ...(dto.baseSalaryBdt !== undefined
          ? { baseSalaryBdt: dto.baseSalaryBdt }
          : {}),
        ...(dto.defaultAllowanceBdt !== undefined
          ? { defaultAllowanceBdt: dto.defaultAllowanceBdt }
          : {}),
        ...(dto.payoutAccount !== undefined
          ? { payoutAccount: dto.payoutAccount.trim() || null }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes.trim() || null } : {}),
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'HRM_EMPLOYEE_UPDATED',
      entityType: 'HrmEmployee',
      entityId: id,
      summary: `Updated staff "${updated.fullName}" (${updated.status}, Base ৳${updated.baseSalaryBdt})`,
    });

    return updated;
  }

  async removeEmployee(actor: AuthenticatedUser, id: string) {
    const existing = await this.prisma.hrmEmployee.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Employee record not found.');
    }
    await this.prisma.hrmEmployee.delete({ where: { id } });
    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'HRM_EMPLOYEE_DELETED',
      entityType: 'HrmEmployee',
      entityId: id,
      summary: `Removed staff "${existing.fullName}" (${existing.employeeCode})`,
    });
    return { deleted: true };
  }

  async findSalaryPayments(monthKey?: string) {
    const where: Record<string, any> = {};
    if (monthKey && monthKey !== 'ALL') {
      where.monthKey = monthKey;
    }

    return this.prisma.hrmSalaryPayment.findMany({
      where,
      include: { employee: true },
      orderBy: [{ monthKey: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createSalaryPayment(
    actor: AuthenticatedUser,
    dto: CreateHrmSalaryPaymentDto,
  ) {
    const employee = await this.prisma.hrmEmployee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    const existing = await this.prisma.hrmSalaryPayment.findUnique({
      where: {
        employeeId_monthKey: {
          employeeId: dto.employeeId,
          monthKey: dto.monthKey,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Salary for ${employee.fullName} is already recorded for ${dto.monthKey}.`,
      );
    }

    const bonus = Number(dto.bonusBdt || 0);
    const overtime = Number(dto.overtimeBdt || 0);
    const deduction = Number(dto.deductionBdt || 0);
    const base = Number(dto.baseSalaryBdt);
    const netPaidBdt = Math.max(0, base + bonus + overtime - deduction);
    const status = dto.status ?? LedgerPaymentStatus.PAID;

    const record = await this.prisma.hrmSalaryPayment.create({
      data: {
        employeeId: dto.employeeId,
        monthKey: dto.monthKey,
        baseSalaryBdt: base,
        bonusBdt: bonus,
        overtimeBdt: overtime,
        deductionBdt: deduction,
        netPaidBdt,
        paymentMethod: dto.paymentMethod,
        paymentRef: dto.paymentRef?.trim() || null,
        status,
        paidAt: new Date(),
        paidByUserId: actor.id,
        notes: dto.notes?.trim() || null,
      },
      include: { employee: true },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'HRM_SALARY_RECORDED',
      entityType: 'HrmSalaryPayment',
      entityId: record.id,
      summary: `Recorded ${dto.monthKey} salary for ${employee.fullName}: ৳${netPaidBdt} (${status})`,
    });

    return record;
  }

  async updateSalaryStatus(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateHrmSalaryStatusDto,
  ) {
    const existing = await this.prisma.hrmSalaryPayment.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!existing) {
      throw new NotFoundException('Salary record not found.');
    }

    const updated = await this.prisma.hrmSalaryPayment.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.paymentRef !== undefined
          ? { paymentRef: dto.paymentRef.trim() || null }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes.trim() || null } : {}),
        ...(dto.status === LedgerPaymentStatus.PAID ? { paidAt: new Date() } : {}),
      },
      include: { employee: true },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'HRM_SALARY_STATUS_UPDATED',
      entityType: 'HrmSalaryPayment',
      entityId: id,
      summary: `Updated ${existing.employee.fullName} (${existing.monthKey}) salary status to ${dto.status}`,
    });

    return updated;
  }

  async deleteSalaryPayment(actor: AuthenticatedUser, id: string) {
    const existing = await this.prisma.hrmSalaryPayment.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!existing) {
      throw new NotFoundException('Salary record not found.');
    }
    await this.prisma.hrmSalaryPayment.delete({ where: { id } });
    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'HRM_SALARY_DELETED',
      entityType: 'HrmSalaryPayment',
      entityId: id,
      summary: `Deleted ${existing.monthKey} salary entry for ${existing.employee.fullName}`,
    });
    return { deleted: true };
  }

  async findExpenses(params: {
    monthKey?: string;
    category?: GymExpenseCategory;
  }) {
    const where: Record<string, any> = {};
    if (params.monthKey && params.monthKey !== 'ALL') {
      where.monthKey = params.monthKey;
    }
    if (params.category) {
      where.category = params.category;
    }

    return this.prisma.gymExpense.findMany({
      where,
      orderBy: [{ monthKey: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createExpense(actor: AuthenticatedUser, dto: CreateGymExpenseDto) {
    const status = dto.status ?? LedgerPaymentStatus.PAID;
    const expense = await this.prisma.gymExpense.create({
      data: {
        title: dto.title.trim(),
        category: dto.category,
        vendorName: dto.vendorName?.trim() || null,
        billReference: dto.billReference?.trim() || null,
        monthKey: dto.monthKey,
        amountBdt: dto.amountBdt,
        status,
        paymentMethod: dto.paymentMethod,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        paidAt: status === LedgerPaymentStatus.PAID ? new Date() : null,
        recordedByUserId: actor.id,
        notes: dto.notes?.trim() || null,
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'HRM_EXPENSE_CREATED',
      entityType: 'GymExpense',
      entityId: expense.id,
      summary: `Logged ${expense.category} bill "${expense.title}" (${expense.monthKey}): ৳${expense.amountBdt}`,
    });

    return expense;
  }

  async updateExpense(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateGymExpenseDto,
  ) {
    const existing = await this.prisma.gymExpense.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Expense record not found.');
    }

    const updated = await this.prisma.gymExpense.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.vendorName !== undefined
          ? { vendorName: dto.vendorName.trim() || null }
          : {}),
        ...(dto.billReference !== undefined
          ? { billReference: dto.billReference.trim() || null }
          : {}),
        ...(dto.amountBdt !== undefined ? { amountBdt: dto.amountBdt } : {}),
        ...(dto.status !== undefined
          ? {
              status: dto.status,
              paidAt:
                dto.status === LedgerPaymentStatus.PAID ? new Date() : null,
            }
          : {}),
        ...(dto.paymentMethod !== undefined
          ? { paymentMethod: dto.paymentMethod }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes.trim() || null } : {}),
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'HRM_EXPENSE_UPDATED',
      entityType: 'GymExpense',
      entityId: id,
      summary: `Updated expense "${updated.title}" (৳${updated.amountBdt}, ${updated.status})`,
    });

    return updated;
  }

  async deleteExpense(actor: AuthenticatedUser, id: string) {
    const existing = await this.prisma.gymExpense.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Expense record not found.');
    }
    await this.prisma.gymExpense.delete({ where: { id } });
    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'HRM_EXPENSE_DELETED',
      entityType: 'GymExpense',
      entityId: id,
      summary: `Deleted expense "${existing.title}" (${existing.monthKey})`,
    });
    return { deleted: true };
  }
}

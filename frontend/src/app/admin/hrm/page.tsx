'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Wallet,
  Users,
  Receipt,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Zap,
  Droplets,
  Flame,
  Wifi,
  Building2,
  Wrench,
  Sparkles,
  Download,
  Banknote,
  Calendar,
} from 'lucide-react';
import { apiFetch, formatBdt, formatDate } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Card,
  Button,
  StatusBadge,
  Modal,
  Input,
  Skeleton,
  EmptyState,
} from '@/components/ui';

const DEPARTMENTS = [
  { value: 'TRAINING', label: 'Trainers & Coaching' },
  { value: 'FRONT_DESK', label: 'Front Desk & Reception' },
  { value: 'HOUSEKEEPING', label: 'Housekeeping & Cleaning' },
  { value: 'SECURITY', label: 'Security & Support' },
  { value: 'MANAGEMENT', label: 'Gym Management' },
];

const EXPENSE_CATEGORIES = [
  { value: 'ELECTRICITY', label: 'Electricity Bill (DESCO)', icon: Zap },
  { value: 'RENT', label: 'Gym Floor Rent', icon: Building2 },
  { value: 'WATER', label: 'Water Bill (WASA)', icon: Droplets },
  { value: 'GAS', label: 'Gas Bill', icon: Flame },
  { value: 'INTERNET', label: 'Internet & WiFi', icon: Wifi },
  { value: 'EQUIPMENT_MAINTENANCE', label: 'Equipment Repair / Service', icon: Wrench },
  { value: 'CLEANING_SUPPLIES', label: 'Cleaning & Hygiene', icon: Sparkles },
  { value: 'MARKETING', label: 'Marketing & Ads', icon: TrendingUp },
  { value: 'MISC', label: 'Other Miscellaneous Cost', icon: Receipt },
];

function getDefaultMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function AdminHrmPage() {
  const { toast } = useToast();
  const [monthKey, setMonthKey] = useState<string>(getDefaultMonthKey);
  const [tab, setTab] = useState<'ledger' | 'payroll' | 'employees'>('ledger');
  const [loading, setLoading] = useState(true);

  const [overview, setOverview] = useState<any>({});
  const [employees, setEmployees] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  // Employee Modal
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [savingEmp, setSavingEmp] = useState(false);
  const [empForm, setEmpForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    designation: 'Gym Trainer',
    department: 'TRAINING',
    baseSalaryBdt: '',
    defaultAllowanceBdt: '0',
    payoutAccount: '',
    nidLast4: '',
    status: 'ACTIVE',
    notes: '',
  });

  // Salary Payment Modal
  const [salaryModalOpen, setSalaryModalOpen] = useState(false);
  const [savingSalary, setSavingSalary] = useState(false);
  const [salaryForm, setSalaryForm] = useState({
    employeeId: '',
    monthKey: getDefaultMonthKey(),
    baseSalaryBdt: '0',
    bonusBdt: '0',
    overtimeBdt: '0',
    deductionBdt: '0',
    paymentMethod: 'CASH',
    paymentRef: '',
    status: 'PAID',
    notes: '',
  });

  // Expense / Utility Bill Modal
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [savingExp, setSavingExp] = useState(false);
  const [expForm, setExpForm] = useState({
    title: '',
    category: 'ELECTRICITY',
    vendorName: '',
    billReference: '',
    monthKey: getDefaultMonthKey(),
    amountBdt: '',
    status: 'PAID',
    paymentMethod: 'CASH',
    notes: '',
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const q = encodeURIComponent(monthKey || 'ALL');
      const [ov, empList, salList, expList] = await Promise.all([
        apiFetch<any>(`/hrm/overview?month=${q}`).catch(() => ({})),
        apiFetch<any[]>('/hrm/employees').catch(() => []),
        apiFetch<any[]>(`/hrm/salaries?month=${q}`).catch(() => []),
        apiFetch<any[]>(`/hrm/expenses?month=${q}`).catch(() => []),
      ]);
      setOverview(ov || {});
      setEmployees(Array.isArray(empList) ? empList : []);
      setSalaries(Array.isArray(salList) ? salList : []);
      setExpenses(Array.isArray(expList) ? expList : []);
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const paidEmployeeMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const sal of salaries) {
      if (monthKey === 'ALL' || sal.monthKey === monthKey) {
        map.set(sal.employeeId, sal);
      }
    }
    return map;
  }, [salaries, monthKey]);

  const activeMonthForActions =
    monthKey === 'ALL' ? getDefaultMonthKey() : monthKey;

  const openAddEmployee = () => {
    setEditingEmployee(null);
    setEmpForm({
      fullName: '',
      phone: '',
      email: '',
      designation: 'Gym Trainer',
      department: 'TRAINING',
      baseSalaryBdt: '',
      defaultAllowanceBdt: '0',
      payoutAccount: '',
      nidLast4: '',
      status: 'ACTIVE',
      notes: '',
    });
    setEmpModalOpen(true);
  };

  const openEditEmployee = (emp: any) => {
    setEditingEmployee(emp);
    setEmpForm({
      fullName: emp.fullName || '',
      phone: emp.phone || '',
      email: emp.email || '',
      designation: emp.designation || '',
      department: emp.department || 'FRONT_DESK',
      baseSalaryBdt: String(emp.baseSalaryBdt ?? ''),
      defaultAllowanceBdt: String(emp.defaultAllowanceBdt ?? '0'),
      payoutAccount: emp.payoutAccount || '',
      nidLast4: emp.nidLast4 || '',
      status: emp.status || 'ACTIVE',
      notes: emp.notes || '',
    });
    setEmpModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEmp(true);
    try {
      const payload = {
        fullName: empForm.fullName,
        phone: empForm.phone,
        email: empForm.email || undefined,
        designation: empForm.designation,
        department: empForm.department,
        baseSalaryBdt: Number(empForm.baseSalaryBdt),
        defaultAllowanceBdt: Number(empForm.defaultAllowanceBdt || 0),
        payoutAccount: empForm.payoutAccount || undefined,
        nidLast4: empForm.nidLast4 || undefined,
        status: empForm.status,
        notes: empForm.notes || undefined,
      };
      if (editingEmployee) {
        await apiFetch(`/hrm/employees/${editingEmployee.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast({ title: 'Staff Profile Updated', variant: 'success' });
      } else {
        await apiFetch('/hrm/employees', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast({ title: 'Staff Member Added', variant: 'success' });
      }
      setEmpModalOpen(false);
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Save Failed', description: err.message, variant: 'error' });
    } finally {
      setSavingEmp(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      await apiFetch(`/hrm/employees/${id}`, { method: 'DELETE' });
      toast({ title: 'Staff Record Removed', variant: 'success' });
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Delete Failed', description: err.message, variant: 'error' });
    }
  };

  const openPaySalaryModal = (emp?: any) => {
    const target = emp || employees.find((e) => e.status === 'ACTIVE');
    setSalaryForm({
      employeeId: target?.id || '',
      monthKey: activeMonthForActions,
      baseSalaryBdt: String(target?.baseSalaryBdt ?? 0),
      bonusBdt: String(target?.defaultAllowanceBdt ?? 0),
      overtimeBdt: '0',
      deductionBdt: '0',
      paymentMethod: 'CASH',
      paymentRef: '',
      status: 'PAID',
      notes: '',
    });
    setSalaryModalOpen(true);
  };

  const computedNetSalary = Math.max(
    0,
    Number(salaryForm.baseSalaryBdt || 0) +
      Number(salaryForm.bonusBdt || 0) +
      Number(salaryForm.overtimeBdt || 0) -
      Number(salaryForm.deductionBdt || 0),
  );

  const handlePaySalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryForm.employeeId) return;
    setSavingSalary(true);
    try {
      await apiFetch('/hrm/salaries', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: salaryForm.employeeId,
          monthKey: salaryForm.monthKey,
          baseSalaryBdt: Number(salaryForm.baseSalaryBdt),
          bonusBdt: Number(salaryForm.bonusBdt || 0),
          overtimeBdt: Number(salaryForm.overtimeBdt || 0),
          deductionBdt: Number(salaryForm.deductionBdt || 0),
          paymentMethod: salaryForm.paymentMethod,
          paymentRef: salaryForm.paymentRef || undefined,
          status: salaryForm.status,
          notes: salaryForm.notes || undefined,
        }),
      });
      toast({ title: 'Salary Payment Recorded', variant: 'success' });
      setSalaryModalOpen(false);
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Salary Error', description: err.message, variant: 'error' });
    } finally {
      setSavingSalary(false);
    }
  };

  const handleToggleSalaryStatus = async (sal: any) => {
    const nextStatus = sal.status === 'PAID' ? 'PENDING' : 'PAID';
    try {
      await apiFetch(`/hrm/salaries/${sal.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      toast({ title: `Salary marked ${nextStatus}`, variant: 'success' });
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Update Failed', description: err.message, variant: 'error' });
    }
  };

  const handleDeleteSalary = async (id: string) => {
    try {
      await apiFetch(`/hrm/salaries/${id}`, { method: 'DELETE' });
      toast({ title: 'Salary Entry Deleted', variant: 'success' });
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Delete Failed', description: err.message, variant: 'error' });
    }
  };

  const openExpenseModal = (presetCategory?: string, presetTitle?: string) => {
    setEditingExpense(null);
    setExpForm({
      title: presetTitle || '',
      category: presetCategory || 'ELECTRICITY',
      vendorName: '',
      billReference: '',
      monthKey: activeMonthForActions,
      amountBdt: '',
      status: 'PAID',
      paymentMethod: 'CASH',
      notes: '',
    });
    setExpModalOpen(true);
  };

  const openEditExpense = (exp: any) => {
    setEditingExpense(exp);
    setExpForm({
      title: exp.title || '',
      category: exp.category || 'MISC',
      vendorName: exp.vendorName || '',
      billReference: exp.billReference || '',
      monthKey: exp.monthKey || activeMonthForActions,
      amountBdt: String(exp.amountBdt ?? ''),
      status: exp.status || 'PAID',
      paymentMethod: exp.paymentMethod || 'CASH',
      notes: exp.notes || '',
    });
    setExpModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingExp(true);
    try {
      const payload = {
        title: expForm.title,
        category: expForm.category,
        vendorName: expForm.vendorName || undefined,
        billReference: expForm.billReference || undefined,
        monthKey: expForm.monthKey,
        amountBdt: Number(expForm.amountBdt),
        status: expForm.status,
        paymentMethod: expForm.paymentMethod,
        notes: expForm.notes || undefined,
      };
      if (editingExpense) {
        await apiFetch(`/hrm/expenses/${editingExpense.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast({ title: 'Expense Updated', variant: 'success' });
      } else {
        await apiFetch('/hrm/expenses', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast({ title: 'Bill / Cost Logged', variant: 'success' });
      }
      setExpModalOpen(false);
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Save Failed', description: err.message, variant: 'error' });
    } finally {
      setSavingExp(false);
    }
  };

  const handleToggleExpenseStatus = async (exp: any) => {
    const nextStatus = exp.status === 'PAID' ? 'PENDING' : 'PAID';
    try {
      await apiFetch(`/hrm/expenses/${exp.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      toast({ title: `Bill marked ${nextStatus}`, variant: 'success' });
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Update Failed', description: err.message, variant: 'error' });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await apiFetch(`/hrm/expenses/${id}`, { method: 'DELETE' });
      toast({ title: 'Bill Deleted', variant: 'success' });
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Delete Failed', description: err.message, variant: 'error' });
    }
  };

  const handleExportAccountingCsv = () => {
    const lines = [
      ['Section', 'Item / Title', 'Category / Role', 'Month', 'Status', 'Amount (BDT)'],
      ['INCOME', 'Membership Fees Verified', 'MEMBERSHIP', overview.monthKey || monthKey, 'PAID', String(overview.membershipRevenueBdt ?? 0)],
      ['INCOME', 'Store Gear Sales Revenue', 'STORE_SALES', overview.monthKey || monthKey, 'ACTIVE', String(overview.storeRevenueBdt ?? 0)],
      ['COST', 'Store Gear Buying Cost', 'STORE_COST', overview.monthKey || monthKey, 'COGS', String(overview.storeCostBdt ?? 0)],
      ...salaries.map((s) => [
        'SALARY',
        s.employee?.fullName || 'Staff',
        s.employee?.designation || 'STAFF',
        s.monthKey,
        s.status,
        String(s.netPaidBdt),
      ]),
      ...expenses.map((ex) => [
        'BILL_EXPENSE',
        ex.title,
        ex.category,
        ex.monthKey,
        ex.status,
        String(ex.amountBdt),
      ]),
      ['SUMMARY', 'Net Gym Profit / Loss', 'NET_PROFIT', overview.monthKey || monthKey, 'CALCULATED', String(overview.netGymProfitBdt ?? 0)],
    ];

    const csv = lines
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `icon-fitness-hrm-hisab-${monthKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const netProfit = Number(overview.netGymProfitBdt ?? 0);

  return (
    <div className="space-y-6">
      {/* Header + Month Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            HRM, Salary Payroll &amp; Utility Accounting
          </h1>
          <p className="text-sm text-[#A1A1AA]">
            Complete monthly হিসাব combining staff salaries, electricity, water, rent, maintenance, membership income, and store profit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#141414] border border-[#2C2C2C]">
            <Calendar className="w-4 h-4 text-[#C7F464]" />
            <input
              type="month"
              value={monthKey === 'ALL' ? getDefaultMonthKey() : monthKey}
              onChange={(e) => setMonthKey(e.target.value)}
              className="bg-transparent text-xs font-mono font-semibold text-white focus:outline-none"
            />
            <button
              type="button"
              onClick={() =>
                setMonthKey(monthKey === 'ALL' ? getDefaultMonthKey() : 'ALL')
              }
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                monthKey === 'ALL'
                  ? 'bg-[#C7F464] border-[#C7F464] text-[#090909]'
                  : 'border-[#2C2C2C] text-[#A1A1AA] hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportAccountingCsv}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="ifg-btn-primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => openExpenseModal()}
          >
            Add Utility / Bill
          </Button>
        </div>
      </div>

      {/* Unified P&L Accounting Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card className="p-4 rounded-2xl border border-[#2C2C2C] space-y-1">
          <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">Membership Income</p>
          <p className="font-display text-2xl text-[#C7F464]">
            {formatBdt(overview.membershipRevenueBdt ?? 0)}
          </p>
          <p className="text-[11px] font-mono text-[#A1A1AA]">
            {overview.membershipPaymentsCount ?? 0} verified payments
          </p>
        </Card>

        <Card className="p-4 rounded-2xl border border-[#2C2C2C] space-y-1">
          <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">Store Net Profit</p>
          <p className="font-display text-2xl text-emerald-400">
            +{formatBdt(overview.storeProfitBdt ?? 0)}
          </p>
          <p className="text-[11px] font-mono text-[#A1A1AA]">
            Sales {formatBdt(overview.storeRevenueBdt ?? 0)} (Cost {formatBdt(overview.storeCostBdt ?? 0)})
          </p>
        </Card>

        <Card className="p-4 rounded-2xl border border-[#2C2C2C] space-y-1">
          <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">Staff Salaries Paid</p>
          <p className="font-display text-2xl text-amber-400">
            {formatBdt(overview.salaryPaidBdt ?? 0)}
          </p>
          <p className="text-[11px] font-mono text-[#A1A1AA]">
            {overview.activeStaffCount ?? 0} active staff • {overview.unpaidActiveStaffCount ?? 0} unpaid
          </p>
        </Card>

        <Card className="p-4 rounded-2xl border border-[#2C2C2C] space-y-1">
          <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">Utility &amp; Gym Bills</p>
          <p className="font-display text-2xl text-rose-400">
            {formatBdt((overview.utilityBillsBdt ?? 0) + (overview.operationsAndMiscBdt ?? 0))}
          </p>
          <p className="text-[11px] font-mono text-[#A1A1AA]">
            Pending Bills: {formatBdt(overview.utilityPendingBdt ?? 0)}
          </p>
        </Card>

        <Card
          className={`p-4 rounded-2xl border space-y-1 ${
            netProfit >= 0
              ? 'bg-[#1B2210] border-[#C7F464]/45'
              : 'bg-rose-500/10 border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">Net Gym Profit</p>
            {netProfit >= 0 ? (
              <TrendingUp className="w-4 h-4 text-[#C7F464]" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <p
            className={`font-display text-3xl ${
              netProfit >= 0 ? 'text-[#C7F464]' : 'text-rose-400'
            }`}
          >
            {netProfit >= 0 ? `+${formatBdt(netProfit)}` : formatBdt(netProfit)}
          </p>
          <p className="text-[11px] font-mono text-[#A1A1AA]">
            (Membership + Store Profit) − Bills &amp; Salary
          </p>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-[#141414] border border-[#2C2C2C] p-1">
          <button
            type="button"
            onClick={() => setTab('ledger')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors ${
              tab === 'ledger'
                ? 'bg-[#C7F464] text-[#090909]'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Utility Bills &amp; Costs ({expenses.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('payroll')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors ${
              tab === 'payroll'
                ? 'bg-[#C7F464] text-[#090909]'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            Salary Payroll ({salaries.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('employees')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors ${
              tab === 'employees'
                ? 'bg-[#C7F464] text-[#090909]'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Staff Directory ({employees.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {tab === 'payroll' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Wallet className="w-3.5 h-3.5" />}
              onClick={() => openPaySalaryModal()}
              disabled={employees.length === 0}
            >
              Pay Staff Salary
            </Button>
          )}
          {tab === 'employees' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={openAddEmployee}
            >
              Add Staff Member
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : tab === 'ledger' ? (
        <div className="space-y-5">
          {/* Quick Utility Bill Preset Bar */}
          <Card className="p-4 rounded-2xl border border-[#2C2C2C] flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono uppercase text-[#A1A1AA] mr-1">
              Quick Log Bill:
            </span>
            {[
              { cat: 'ELECTRICITY', title: `DESCO Electricity Bill — ${activeMonthForActions}` },
              { cat: 'RENT', title: `Gym Floor Monthly Rent — ${activeMonthForActions}` },
              { cat: 'WATER', title: `WASA Water Bill — ${activeMonthForActions}` },
              { cat: 'GAS', title: `Titas Gas Bill — ${activeMonthForActions}` },
              { cat: 'INTERNET', title: `Broadband Internet / WiFi — ${activeMonthForActions}` },
              { cat: 'EQUIPMENT_MAINTENANCE', title: `Equipment Service & Parts — ${activeMonthForActions}` },
            ].map((preset) => (
              <button
                key={preset.cat}
                type="button"
                onClick={() => openExpenseModal(preset.cat, preset.title)}
                className="px-3 py-1.5 rounded-xl bg-[#171717] border border-[#2C2C2C] hover:border-[#C7F464]/60 text-xs font-mono text-[#A1A1AA] hover:text-[#C7F464] transition-colors"
              >
                + {preset.cat.replace(/_/g, ' ')}
              </button>
            ))}
          </Card>

          {expenses.length === 0 ? (
            <EmptyState
              title="No Utility Bills or Expenses Logged Yet"
              description="Log electricity, water, gas, floor rent, internet, or maintenance costs to track exact monthly net profit."
              action={
                <Button variant="primary" onClick={() => openExpenseModal()}>
                  Add First Utility Bill
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {expenses.map((exp) => {
                const catMeta = EXPENSE_CATEGORIES.find((c) => c.value === exp.category);
                const IconComp = catMeta?.icon || Receipt;
                return (
                  <Card
                    key={exp.id}
                    className="p-4 rounded-2xl border border-[#2C2C2C] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#1B2210] flex items-center justify-center text-[#C7F464] shrink-0">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-white">{exp.title}</span>
                          <StatusBadge status={exp.status} />
                          <span className="px-2 py-0.5 rounded bg-[#171717] border border-[#2C2C2C] text-[10px] font-mono text-[#A1A1AA]">
                            {exp.monthKey}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-[#A1A1AA]">
                          {catMeta?.label || exp.category}
                          {exp.vendorName ? ` • Vendor: ${exp.vendorName}` : ''}
                          {exp.billReference ? ` • Ref: ${exp.billReference}` : ''}
                          {exp.paymentMethod ? ` • ${exp.paymentMethod}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <span className="font-display text-2xl text-rose-400">
                        -{formatBdt(exp.amountBdt)}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleToggleExpenseStatus(exp)}
                      >
                        {exp.status === 'PAID' ? 'Mark Unpaid' : 'Mark Paid'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditExpense(exp)}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-400"
                        onClick={() => handleDeleteExpense(exp.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : tab === 'payroll' ? (
        <div className="space-y-5">
          {/* Active Staff Quick Payroll Checklist for selected month */}
          {employees.filter((e) => e.status === 'ACTIVE').length > 0 && monthKey !== 'ALL' && (
            <Card className="p-5 rounded-3xl border border-[#2C2C2C] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Monthly Staff Checklist ({monthKey})
                </h2>
                <span className="text-xs font-mono text-[#A1A1AA]">
                  Est. Base Payroll: {formatBdt(overview.estimatedMonthlyPayrollBdt ?? 0)}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {employees
                  .filter((e) => e.status === 'ACTIVE')
                  .map((emp) => {
                    const paidRecord = paidEmployeeMap.get(emp.id);
                    return (
                      <div
                        key={emp.id}
                        className="p-3.5 rounded-2xl bg-[#171717] border border-[#2C2C2C] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {emp.fullName}
                          </p>
                          <p className="text-[11px] font-mono text-[#A1A1AA] truncate">
                            {emp.designation} • Base {formatBdt(emp.baseSalaryBdt)}
                          </p>
                        </div>
                        {paidRecord ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-400 shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            {paidRecord.status}
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => openPaySalaryModal(emp)}
                          >
                            Pay
                          </Button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </Card>
          )}

          {salaries.length === 0 ? (
            <EmptyState
              title="No Salary Payments Recorded"
              description="Add gym staff in the Staff Directory tab first, then record monthly salary payouts here."
              action={
                employees.length === 0 ? (
                  <Button variant="primary" onClick={openAddEmployee}>
                    Add First Staff Member
                  </Button>
                ) : (
                  <Button variant="primary" onClick={() => openPaySalaryModal()}>
                    Record Salary Payment
                  </Button>
                )
              }
            />
          ) : (
            <div className="space-y-3">
              {salaries.map((sal) => (
                <Card
                  key={sal.id}
                  className="p-4 rounded-2xl border border-[#2C2C2C] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {sal.employee?.fullName || 'Staff Member'}
                      </span>
                      <StatusBadge status={sal.status} />
                      <span className="px-2 py-0.5 rounded bg-[#171717] border border-[#2C2C2C] text-[10px] font-mono text-[#C7F464]">
                        {sal.monthKey}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-[#A1A1AA]">
                      {sal.employee?.designation} • Base {formatBdt(sal.baseSalaryBdt)}
                      {Number(sal.bonusBdt) > 0 ? ` + Bonus ${formatBdt(sal.bonusBdt)}` : ''}
                      {Number(sal.overtimeBdt) > 0 ? ` + OT ${formatBdt(sal.overtimeBdt)}` : ''}
                      {Number(sal.deductionBdt) > 0 ? ` − Ded ${formatBdt(sal.deductionBdt)}` : ''}
                      {` • ${sal.paymentMethod}`}
                      {sal.paymentRef ? ` (${sal.paymentRef})` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-display text-2xl text-amber-400">
                      -{formatBdt(sal.netPaidBdt)}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleToggleSalaryStatus(sal)}
                    >
                      {sal.status === 'PAID' ? 'Mark Pending' : 'Mark Paid'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-400"
                      onClick={() => handleDeleteSalary(sal.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          title="No Staff Added to HRM Directory"
          description="Add your trainers, front desk receptionists, cleaners, and security staff with their monthly salary."
          action={
            <Button variant="primary" onClick={openAddEmployee}>
              Add First Staff Member
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <Card
              key={emp.id}
              className="p-5 rounded-3xl border border-[#2C2C2C] flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#C7F464]">
                    {emp.employeeCode}
                  </span>
                  <StatusBadge status={emp.status} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{emp.fullName}</h3>
                  <p className="text-xs text-[#A1A1AA]">
                    {emp.designation} • {emp.department.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#171717] border border-[#2C2C2C] text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#A1A1AA]">Base Salary:</span>
                    <strong className="text-white">{formatBdt(emp.baseSalaryBdt)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A1A1AA]">Allowance:</span>
                    <span className="text-[#C7F464]">{formatBdt(emp.defaultAllowanceBdt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A1A1AA]">Phone:</span>
                    <span className="text-white">{emp.phone}</span>
                  </div>
                  {emp.payoutAccount && (
                    <div className="flex justify-between">
                      <span className="text-[#A1A1AA]">Payout Acc:</span>
                      <span className="text-white">{emp.payoutAccount}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#2C2C2C] flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-[#A1A1AA]">
                  Joined {formatDate(emp.joiningDate)}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openEditEmployee(emp)}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-400"
                    onClick={() => handleDeleteEmployee(emp.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={empModalOpen}
        onClose={() => setEmpModalOpen(false)}
        title={editingEmployee ? `Edit Staff — ${editingEmployee.fullName}` : 'Add Gym Staff Member'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveEmployee} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              required
              value={empForm.fullName}
              onChange={(e) => setEmpForm({ ...empForm, fullName: e.target.value })}
            />
            <Input
              label="Phone Number *"
              required
              placeholder="+88017XXXXXXXX"
              value={empForm.phone}
              onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Designation *"
              required
              placeholder="e.g. Senior Trainer / Receptionist"
              value={empForm.designation}
              onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })}
            />
            <div>
              <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                Department *
              </label>
              <select
                value={empForm.department}
                onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                className="w-full h-11 px-3 rounded-xl bg-[#141414] border border-[#2C2C2C] text-sm text-white"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Base Salary (BDT) *"
              type="number"
              min={0}
              required
              value={empForm.baseSalaryBdt}
              onChange={(e) => setEmpForm({ ...empForm, baseSalaryBdt: e.target.value })}
            />
            <Input
              label="Default Allowance"
              type="number"
              min={0}
              value={empForm.defaultAllowanceBdt}
              onChange={(e) => setEmpForm({ ...empForm, defaultAllowanceBdt: e.target.value })}
            />
            <div>
              <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                Status
              </label>
              <select
                value={empForm.status}
                onChange={(e) => setEmpForm({ ...empForm, status: e.target.value })}
                className="w-full h-11 px-3 rounded-xl bg-[#141414] border border-[#2C2C2C] text-sm text-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Payout Account (bKash / Bank)"
              placeholder="e.g. bKash 017XXXXXXXX"
              value={empForm.payoutAccount}
              onChange={(e) => setEmpForm({ ...empForm, payoutAccount: e.target.value })}
            />
            <Input
              label="Email (Optional)"
              type="email"
              value={empForm.email}
              onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEmpModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={savingEmp}>
              {editingEmployee ? 'Save Staff Profile' : 'Add Staff'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pay Monthly Salary Modal */}
      <Modal
        isOpen={salaryModalOpen}
        onClose={() => setSalaryModalOpen(false)}
        title="Record Staff Monthly Salary"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handlePaySalary} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                Staff Member *
              </label>
              <select
                required
                value={salaryForm.employeeId}
                onChange={(e) => {
                  const emp = employees.find((x) => x.id === e.target.value);
                  setSalaryForm({
                    ...salaryForm,
                    employeeId: e.target.value,
                    baseSalaryBdt: String(emp?.baseSalaryBdt ?? 0),
                    bonusBdt: String(emp?.defaultAllowanceBdt ?? 0),
                  });
                }}
                className="w-full h-11 px-3 rounded-xl bg-[#141414] border border-[#2C2C2C] text-sm text-white"
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.designation})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                Salary Month *
              </label>
              <input
                type="month"
                required
                value={salaryForm.monthKey}
                onChange={(e) => setSalaryForm({ ...salaryForm, monthKey: e.target.value })}
                className="w-full h-11 px-3 rounded-xl bg-[#141414] border border-[#2C2C2C] text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input
              label="Base Salary"
              type="number"
              min={0}
              required
              value={salaryForm.baseSalaryBdt}
              onChange={(e) => setSalaryForm({ ...salaryForm, baseSalaryBdt: e.target.value })}
            />
            <Input
              label="Bonus / Allow."
              type="number"
              min={0}
              value={salaryForm.bonusBdt}
              onChange={(e) => setSalaryForm({ ...salaryForm, bonusBdt: e.target.value })}
            />
            <Input
              label="Overtime"
              type="number"
              min={0}
              value={salaryForm.overtimeBdt}
              onChange={(e) => setSalaryForm({ ...salaryForm, overtimeBdt: e.target.value })}
            />
            <Input
              label="Deduction"
              type="number"
              min={0}
              value={salaryForm.deductionBdt}
              onChange={(e) => setSalaryForm({ ...salaryForm, deductionBdt: e.target.value })}
            />
          </div>

          <div className="p-3 rounded-xl bg-[#1B2210] border border-[#C7F464]/35 flex items-center justify-between text-xs font-mono">
            <span className="text-[#A1A1AA]">Net Salary Payable:</span>
            <strong className="text-lg text-[#C7F464]">{formatBdt(computedNetSalary)}</strong>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                Method
              </label>
              <select
                value={salaryForm.paymentMethod}
                onChange={(e) => setSalaryForm({ ...salaryForm, paymentMethod: e.target.value })}
                className="w-full h-11 px-3 rounded-xl bg-[#141414] border border-[#2C2C2C] text-sm text-white"
              >
                <option value="CASH">Cash</option>
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                Status
              </label>
              <select
                value={salaryForm.status}
                onChange={(e) => setSalaryForm({ ...salaryForm, status: e.target.value })}
                className="w-full h-11 px-3 rounded-xl bg-[#141414] border border-[#2C2C2C] text-sm text-white"
              >
                <option value="PAID">Paid Now</option>
                <option value="PENDING">Pending / Due</option>
              </select>
            </div>
            <Input
              label="Payment Ref"
              placeholder="TrxID / Slip #"
              value={salaryForm.paymentRef}
              onChange={(e) => setSalaryForm({ ...salaryForm, paymentRef: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setSalaryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={savingSalary}>
              Confirm Payout ({formatBdt(computedNetSalary)})
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Utility Bill & Expense Modal */}
      <Modal
        isOpen={expModalOpen}
        onClose={() => setExpModalOpen(false)}
        title={
          editingExpense
            ? `Edit Bill — ${editingExpense.title}`
            : 'Log Utility Bill or Gym Expense'
        }
        description="Track monthly Ashkona club utility bills, rent, maintenance, and operational expenses."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveExpense} className="space-y-5">
          {/* Live Expense Summary Banner */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#C7F464]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#C7F464] text-[#090909] flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#C7F464]">
                  {expForm.category} • {expForm.monthKey || 'BILLING'}
                </p>
                <p className="text-sm font-bold text-white truncate">
                  {expForm.title || 'New Utility Bill / Expense'}
                </p>
                <p className="text-xs font-mono text-[#A1A1AA] truncate">
                  {expForm.paymentMethod} •{' '}
                  {expForm.vendorName || 'Vendor optional'}
                </p>
              </div>
            </div>

            <div className="sm:text-right shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#2C2C2C]">
              <StatusBadge status={expForm.status} />
              <p className="font-display text-2xl text-[#C7F464] leading-tight mt-1 tabular-nums">
                {formatBdt(Number(expForm.amountBdt || 0))}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                  Category *
                </label>
                <select
                  value={expForm.category}
                  onChange={(e) =>
                    setExpForm({ ...expForm, category: e.target.value })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-[#171717] border border-[#2C2C2C] text-sm text-white"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                  Billing Month *
                </label>
                <input
                  type="month"
                  required
                  value={expForm.monthKey}
                  onChange={(e) =>
                    setExpForm({ ...expForm, monthKey: e.target.value })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-[#171717] border border-[#2C2C2C] text-sm text-white"
                />
              </div>
            </div>

            <Input
              label="Bill / Expense Title *"
              required
              placeholder="e.g. DESCO Electricity Bill — Nov 2026"
              value={expForm.title}
              onChange={(e) =>
                setExpForm({ ...expForm, title: e.target.value })
              }
            />

            <Input
              label="Amount (BDT) *"
              type="number"
              min={1}
              required
              placeholder="e.g. 12500"
              value={expForm.amountBdt}
              onChange={(e) =>
                setExpForm({ ...expForm, amountBdt: e.target.value })
              }
            />
          </div>

          {/* Interactive Payment Method & Settlement Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-2.5">
              <span className="block text-xs font-mono font-semibold uppercase tracking-wider text-white">
                Payment Method
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'CASH', label: 'Cash' },
                  { value: 'BKASH', label: 'bKash' },
                  { value: 'NAGAD', label: 'Nagad' },
                  { value: 'BANK_TRANSFER', label: 'Bank' },
                ].map((m) => {
                  const active = expForm.paymentMethod === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() =>
                        setExpForm({ ...expForm, paymentMethod: m.value })
                      }
                      className={`h-10 rounded-xl border text-xs font-mono font-bold transition-colors ${
                        active
                          ? 'bg-[#C7F464] border-[#C7F464] !text-[#090909]'
                          : 'bg-[#171717] border-[#2C2C2C] text-[#A1A1AA] hover:border-[#C7F464]/50'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-2.5">
              <span className="block text-xs font-mono font-semibold uppercase tracking-wider text-white">
                Settlement Status
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'PAID', label: 'Paid', tone: 'emerald' },
                  { value: 'PENDING', label: 'Unpaid / Due', tone: 'amber' },
                ].map((st) => {
                  const active = expForm.status === st.value;
                  return (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() =>
                        setExpForm({ ...expForm, status: st.value })
                      }
                      className={`h-10 rounded-xl border text-xs font-mono font-bold transition-colors ${
                        active
                          ? st.tone === 'emerald'
                            ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-400'
                            : 'bg-amber-500/15 border-amber-500/60 text-amber-400'
                          : 'bg-[#171717] border-[#2C2C2C] text-[#A1A1AA] hover:border-[#C7F464]/50'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Vendor / Provider (Optional)"
              placeholder="e.g. DESCO / WASA / Landlord"
              value={expForm.vendorName}
              onChange={(e) =>
                setExpForm({ ...expForm, vendorName: e.target.value })
              }
            />
            <Input
              label="Meter / Receipt Ref (Optional)"
              placeholder="Bill / TrxID #"
              value={expForm.billReference}
              onChange={(e) =>
                setExpForm({ ...expForm, billReference: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#2C2C2C]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setExpModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="ifg-btn-primary"
              isLoading={savingExp}
            >
              {editingExpense ? 'Save Changes' : 'Save Expense'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

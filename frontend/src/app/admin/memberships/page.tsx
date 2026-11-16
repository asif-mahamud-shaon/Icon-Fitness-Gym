'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  UserCheck,
  Sparkles,
  Check,
} from 'lucide-react';
import { apiFetch, getErrorMessage, formatBdt, computePlanPricing } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Membership,
  MembershipPlan,
  MemberProfile,
  PaginatedResult,
  MembershipStatus,
} from '@/types';
import {
  Card,
  Button,
  Input,
  Select,
  StatusBadge,
  Modal,
  Skeleton,
  EmptyState,
} from '@/components/ui';

export default function AdminMembershipsPage() {
  const { showToast } = useToast();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [memberPickerSearch, setMemberPickerSearch] = useState('');
  const [createForm, setCreateForm] = useState({
    memberProfileId: '',
    planId: '',
    startDate: new Date().toISOString().slice(0, 10),
    status: 'PENDING' as MembershipStatus,
    renewalNotes: '',
  });

  const [renewTarget, setRenewTarget] = useState<Membership | null>(null);
  const [renewPlanId, setRenewPlanId] = useState('');
  const [renewNotes, setRenewNotes] = useState('');
  const [renewing, setRenewing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = statusFilter ? `?status=${statusFilter}&limit=50` : '?limit=50';
      const [mRes, memRes, planRes] = await Promise.all([
        apiFetch<PaginatedResult<Membership>>(`/memberships${qs}`),
        apiFetch<PaginatedResult<MemberProfile>>('/members?limit=100'),
        apiFetch<MembershipPlan[]>('/membership-plans'),
      ]);
      setMemberships(mRes?.items || []);
      setMembers(memRes?.items || []);
      setPlans(Array.isArray(planRes) ? planRes : []);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiFetch('/memberships', {
        method: 'POST',
        body: JSON.stringify(createForm),
      });
      showToast('success', 'Membership assigned to member.');
      setCreateOpen(false);
      loadData();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id: string, status: MembershipStatus) => {
    try {
      await apiFetch(`/memberships/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showToast('success', `Membership status updated to ${status}.`);
      loadData();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewTarget) return;
    setRenewing(true);
    try {
      await apiFetch(`/memberships/${renewTarget.id}/renew`, {
        method: 'POST',
        body: JSON.stringify({
          planId:
            renewPlanId ||
            (renewTarget as any).planId ||
            renewTarget.membershipPlanId,
          renewalNotes: renewNotes || 'Admin-initiated membership renewal',
        }),
      });
      showToast(
        'success',
        'New renewal membership record created while preserving historical record.',
      );
      setRenewTarget(null);
      loadData();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setRenewing(false);
    }
  };

  const filteredMemberships = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return memberships;
    return memberships.filter((m) => {
      const mName = String(
        m.memberProfile?.user?.fullName ||
          `${m.memberProfile?.user?.firstName || ''} ${m.memberProfile?.user?.lastName || ''}`,
      ).toLowerCase();
      const code = String(m.memberProfile?.memberCode || '').toLowerCase();
      const planName = String((m as any).plan?.name || m.membershipPlan?.name || '').toLowerCase();
      return mName.includes(q) || code.includes(q) || planName.includes(q);
    });
  }, [memberships, search]);

  const activeCount = memberships.filter((m) => m.status === 'ACTIVE').length;
  const pendingCount = memberships.filter((m) => m.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Subscriptions
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Membership Lifecycle &amp; Renewals</span>
          </p>
        </div>
        <Button
          onClick={() => {
            setCreateForm({
              memberProfileId: members[0]?.id || '',
              planId: plans[0]?.id || '',
              startDate: new Date().toISOString().slice(0, 10),
              status: 'PENDING',
              renewalNotes: '',
            });
            setCreateOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> Assign New Membership
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Loaded Records</p>
            <p className="text-2xl font-bold text-white font-mono mt-0.5">{memberships.length}</p>
          </div>
          <ShieldCheck className="w-5 h-5 text-[#C7F464]" />
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Active Subscriptions</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">{activeCount}</p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Pending Activation</p>
            <p className="text-2xl font-bold text-amber-400 font-mono mt-0.5">{pendingCount}</p>
          </div>
          <Clock className="w-5 h-5 text-amber-400" />
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-[#171717] border border-[#2C2C2C] rounded-xl px-3.5 h-10 w-full lg:w-80">
          <Search className="w-4 h-4 text-[#A1A1AA] shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member, code, or plan..."
            className="w-full bg-transparent text-xs text-white placeholder:text-[#A1A1AA] focus:outline-none"
          />
        </div>
        <div className="w-full lg:w-64">
          <Select
            options={[
              { value: '', label: 'All Membership Statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'PENDING', label: 'Pending Verification' },
              { value: 'EXPIRED', label: 'Expired' },
              { value: 'SUSPENDED', label: 'Suspended' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </Card>

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : filteredMemberships.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="w-6 h-6" />}
          title="No Memberships Found"
          description="Assign a membership plan to a registered member to begin tracking validity."
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2C2C2C] bg-[#171717] text-xs font-semibold text-[#A1A1AA]">
                  <th className="py-3.5 px-5">Member</th>
                  <th className="py-3.5 px-5">Plan</th>
                  <th className="py-3.5 px-5">Start — End</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C2C2C] text-sm">
                {filteredMemberships.map((m) => {
                  const planObj = (m as any).plan || m.membershipPlan;
                  const memberName =
                    m.memberProfile?.user?.fullName ||
                    `${m.memberProfile?.user?.firstName || ''} ${m.memberProfile?.user?.lastName || ''}`.trim() ||
                    'Member';

                  return (
                    <tr key={m.id} className="hover:bg-[#171717]/60">
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-white">{memberName}</p>
                        <p className="text-xs font-mono text-[#C7F464]">
                          {m.memberProfile?.memberCode}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-white font-medium">
                          {planObj?.name || 'Membership Plan'}
                        </p>
                        <p className="text-xs text-[#A1A1AA]">
                          {planObj?.durationDays || 30} Days
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-zinc-300">
                        {new Date(m.startDate).toLocaleDateString()} →{' '}
                        {new Date(m.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {m.status !== 'ACTIVE' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(m.id, 'ACTIVE')}
                            >
                              Activate
                            </Button>
                          )}
                          {m.status === 'ACTIVE' && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleStatusChange(m.id, 'SUSPENDED')}
                            >
                              Suspend
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setRenewTarget(m);
                              setRenewPlanId(
                                (m as any).planId || m.membershipPlanId || '',
                              );
                              setRenewNotes('');
                            }}
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Renew
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Assign Membership Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Assign Membership Plan"
        description="Select a member, pick a training tier, and configure activation."
        maxWidth="max-w-2xl"
      >
        {(() => {
          const filteredCreateMembers = members.filter((mem) => {
            const q = memberPickerSearch.trim().toLowerCase();
            if (!q) return true;
            const full =
              mem.user?.fullName ||
              `${mem.user?.firstName || ''} ${mem.user?.lastName || ''}`.trim();
            return (
              String(mem.memberCode || '').toLowerCase().includes(q) ||
              full.toLowerCase().includes(q) ||
              String(mem.user?.email || '').toLowerCase().includes(q) ||
              String(mem.user?.phone || '').toLowerCase().includes(q)
            );
          });
          const selectedMember = members.find(
            (m) => m.id === createForm.memberProfileId,
          );
          const selectedPlan = plans.find((p) => p.id === createForm.planId);
          const selectedPricing = computePlanPricing(selectedPlan);
          const computedEndDate = (() => {
            if (!createForm.startDate || !selectedPlan?.durationDays) return null;
            const start = new Date(`${createForm.startDate}T00:00:00`);
            if (Number.isNaN(start.getTime())) return null;
            const end = new Date(start);
            end.setDate(end.getDate() + Number(selectedPlan.durationDays));
            return end.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });
          })();
          const selectedMemberName =
            selectedMember?.user?.fullName ||
            `${selectedMember?.user?.firstName || ''} ${selectedMember?.user?.lastName || ''}`.trim() ||
            'Select a Member';

          return (
            <form onSubmit={handleCreateMembership} className="space-y-5">
              {/* Executive Live Summary Banner */}
              <div className="p-4 rounded-2xl bg-[#141414] border border-[#C7F464]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#C7F464] text-[#090909] font-display text-lg flex items-center justify-center shrink-0">
                    {selectedMemberName
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || 'IF'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#C7F464]">
                      {selectedMember?.memberCode || 'NEW ENROLLMENT'}
                    </p>
                    <p className="text-sm font-bold text-white truncate">
                      {selectedMemberName}
                    </p>
                    <p className="text-xs text-[#A1A1AA] truncate">
                      {selectedPlan
                        ? `${selectedPlan.name} (${selectedPlan.durationDays} Days)`
                        : 'Choose a membership tier below'}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#2C2C2C]">
                  <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                    Plan Rate {computedEndDate ? `• Ends ${computedEndDate}` : ''}
                  </p>
                  <p className="font-display text-2xl text-[#C7F464] leading-tight">
                    {selectedPlan ? formatBdt(selectedPricing.discountedPrice) : '—'}
                  </p>
                </div>
              </div>

              {/* Step 1: Member Search & Selector */}
              <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-white">
                    <UserCheck className="w-3.5 h-3.5 text-[#C7F464]" />
                    1. Select Member *
                  </label>
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={memberPickerSearch}
                      onChange={(e) => setMemberPickerSearch(e.target.value)}
                      placeholder="Filter name, code, phone..."
                      className="w-full h-8 pl-8 pr-3 rounded-lg bg-[#171717] border border-[#2C2C2C] text-xs text-white placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#C7F464]"
                    />
                  </div>
                </div>
                <Select
                  required
                  options={
                    filteredCreateMembers.length > 0
                      ? filteredCreateMembers.map((mem) => ({
                          value: mem.id,
                          label: `${mem.memberCode} — ${mem.user?.fullName || `${mem.user?.firstName || ''} ${mem.user?.lastName || ''}`.trim()} (${mem.user?.email})`,
                        }))
                      : [{ value: '', label: 'No members match filter' }]
                  }
                  value={createForm.memberProfileId}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      memberProfileId: e.target.value,
                    })
                  }
                />
              </div>

              {/* Step 2: Interactive Plan Cards */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-white">
                    <Sparkles className="w-3.5 h-3.5 text-[#C7F464]" />
                    2. Choose Membership Tier *
                  </span>
                  <span className="text-[11px] font-mono text-[#A1A1AA]">
                    {plans.length} Plans Available
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {plans.map((p) => {
                    const pricing = computePlanPricing(p);
                    const isSelected = createForm.planId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setCreateForm({ ...createForm, planId: p.id })
                        }
                        className={`text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#1B2210] border-[#C7F464] shadow-xs'
                            : 'bg-[#141414] border-[#2C2C2C] hover:border-[#C7F464]/50'
                        }`}
                      >
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-bold text-white truncate">
                            {p.name}
                          </p>
                          <p className="text-[11px] font-mono text-[#A1A1AA]">
                            {p.durationDays} Days Validity
                          </p>
                          <div className="flex items-baseline gap-2 pt-0.5">
                            <span className="font-mono text-sm font-bold text-[#C7F464]">
                              {formatBdt(pricing.discountedPrice)}
                            </span>
                            {pricing.hasDiscount && (
                              <span className="font-mono text-[11px] line-through text-[#A1A1AA]">
                                {formatBdt(pricing.basePrice)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-[#C7F464] border-[#C7F464] text-[#090909]'
                              : 'border-[#2C2C2C] text-transparent'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Schedule & Initial Activation Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-white">
                      <Calendar className="w-3.5 h-3.5 text-[#C7F464]" />
                      3. Start Date
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCreateForm({
                          ...createForm,
                          startDate: new Date().toISOString().slice(0, 10),
                        })
                      }
                      className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#1B2210] border border-[#C7F464]/35 text-[#C7F464]"
                    >
                      Today
                    </button>
                  </div>
                  <Input
                    type="date"
                    required
                    value={createForm.startDate}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, startDate: e.target.value })
                    }
                  />
                  {computedEndDate && (
                    <p className="text-[11px] font-mono text-[#A1A1AA]">
                      Valid until:{' '}
                      <strong className="text-white">{computedEndDate}</strong>
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-2.5">
                  <span className="block text-xs font-mono font-semibold uppercase tracking-wider text-white">
                    4. Initial Status
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCreateForm({ ...createForm, status: 'PENDING' })
                      }
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                        createForm.status === 'PENDING'
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                          : 'bg-[#171717] border-[#2C2C2C] text-[#A1A1AA]'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        Pending Payment / Approval
                      </span>
                      {createForm.status === 'PENDING' && (
                        <Check className="w-3.5 h-3.5 shrink-0" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCreateForm({ ...createForm, status: 'ACTIVE' })
                      }
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                        createForm.status === 'ACTIVE'
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                          : 'bg-[#171717] border-[#2C2C2C] text-[#A1A1AA]'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        Activate Immediately
                      </span>
                      {createForm.status === 'ACTIVE' && (
                        <Check className="w-3.5 h-3.5 shrink-0" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 4: Notes + Quick Chips */}
              <div className="space-y-2">
                <Input
                  label="Administrative Notes"
                  value={createForm.renewalNotes}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      renewalNotes: e.target.value,
                    })
                  }
                  placeholder="Assigned at Ashkona front desk"
                />
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Assigned at Ashkona front desk',
                    'Walk-in registration • Cash pending',
                    'Transfer / Upgrade approved',
                  ].map((noteChip) => (
                    <button
                      key={noteChip}
                      type="button"
                      onClick={() =>
                        setCreateForm({ ...createForm, renewalNotes: noteChip })
                      }
                      className="px-2.5 py-1 rounded-lg bg-[#141414] border border-[#2C2C2C] text-[11px] font-mono text-[#A1A1AA] hover:border-[#C7F464]/50 hover:text-white transition-colors"
                    >
                      + {noteChip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#2C2C2C]">
                <span className="text-xs font-mono text-[#A1A1AA]">
                  Status:{' '}
                  <strong className="text-white">
                    {createForm.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING'}
                  </strong>
                  {selectedPlan
                    ? ` • ${formatBdt(selectedPricing.discountedPrice)}`
                    : ''}
                </span>
                <div className="flex items-center gap-2.5">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="ifg-btn-primary"
                    isLoading={creating}
                  >
                    Assign Membership
                  </Button>
                </div>
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* Renew Membership Modal */}
      <Modal
        isOpen={!!renewTarget}
        onClose={() => setRenewTarget(null)}
        title="Record Membership Renewal"
      >
        {renewTarget && (
          <form onSubmit={handleRenewSubmit} className="space-y-4">
            <div className="p-3.5 rounded-lg bg-[#090909] border border-[#303030] text-xs text-[#A1A1AA]">
              Renewing for{' '}
              <strong className="text-white">
                {renewTarget.memberProfile?.user?.fullName || 'Member'}
              </strong>
              . Previous record (
              {new Date(renewTarget.startDate).toLocaleDateString()} to{' '}
              {new Date(renewTarget.endDate).toLocaleDateString()}) will be
              preserved in history.
            </div>
            <Select
              label="Renewal Plan"
              options={plans.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.durationDays} Days)`,
              }))}
              value={renewPlanId}
              onChange={(e) => setRenewPlanId(e.target.value)}
            />
            <Input
              label="Renewal Notes"
              value={renewNotes}
              onChange={(e) => setRenewNotes(e.target.value)}
              placeholder="Renewal requested at reception"
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-[#303030]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRenewTarget(null)}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={renewing}>
                Create Renewal Record
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

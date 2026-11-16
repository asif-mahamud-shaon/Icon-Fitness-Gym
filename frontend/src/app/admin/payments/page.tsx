'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  FileText,
  RotateCcw,
  History,
  Search,
  ArrowRight,
  UserCheck,
  Receipt,
  Check,
  Banknote,
  Smartphone,
  Building2,
} from 'lucide-react';
import { apiFetch, getErrorMessage, formatBdt, computePlanPricing } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Payment,
  MemberProfile,
  Membership,
  PaginatedResult,
  PaymentMethod,
} from '@/types';
import dynamic from 'next/dynamic';
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

const ReceiptModal = dynamic(
  () => import('@/components/shared/ReceiptModal').then((m) => m.ReceiptModal),
  { ssr: false },
);

export default function AdminPaymentsPage() {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [paymentMemberSearch, setPaymentMemberSearch] = useState('');
  const [createForm, setCreateForm] = useState({
    memberProfileId: '',
    membershipId: '',
    amountBdt: '',
    discountBdt: '0',
    paymentMethod: 'CASH' as PaymentMethod,
    transactionReference: '',
    senderPhone: '',
    notes: '',
  });

  const [verifyTarget, setVerifyTarget] = useState<Payment | null>(null);
  const [verifyForm, setVerifyForm] = useState({
    activateLinkedMembership: true,
    transactionReference: '',
    notes: '',
  });
  const [verifying, setVerifying] = useState(false);

  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const [refundForm, setRefundForm] = useState({
    refundedAmountBdt: '',
    refundReason: '',
  });
  const [refunding, setRefunding] = useState(false);

  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [editHistoryTarget, setEditHistoryTarget] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = statusFilter ? `?status=${statusFilter}&limit=50` : '?limit=50';
      const [payRes, memRes, mshipRes] = await Promise.all([
        apiFetch<PaginatedResult<Payment>>(`/payments${qs}`),
        apiFetch<PaginatedResult<MemberProfile>>('/members?limit=100'),
        apiFetch<PaginatedResult<Membership>>('/memberships?limit=100'),
      ]);
      setPayments(payRes?.items || []);
      setMembers(memRes?.items || []);
      setMemberships(mshipRes?.items || []);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiFetch('/payments', {
        method: 'POST',
        body: JSON.stringify({
          memberProfileId: createForm.memberProfileId,
          membershipId: createForm.membershipId || undefined,
          amountBdt: Number(createForm.amountBdt),
          discountBdt: Number(createForm.discountBdt || 0),
          paymentMethod: createForm.paymentMethod,
          transactionReference: createForm.transactionReference || undefined,
          senderPhone: createForm.senderPhone || undefined,
          notes: createForm.notes || undefined,
        }),
      });
      showToast(
        'success',
        'Payment recorded with status PENDING. Verify payment to issue official receipt.',
      );
      setCreateOpen(false);
      loadData();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyTarget) return;
    setVerifying(true);
    try {
      await apiFetch(`/payments/${verifyTarget.id}/verify`, {
        method: 'PATCH',
        body: JSON.stringify(verifyForm),
      });
      showToast(
        'success',
        'Payment verified, official receipt generated, and audit-logged.',
      );
      setVerifyTarget(null);
      loadData();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTarget) return;
    setRefunding(true);
    try {
      await apiFetch(`/payments/${refundTarget.id}/refund`, {
        method: 'PATCH',
        body: JSON.stringify({
          refundedAmountBdt: Number(refundForm.refundedAmountBdt),
          refundReason: refundForm.refundReason,
        }),
      });
      showToast('success', 'Refund recorded and audit-logged.');
      setRefundTarget(null);
      loadData();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setRefunding(false);
    }
  };

  const memberMemberships = memberships.filter(
    (m) => m.memberProfileId === createForm.memberProfileId,
  );

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p: any) => {
      const mName = String(
        p.memberProfile?.user?.fullName ||
          `${p.memberProfile?.user?.firstName || ''} ${p.memberProfile?.user?.lastName || ''}`,
      ).toLowerCase();
      const rec = String(p.receipt?.receiptNumber || p.receiptNumber || '').toLowerCase();
      const trx = String(p.transactionReference || '').toLowerCase();
      return mName.includes(q) || rec.includes(q) || trx.includes(q);
    });
  }, [payments, search]);

  const verifiedRevenue = useMemo(
    () =>
      payments
        .filter((p: any) => p.status === 'VERIFIED_PAID')
        .reduce((sum: number, p: any) => sum + Number(p.netAmountBdt ?? p.amountBdt ?? 0), 0),
    [payments],
  );
  const pendingCount = payments.filter((p: any) => p.status === 'PENDING').length;
  const editedCount = payments.filter((p: any) => p.isEdited).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Payment Ledger
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Payments &amp; Manual Verification</span>
          </p>
        </div>
        <Button
          onClick={() => {
            const firstMemberId = members[0]?.id || '';
            setCreateForm({
              memberProfileId: firstMemberId,
              membershipId: '',
              amountBdt: '',
              discountBdt: '0',
              paymentMethod: 'CASH',
              transactionReference: '',
              senderPhone: '',
              notes: '',
            });
            setCreateOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> Record Manual Payment
        </Button>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Loaded Transactions</p>
            <p className="text-2xl font-bold text-white font-mono mt-0.5">{payments.length}</p>
          </div>
          <CreditCard className="w-5 h-5 text-[#C7F464]" />
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Verified Revenue</p>
            <p className="text-2xl font-bold text-[#C7F464] font-mono mt-0.5">
              {formatBdt(verifiedRevenue)}
            </p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Pending Verification</p>
            <p className="text-2xl font-bold text-amber-400 font-mono mt-0.5">{pendingCount}</p>
          </div>
          <FileText className="w-5 h-5 text-amber-400" />
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Edited Submissions</p>
            <p className="text-2xl font-bold text-white font-mono mt-0.5">{editedCount}</p>
          </div>
          <History className="w-5 h-5 text-[#C7F464]" />
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-[#171717] border border-[#2C2C2C] rounded-xl px-3.5 h-10 w-full lg:w-96">
          <Search className="w-4 h-4 text-[#A1A1AA] shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member, receipt number, TrxID..."
            className="w-full bg-transparent text-xs text-white placeholder:text-[#A1A1AA] focus:outline-none"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
          <span className="text-xs text-[#A1A1AA]">
            All submissions require staff verification before activation.
          </span>
          <div className="w-full sm:w-56">
            <Select
              options={[
                { value: '', label: 'All Payment Statuses' },
                { value: 'PENDING', label: 'Pending Verification' },
                { value: 'VERIFIED_PAID', label: 'Verified Paid' },
                { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
                { value: 'FAILED', label: 'Failed / Rejected' },
                { value: 'REFUNDED', label: 'Refunded' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-6 h-6" />}
          title="No Payment Records"
          description="Record a manual Cash, bKash, Nagad, or Bank Transfer transaction to begin."
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2C2C2C] bg-[#171717] text-xs font-semibold text-[#A1A1AA]">
                  <th className="py-3.5 px-5">Receipt / Ref</th>
                  <th className="py-3.5 px-5">Member</th>
                  <th className="py-3.5 px-5">Net Amount</th>
                  <th className="py-3.5 px-5">Method</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C2C2C] text-sm">
                {filteredPayments.map((p: any) => {
                  const receiptNum =
                    p.receipt?.receiptNumber ||
                    p.receiptNumber ||
                    'PENDING-VERIFICATION';
                  const memberName =
                    p.memberProfile?.user?.fullName ||
                    `${p.memberProfile?.user?.firstName || ''} ${p.memberProfile?.user?.lastName || ''}`.trim() ||
                    'Member';
                  const planName =
                    p.membership?.plan?.name ||
                    p.membership?.membershipPlan?.name ||
                    'General Payment';
                  const netBdt = p.netAmountBdt ?? p.amountBdt ?? p.amount ?? 0;
                  const method = p.paymentMethod || p.method || 'CASH';

                  return (
                    <tr key={p.id} className="hover:bg-[#171717]/60">
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[#C7F464] block">
                            {receiptNum}
                          </span>
                          {p.isEdited && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-[10px] font-mono font-bold uppercase text-amber-400">
                              <History className="w-3 h-3" /> Edited v2 (1/1)
                            </span>
                          )}
                        </div>
                        <span className="text-[#A1A1AA] block mt-0.5">
                          {p.transactionReference ||
                            new Date(p.createdAt).toLocaleDateString()}
                        </span>
                        {p.isEdited && p.latestEdit?.previous && (
                          <span className="text-[11px] text-amber-400/90 block mt-0.5">
                            Was:{' '}
                            {p.latestEdit.previous.transactionReference ||
                              p.latestEdit.previous.paymentMethod ||
                              'N/A'}{' '}
                            → Edited:{' '}
                            {p.latestEdit.updated?.transactionReference ||
                              p.transactionReference ||
                              'N/A'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-white font-medium">{memberName}</p>
                        <p className="text-xs text-[#A1A1AA]">{planName}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-white">
                        {formatBdt(netBdt)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-zinc-300">
                        {method}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {p.isEdited && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setEditHistoryTarget(p)}
                            >
                              <History className="w-3.5 h-3.5" /> Edit Version
                            </Button>
                          )}
                          {p.status === 'PENDING' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setVerifyTarget(p);
                                setVerifyForm({
                                  activateLinkedMembership: true,
                                  transactionReference:
                                    p.transactionReference || '',
                                  notes: 'Verified at Ashkona reception desk',
                                });
                              }}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setReceiptPayment(p)}
                          >
                            <FileText className="w-3.5 h-3.5" /> Receipt
                          </Button>
                          {p.status === 'VERIFIED_PAID' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setRefundTarget(p);
                                setRefundForm({
                                  refundedAmountBdt: String(netBdt),
                                  refundReason: '',
                                });
                              }}
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Refund
                            </Button>
                          )}
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

      {/* Record Manual Payment Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Record Manual Payment"
        description="Log cash desk or mobile-banking payments before verification & receipt issuance."
        maxWidth="max-w-2xl"
      >
        {(() => {
          const filteredPayMembers = members.filter((mem) => {
            const q = paymentMemberSearch.trim().toLowerCase();
            if (!q) return true;
            const full =
              mem.user?.fullName ||
              `${mem.user?.firstName || ''} ${mem.user?.lastName || ''}`.trim();
            return (
              String(mem.memberCode || '').toLowerCase().includes(q) ||
              full.toLowerCase().includes(q) ||
              String(mem.user?.phone || '').toLowerCase().includes(q)
            );
          });
          const selectedMember = members.find(
            (m) => m.id === createForm.memberProfileId,
          );
          const selectedMembership: any = memberMemberships.find(
            (ms: any) => ms.id === createForm.membershipId,
          );
          const linkedPlanPricing = selectedMembership
            ? computePlanPricing(
                selectedMembership.plan || selectedMembership.membershipPlan,
              )
            : null;
          const grossBdt = Math.max(0, Number(createForm.amountBdt || 0));
          const discountBdt = Math.max(0, Number(createForm.discountBdt || 0));
          const netPayableBdt = Math.max(0, grossBdt - discountBdt);
          const selectedMemberName =
            selectedMember?.user?.fullName ||
            `${selectedMember?.user?.firstName || ''} ${selectedMember?.user?.lastName || ''}`.trim() ||
            'Select a Member';
          const isMobileTransfer = ['BKASH', 'NAGAD', 'ROCKET'].includes(
            createForm.paymentMethod,
          );

          const paymentMethods: Array<{
            value: PaymentMethod;
            label: string;
            sub: string;
            icon: React.ReactNode;
          }> = [
            {
              value: 'CASH',
              label: 'Cash (Front Desk)',
              sub: 'Instant desk settlement',
              icon: <Banknote className="w-4 h-4 shrink-0" />,
            },
            {
              value: 'BKASH',
              label: 'bKash Transfer',
              sub: 'TrxID + Sender phone',
              icon: <Smartphone className="w-4 h-4 shrink-0" />,
            },
            {
              value: 'NAGAD',
              label: 'Nagad Transfer',
              sub: 'TrxID + Sender phone',
              icon: <Smartphone className="w-4 h-4 shrink-0" />,
            },
            {
              value: 'ROCKET',
              label: 'Rocket Transfer',
              sub: 'Mobile wallet TrxID',
              icon: <Smartphone className="w-4 h-4 shrink-0" />,
            },
            {
              value: 'BANK_TRANSFER',
              label: 'Bank Transfer',
              sub: 'BEFTN / NPSB slip',
              icon: <Building2 className="w-4 h-4 shrink-0" />,
            },
            {
              value: 'POS_CARD',
              label: 'POS Card Terminal',
              sub: 'Visa / Mastercard swipe',
              icon: <CreditCard className="w-4 h-4 shrink-0" />,
            },
          ];

          return (
            <form onSubmit={handleRecordPayment} className="space-y-5">
              {/* Live Receipt Calculation Banner */}
              <div className="p-4 rounded-2xl bg-[#141414] border border-[#C7F464]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#C7F464] text-[#090909] flex items-center justify-center shrink-0">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#C7F464]">
                      {selectedMember?.memberCode || 'PAYMENT INTAKE'} •{' '}
                      {createForm.paymentMethod.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm font-bold text-white truncate">
                      {selectedMemberName}
                    </p>
                    <p className="text-xs text-[#A1A1AA] truncate">
                      {selectedMembership
                        ? `Linked: ${selectedMembership.plan?.name || selectedMembership.membershipPlan?.name || 'Membership'} (${selectedMembership.status})`
                        : 'General Front-Desk Payment'}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#2C2C2C]">
                  <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                    Net Payable {discountBdt > 0 ? `(−${formatBdt(discountBdt)} off)` : ''}
                  </p>
                  <p className="font-display text-2xl text-[#C7F464] leading-tight tabular-nums">
                    {formatBdt(netPayableBdt)}
                  </p>
                </div>
              </div>

              {/* Section 1: Member & Linked Membership */}
              <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-white">
                    <UserCheck className="w-3.5 h-3.5 text-[#C7F464]" />
                    1. Member &amp; Subscription Link
                  </span>
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={paymentMemberSearch}
                      onChange={(e) => setPaymentMemberSearch(e.target.value)}
                      placeholder="Filter member name or code..."
                      className="w-full h-8 pl-8 pr-3 rounded-lg bg-[#171717] border border-[#2C2C2C] text-xs text-white placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#C7F464]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Select
                    label="Member *"
                    required
                    options={
                      filteredPayMembers.length > 0
                        ? filteredPayMembers.map((m) => ({
                            value: m.id,
                            label: `${m.memberCode} — ${m.user?.fullName || `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.trim()}`,
                          }))
                        : [{ value: '', label: 'No members match filter' }]
                    }
                    value={createForm.memberProfileId}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        memberProfileId: e.target.value,
                        membershipId: '',
                      })
                    }
                  />
                  <div className="space-y-1.5">
                    <Select
                      label="Link to Membership (Optional)"
                      options={[
                        { value: '', label: 'None / General Payment' },
                        ...memberMemberships.map((ms: any) => ({
                          value: ms.id,
                          label: `${ms.plan?.name || ms.membershipPlan?.name || 'Membership'} (${ms.status})`,
                        })),
                      ]}
                      value={createForm.membershipId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        const matched: any = memberMemberships.find(
                          (ms: any) => ms.id === nextId,
                        );
                        const autoPrice = matched
                          ? computePlanPricing(matched.plan || matched.membershipPlan)
                              .discountedPrice
                          : null;
                        setCreateForm((prev) => ({
                          ...prev,
                          membershipId: nextId,
                          amountBdt:
                            !prev.amountBdt && autoPrice
                              ? String(autoPrice)
                              : prev.amountBdt,
                        }));
                      }}
                    />
                    {linkedPlanPricing && (
                      <button
                        type="button"
                        onClick={() =>
                          setCreateForm((prev) => ({
                            ...prev,
                            amountBdt: String(linkedPlanPricing.discountedPrice),
                          }))
                        }
                        className="text-[11px] font-mono text-[#C7F464] hover:underline"
                      >
                        Auto-fill linked plan fee ({formatBdt(linkedPlanPricing.discountedPrice)})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Payment Method Selector Grid */}
              <div className="space-y-2.5">
                <span className="block text-xs font-mono font-semibold uppercase tracking-wider text-white">
                  2. Payment Method *
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {paymentMethods.map((pm) => {
                    const active = createForm.paymentMethod === pm.value;
                    return (
                      <button
                        key={pm.value}
                        type="button"
                        onClick={() =>
                          setCreateForm({ ...createForm, paymentMethod: pm.value })
                        }
                        className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-2 ${
                          active
                            ? 'bg-[#1B2210] border-[#C7F464] shadow-xs'
                            : 'bg-[#141414] border-[#2C2C2C] hover:border-[#C7F464]/50'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span
                            className={`mt-0.5 ${
                              active ? 'text-[#C7F464]' : 'text-[#A1A1AA]'
                            }`}
                          >
                            {pm.icon}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white leading-tight">
                              {pm.label}
                            </p>
                            <p className="text-[10px] font-mono text-[#A1A1AA] mt-0.5 truncate">
                              {pm.sub}
                            </p>
                          </div>
                        </div>
                        {active && (
                          <Check className="w-3.5 h-3.5 text-[#C7F464] shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Amounts & Verification Details */}
              <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Gross Amount (BDT) *"
                    type="number"
                    min={1}
                    required
                    value={createForm.amountBdt}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, amountBdt: e.target.value })
                    }
                    placeholder="2500"
                  />
                  <Input
                    label="Discount (BDT)"
                    type="number"
                    min={0}
                    value={createForm.discountBdt}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, discountBdt: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Transaction Reference / TrxID"
                    value={createForm.transactionReference}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        transactionReference: e.target.value,
                      })
                    }
                    placeholder={
                      createForm.paymentMethod === 'CASH'
                        ? 'e.g. CASH-DESK-104'
                        : 'e.g. BKH8923412A'
                    }
                  />
                  <Input
                    label={
                      isMobileTransfer
                        ? 'Sender Phone * (bKash / Nagad / Rocket)'
                        : 'Sender Phone (Optional)'
                    }
                    value={createForm.senderPhone}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, senderPhone: e.target.value })
                    }
                    placeholder="017..."
                  />
                </div>

                <Input
                  label="Staff Notes"
                  value={createForm.notes}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, notes: e.target.value })
                  }
                  placeholder="Optional counter verification remarks"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#2C2C2C]">
                <span className="text-xs font-mono text-[#A1A1AA]">
                  Creates <strong className="text-amber-400">PENDING</strong> entry
                  for verification
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
                    Record Pending Payment ({formatBdt(netPayableBdt)})
                  </Button>
                </div>
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* Verify Payment Modal */}
      <Modal
        isOpen={!!verifyTarget}
        onClose={() => setVerifyTarget(null)}
        title="Verify Payment & Issue Receipt"
      >
        {verifyTarget && (
          <form onSubmit={handleVerifyPayment} className="space-y-4">
            <div className="p-4 rounded-lg bg-[#090909] border border-[#303030] text-xs space-y-1">
              <p className="text-white font-medium">
                Member:{' '}
                {(verifyTarget as any).memberProfile?.user?.fullName ||
                  'Member'}
              </p>
              <p className="text-[#C7F464] font-mono">
                Net Amount:{' '}
                {formatBdt(
                  (verifyTarget as any).netAmountBdt ??
                    (verifyTarget as any).amountBdt ??
                    verifyTarget.amount,
                )}{' '}
                ({(verifyTarget as any).paymentMethod || verifyTarget.method})
              </p>
            </div>
            {(verifyTarget as any).isEdited && (verifyTarget as any).latestEdit && (
              <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/35 text-xs space-y-1.5">
                <p className="font-mono uppercase font-bold text-amber-400 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  Member Edited Submission (v2 Active)
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#A1A1AA] block">Original (v1):</span>
                    <span className="font-mono text-white">
                      {(verifyTarget as any).latestEdit.previous?.paymentMethod} •{' '}
                      {(verifyTarget as any).latestEdit.previous?.transactionReference || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#C7F464] block">Edited (v2):</span>
                    <span className="font-mono text-[#C7F464] font-semibold">
                      {(verifyTarget as any).latestEdit.updated?.paymentMethod} •{' '}
                      {(verifyTarget as any).latestEdit.updated?.transactionReference || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <Input
              label="Confirmed Transaction Reference"
              value={verifyForm.transactionReference}
              onChange={(e) =>
                setVerifyForm({
                  ...verifyForm,
                  transactionReference: e.target.value,
                })
              }
            />
            <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
              <input
                type="checkbox"
                checked={verifyForm.activateLinkedMembership}
                onChange={(e) =>
                  setVerifyForm({
                    ...verifyForm,
                    activateLinkedMembership: e.target.checked,
                  })
                }
                className="accent-[#C7F464]"
              />
              Automatically activate linked membership on verification
            </label>
            <Input
              label="Verification Audit Notes"
              value={verifyForm.notes}
              onChange={(e) =>
                setVerifyForm({ ...verifyForm, notes: e.target.value })
              }
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-[#303030]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setVerifyTarget(null)}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={verifying}>
                Confirm Verification & Issue Receipt
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Refund Modal */}
      <Modal
        isOpen={!!refundTarget}
        onClose={() => setRefundTarget(null)}
        title="Record Payment Refund"
      >
        {refundTarget && (
          <form onSubmit={handleRefundSubmit} className="space-y-4">
            <Input
              label="Refund Amount (BDT)"
              type="number"
              required
              min={1}
              value={refundForm.refundedAmountBdt}
              onChange={(e) =>
                setRefundForm({
                  ...refundForm,
                  refundedAmountBdt: e.target.value,
                })
              }
            />
            <Input
              label="Refund Reason"
              required
              value={refundForm.refundReason}
              onChange={(e) =>
                setRefundForm({ ...refundForm, refundReason: e.target.value })
              }
              placeholder="Approved cancellation / duplicate charge"
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-[#303030]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRefundTarget(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="danger" isLoading={refunding}>
                Record Refund
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ReceiptModal
        isOpen={!!receiptPayment}
        onClose={() => setReceiptPayment(null)}
        payment={receiptPayment}
      />

      {/* Member Edit Revision Comparison Modal */}
      <Modal
        isOpen={!!editHistoryTarget}
        onClose={() => setEditHistoryTarget(null)}
        title="Member Payment Edit Version (v1 → v2)"
        size="lg"
      >
        {editHistoryTarget && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-[#090909] border border-[#303030] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <p className="text-white font-semibold text-sm">
                  {editHistoryTarget.memberProfile?.user?.fullName || 'Member'}
                </p>
                <p className="text-[#A1A1AA] font-mono mt-0.5">
                  Member ID: {editHistoryTarget.memberProfile?.memberCode || 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-[10px] font-mono font-bold uppercase text-amber-400">
                  Edited 1/1 Times
                </span>
                {editHistoryTarget.editedAt && (
                  <p className="text-[#A1A1AA] font-mono mt-1">
                    Edited: {new Date(editHistoryTarget.editedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {editHistoryTarget.latestEdit ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#141414] border border-[#303030] space-y-2.5 text-xs">
                  <span className="inline-block px-2 py-0.5 rounded bg-[#242424] text-[#A1A1AA] font-mono text-[10px] uppercase font-bold">
                    Original Submission (v1)
                  </span>
                  <div>
                    <span className="text-[#A1A1AA] block">Plan</span>
                    <span className="text-white font-medium">
                      {editHistoryTarget.latestEdit.previous?.planName || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A1A1AA] block">Amount</span>
                    <span className="font-mono text-white font-semibold">
                      {formatBdt(editHistoryTarget.latestEdit.previous?.amountBdt || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A1A1AA] block">Method</span>
                    <span className="font-mono text-white">
                      {editHistoryTarget.latestEdit.previous?.paymentMethod || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A1A1AA] block">Transaction Reference</span>
                    <span className="font-mono text-white break-all">
                      {editHistoryTarget.latestEdit.previous?.transactionReference || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A1A1AA] block">Sender Phone</span>
                    <span className="font-mono text-white">
                      {editHistoryTarget.latestEdit.previous?.senderPhone || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A1A1AA] block">Notes</span>
                    <span className="text-[#A1A1AA]">
                      {editHistoryTarget.latestEdit.previous?.notes || '—'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#141414] border border-[#C7F464]/50 space-y-2.5 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#C7F464]/20 text-[#C7F464] font-mono text-[10px] uppercase font-bold">
                    Edited Version (v2 • Current)
                  </span>
                  <div>
                    <span className="text-[#A1A1AA] block">Plan</span>
                    <span className="text-white font-medium">
                      {editHistoryTarget.latestEdit.updated?.planName ||
                        editHistoryTarget.membership?.plan?.name ||
                        'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A1A1AA] block">Amount</span>
                    <span className="font-mono text-[#C7F464] font-semibold">
                      {formatBdt(
                        editHistoryTarget.latestEdit.updated?.amountBdt ??
                          editHistoryTarget.netAmountBdt ??
                          0,
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A1A1AA] block">Method</span>
                    <span className="font-mono text-white font-semibold">
                      {editHistoryTarget.latestEdit.updated?.paymentMethod ||
                        editHistoryTarget.paymentMethod}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A1A1AA] block">Transaction Reference</span>
                    <span className="font-mono text-[#C7F464] font-semibold break-all">
                      {editHistoryTarget.latestEdit.updated?.transactionReference ||
                        editHistoryTarget.transactionReference ||
                        'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A1A1AA] block">Sender Phone</span>
                    <span className="font-mono text-white">
                      {editHistoryTarget.latestEdit.updated?.senderPhone ||
                        editHistoryTarget.senderPhone ||
                        'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A1A1AA] block">Notes</span>
                    <span className="text-white">
                      {editHistoryTarget.latestEdit.updated?.notes ||
                        editHistoryTarget.notes ||
                        '—'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#A1A1AA]">
                No revision snapshot metadata found for this payment.
              </p>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-[#303030]">
              {editHistoryTarget.status === 'PENDING' && (
                <Button
                  onClick={() => {
                    const target = editHistoryTarget;
                    setEditHistoryTarget(null);
                    setVerifyTarget(target);
                    setVerifyForm({
                      activateLinkedMembership: true,
                      transactionReference: target.transactionReference || '',
                      notes: 'Verified edited payment at Ashkona reception desk',
                    });
                  }}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Proceed to Verify Edited Version
                </Button>
              )}
              <Button variant="ghost" onClick={() => setEditHistoryTarget(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

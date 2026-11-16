'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  CreditCard,
  RefreshCw,
  FileText,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import { apiFetch, formatBdt, formatDate, computePlanPricing } from '@/lib/api';
import { MembershipPlan } from '@/types';
import { useToast } from '@/context/ToastContext';
import {
  Card,
  Button,
  StatusBadge,
  Modal,
  Select,
  Input,
  Textarea,
  Skeleton,
} from '@/components/ui';
import { ReceiptModal } from '@/components/shared/ReceiptModal';

export default function MemberMembershipPage() {
  const { toast } = useToast();
  const [membershipData, setMembershipData] = useState<{
    activeMembership: any | null;
    history: any[];
  }>({ activeMembership: null, history: [] });
  const [payments, setPayments] = useState<any[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [renewalNotes, setRenewalNotes] = useState('');
  const [submittingRenewal, setSubmittingRenewal] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    membershipId: '',
    amountBdt: '',
    paymentMethod: 'BKASH',
    transactionReference: '',
    senderPhone: '',
    notes: '',
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, pRes, plansRes] = await Promise.all([
        apiFetch<any>('/memberships/my'),
        apiFetch<any[]>('/payments/my'),
        apiFetch<MembershipPlan[]>('/membership-plans/public'),
      ]);
      setMembershipData(mRes);
      setPayments(pRes);
      setPlans(plansRes);
      if (plansRes.length > 0 && !selectedPlanId) {
        setSelectedPlanId(plansRes[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedPlanId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRequestRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRenewal(true);
    try {
      await apiFetch('/memberships/renewal-request', {
        method: 'POST',
        body: JSON.stringify({ planId: selectedPlanId, renewalNotes }),
      });
      toast({
        title: 'Renewal Request Submitted',
        description:
          'Your renewal subscription has been created with PENDING status. Submit your payment reference or visit the Ashkona front desk for activation.',
        variant: 'success',
      });
      setRenewModalOpen(false);
      setRenewalNotes('');
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Renewal Request Failed',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setSubmittingRenewal(false);
    }
  };

  const handleRecordPaymentReference = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPayment(true);
    try {
      await apiFetch('/payments', {
        method: 'POST',
        body: JSON.stringify({
          membershipId: paymentForm.membershipId || undefined,
          amountBdt: Number(paymentForm.amountBdt),
          paymentMethod: paymentForm.paymentMethod,
          transactionReference: paymentForm.transactionReference,
          senderPhone: paymentForm.senderPhone,
          notes: paymentForm.notes,
        }),
      });
      toast({
        title: 'Payment Reference Submitted (PENDING)',
        description:
          'Authorized staff will verify your transaction reference and issue your official receipt.',
        variant: 'info',
      });
      setPaymentModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Error Recording Payment',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  const active = membershipData.activeMembership;
  const latest = membershipData.history[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Membership &amp; Billing
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Member Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Membership &amp; Receipts</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => setRenewModalOpen(true)}
          >
            Request Plan / Renewal
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<CreditCard className="w-4 h-4" />}
            onClick={() => {
              const latestPricing = computePlanPricing(latest?.plan);
              setPaymentForm({
                membershipId: latest?.id || '',
                amountBdt: String(
                  latest?.plan ? latestPricing.discountedPrice : 2000,
                ),
                paymentMethod: 'BKASH',
                transactionReference: '',
                senderPhone: '',
                notes: '',
              });
              setPaymentModalOpen(true);
            }}
          >
            Submit Payment Reference
          </Button>
        </div>
      </div>

      {/* Current Subscription Summary Card */}
      <Card className="border-[#C7F464]/50 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#C7F464]">
              Current Subscription
            </span>
            <h2 className="text-2xl font-bold text-white mt-1">
              {active?.plan?.name ||
                latest?.plan?.name ||
                'No Membership Plan Selected'}
            </h2>
          </div>
          <StatusBadge status={active?.status || latest?.status || 'NONE'} />
        </div>

        {(active || latest) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#171717] border border-[#2C2C2C]">
              <p className="text-xs text-[#A1A1AA] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C7F464]" /> Start Date
              </p>
              <p className="font-mono text-sm font-semibold text-white mt-1">
                {formatDate((active || latest).startDate)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#171717] border border-[#2C2C2C]">
              <p className="text-xs text-[#A1A1AA] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C7F464]" /> Expiry Date
              </p>
              <p className="font-mono text-sm font-semibold text-[#C7F464] mt-1">
                {formatDate((active || latest).endDate)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#171717] border border-[#2C2C2C]">
              <p className="text-xs text-[#A1A1AA]">Plan Rate</p>
              <p className="font-mono text-sm font-semibold text-white mt-1">
                {formatBdt(
                  computePlanPricing((active || latest).plan).discountedPrice,
                )}{' '}
                ({(active || latest).plan?.durationDays} Days)
              </p>
            </div>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-[#171717] border border-[#2C2C2C] flex items-center gap-2.5 text-xs text-[#A1A1AA]">
          <ShieldAlert className="w-4 h-4 text-[#C7F464] shrink-0" />
          <span>
            Pending payments do not automatically activate memberships. Once staff
            verify your payment at the front desk or admin panel, your subscription
            activates and an official receipt is issued.
          </span>
        </div>
      </Card>

      {/* Membership History Table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2C2C2C] flex items-center justify-between">
          <h3 className="text-base font-bold text-white">
            Subscription History
          </h3>
          <span className="text-xs font-mono text-[#A1A1AA]">
            {membershipData.history.length} records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#171717] border-b border-[#2C2C2C] text-xs font-semibold text-[#A1A1AA]">
                <th className="py-3.5 px-5">Plan</th>
                <th className="py-3.5 px-5">Start Date</th>
                <th className="py-3.5 px-5">Expiry Date</th>
                <th className="py-3.5 px-5">Fee</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C2C2C]">
              {membershipData.history.map((m: any) => (
                <tr key={m.id} className="hover:bg-[#171717]/60 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-white">
                    {m.plan?.name}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-xs text-[#A1A1AA]">
                    {formatDate(m.startDate)}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-xs text-white">
                    {formatDate(m.endDate)}
                  </td>
                  <td className="py-3.5 px-5 font-mono font-semibold text-[#C7F464]">
                    {formatBdt(computePlanPricing(m.plan).discountedPrice)}
                  </td>
                  <td className="py-3.5 px-5">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="py-3.5 px-5 text-xs text-[#A1A1AA]">
                    {m.renewalNotes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payment Ledger Table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2C2C2C] flex items-center justify-between">
          <h3 className="text-base font-bold text-white">
            Payment Records &amp; Official Receipts
          </h3>
          <span className="text-xs font-mono text-[#A1A1AA]">
            {payments.length} transactions
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#171717] border-b border-[#2C2C2C] text-xs font-semibold text-[#A1A1AA]">
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5">Plan</th>
                <th className="py-3.5 px-5">Amount</th>
                <th className="py-3.5 px-5">Method / Ref</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C2C2C]">
              {payments.map((p: any) => (
                <tr key={p.id} className="hover:bg-[#171717]/60 transition-colors">
                  <td className="py-3.5 px-5 font-mono text-xs text-[#A1A1AA]">
                    {formatDate(p.paidAt || p.createdAt)}
                  </td>
                  <td className="py-3.5 px-5 text-white font-medium">
                    {p.membership?.plan?.name || 'Membership'}
                  </td>
                  <td className="py-3.5 px-5 font-mono font-bold text-[#C7F464]">
                    {formatBdt(p.netAmountBdt)}
                  </td>
                  <td className="py-3.5 px-5 text-xs text-[#A1A1AA]">
                    {p.paymentMethod}{' '}
                    {p.transactionReference ? `(${p.transactionReference})` : ''}
                  </td>
                  <td className="py-3.5 px-5">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="py-3.5 px-5">
                    {p.receipt ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<FileText className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedReceipt(p)}
                      >
                        {p.receipt.receiptNumber}
                      </Button>
                    ) : (
                      <span className="text-xs text-[#A1A1AA]">
                        Awaiting Verification
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      <Modal
        isOpen={renewModalOpen}
        onClose={() => setRenewModalOpen(false)}
        title="Request Membership Renewal or Plan Upgrade"
        description="Preserves your full membership history and creates a pending renewal record."
      >
        <form onSubmit={handleRequestRenewal} className="space-y-4">
          <Select
            label="Select Membership Plan *"
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            options={plans.map((p) => {
              const pricing = computePlanPricing(p);
              return {
                value: p.id,
                label: pricing.hasDiscount
                  ? `${p.name} — ${formatBdt(pricing.discountedPrice)} (${pricing.badgeText || `Save ${formatBdt(pricing.totalDiscount)}`}, ${p.durationDays} Days)`
                  : `${p.name} — ${formatBdt(pricing.basePrice)} (${p.durationDays} Days)`,
              };
            })}
          />
          <Textarea
            label="Notes for Front Desk / Admin (Optional)"
            placeholder="e.g. Paying via bKash / Cash at Ashkona front desk..."
            value={renewalNotes}
            onChange={(e) => setRenewalNotes(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRenewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submittingRenewal}
            >
              Submit Renewal Request
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Submit Payment Reference for Verification"
        description="Record your bKash, Nagad, Bank Transfer, or Cash payment reference. Staff will verify and issue a receipt."
      >
        <form onSubmit={handleRecordPaymentReference} className="space-y-4">
          <Input
            label="Amount (BDT) *"
            type="number"
            required
            value={paymentForm.amountBdt}
            onChange={(e) =>
              setPaymentForm({ ...paymentForm, amountBdt: e.target.value })
            }
          />
          <Select
            label="Payment Method *"
            value={paymentForm.paymentMethod}
            onChange={(e) =>
              setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })
            }
            options={[
              { value: 'BKASH', label: 'bKash' },
              { value: 'NAGAD', label: 'Nagad' },
              { value: 'ROCKET', label: 'Rocket' },
              { value: 'CASH', label: 'Cash at Front Desk' },
              { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
              { value: 'POS_CARD', label: 'POS Card Terminal' },
            ]}
          />
          <Input
            label="Transaction Reference / TrxID"
            placeholder="e.g. BKH9823412A"
            value={paymentForm.transactionReference}
            onChange={(e) =>
              setPaymentForm({
                ...paymentForm,
                transactionReference: e.target.value,
              })
            }
          />
          <Input
            label="Sender Phone Number"
            placeholder="+8801711000000"
            value={paymentForm.senderPhone}
            onChange={(e) =>
              setPaymentForm({ ...paymentForm, senderPhone: e.target.value })
            }
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPaymentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submittingPayment}
            >
              Submit for Staff Verification
            </Button>
          </div>
        </form>
      </Modal>

      <ReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        payment={selectedReceipt}
        receipt={selectedReceipt?.receipt || selectedReceipt}
      />
    </div>
  );
}

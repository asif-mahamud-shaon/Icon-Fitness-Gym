'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  ShieldCheck,
  Clock,
  CheckCircle2,
  RefreshCw,
  LogOut,
  ArrowRight,
  Lock,
  Smartphone,
  Building2,
  Banknote,
  Receipt,
  Sparkles,
  Edit3,
  History,
  AlertTriangle,
} from 'lucide-react';
import { useAuth, getPortalRouteByRole } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiFetch, formatBdt, formatDate, computePlanPricing } from '@/lib/api';
import { MembershipPlan, PaymentMethod } from '@/types';
import { Card, Button, Input, Select, Textarea, StatusBadge } from '@/components/ui';

const PAYMENT_OPTIONS: Array<{
  value: PaymentMethod;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  instructions: string;
  requiresRef: boolean;
}> = [
  {
    value: 'BKASH',
    label: 'bKash',
    subtitle: 'Mobile Banking Transfer',
    icon: <Smartphone className="w-4 h-4" />,
    instructions:
      'Send total amount via bKash Send Money / Payment to 01685475975 (Ashkona Gym Desk), then enter your TrxID and sender number below.',
    requiresRef: true,
  },
  {
    value: 'NAGAD',
    label: 'Nagad',
    subtitle: 'Mobile Banking Transfer',
    icon: <Smartphone className="w-4 h-4" />,
    instructions:
      'Send total amount via Nagad to 01685475975 (Icon Fitness Gym), then submit your Nagad Transaction ID and sender number.',
    requiresRef: true,
  },
  {
    value: 'ROCKET',
    label: 'Rocket',
    subtitle: 'DBBL Mobile Banking',
    icon: <Smartphone className="w-4 h-4" />,
    instructions:
      'Send total amount via Rocket to our official gym number 01685475975 and paste the TrxID below for staff verification.',
    requiresRef: true,
  },
  {
    value: 'CASH',
    label: 'Cash at Front Desk',
    subtitle: 'Pay at Ashkona Reception',
    icon: <Banknote className="w-4 h-4" />,
    instructions:
      'Submit your payment request now, then pay in person at the Ashkona Main Road reception counter. Admin will verify & unlock your portal immediately.',
    requiresRef: false,
  },
  {
    value: 'POS_CARD',
    label: 'Card / POS Terminal',
    subtitle: 'Debit or Credit Card',
    icon: <CreditCard className="w-4 h-4" />,
    instructions:
      'Enter the POS approval/reference code provided by reception or request card payment at the Ashkona desk.',
    requiresRef: false,
  },
  {
    value: 'BANK_TRANSFER',
    label: 'Bank Transfer / NPSB',
    subtitle: 'Direct Bank Deposit',
    icon: <Building2 className="w-4 h-4" />,
    instructions:
      'Submit your bank transfer reference number below so our finance admin can match and verify your deposit.',
    requiresRef: true,
  },
];

function RegisterPaymentContent() {
  const { user, isLoading, logout, refreshProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [activeMembership, setActiveMembership] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BKASH');
  const [transactionReference, setTransactionReference] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditingPending, setIsEditingPending] = useState(false);

  const loadBillingState = useCallback(
    async (silent = false) => {
      if (!user || user.role !== 'MEMBER') return;
      if (!silent) setChecking(true);
      try {
        const [mRes, pRes, plansRes] = await Promise.all([
          apiFetch<{ activeMembership: any | null; history: any[] }>(
            '/memberships/my',
          ),
          apiFetch<any[]>('/payments/my'),
          apiFetch<MembershipPlan[]>('/membership-plans/public'),
        ]);

        setActiveMembership(mRes?.activeMembership || null);
        setHistory(mRes?.history || []);
        setPayments(pRes || []);
        setPlans(plansRes || []);

        const latestPending = (mRes?.history || []).find(
          (m: any) => m.status === 'PENDING' || m.status === 'PENDING_PAYMENT' || m.status === 'PENDING_APPROVAL',
        );
        if (latestPending?.planId) {
          setSelectedPlanId((prev) => prev || latestPending.planId);
        } else if (plansRes?.length > 0) {
          const featured = plansRes.find((p) => p.isFeatured) || plansRes[0];
          setSelectedPlanId((prev) => prev || featured.id);
        }

        if (mRes?.activeMembership) {
          await refreshProfile();
        }
      } catch (err: any) {
        toast({
          title: 'Could Not Load Billing Status',
          description: err.message || 'Please try refreshing again.',
          variant: 'error',
        });
      } finally {
        setChecking(false);
      }
    },
    [user, refreshProfile, toast],
  );

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login?redirect=/register/payment');
      return;
    }
    if (user.role !== 'MEMBER') {
      router.replace(getPortalRouteByRole(user.role));
      return;
    }
    loadBillingState();
  }, [isLoading, user, router, loadBillingState]);

  const pendingMembership = history.find(
    (m) =>
      m.status === 'PENDING' ||
      m.status === 'PENDING_PAYMENT' ||
      m.status === 'PENDING_APPROVAL',
  );

  const selectedPlan =
    plans.find((p) => p.id === selectedPlanId) ||
    pendingMembership?.plan ||
    plans[0] ||
    null;

  const planPricing = computePlanPricing(selectedPlan);
  const planFee = planPricing.basePrice;
  const planDiscount = planPricing.totalDiscount;
  const admissionFee = planPricing.admissionFee;
  const totalPayable = planPricing.netFirstTotal;

  const pendingPayment = payments.find((p) => p.status === 'PENDING');
  const pendingEditCount = Number(pendingPayment?.editCount || 0);
  const canEditPending = Boolean(pendingPayment && pendingEditCount < 1);
  const activeOption =
    PAYMENT_OPTIONS.find((opt) => opt.value === paymentMethod) ||
    PAYMENT_OPTIONS[0];

  const handleOpenEditMode = () => {
    if (!pendingPayment || !canEditPending) return;
    setSelectedPlanId(
      pendingPayment.membership?.planId ||
        pendingMembership?.planId ||
        selectedPlanId,
    );
    setPaymentMethod(pendingPayment.paymentMethod || 'BKASH');
    setTransactionReference(pendingPayment.transactionReference || '');
    setSenderPhone(pendingPayment.senderPhone || user?.phone || '');
    setNotes(pendingPayment.notes || '');
    setIsEditingPending(true);
  };

  const handleRefreshApproval = async () => {
    setRefreshingStatus(true);
    try {
      const mRes = await apiFetch<{ activeMembership: any | null }>(
        '/memberships/my',
      );
      if (mRes?.activeMembership) {
        await refreshProfile();
        toast({
          title: 'Membership Approved!',
          description:
            'Admin has approved your payment. Unlocking your Member Portal now...',
          variant: 'success',
        });
        router.push('/member/dashboard');
        return;
      }
      await loadBillingState(true);
      toast({
        title: 'Still Awaiting Admin Approval',
        description:
          'Your payment is currently in the verification queue. Once an Admin approves it, full Member Portal access opens automatically.',
        variant: 'info',
      });
    } finally {
      setRefreshingStatus(false);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) {
      toast({
        title: 'Select a Membership Plan',
        description: 'Please pick a membership tier before submitting payment.',
        variant: 'error',
      });
      return;
    }

    if (activeOption.requiresRef && !transactionReference.trim()) {
      toast({
        title: 'Transaction Reference Required',
        description: `Please enter your ${activeOption.label} Transaction ID (TrxID).`,
        variant: 'error',
      });
      return;
    }

    setSubmitting(true);
    try {
      const fallbackRef =
        paymentMethod === 'CASH'
          ? `FRONT-DESK-CASH-${user?.memberCode || Date.now()}`
          : paymentMethod === 'POS_CARD'
          ? `POS-CARD-${user?.memberCode || Date.now()}`
          : '';

      if (isEditingPending && pendingPayment) {
        await apiFetch(`/payments/${pendingPayment.id}/my`, {
          method: 'PATCH',
          body: JSON.stringify({
            planId: selectedPlan.id,
            paymentMethod,
            transactionReference:
              transactionReference.trim() || fallbackRef || undefined,
            senderPhone: senderPhone.trim() || user?.phone || undefined,
            notes:
              notes.trim() ||
              `Edited onboarding payment (1/1) by ${user?.fullName} (${user?.memberCode}) for ${selectedPlan.name}`,
          }),
        });

        toast({
          title: 'Edited Version Saved (1/1 Used)',
          description:
            'Your updated payment submission is now visible in the Admin Panel for verification. Further edits are locked.',
          variant: 'success',
        });

        setTransactionReference('');
        setNotes('');
        setIsEditingPending(false);
        await loadBillingState(true);
        return;
      }

      if (pendingPayment) {
        toast({
          title: 'Payment Already Submitted',
          description:
            'Only one payment submission is allowed per Member ID. Use Edit Payment if you have not edited yet.',
          variant: 'info',
        });
        setIsEditingPending(false);
        return;
      }

      let targetMembershipId = pendingMembership?.id;

      if (!targetMembershipId || pendingMembership?.planId !== selectedPlan.id) {
        const createdMembership = await apiFetch<any>(
          '/memberships/renewal-request',
          {
            method: 'POST',
            body: JSON.stringify({
              planId: selectedPlan.id,
              renewalNotes:
                'Selected during member onboarding payment checkout. Pending Admin verification.',
            }),
          },
        );
        targetMembershipId = createdMembership.id;
      }

      await apiFetch('/payments', {
        method: 'POST',
        body: JSON.stringify({
          membershipId: targetMembershipId,
          amountBdt: planPricing.grossFirstTotal,
          discountBdt: planDiscount,
          paymentMethod,
          transactionReference:
            transactionReference.trim() || fallbackRef || undefined,
          senderPhone: senderPhone.trim() || user?.phone || undefined,
          notes:
            notes.trim() ||
            `Onboarding payment submitted by ${user?.fullName} (${user?.memberCode}) for ${selectedPlan.name}`,
        }),
      });

      toast({
        title: 'Payment Submitted for Admin Approval!',
        description:
          'Your payment record is now PENDING verification. You may edit it once if needed while pending.',
        variant: 'success',
      });

      setTransactionReference('');
      setNotes('');
      setIsEditingPending(false);
      await loadBillingState(true);
    } catch (err: any) {
      toast({
        title: 'Payment Submission Failed',
        description: err.message || 'Could not submit payment record.',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || checking || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl border border-[#2C2C2C] bg-[#141414] flex items-center justify-center animate-pulse">
            <CreditCard className="w-5 h-5 text-[#C7F464]" />
          </div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#A1A1AA]">
            Loading Membership Payment &amp; Approval Status...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-16">
      {/* Progress Stepper */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#262626]">
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
            STEP 02 OF 03 • MEMBERSHIP CHECKOUT &amp; VERIFICATION
          </span>
          <h1 className="font-display text-3xl sm:text-5xl uppercase tracking-wide text-white mt-1">
            {activeMembership
              ? 'MEMBERSHIP APPROVED & ACTIVE'
              : pendingPayment && !isEditingPending
              ? 'AWAITING ADMIN PAYMENT APPROVAL'
              : isEditingPending
              ? 'EDIT SUBMITTED PAYMENT (FINAL 1/1)'
              : 'COMPLETE MEMBERSHIP PAYMENT'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-[#141414] border border-[#2C2C2C] text-xs font-mono">
            <span className="text-[#A1A1AA] mr-1.5">MEMBER ID:</span>
            <span className="text-[#C7F464] font-bold">
              {user.memberCode || 'ASSIGNING'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Portal Gate Banner when not yet approved */}
      {!activeMembership && (
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#C7F464]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#C7F464]/15 border border-[#C7F464]/35 flex items-center justify-center shrink-0 text-[#C7F464]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Member Portal Access Locks Until Payment &amp; Admin Approval
              </p>
              <p className="text-xs text-[#A1A1AA] mt-0.5 leading-relaxed">
                Complete your membership payment below. As soon as an Ashkona
                Gym Admin verifies and approves your payment, your Dashboard,
                Workouts, Class Bookings, and Smart Face Access open
                automatically.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefreshApproval}
            isLoading={refreshingStatus}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Check Approval Status
          </Button>
        </div>
      )}

      {/* CASE A: ACTIVE MEMBERSHIP APPROVED */}
      {activeMembership ? (
        <Card className="p-8 sm:p-10 rounded-3xl border border-[#C7F464]/45 space-y-6 max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#C7F464]/15 border border-[#C7F464]/40 flex items-center justify-center mx-auto text-[#C7F464]">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-[#C7F464]/15 text-[#C7F464] text-[11px] font-mono uppercase tracking-wider font-bold">
              VERIFIED &amp; APPROVED BY ADMIN
            </span>
            <h2 className="font-display text-3xl sm:text-4xl uppercase text-white">
              WELCOME TO ICON FITNESS, {user.fullName}
            </h2>
            <p className="text-sm text-[#A1A1AA] max-w-xl mx-auto">
              Your <strong className="text-white">{activeMembership.plan?.name}</strong>{' '}
              membership is now active through{' '}
              <strong className="text-[#C7F464]">
                {formatDate(activeMembership.endDate)}
              </strong>
              . Full Member Portal access is unlocked.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/member/dashboard">
              <Button
                variant="primary"
                size="lg"
                className="ifg-btn-primary rounded-xl"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Enter Member Portal Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      ) : pendingPayment && !isEditingPending ? (
        /* CASE B: PAYMENT SUBMITTED (1/1) — WAITING FOR ADMIN APPROVAL */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <Card className="lg:col-span-7 p-6 sm:p-9 rounded-3xl border border-[#2C2C2C] space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400 shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                    SUBMITTED (1/1) • {pendingEditCount > 0 ? 'EDITED VERSION SENT TO ADMIN' : '1 EDIT REMAINING'}
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl uppercase text-white mt-0.5">
                    PENDING ADMIN VERIFICATION
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pendingEditCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C7F464]/15 border border-[#C7F464]/35 text-[10px] font-mono font-bold uppercase text-[#C7F464]">
                    <History className="w-3 h-3" /> Edited (1/1 Used)
                  </span>
                )}
                <StatusBadge status={pendingPayment.status} />
              </div>
            </div>

            <p className="text-sm text-[#A1A1AA] leading-relaxed">
              Thank you, <strong className="text-white">{user.fullName}</strong>.
              Your single payment submission for this Member ID has been logged
              for{' '}
              <strong className="text-white">
                {pendingPayment.membership?.plan?.name || selectedPlan?.name}
              </strong>
              . An Icon Fitness Gym Administrator is reviewing your payment
              details. Once verified in the Admin Panel, your membership will
              activate and Member Portal access will unlock.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-[#141414] border border-[#262626] text-xs">
              <div>
                <span className="font-mono uppercase text-[#A1A1AA] block">
                  Payment Amount
                </span>
                <span className="text-base font-bold text-[#C7F464] mt-1 block">
                  {formatBdt(pendingPayment.netAmountBdt || pendingPayment.amountBdt)}
                </span>
              </div>
              <div>
                <span className="font-mono uppercase text-[#A1A1AA] block">
                  Payment Method
                </span>
                <span className="text-sm font-semibold text-white mt-1 block">
                  {pendingPayment.paymentMethod}
                </span>
              </div>
              <div>
                <span className="font-mono uppercase text-[#A1A1AA] block">
                  Transaction Reference
                </span>
                <span className="font-mono text-sm text-white mt-1 block break-all">
                  {pendingPayment.transactionReference || 'Front Desk Verification'}
                </span>
              </div>
              <div>
                <span className="font-mono uppercase text-[#A1A1AA] block">
                  Submitted On
                </span>
                <span className="text-sm text-white mt-1 block">
                  {formatDate(pendingPayment.createdAt)}
                </span>
              </div>
            </div>

            {pendingPayment.isEdited && pendingPayment.latestEdit && (
              <div className="p-4 rounded-2xl bg-[#141414] border border-[#C7F464]/35 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono uppercase text-[#C7F464] font-bold flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    Edited Version Active (1/1 Edit Used)
                  </span>
                  <span className="text-[#A1A1AA] font-mono">
                    {formatDate(pendingPayment.latestEdit.editedAt)}
                  </span>
                </div>
                <p className="text-[#A1A1AA]">
                  Your updated version is displayed to the Admin for approval.
                  Previous TrxID:{' '}
                  <span className="font-mono text-white">
                    {pendingPayment.latestEdit.previous?.transactionReference ||
                      pendingPayment.latestEdit.previous?.paymentMethod ||
                      'N/A'}
                  </span>{' '}
                  → Edited TrxID:{' '}
                  <span className="font-mono text-[#C7F464] font-semibold">
                    {pendingPayment.latestEdit.updated?.transactionReference ||
                      pendingPayment.latestEdit.updated?.paymentMethod ||
                      'N/A'}
                  </span>
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                className="ifg-btn-primary rounded-xl"
                onClick={handleRefreshApproval}
                isLoading={refreshingStatus}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Refresh Approval Status
              </Button>
              {canEditPending ? (
                <Button
                  variant="secondary"
                  size="lg"
                  className="rounded-xl"
                  onClick={handleOpenEditMode}
                  leftIcon={<Edit3 className="w-4 h-4" />}
                >
                  Edit Payment (1 Time Only)
                </Button>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#141414] border border-[#2C2C2C] text-xs font-mono text-[#A1A1AA]">
                  <Lock className="w-3.5 h-3.5 text-[#C7F464]" />
                  Edit Limit Reached (1/1 Used)
                </span>
              )}
            </div>
          </Card>

          <Card className="lg:col-span-5 p-6 sm:p-8 rounded-3xl border border-[#2C2C2C] space-y-5">
            <span className="text-xs font-mono uppercase tracking-widest text-[#C7F464]">
              WHAT HAPPENS NEXT?
            </span>
            <h3 className="font-display text-2xl uppercase text-white">
              3-STEP ACTIVATION CHECKLIST
            </h3>
            <div className="space-y-4">
              {[
                {
                  step: '01',
                  title: 'Account & Member Code Created',
                  desc: `Completed (${user.memberCode}).`,
                  done: true,
                },
                {
                  step: '02',
                  title: 'Payment Record Submitted',
                  desc: `Submitted via ${pendingPayment.paymentMethod} (${formatBdt(pendingPayment.netAmountBdt || pendingPayment.amountBdt)}).`,
                  done: true,
                },
                {
                  step: '03',
                  title: 'Admin Approval & Portal Unlock',
                  desc: 'Admin verifies your TrxID or Cash receipt in Admin Payments and activates your plan.',
                  done: false,
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#141414] border border-[#262626]"
                >
                  <span
                    className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                      item.done
                        ? 'bg-[#C7F464] text-[#090909]'
                        : 'bg-[#202020] text-[#C7F464] border border-[#C7F464]/35'
                    }`}
                  >
                    {item.step}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-[#262626] text-xs text-[#A1A1AA]">
              Need urgent front-desk verification? Call{' '}
              <span className="text-[#C7F464] font-semibold font-mono">
                01685475975
              </span>{' '}
              with your Member ID{' '}
              <span className="text-white font-mono">{user.memberCode}</span>.
            </div>
          </Card>
        </div>
      ) : (
        /* CASE C: MEMBERSHIP PAYMENT SUBMISSION FORM */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Summary & Invoice Breakdown */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            <Card className="p-6 sm:p-8 rounded-3xl border border-[#2C2C2C] space-y-6">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-[#C7F464]">
                  ORDER SUMMARY
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#C7F464]/15 border border-[#C7F464]/30 text-[10px] font-mono font-bold text-[#C7F464] uppercase">
                  PENDING PAYMENT
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-1">
                <p className="text-xs font-mono uppercase text-[#A1A1AA]">
                  Registered Member
                </p>
                <p className="text-base font-semibold text-white">
                  {user.fullName}
                </p>
                <p className="text-xs text-[#A1A1AA]">
                  {user.email} • {user.phone}
                </p>
              </div>

              <Select
                label="Selected Membership Plan"
                value={selectedPlan?.id || ''}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                options={plans.map((p) => {
                  const pricing = computePlanPricing(p);
                  return {
                    value: p.id,
                    label: pricing.hasDiscount
                      ? `${p.name} (${p.durationDays} Days) — ${formatBdt(pricing.discountedPrice)} (${pricing.badgeText || `-${formatBdt(pricing.totalDiscount)}`})`
                      : `${p.name} (${p.durationDays} Days) — ${formatBdt(pricing.basePrice)}`,
                  };
                })}
              />

              {selectedPlan && (
                <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-3 text-sm">
                  <div className="flex items-center justify-between text-[#A1A1AA]">
                    <span>{selectedPlan.name} Fee</span>
                    <span className="text-white font-medium">
                      {formatBdt(planFee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#A1A1AA]">
                    <span>One-Time Admission Fee</span>
                    <span className="text-white font-medium">
                      {formatBdt(admissionFee)}
                    </span>
                  </div>
                  {planPricing.hasDiscount && (
                    <div className="flex items-center justify-between text-[#C7F464]">
                      <span className="flex items-center gap-2">
                        Plan Discount
                        {planPricing.badgeText && (
                          <span className="px-2 py-0.5 rounded-full bg-[#C7F464]/15 border border-[#C7F464]/40 text-[10px] font-mono uppercase">
                            {planPricing.badgeText}
                          </span>
                        )}
                      </span>
                      <span className="font-mono font-semibold">
                        -{formatBdt(planDiscount)}
                      </span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-[#262626] flex items-center justify-between">
                    <span className="font-semibold text-white">
                      Total Payable Now
                    </span>
                    <div className="text-right">
                      {planPricing.hasDiscount && (
                        <span className="block font-mono text-xs text-[#A1A1AA] line-through">
                          {formatBdt(planPricing.grossFirstTotal)}
                        </span>
                      )}
                      <span className="font-display text-2xl text-[#C7F464]">
                        {formatBdt(totalPayable)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5 text-xs text-[#A1A1AA]">
                <ShieldCheck className="w-4 h-4 text-[#C7F464] shrink-0 mt-0.5" />
                <span>
                  Payments stay in <strong className="text-white">PENDING</strong>{' '}
                  status until verified by authorized Ashkona Gym Staff / Admin.
                </span>
              </div>
            </Card>
          </div>

          {/* Right: Payment Method & Transaction Form */}
          <div className="lg:col-span-7">
            <Card className="p-6 sm:p-9 rounded-3xl border border-[#2C2C2C] space-y-6">
              <div>
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
                  {isEditingPending
                    ? 'ONE-TIME PAYMENT EDIT (1/1)'
                    : 'PAY & SUBMIT FOR APPROVAL (1 SUBMISSION PER ID)'}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl uppercase text-white mt-1">
                  {isEditingPending
                    ? 'UPDATE YOUR SUBMITTED PAYMENT'
                    : 'CHOOSE PAYMENT METHOD'}
                </h2>
              </div>

              {isEditingPending && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/35 flex items-start gap-3 text-xs text-[#A1A1AA]">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Final Edit Notice:</strong> You
                    can only edit your payment submission <strong>once</strong>.
                    After saving, this edited version will appear in the Admin
                    Panel and further edits will be locked.
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmitPayment} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PAYMENT_OPTIONS.map((opt) => {
                    const active = paymentMethod === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPaymentMethod(opt.value)}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          active
                            ? 'border-[#C7F464] bg-[#C7F464]/15 shadow-sm'
                            : 'border-[#2C2C2C] bg-[#141414] hover:border-[#C7F464]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`${
                              active ? 'text-[#C7F464]' : 'text-[#A1A1AA]'
                            }`}
                          >
                            {opt.icon}
                          </span>
                          {active && (
                            <Sparkles className="w-3.5 h-3.5 text-[#C7F464]" />
                          )}
                        </div>
                        <p className="text-sm font-semibold text-white">
                          {opt.label}
                        </p>
                        <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                          {opt.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] text-xs text-[#A1A1AA] leading-relaxed">
                  <span className="font-mono uppercase text-[#C7F464] font-bold block mb-1">
                    {activeOption.label} Instructions
                  </span>
                  {activeOption.instructions}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={
                      activeOption.requiresRef
                        ? `${activeOption.label} Transaction ID (TrxID) *`
                        : 'Counter Reference / Note (Optional)'
                    }
                    required={activeOption.requiresRef}
                    placeholder={
                      activeOption.requiresRef
                        ? 'e.g. BKS9X8K2L1P'
                        : 'Optional desk or POS slip code'
                    }
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                  />
                  <Input
                    label="Sender Phone Number"
                    placeholder={user.phone || '017XXXXXXXX'}
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                  />
                </div>

                <Textarea
                  label="Additional Payment Notes (Optional)"
                  rows={2}
                  placeholder="Any note for the verifying Admin (e.g. paid at morning desk, preferred branch time)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="flex-1 ifg-btn-primary rounded-xl"
                    isLoading={submitting}
                    leftIcon={
                      isEditingPending ? (
                        <Edit3 className="w-4 h-4" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )
                    }
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isEditingPending
                      ? `Save Edited Payment (${formatBdt(totalPayable)}) — Final 1/1`
                      : `Submit Payment (${formatBdt(totalPayable)}) for Approval`}
                  </Button>
                  {isEditingPending && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      onClick={() => setIsEditingPending(false)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegisterPaymentPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
      <RegisterPaymentContent />
    </Suspense>
  );
}


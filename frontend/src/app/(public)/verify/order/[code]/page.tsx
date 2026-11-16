'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  AlertTriangle,
  Truck,
  Store,
  CheckCircle2,
  Clock,
  CreditCard,
  ShoppingBag,
  ArrowLeft,
  RefreshCw,
  Package,
  Search,
  XCircle,
} from 'lucide-react';
import { apiFetch, formatBdt, formatDateTime } from '@/lib/api';
import { formatPaymentMethod, formatVerifiedByLabel } from '@/lib/receipt-helpers';
import { Card, StatusBadge, Button, Skeleton, Input } from '@/components/ui';

function getOrderStageIndex(status?: string): number {
  const s = String(status || 'PENDING').toUpperCase();
  if (s === 'COMPLETED') return 4;
  if (s === 'READY_FOR_PICKUP') return 3;
  if (s === 'CONFIRMED') return 2;
  if (s === 'CANCELLED') return -1;
  return 1; // PENDING
}

function getStageSummaryText(status?: string, fulfillmentType?: string) {
  const s = String(status || 'PENDING').toUpperCase();
  const isDelivery = fulfillmentType === 'DELIVERY';
  if (s === 'COMPLETED') {
    return {
      title: isDelivery
        ? 'Stage 4 of 4 — Delivered & Settled'
        : 'Stage 4 of 4 — Picked Up & Settled',
      detail: isDelivery
        ? 'Your order has been handed over via courier and marked completed in Icon Fitness records.'
        : 'Your gear was collected from the Ashkona Reception Desk and settled in full.',
      tone: 'emerald' as const,
    };
  }
  if (s === 'READY_FOR_PICKUP') {
    return {
      title: isDelivery
        ? 'Stage 3 of 4 — Out for Courier Delivery'
        : 'Stage 3 of 4 — Packed & Ready at Ashkona Desk',
      detail: isDelivery
        ? 'Your package is packed and handed over to courier / rider for delivery to your address.'
        : 'Your order is packed and waiting for collection at Icon Fitness Gym Ashkona Front Desk.',
      tone: 'lime' as const,
    };
  }
  if (s === 'CONFIRMED') {
    return {
      title: 'Stage 2 of 4 — Order Confirmed & Packing',
      detail:
        'Your advance payment / gym student ID has been verified. Our pro-shop team is preparing your items.',
      tone: 'lime' as const,
    };
  }
  if (s === 'CANCELLED') {
    return {
      title: 'Order Cancelled',
      detail:
        'This order was cancelled. If you paid an advance, please contact the Ashkona Front Desk (+880 1685-475975).',
      tone: 'rose' as const,
    };
  }
  return {
    title: 'Stage 1 of 4 — Order Placed (Verification Pending)',
    detail:
      'Your order is logged in our system and currently waiting for TrxID / desk confirmation by the Icon Fitness team.',
    tone: 'amber' as const,
  };
}

export default function VerifyStoreOrderPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = decodeURIComponent(String(params?.code || ''));

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<any | null>(null);
  const [lookupCode, setLookupCode] = useState(code);

  const loadOrderStatus = useCallback(
    async (isManualRefresh = false) => {
      if (!code) return;
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      try {
        const res = await apiFetch<any>(`/store/orders/verify/${encodeURIComponent(code)}`);
        setData(res);
      } catch (err: any) {
        setError(err?.message || 'Unable to verify or track this order.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [code],
  );

  useEffect(() => {
    setLookupCode(code);
    loadOrderStatus(false);
  }, [code, loadOrderStatus]);

  const handleTrackAnother = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = lookupCode.trim().toUpperCase();
    if (!cleaned) return;
    router.push(`/verify/order/${encodeURIComponent(cleaned)}`);
  };

  const stageIndex = getOrderStageIndex(data?.status);
  const stageInfo = getStageSummaryText(data?.status, data?.fulfillmentType);
  const isDelivery = data?.fulfillmentType === 'DELIVERY';

  const progressSteps = [
    {
      step: 1,
      label: 'Order Placed',
      sub: 'Logged online',
    },
    {
      step: 2,
      label: 'Confirmed',
      sub: 'Payment verified',
    },
    {
      step: 3,
      label: isDelivery ? 'Out for Delivery' : 'Ready for Pickup',
      sub: isDelivery ? 'Courier dispatched' : 'At Ashkona Desk',
    },
    {
      step: 4,
      label: isDelivery ? 'Delivered' : 'Picked Up',
      sub: 'Completed',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/store"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#A1A1AA] hover:text-[#C7F464]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Gear Store
        </Link>

        <form onSubmit={handleTrackAnother} className="flex items-center gap-2">
          <Input
            placeholder="Track Order ID (e.g. IFG-ORD-...)"
            value={lookupCode}
            onChange={(e) => setLookupCode(e.target.value)}
            className="h-9 text-xs font-mono w-56"
          />
          <Button type="submit" size="sm" variant="secondary" className="h-9">
            <Search className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>

      {loading ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : error || !data ? (
        <Card className="p-8 rounded-3xl border border-rose-500/40 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
          <div className="space-y-1">
            <h1 className="font-display text-3xl uppercase text-white">
              Order Not Found
            </h1>
            <p className="text-sm text-[#A1A1AA]">
              {error || `Reference "${code}" was not found in Icon Fitness Gym records.`}
            </p>
          </div>
          <Link href="/store" className="inline-block">
            <Button variant="primary">Browse Official Store</Button>
          </Link>
        </Card>
      ) : (
        <Card className="p-6 sm:p-8 rounded-3xl border border-[#C7F464]/50 space-y-6">
          {/* Verified Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2C2C2C]">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#1B2210] border border-[#C7F464]/45 flex items-center justify-center text-[#C7F464] shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-mono uppercase tracking-widest text-[#C7F464] font-bold">
                  ICON FITNESS GYM • LIVE ORDER TRACKER
                </p>
                <h1 className="font-display text-2xl sm:text-3xl uppercase text-white mt-0.5">
                  {data.slipNumber || data.orderNumber}
                </h1>
                <p className="text-xs font-mono text-[#A1A1AA] mt-0.5">
                  Order #{data.orderNumber} • Issued {formatDateTime(data.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <StatusBadge status={data.status} />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => loadOrderStatus(true)}
                isLoading={refreshing}
                title="Refresh Live Status"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Live 4-Stage Order Progress Stepper */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#C7F464]">
                <Package className="w-4 h-4" />
                <span>Order Progress Timeline</span>
              </div>
              <span className="text-[11px] font-mono text-[#A1A1AA]">
                Updated {formatDateTime(data.updatedAt)}
              </span>
            </div>

            {stageIndex === -1 ? (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/35 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-rose-400">{stageInfo.title}</p>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">{stageInfo.detail}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {progressSteps.map((st) => {
                    const completed = stageIndex >= st.step;
                    const current = stageIndex === st.step;
                    return (
                      <div
                        key={st.step}
                        className={`p-3 rounded-xl border transition-all ${
                          current
                            ? 'bg-[#1B2210] border-[#C7F464]'
                            : completed
                              ? 'bg-emerald-500/10 border-emerald-500/35'
                              : 'bg-[#141414] border-[#2C2C2C] opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`w-6 h-6 rounded-full text-[11px] font-mono font-bold flex items-center justify-center ${
                              completed
                                ? 'bg-[#C7F464] text-[#090909]'
                                : 'bg-[#2C2C2C] text-[#A1A1AA]'
                            }`}
                          >
                            {completed ? '✓' : st.step}
                          </span>
                          {current && (
                            <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-[#C7F464]/20 text-[#C7F464]">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-white leading-tight">
                          {st.label}
                        </p>
                        <p className="text-[10px] font-mono text-[#A1A1AA] mt-0.5">
                          {st.sub}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    stageInfo.tone === 'emerald'
                      ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400'
                      : stageInfo.tone === 'amber'
                        ? 'bg-amber-500/10 border-amber-500/35 text-amber-400'
                        : 'bg-[#1B2210] border-[#C7F464]/45 text-[#C7F464]'
                  }`}
                >
                  <p className="font-bold">{stageInfo.title}</p>
                  <p className="text-[#A1A1AA] mt-0.5">{stageInfo.detail}</p>
                </div>
              </>
            )}
          </div>

          {/* Customer, Eligibility & Fulfillment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-1.5">
              <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                Customer &amp; Student Verification
              </p>
              <p className="text-sm font-bold text-white">{data.customerName}</p>
              <p className="text-xs font-mono text-[#A1A1AA]">{data.maskedPhone}</p>
              {data.memberCode && (
                <p className="text-xs font-mono text-emerald-400 inline-flex items-center gap-1 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {data.memberCode} {data.isMemberVerified ? '(Verified Running Student)' : ''}
                </p>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-1.5">
              <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                Collection / Delivery Mode
              </p>
              <p className="text-sm font-bold text-white inline-flex items-center gap-1.5">
                {data.fulfillmentType === 'DELIVERY' ? (
                  <>
                    <Truck className="w-4 h-4 text-[#C7F464]" />
                    <span>
                      Online Home Delivery ({data.deliveryArea === 'OUTSIDE_DHAKA' ? 'Outside Dhaka' : 'Dhaka City'})
                    </span>
                  </>
                ) : (
                  <>
                    <Store className="w-4 h-4 text-[#C7F464]" />
                    <span>Ashkona Reception Desk Pickup</span>
                  </>
                )}
              </p>
              <p className="text-xs font-mono text-[#A1A1AA] inline-flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#C7F464]" />
                {formatPaymentMethod(data.paymentMethod)}
                {data.transactionReference ? ` • TrxID: ${data.transactionReference}` : ''}
              </p>
              {data.processedByUser && (
                <p className="text-[11px] font-mono text-[#A1A1AA]">
                  Processed By:{' '}
                  {formatVerifiedByLabel(
                    data.processedByUser.fullName,
                    data.processedByUser.role,
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Itemized Breakdown */}
          <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-3">
            <p className="text-xs font-mono uppercase text-[#A1A1AA] flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-[#C7F464]" />
              <span>Items &amp; Payment Breakdown</span>
            </p>
            <div className="space-y-2">
              {(data.items || []).map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-[#262626] last:border-b-0"
                >
                  <div>
                    <p className="font-semibold text-white">{item.productName}</p>
                    <p className="text-[11px] font-mono text-[#A1A1AA]">
                      {formatBdt(item.unitPriceBdt)} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-[#C7F464]">
                    {formatBdt(item.subtotalBdt)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#2C2C2C] space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-[#A1A1AA]">
                <span>Products Subtotal</span>
                <span>{formatBdt(data.subtotalBdt)}</span>
              </div>
              {Number(data.discountAmountBdt || 0) > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Promo Discount ({data.discountCode})</span>
                  <span>-{formatBdt(data.discountAmountBdt)}</span>
                </div>
              )}
              {Number(data.deliveryFeeBdt || 0) > 0 && (
                <div className="flex justify-between text-[#A1A1AA]">
                  <span>Delivery Charge (Separate)</span>
                  <span>+{formatBdt(data.deliveryFeeBdt)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white pt-1.5 border-t border-[#2C2C2C]">
                <span>Total Order Amount</span>
                <span className="text-[#C7F464]">{formatBdt(data.totalAmountBdt)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Advance Paid</span>
                <span>{formatBdt(data.advancePaidBdt)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className={data.balanceDueBdt === 0 ? 'text-emerald-400' : 'text-amber-400'}>
                  {data.balanceDueBdt === 0 ? 'Payment Status' : 'Balance Due'}
                </span>
                <span className={data.balanceDueBdt === 0 ? 'text-emerald-400' : 'text-amber-400'}>
                  {data.balanceDueBdt === 0 ? 'PAID IN FULL' : formatBdt(data.balanceDueBdt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs font-mono text-[#A1A1AA] pt-1">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#C7F464]" />
              Last Updated: {formatDateTime(data.updatedAt)}
            </span>
            <span>Icon Fitness Gym • Ashkona, Dhaka</span>
          </div>
        </Card>
      )}
    </div>
  );
}

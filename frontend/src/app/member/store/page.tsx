'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Plus,
  PackageCheck,
  ArrowUpRight,
  Clock,
  Eye,
  Printer,
  Smartphone,
  Copy,
  Check,
} from 'lucide-react';
import { apiFetch, formatBdt, formatDate } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
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
import {
  StoreProductVisual,
  STORE_CATEGORY_META,
  formatStoreCategoryLabel,
} from '@/components/shared/StoreProductVisual';
import { downloadOrderPaymentSlip } from '@/lib/download-order-slip';
import { StoreOrderSlipModal } from '@/components/shared/StoreOrderSlipModal';
import {
  AppliedPromoSummary,
  PromoCodeInput,
} from '@/components/shared/PromoCodeInput';

export default function MemberStorePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<'shop' | 'orders'>('shop');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('ALL');

  const [buyProduct, setBuyProduct] = useState<any | null>(null);
  const [qty, setQty] = useState(1);
  const [fulfillmentType, setFulfillmentType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [deliveryArea, setDeliveryArea] = useState<'DHAKA_METRO' | 'OUTSIDE_DHAKA'>('DHAKA_METRO');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [advanceAmountBdt, setAdvanceAmountBdt] = useState('500');
  const [trxRef, setTrxRef] = useState('');
  const [pickupNote, setPickupNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const [slipOrder, setSlipOrder] = useState<any | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromoSummary | null>(null);
  const [officialPaymentPhone, setOfficialPaymentPhone] = useState('01685475975');
  const [copiedPaymentPhone, setCopiedPaymentPhone] = useState(false);
  const [memberEligibility, setMemberEligibility] = useState<{
    verified: boolean;
    planName?: string;
    reason?: string;
  } | null>(null);

  const checkMemberRunningStatus = useCallback(async (code?: string | null) => {
    if (!code) {
      setMemberEligibility({
        verified: false,
        reason: 'No Gym Member ID found on your account.',
      });
      return;
    }
    const cleanCode = String(code)
      .trim()
      .replace(/^(?:GYM\s*)?(?:MEMBER\s*)?ID\s*[:#-]?\s*/i, '')
      .replace(/^#+\s*/, '')
      .replace(/\s+/g, '')
      .toUpperCase();
    try {
      const res = await apiFetch<{ verified: boolean; planName?: string; reason?: string }>(
        `/store/members/verify-auth?code=${encodeURIComponent(cleanCode)}`,
      );
      setMemberEligibility(res);
      if (!res?.verified) {
        setPaymentMethod((prev) => (prev === 'CASH' ? 'BKASH' : prev));
      }
    } catch {
      setMemberEligibility({
        verified: false,
        reason: 'Could not verify running membership status.',
      });
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodList, myOrders] = await Promise.all([
        apiFetch<any[]>('/store/products').catch(() => []),
        apiFetch<any[]>('/store/orders/my').catch(() => []),
      ]);
      setProducts(Array.isArray(prodList) ? prodList : []);
      setOrders(Array.isArray(myOrders) ? myOrders : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    apiFetch<{ phonePrimary?: string }>('/settings/public')
      .then((res) => {
        if (res?.phonePrimary && !res.phonePrimary.includes('Configurable')) {
          setOfficialPaymentPhone(res.phonePrimary);
        }
      })
      .catch(() => { });
    if (user?.memberCode) {
      checkMemberRunningStatus(user.memberCode);
    }
  }, [loadData, user?.memberCode, checkMemberRunningStatus]);

  const handleQuickOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyProduct || !user) return;
    const isVerifiedMember = Boolean(memberEligibility?.verified);
    const quickDeliveryFee =
      fulfillmentType === 'DELIVERY'
        ? deliveryArea === 'OUTSIDE_DHAKA'
          ? 150
          : 80
        : 0;
    const totalQuickPayable =
      Math.max(
        0,
        Number(buyProduct.priceBdt || 0) * qty - Number(appliedPromo?.discountAmountBdt || 0),
      ) + quickDeliveryFee;
    const minAdv = isVerifiedMember ? 0 : Math.min(500, totalQuickPayable);
    const parsedAdv = Number(advanceAmountBdt || 0);

    if (fulfillmentType === 'DELIVERY' && deliveryAddress.trim().length < 8) {
      toast({
        title: 'Delivery Address Required',
        description: 'Enter your complete delivery address (House, Road, Area) for online delivery.',
        variant: 'error',
      });
      return;
    }

    if (!isVerifiedMember && totalQuickPayable > 0) {
      if (paymentMethod === 'CASH' || parsedAdv < minAdv || trxRef.trim().length < 4) {
        toast({
          title: 'Minimum ৳500 Advance Required',
          description:
            'Your gym membership is not active/running. Pay at least ৳500 advance via bKash/Nagad/Card with TrxID.',
          variant: 'error',
        });
        return;
      }
    }

    setPlacing(true);
    try {
      const created = await apiFetch<any>('/store/orders/member', {
        method: 'POST',
        body: JSON.stringify({
          customerName: user.fullName || 'Member',
          customerPhone: user.phone || '+8801700000000',
          customerEmail: user.email,
          memberCode: isVerifiedMember ? user.memberCode : undefined,
          fulfillmentType,
          deliveryArea: fulfillmentType === 'DELIVERY' ? deliveryArea : undefined,
          deliveryAddress:
            fulfillmentType === 'DELIVERY' ? deliveryAddress.trim() : undefined,
          paymentMethod,
          advanceAmountBdt: isVerifiedMember ? 0 : parsedAdv,
          transactionReference: trxRef || undefined,
          pickupNote: pickupNote || undefined,
          discountCode: appliedPromo?.code || undefined,
          items: [{ productId: buyProduct.id, quantity: qty }],
        }),
      });
      downloadOrderPaymentSlip(created, officialPaymentPhone).catch(() => { });
      toast({
        title: 'Gear Order Placed & Slip Downloaded',
        description:
          created.fulfillmentType === 'DELIVERY'
            ? `Order ${created.orderNumber} scheduled for online delivery. Payment slip downloaded — scan its QR to track status!`
            : `Order ${created.orderNumber} reserved for reception pickup. Payment slip downloaded — scan its QR to track status!`,
        variant: 'success',
      });
      setBuyProduct(null);
      setQty(1);
      setDeliveryAddress('');
      setTrxRef('');
      setPickupNote('');
      setAppliedPromo(null);
      setTab('orders');
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Order Failed',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setPlacing(false);
    }
  };

  const filteredProducts = products.filter(
    (p) => category === 'ALL' || p.category === category,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Gym Gear &amp; Supplements
          </h1>
          <p className="text-sm text-[#A1A1AA]">
            Order bottles, gloves, lifting belts, and protein directly with your member profile.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-xl bg-[#141414] border border-[#2C2C2C] p-1">
            <button
              type="button"
              onClick={() => setTab('shop')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${tab === 'shop'
                ? 'bg-[#C7F464] text-[#090909]'
                : 'text-[#A1A1AA] hover:text-white'
                }`}
            >
              Shop Catalog ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('orders')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${tab === 'orders'
                ? 'bg-[#C7F464] text-[#090909]'
                : 'text-[#A1A1AA] hover:text-white'
                }`}
            >
              My Orders ({orders.length})
            </button>
          </div>
          <Link
            href="/store"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141414] border border-[#2C2C2C] text-xs font-mono text-[#C7F464] hover:border-[#C7F464] no-underline"
          >
            Full Storefront <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-80 rounded-3xl" />
      ) : tab === 'shop' ? (
        <div className="space-y-5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              'ALL',
              ...Array.from(
                new Set([
                  'BOTTLES',
                  'GLOVES',
                  'BELTS',
                  'SUPPLEMENTS',
                  'ACCESSORIES',
                  'APPAREL',
                  ...products
                    .map((p) => String(p.category || '').trim().toUpperCase())
                    .filter(Boolean),
                ]),
              ),
            ].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold border whitespace-nowrap transition-colors ${category === cat
                  ? 'bg-[#C7F464] border-[#C7F464] text-[#090909]'
                  : 'bg-[#141414] border-[#2C2C2C] text-[#A1A1AA] hover:text-white'
                  }`}
              >
                {cat === 'ALL'
                  ? 'All Items'
                  : STORE_CATEGORY_META[cat]?.label || formatStoreCategoryLabel(cat)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((p) => {
              const stock = Number(p.stockQty || 0);
              return (
                <Card
                  key={p.id}
                  className="p-4 rounded-3xl border border-[#2C2C2C] flex flex-col justify-between gap-4 overflow-hidden"
                >
                  <div className="space-y-3 min-w-0">
                    <div className="relative dark-media-card">
                      <StoreProductVisual
                        imageUrl={p.imageUrl}
                        category={p.category}
                        name={p.name}
                        className="h-40"
                      />
                      {p.badgeText && (
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/85 backdrop-blur-sm border border-[#C7F464]/50 text-[10px] font-mono font-bold uppercase text-[#C7F464]">
                          {p.badgeText}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase text-[#A1A1AA]">
                        <span className="truncate">
                          {STORE_CATEGORY_META[p.category]?.label ||
                            formatStoreCategoryLabel(p.category)}
                        </span>
                        <span className="shrink-0">
                          {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white line-clamp-2">{p.name}</h3>
                      <p className="text-xs text-[#A1A1AA] line-clamp-2">{p.description}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-[#2C2C2C] space-y-2.5 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-2xl text-[#C7F464]">
                        {formatBdt(p.priceBdt)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <Link
                        href={`/store/${p.slug}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 h-9 rounded-xl bg-[#171717] border border-[#2C2C2C] hover:border-[#C7F464]/60 text-xs font-semibold text-white w-full"
                      >
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                        <span>Details</span>
                      </Link>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={stock === 0}
                        className="rounded-xl w-full h-9 justify-center"
                        leftIcon={<Plus className="w-3.5 h-3.5 shrink-0" />}
                        onClick={() => {
                          setBuyProduct(p);
                          setQty(1);
                          checkMemberRunningStatus(user?.memberCode);
                        }}
                      >
                        Order Now
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No Gear Orders Yet"
          description="You haven't ordered any water bottles, gloves, belts, or supplements yet."
          action={
            <Button variant="primary" onClick={() => setTab('shop')}>
              Browse Gym Store
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((ord) => (
            <Card
              key={ord.id}
              className="p-5 rounded-3xl border border-[#2C2C2C] flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#C7F464]">
                    {ord.orderNumber}
                  </span>
                  <StatusBadge status={ord.status} />
                  <span className="text-xs font-mono text-[#A1A1AA] inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDate(ord.createdAt)}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {(ord.items || [])
                    .map((i: any) => `${i.productName} × ${i.quantity}`)
                    .join(' • ')}
                </p>
                {ord.pickupNote && (
                  <p className="text-xs text-[#A1A1AA]">Note: {ord.pickupNote}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-2 shrink-0">
                <div className="text-left md:text-right">
                  <span className="font-display text-2xl text-white block">
                    {formatBdt(ord.totalAmountBdt)}
                  </span>
                  <span className="text-[11px] font-mono text-[#A1A1AA] inline-flex items-center gap-1">
                    <PackageCheck className="w-3.5 h-3.5 text-[#C7F464]" />
                    {ord.paymentMethod} •{' '}
                    {ord.fulfillmentType === 'DELIVERY'
                      ? 'Online Home Delivery'
                      : 'Pickup at Ashkona Desk'}
                  </span>
                </div>
                {ord.status !== 'CANCELLED' && (
                  <Button
                    size="sm"
                    variant={ord.status === 'COMPLETED' ? 'primary' : 'secondary'}
                    leftIcon={<Printer className="w-3.5 h-3.5" />}
                    onClick={() => setSlipOrder(ord)}
                  >
                    {ord.status === 'COMPLETED' ? 'Payment Slip' : 'View Voucher'}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Order Modal */}
      <Modal
        isOpen={Boolean(buyProduct)}
        onClose={() => setBuyProduct(null)}
        title={`Order — ${buyProduct?.name || ''}`}
        description="Reserve now and pick up at Ashkona Reception Desk"
      >
        {buyProduct && (
          <form onSubmit={handleQuickOrder} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-[#171717] border border-[#2C2C2C] flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">{buyProduct.name}</p>
                <p className="text-xs font-mono text-[#A1A1AA]">
                  {formatBdt(buyProduct.priceBdt)} each • {buyProduct.stockQty} available
                </p>
              </div>
              <span className="font-display text-2xl text-[#C7F464]">
                {formatBdt(Number(buyProduct.priceBdt) * qty)}
              </span>
            </div>

            {memberEligibility && !memberEligibility.verified && (() => {
              const quickDeliveryFee =
                fulfillmentType === 'DELIVERY'
                  ? deliveryArea === 'OUTSIDE_DHAKA'
                    ? 150
                    : 80
                  : 0;
              const quickTotal =
                Math.max(
                  0,
                  Number(buyProduct.priceBdt || 0) * qty -
                    Number(appliedPromo?.discountAmountBdt || 0),
                ) + quickDeliveryFee;
              const quickMinAdv = Math.min(500, quickTotal);
              return (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/35 text-xs text-amber-300 space-y-1">
                  <p className="font-bold">
                    Running Gym Membership Not Active — Min {formatBdt(quickMinAdv)} Advance Required
                  </p>
                  <p className="text-[#A1A1AA]">
                    {memberEligibility.reason} Pay at least {formatBdt(quickMinAdv)} via bKash/Nagad/Card with TrxID.
                  </p>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Quantity *"
                type="number"
                min={1}
                max={Number(buyProduct.stockQty || 1)}
                required
                value={String(qty)}
                onChange={(e) =>
                  setQty(
                    Math.max(
                      1,
                      Math.min(
                        Number(buyProduct.stockQty || 1),
                        Number(e.target.value || 1),
                      ),
                    ),
                  )
                }
              />
              <div>
                <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-[#141414] border border-[#2C2C2C] text-sm text-white"
                >
                  {memberEligibility?.verified && (
                    <option value="CASH">Cash at Front Desk (৳0 Advance)</option>
                  )}
                  <option value="BKASH">bKash</option>
                  <option value="NAGAD">Nagad</option>
                  <option value="ROCKET">Rocket</option>
                  <option value="POS_CARD">Card / POS</option>
                </select>
              </div>
            </div>

            {memberEligibility && !memberEligibility.verified && (() => {
              const quickDeliveryFee =
                fulfillmentType === 'DELIVERY'
                  ? deliveryArea === 'OUTSIDE_DHAKA'
                    ? 150
                    : 80
                  : 0;
              const quickMinAdv = Math.min(
                500,
                Math.max(
                  0,
                  Number(buyProduct.priceBdt || 0) * qty -
                    Number(appliedPromo?.discountAmountBdt || 0),
                ) + quickDeliveryFee,
              );
              return (
                <Input
                  label={`Advance Paid BDT (Min ৳${quickMinAdv}) *`}
                  type="number"
                  min={quickMinAdv}
                  required
                  value={advanceAmountBdt}
                  onChange={(e) => setAdvanceAmountBdt(e.target.value)}
                />
              );
            })()}

            {(paymentMethod === 'BKASH' ||
              paymentMethod === 'NAGAD' ||
              paymentMethod === 'ROCKET') && (
                <div className="p-3 rounded-xl bg-[#1B2210] border border-[#C7F464]/45 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#C7F464] text-[#090909] flex items-center justify-center shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-[#C7F464] font-bold">
                        Official {paymentMethod === 'BKASH' ? 'bKash' : paymentMethod === 'NAGAD' ? 'Nagad' : 'Rocket'} Number
                      </p>
                      <p className="font-mono text-sm font-extrabold text-white">
                        {officialPaymentPhone}
                      </p>
                      <p className="text-[10px] text-[#A1A1AA]">
                        Send Money to this official contact number, then enter TrxID below.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const clean = officialPaymentPhone.replace(/[^\d+]/g, '') || '01685475975';
                      try {
                        await navigator.clipboard.writeText(clean);
                        setCopiedPaymentPhone(true);
                        toast({
                          title: 'Number Copied',
                          description: `Copied ${clean} to clipboard.`,
                          variant: 'success',
                        });
                        setTimeout(() => setCopiedPaymentPhone(false), 2000);
                      } catch {
                        toast({
                          title: 'Official Number',
                          description: `Send Money to ${clean}`,
                          variant: 'info',
                        });
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#141414] border border-[#C7F464]/45 text-[11px] font-mono font-bold text-white inline-flex items-center gap-1 shrink-0"
                  >
                    {copiedPaymentPhone ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-[#C7F464]" /> Copy
                      </>
                    )}
                  </button>
                </div>
              )}

            {((memberEligibility && !memberEligibility.verified) ||
              paymentMethod === 'BKASH' ||
              paymentMethod === 'NAGAD' ||
              paymentMethod === 'ROCKET' ||
              paymentMethod === 'POS_CARD') && (
                <Input
                  label={
                    memberEligibility?.verified
                      ? 'Transaction Reference (TrxID — Optional)'
                      : 'Transaction Reference (TrxID) *'
                  }
                  required={Boolean(memberEligibility && !memberEligibility.verified)}
                  placeholder="Enter bKash / Nagad / Card TrxID"
                  value={trxRef}
                  onChange={(e) => setTrxRef(e.target.value)}
                />
              )}

            <Input
              label="Size / Flavor / Pickup Note"
              placeholder="e.g. Size L, pick up at 6 PM"
              value={pickupNote}
              onChange={(e) => setPickupNote(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFulfillmentType('PICKUP')}
                className={`p-2.5 rounded-xl border text-left transition-colors ${fulfillmentType === 'PICKUP'
                  ? 'bg-[#1B2210] border-[#C7F464] text-white'
                  : 'bg-[#171717] border-[#2C2C2C] text-[#A1A1AA]'
                  }`}
              >
                <p className="text-xs font-bold">Desk Pickup</p>
                <p className="text-[10px] font-mono text-[#C7F464]">Fee: ৳0</p>
              </button>
              <button
                type="button"
                onClick={() => setFulfillmentType('DELIVERY')}
                className={`p-2.5 rounded-xl border text-left transition-colors ${fulfillmentType === 'DELIVERY'
                  ? 'bg-[#1B2210] border-[#C7F464] text-white'
                  : 'bg-[#171717] border-[#2C2C2C] text-[#A1A1AA]'
                  }`}
              >
                <p className="text-xs font-bold">Online Delivery</p>
                <p className="text-[10px] font-mono text-[#C7F464]">Dhaka ৳80 / Out ৳150</p>
              </button>
            </div>

            {fulfillmentType === 'DELIVERY' && (
              <div className="p-3 rounded-xl bg-[#171717] border border-[#2C2C2C] space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'DHAKA_METRO' as const, label: 'Dhaka City (৳80)' },
                    { value: 'OUTSIDE_DHAKA' as const, label: 'Outside Dhaka (৳150)' },
                  ].map((z) => (
                    <button
                      key={z.value}
                      type="button"
                      onClick={() => setDeliveryArea(z.value)}
                      className={`py-1.5 px-2.5 rounded-lg border text-[11px] font-mono font-bold ${deliveryArea === z.value
                        ? 'bg-[#C7F464] border-[#C7F464] text-[#090909]'
                        : 'bg-[#141414] border-[#2C2C2C] text-white'
                        }`}
                    >
                      {z.label}
                    </button>
                  ))}
                </div>
                <Input
                  label="Full Delivery Address *"
                  required
                  placeholder="House, Road, Area, Thana..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
            )}

            <PromoCodeInput
              subtotalBdt={Number(buyProduct.priceBdt || 0) * qty}
              appliedPromo={appliedPromo}
              onChange={setAppliedPromo}
            />

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#2C2C2C]">
              <div>
                <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                  Payable Total
                  {fulfillmentType === 'DELIVERY'
                    ? ` (+৳${deliveryArea === 'OUTSIDE_DHAKA' ? 150 : 80} Delivery)`
                    : ''}
                </p>
                <p className="font-display text-2xl text-[#C7F464]">
                  {formatBdt(
                    Math.max(
                      0,
                      Number(buyProduct.priceBdt || 0) * qty -
                      Math.min(
                        Number(buyProduct.priceBdt || 0) * qty,
                        Number(appliedPromo?.discountAmountBdt || 0),
                      ),
                    ) +
                    (fulfillmentType === 'DELIVERY'
                      ? deliveryArea === 'OUTSIDE_DHAKA'
                        ? 150
                        : 80
                      : 0),
                  )}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setBuyProduct(null);
                    setAppliedPromo(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  leftIcon={<ShoppingBag className="w-4 h-4" />}
                  isLoading={placing}
                >
                  Place Order
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      <StoreOrderSlipModal
        isOpen={Boolean(slipOrder)}
        onClose={() => setSlipOrder(null)}
        order={slipOrder}
      />
    </div>
  );
}

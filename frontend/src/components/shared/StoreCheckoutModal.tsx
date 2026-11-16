'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Truck,
  Store,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Smartphone,
  UserCheck,
  CreditCard,
  Download,
  ExternalLink,
} from 'lucide-react';
import { apiFetch, formatBdt } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button, Input, Modal } from '@/components/ui';
import { StoreCartMap, clearStoredCart } from '@/lib/store-cart';
import { QrCodeSvg } from '@/components/shared/QrCodeSvg';
import {
  buildOrderTrackingUrl,
  downloadOrderPaymentSlip,
} from '@/lib/download-order-slip';
import {
  AppliedPromoSummary,
  PromoCodeInput,
} from '@/components/shared/PromoCodeInput';

interface StoreCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: StoreCartMap;
  setCart: React.Dispatch<React.SetStateAction<StoreCartMap>>;
  onOrderSuccess?: () => void | Promise<void>;
}

const normalizeGymIdInput = (raw?: string | null): string =>
  String(raw || '')
    .trim()
    .replace(/^(?:GYM\s*)?(?:MEMBER\s*)?ID\s*[:#-]?\s*/i, '')
    .replace(/^#+\s*/, '')
    .replace(/\s+/g, '')
    .toUpperCase();

export function StoreCheckoutModal({
  isOpen,
  onClose,
  cart,
  setCart,
  onOrderSuccess,
}: StoreCheckoutModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [placingOrder, setPlacingOrder] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'BAG' | 'CHECKOUT'>('BAG');
  const [officialPaymentPhone, setOfficialPaymentPhone] = useState('01685475975');
  const [copiedPaymentPhone, setCopiedPaymentPhone] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromoSummary | null>(null);
  const [verifyingMember, setVerifyingMember] = useState(false);
  const [memberVerifyState, setMemberVerifyState] = useState<{
    checkedCode: string;
    verified: boolean;
    fullName?: string;
    planName?: string;
    reason?: string;
  } | null>(null);
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    memberCode: '',
    fulfillmentType: 'PICKUP' as 'PICKUP' | 'DELIVERY',
    deliveryArea: 'DHAKA_METRO' as 'DHAKA_METRO' | 'OUTSIDE_DHAKA',
    deliveryAddress: '',
    paymentMethod: 'BKASH',
    advanceAmountBdt: '500',
    transactionReference: '',
    pickupNote: '',
  });

  const verifyMemberCodeInDb = useCallback(async (rawCode: string) => {
    const clean = normalizeGymIdInput(rawCode);
    if (!clean) {
      setMemberVerifyState(null);
      return null;
    }
    setVerifyingMember(true);
    try {
      const verifyUrl = user
        ? `/store/members/verify-auth?code=${encodeURIComponent(clean)}`
        : `/store/members/verify?code=${encodeURIComponent(clean)}`;
      const res = await apiFetch<{
        verified: boolean;
        memberCode?: string;
        fullName?: string;
        phone?: string;
        maskedPhone?: string;
        email?: string;
        address?: string;
        planName?: string;
        reason?: string;
      }>(verifyUrl);
      const nextState = {
        checkedCode: clean,
        verified: Boolean(res?.verified),
        fullName: res?.fullName,
        planName: res?.planName,
        reason: res?.reason,
      };
      setMemberVerifyState(nextState);
      if (nextState.verified) {
        setOrderForm((prev) => ({
          ...prev,
          memberCode: res?.memberCode || clean,
          customerName: res?.fullName || prev.customerName,
          customerPhone: res?.phone || prev.customerPhone,
          customerEmail: res?.email || prev.customerEmail,
          deliveryAddress: res?.address || prev.deliveryAddress,
          paymentMethod: 'CASH',
          advanceAmountBdt: '0',
        }));
      } else {
        setOrderForm((prev) => ({
          ...prev,
          paymentMethod: prev.paymentMethod === 'CASH' ? 'BKASH' : prev.paymentMethod,
        }));
      }
      return nextState;
    } catch (err: any) {
      const nextState = {
        checkedCode: clean,
        verified: false,
        reason: err?.message || 'Failed to verify Gym ID.',
      };
      setMemberVerifyState(nextState);
      return nextState;
    } finally {
      setVerifyingMember(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setOrderForm((prev) => ({
        ...prev,
        customerName: prev.customerName || user.fullName || '',
        customerPhone: prev.customerPhone || user.phone || '',
        customerEmail: prev.customerEmail || user.email || '',
        memberCode: prev.memberCode || user.memberCode || '',
      }));
      if (user.memberCode && isOpen) {
        verifyMemberCodeInDb(user.memberCode);
      }
    }
  }, [user, isOpen, verifyMemberCodeInDb]);

  useEffect(() => {
    if (isOpen && confirmedOrder) {
      // Allow opening a fresh bag once items are added again
      if (Object.keys(cart).length > 0) {
        setConfirmedOrder(null);
        setCheckoutStep('BAG');
      }
    }
  }, [isOpen, cart, confirmedOrder]);

  useEffect(() => {
    if (!isOpen) {
      setCheckoutStep('BAG');
      setCopiedPaymentPhone(false);
      return;
    }
    apiFetch<{ phonePrimary?: string }>('/settings/public')
      .then((res) => {
        if (res?.phonePrimary && !res.phonePrimary.includes('Configurable')) {
          setOfficialPaymentPhone(res.phonePrimary);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const totalCartUnits = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );
  const totalCartBdt = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + Number(item.product.priceBdt || 0) * item.quantity,
        0,
      ),
    [cartItems],
  );

  const effectiveDiscountBdt = Math.min(
    totalCartBdt,
    Number(appliedPromo?.discountAmountBdt || 0),
  );
  const deliveryFeeBdt =
    orderForm.fulfillmentType === 'DELIVERY'
      ? orderForm.deliveryArea === 'OUTSIDE_DHAKA'
        ? 150
        : 80
      : 0;
  const finalPayableBdt =
    Math.max(0, totalCartBdt - effectiveDiscountBdt) + deliveryFeeBdt;

  const normalizedMemberCode = normalizeGymIdInput(orderForm.memberCode);
  const isVerifiedRunningMember = Boolean(
    normalizedMemberCode &&
    memberVerifyState?.verified &&
    memberVerifyState.checkedCode === normalizedMemberCode,
  );
  const minRequiredAdvanceBdt = isVerifiedRunningMember
    ? 0
    : Math.min(500, finalPayableBdt);

  useEffect(() => {
    if (!isVerifiedRunningMember) {
      setOrderForm((prev) => {
        const curAdv = Number(prev.advanceAmountBdt || 0);
        const nextMethod = prev.paymentMethod === 'CASH' ? 'BKASH' : prev.paymentMethod;
        const clamped =
          finalPayableBdt === 0
            ? '0'
            : curAdv < minRequiredAdvanceBdt || curAdv > finalPayableBdt
              ? String(minRequiredAdvanceBdt)
              : prev.advanceAmountBdt;
        if (prev.paymentMethod === nextMethod && prev.advanceAmountBdt === clamped) {
          return prev;
        }
        return {
          ...prev,
          paymentMethod: nextMethod,
          advanceAmountBdt: clamped,
        };
      });
    }
  }, [isVerifiedRunningMember, minRequiredAdvanceBdt, finalPayableBdt]);

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const entry = prev[productId];
      if (!entry) return prev;
      const maxStock = Number(entry.product.stockQty || 0);
      const next = entry.quantity + delta;
      if (next <= 0) {
        const clone = { ...prev };
        delete clone[productId];
        return clone;
      }
      return {
        ...prev,
        [productId]: { ...entry, quantity: Math.min(maxStock, next) },
      };
    });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    // 1. If user typed a Gym / Member ID, verify it against the database first
    let activeMemberVerified = isVerifiedRunningMember;
    if (normalizedMemberCode && !activeMemberVerified) {
      const check = await verifyMemberCodeInDb(normalizedMemberCode);
      if (!check?.verified) {
        toast({
          title: 'Gym ID Verification Failed',
          description:
            check?.reason ||
            'Entered Gym ID is not an active running student in database. Fix the ID or clear it and pay minimum ৳500 advance.',
          variant: 'error',
        });
        return;
      }
      activeMemberVerified = true;
    }

    // 2. If not a verified running gym student, enforce minimum 500 BDT advance + TrxID
    const effectiveMinAdvance = activeMemberVerified
      ? 0
      : Math.min(500, finalPayableBdt);
    const parsedAdvance = Number(orderForm.advanceAmountBdt || 0);

    if (!activeMemberVerified && finalPayableBdt > 0) {
      if (orderForm.paymentMethod === 'CASH') {
        toast({
          title: 'Advance Payment Required',
          description: `Non-member orders require at least ${formatBdt(effectiveMinAdvance)} advance via bKash, Nagad, Rocket, or Card.`,
          variant: 'error',
        });
        return;
      }
      if (!Number.isFinite(parsedAdvance) || parsedAdvance < effectiveMinAdvance) {
        toast({
          title: 'Minimum ৳500 Advance Required',
          description: `Please pay at least ${formatBdt(effectiveMinAdvance)} advance to place this order without a verified Gym ID.`,
          variant: 'error',
        });
        return;
      }
      if (parsedAdvance > finalPayableBdt) {
        toast({
          title: 'Invalid Advance Amount',
          description: 'Advance amount cannot exceed total payable amount.',
          variant: 'error',
        });
        return;
      }
      if (orderForm.transactionReference.trim().length < 4) {
        toast({
          title: 'Transaction Reference Required',
          description:
            'Enter the bKash / Nagad / Card TrxID (at least 4 characters) for your advance payment.',
          variant: 'error',
        });
        return;
      }
    }

    if (
      orderForm.fulfillmentType === 'DELIVERY' &&
      orderForm.deliveryAddress.trim().length < 8
    ) {
      toast({
        title: 'Delivery Address Required',
        description:
          'Please enter a complete delivery address (House, Road, Area) for online delivery.',
        variant: 'error',
      });
      return;
    }

    setPlacingOrder(true);
    try {
      const endpoint = user ? '/store/orders/member' : '/store/orders';
      const created = await apiFetch<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          customerName: orderForm.customerName,
          customerPhone: orderForm.customerPhone,
          customerEmail: orderForm.customerEmail || undefined,
          memberCode: normalizedMemberCode || undefined,
          fulfillmentType: orderForm.fulfillmentType,
          deliveryArea:
            orderForm.fulfillmentType === 'DELIVERY'
              ? orderForm.deliveryArea
              : undefined,
          deliveryAddress:
            orderForm.fulfillmentType === 'DELIVERY'
              ? orderForm.deliveryAddress.trim()
              : undefined,
          paymentMethod: orderForm.paymentMethod,
          advanceAmountBdt: activeMemberVerified
            ? Math.max(0, Number(orderForm.advanceAmountBdt || 0))
            : parsedAdvance,
          transactionReference: orderForm.transactionReference || undefined,
          pickupNote: orderForm.pickupNote || undefined,
          discountCode: appliedPromo?.code || undefined,
          items: cartItems.map((c) => ({
            productId: c.product.id,
            quantity: c.quantity,
          })),
        }),
      });

      setConfirmedOrder(created);
      setCheckoutStep('BAG');
      setCart({});
      clearStoredCart();
      setAppliedPromo(null);
      setOrderForm((prev) => ({
        ...prev,
        deliveryAddress: '',
        transactionReference: '',
        pickupNote: '',
      }));
      downloadOrderPaymentSlip(created, officialPaymentPhone).catch(() => {});
      toast({
        title: 'Order Confirmed & Slip Downloaded',
        description:
          created.fulfillmentType === 'DELIVERY'
            ? `Order #${created.orderNumber} logged. Your QR payment slip has downloaded — scan the QR anytime to track delivery!`
            : `Order #${created.orderNumber} logged. Your QR payment slip has downloaded — scan the QR anytime to track status!`,
        variant: 'success',
      });
      if (onOrderSuccess) {
        await onOrderSuccess();
      }
    } catch (err: any) {
      toast({
        title: 'Unable to Complete Order',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setPlacingOrder(false);
    }
  };

  const isMobileBankingMethod =
    orderForm.paymentMethod === 'BKASH' ||
    orderForm.paymentMethod === 'NAGAD' ||
    orderForm.paymentMethod === 'ROCKET';
  const mobileMethodLabel =
    orderForm.paymentMethod === 'BKASH'
      ? 'bKash'
      : orderForm.paymentMethod === 'NAGAD'
        ? 'Nagad'
        : orderForm.paymentMethod === 'ROCKET'
          ? 'Rocket'
          : orderForm.paymentMethod;
  const cleanCopyPhone = officialPaymentPhone.replace(/[^\d+]/g, '') || '01685475975';

  const handleCopyPaymentPhone = async () => {
    try {
      await navigator.clipboard.writeText(cleanCopyPhone);
      setCopiedPaymentPhone(true);
      toast({
        title: 'Number Copied',
        description: `Copied official ${mobileMethodLabel} number (${cleanCopyPhone}) to clipboard.`,
        variant: 'success',
      });
      setTimeout(() => setCopiedPaymentPhone(false), 2200);
    } catch {
      toast({
        title: 'Official Number',
        description: `Send Money to ${cleanCopyPhone}`,
        variant: 'info',
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        confirmedOrder
          ? `Order Confirmed — ${confirmedOrder.orderNumber}`
          : checkoutStep === 'BAG'
            ? `Your Gym Gear Bag (${totalCartUnits} items)`
            : 'Checkout & Delivery Details'
      }
      description={
        confirmedOrder
          ? 'Keep your order receipt for pickup handover or delivery tracking'
          : checkoutStep === 'BAG'
            ? 'Review your items and apply any promo code before proceeding to checkout'
            : 'Verify running Gym ID for ৳0 advance or send mobile banking advance to our official number'
      }
      maxWidth="max-w-2xl"
    >
      {confirmedOrder ? (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-[#1B2210] border border-[#C7F464]/40 flex items-start gap-4">
            <CheckCircle2 className="w-7 h-7 text-[#C7F464] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">
                Thank you, {confirmedOrder.customerName}! Your gear order is logged.
              </p>
              <p className="text-xs text-[#A1A1AA]">
                Order ID{' '}
                <strong className="font-mono text-[#C7F464]">
                  {confirmedOrder.orderNumber}
                </strong>{' '}
                {confirmedOrder.fulfillmentType === 'DELIVERY'
                  ? `will be dispatched via courier to: ${confirmedOrder.deliveryAddress}.`
                  : 'is reserved at the Ashkona Front Desk for handover.'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-2">
            <p className="text-xs font-mono uppercase text-[#A1A1AA]">
              Ordered Items Summary
            </p>
            {(confirmedOrder.items || []).map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs py-1 border-b border-[#2C2C2C] last:border-b-0"
              >
                <span className="text-white font-medium">
                  {item.productName} × {item.quantity}
                </span>
                <span className="font-mono font-bold text-[#C7F464]">
                  {formatBdt(item.subtotalBdt)}
                </span>
              </div>
            ))}
            {Number(confirmedOrder.discountAmountBdt || 0) > 0 && (
              <div className="flex items-center justify-between text-xs py-1 text-emerald-400">
                <span className="font-mono">
                  Promo Discount ({confirmedOrder.discountCode})
                </span>
                <span className="font-mono font-bold">
                  -{formatBdt(confirmedOrder.discountAmountBdt)}
                </span>
              </div>
            )}
            {Number(confirmedOrder.deliveryFeeBdt || 0) > 0 && (
              <div className="flex items-center justify-between text-xs py-1 text-[#A1A1AA]">
                <span className="font-mono">
                  Online Delivery ({confirmedOrder.deliveryArea === 'OUTSIDE_DHAKA' ? 'Outside Dhaka' : 'Dhaka Metro'})
                </span>
                <span className="font-mono font-bold text-white">
                  +{formatBdt(confirmedOrder.deliveryFeeBdt)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 text-sm font-bold">
              <span className="text-white">
                Total Payable ({confirmedOrder.paymentMethod})
              </span>
              <span className="font-mono text-lg text-[#C7F464]">
                {formatBdt(confirmedOrder.totalAmountBdt)}
              </span>
            </div>
            {Number(confirmedOrder.advancePaidBdt || 0) > 0 && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#2C2C2C]">
                <span className="text-emerald-400 font-mono">
                  Advance Paid ({confirmedOrder.transactionReference || confirmedOrder.paymentMethod})
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatBdt(confirmedOrder.advancePaidBdt)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A1A1AA] font-mono">
                {confirmedOrder.fulfillmentType === 'DELIVERY'
                  ? 'Balance Due on Delivery'
                  : 'Balance Due at Reception Desk'}
              </span>
              <span className="font-mono font-bold text-white">
                {formatBdt(
                  Math.max(
                    0,
                    Number(confirmedOrder.totalAmountBdt || 0) -
                    Number(confirmedOrder.advancePaidBdt || 0),
                  ),
                )}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#141414] border border-[#C7F464]/35 flex flex-col sm:flex-row items-center gap-4">
            <div className="shrink-0">
              <QrCodeSvg
                value={buildOrderTrackingUrl(confirmedOrder.orderNumber)}
                size={96}
              />
            </div>
            <div className="space-y-1 text-center sm:text-left flex-1">
              <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                Payment Slip Auto-Downloaded to Your Device
              </p>
              <p className="text-xs font-semibold text-white">
                Scan this QR code anytime to track your live order progress
              </p>
              <p className="text-[11px] text-[#A1A1AA]">
                Shows every stage live: Order Placed → Confirmed → Ready / Courier Dispatched → Delivered.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => downloadOrderPaymentSlip(confirmedOrder, officialPaymentPhone)}
            >
              <span className="inline-flex items-center gap-1.5">
                <Download className="w-4 h-4" />
                Download Slip (PNG)
              </span>
            </Button>
            <Link
              href={`/verify/order/${encodeURIComponent(confirmedOrder.orderNumber)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button type="button" variant="secondary">
                <span className="inline-flex items-center gap-1.5">
                  Track Order Live
                  <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </Button>
            </Link>
            <Button
              variant="primary"
              className="ifg-btn-primary"
              onClick={() => {
                setConfirmedOrder(null);
                onClose();
              }}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      ) : cartItems.length === 0 ? (
        <div className="py-8 text-center space-y-3">
          <ShoppingBag className="w-10 h-10 text-[#A1A1AA] mx-auto" />
          <p className="text-sm font-semibold text-white">
            Your gym gear bag is empty
          </p>
          <p className="text-xs text-[#A1A1AA]">
            Add water bottles, lifting gloves, belts, or protein from the catalog.
          </p>
          <Button variant="secondary" onClick={onClose}>
            Browse Gear
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Clean 2-Step Checkout Progress Bar */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#141414] border border-[#2C2C2C]">
            <button
              type="button"
              onClick={() => setCheckoutStep('BAG')}
              className={`py-2 px-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                checkoutStep === 'BAG'
                  ? 'bg-[#C7F464] text-[#090909] shadow-sm'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
                  checkoutStep === 'BAG'
                    ? 'bg-[#090909]/15 text-[#090909]'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {checkoutStep === 'CHECKOUT' ? '✓' : '1'}
              </span>
              <span>Gear Bag ({totalCartUnits})</span>
            </button>

            <button
              type="button"
              onClick={() => setCheckoutStep('CHECKOUT')}
              className={`py-2 px-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                checkoutStep === 'CHECKOUT'
                  ? 'bg-[#C7F464] text-[#090909] shadow-sm'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
                  checkoutStep === 'CHECKOUT'
                    ? 'bg-[#090909]/15 text-[#090909]'
                    : 'bg-[#2C2C2C] text-[#A1A1AA]'
                }`}
              >
                2
              </span>
              <span>Delivery &amp; Payment</span>
            </button>
          </div>

          {checkoutStep === 'BAG' ? (
            <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-2.5">
                {cartItems.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="p-3.5 rounded-2xl bg-[#171717] border border-[#2C2C2C] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {product.name}
                      </p>
                      <p className="text-xs font-mono text-[#A1A1AA] mt-0.5">
                        {formatBdt(product.priceBdt)} × {quantity} ={' '}
                        <strong className="text-[#C7F464]">
                          {formatBdt(Number(product.priceBdt) * quantity)}
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateCartQty(product.id, -1)}
                        className="w-8 h-8 rounded-lg bg-[#141414] border border-[#2C2C2C] flex items-center justify-center text-white hover:border-[#C7F464]/50 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-mono text-xs font-bold text-white">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(product.id, 1)}
                        disabled={quantity >= Number(product.stockQty || 0)}
                        className="w-8 h-8 rounded-lg bg-[#141414] border border-[#2C2C2C] flex items-center justify-center text-white hover:border-[#C7F464]/50 transition-colors disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCartQty(product.id, -quantity)}
                        className="w-8 h-8 rounded-lg bg-[#141414] border border-[#2C2C2C] flex items-center justify-center text-rose-400 hover:border-rose-400/50 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C]">
                <PromoCodeInput
                  subtotalBdt={totalCartBdt}
                  appliedPromo={appliedPromo}
                  onChange={setAppliedPromo}
                />
              </div>

              <div className="pt-3 border-t border-[#2C2C2C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  {effectiveDiscountBdt > 0 && (
                    <div className="flex items-center gap-2 text-xs font-mono text-[#A1A1AA]">
                      <span className="line-through">{formatBdt(totalCartBdt)}</span>
                      <span className="text-emerald-400 font-semibold">
                        -{formatBdt(effectiveDiscountBdt)} promo applied
                      </span>
                    </div>
                  )}
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA] block">
                    Products Subtotal
                  </span>
                  <span className="font-display text-3xl text-[#C7F464]">
                    {formatBdt(Math.max(0, totalCartBdt - effectiveDiscountBdt))}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <Button type="button" variant="secondary" onClick={onClose}>
                    Keep Browsing
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    className="ifg-btn-primary"
                    onClick={() => setCheckoutStep('CHECKOUT')}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      Continue to Checkout
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handlePlaceOrder}
              className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
            >
              {/* Section 1: Delivery or Desk Pickup */}
              <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#C7F464]">
                    <Truck className="w-4 h-4" />
                    <span>1. Delivery / Collection Method</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#A1A1AA] uppercase">
                    {orderForm.fulfillmentType === 'DELIVERY' ? 'Courier Dispatch' : 'Free Pickup'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      setOrderForm((prev) => ({ ...prev, fulfillmentType: 'PICKUP' }))
                    }
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      orderForm.fulfillmentType === 'PICKUP'
                        ? 'bg-[#1B2210] border-[#C7F464]'
                        : 'bg-[#141414] border-[#2C2C2C] hover:border-[#C7F464]/45'
                    }`}
                  >
                    <Store className="w-4 h-4 text-[#C7F464] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">
                        Ashkona Reception Pickup
                      </p>
                      <p className="text-[11px] font-mono text-[#A1A1AA]">
                        Collect at Gym Desk • Fee: ৳0
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setOrderForm((prev) => ({ ...prev, fulfillmentType: 'DELIVERY' }))
                    }
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      orderForm.fulfillmentType === 'DELIVERY'
                        ? 'bg-[#1B2210] border-[#C7F464]'
                        : 'bg-[#141414] border-[#2C2C2C] hover:border-[#C7F464]/45'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-[#C7F464] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">
                        Online Home Delivery
                      </p>
                      <p className="text-[11px] font-mono text-[#A1A1AA]">
                        Dhaka ৳80 • Nationwide ৳150
                      </p>
                    </div>
                  </button>
                </div>

                {orderForm.fulfillmentType === 'DELIVERY' && (
                  <div className="p-3.5 rounded-xl bg-[#141414] border border-[#C7F464]/35 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-[#C7F464]">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Delivery Zone &amp; Full Address</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        {
                          value: 'DHAKA_METRO' as const,
                          title: 'Inside Dhaka City',
                          fee: '৳80 Delivery Fee',
                        },
                        {
                          value: 'OUTSIDE_DHAKA' as const,
                          title: 'Outside Dhaka (Courier)',
                          fee: '৳150 Delivery Fee',
                        },
                      ].map((zone) => {
                        const active = orderForm.deliveryArea === zone.value;
                        return (
                          <button
                            key={zone.value}
                            type="button"
                            onClick={() =>
                              setOrderForm((prev) => ({ ...prev, deliveryArea: zone.value }))
                            }
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              active
                                ? 'bg-[#C7F464] border-[#C7F464] text-[#090909]'
                                : 'bg-[#171717] border-[#2C2C2C] text-white hover:border-[#C7F464]/50'
                            }`}
                          >
                            <p className="text-xs font-bold">{zone.title}</p>
                            <p
                              className={`text-[10px] font-mono ${
                                active ? 'text-[#090909]/80' : 'text-[#A1A1AA]'
                              }`}
                            >
                              {zone.fee}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                    <Input
                      label="Full Delivery Address *"
                      required
                      placeholder="House / Flat #, Road #, Area / Sector, Thana, District..."
                      value={orderForm.deliveryAddress}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, deliveryAddress: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>

              {/* Section 2: Running Gym Student Verification */}
              <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#C7F464]">
                    <UserCheck className="w-4 h-4" />
                    <span>2. Running Gym Student Verification</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      isVerifiedRunningMember
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                    }`}
                  >
                    {isVerifiedRunningMember ? '৳0 Advance' : 'Min ৳500 Advance'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end gap-2.5">
                  <div className="flex-1">
                    <Input
                      label="Gym Student ID (Verify to Auto-Fill & ৳0 Advance)"
                      placeholder="IFG-****"
                      value={orderForm.memberCode}
                      onBlur={() => {
                        const clean = normalizeGymIdInput(orderForm.memberCode);
                        if (clean && clean !== orderForm.memberCode) {
                          setOrderForm((prev) => ({ ...prev, memberCode: clean }));
                        }
                        if (
                          clean.length >= 5 &&
                          clean !== memberVerifyState?.checkedCode
                        ) {
                          verifyMemberCodeInDb(clean);
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        const clean = normalizeGymIdInput(val);
                        setOrderForm({ ...orderForm, memberCode: val });
                        if (
                          !clean ||
                          clean !== memberVerifyState?.checkedCode
                        ) {
                          setMemberVerifyState(null);
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={!orderForm.memberCode.trim() || verifyingMember}
                    onClick={() => verifyMemberCodeInDb(orderForm.memberCode)}
                    className="h-11 px-4 shrink-0"
                  >
                    {verifyingMember ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking DB...
                      </span>
                    ) : (
                      'Verify Gym ID'
                    )}
                  </Button>
                </div>

                {isVerifiedRunningMember ? (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/35 flex items-start gap-2.5 text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-emerald-400">
                        Verified Running Gym Student: {memberVerifyState?.fullName} (
                        {memberVerifyState?.planName})
                      </p>
                      <p className="text-[#A1A1AA]">
                        Name, phone, and profile info auto-filled from database — ৳0 advance required.
                        {orderForm.fulfillmentType === 'DELIVERY'
                          ? ` Delivery fee (${formatBdt(deliveryFeeBdt)}) is itemized separately.`
                          : ''}
                      </p>
                    </div>
                  </div>
                ) : memberVerifyState && !memberVerifyState.verified ? (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/35 flex items-start gap-2.5 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-rose-400">Gym ID Not Verified</p>
                      <p className="text-[#A1A1AA]">
                        {memberVerifyState.reason} Fix your Gym ID or leave the box empty and pay minimum ৳500 advance.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/35 flex items-start gap-2.5 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-amber-400">
                        Guest / Non-Student Policy: Minimum {formatBdt(minRequiredAdvanceBdt)} Advance
                      </p>
                      <p className="text-[#A1A1AA]">
                        Active gym students can order with ৳0 advance. Non-members must send at least ৳500 advance via bKash, Nagad, Rocket, or Card and provide the TrxID below.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Recipient Details & Payment */}
              <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#C7F464]">
                  <CreditCard className="w-4 h-4" />
                  <span>3. Customer &amp; Payment Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Input
                    label="Your Full Name *"
                    required
                    placeholder="Full name"
                    value={orderForm.customerName}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, customerName: e.target.value })
                    }
                  />
                  <Input
                    label="Phone Number *"
                    required
                    placeholder="+88017XXXXXXXX"
                    value={orderForm.customerPhone}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, customerPhone: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                      Payment Method *
                    </label>
                    <select
                      value={orderForm.paymentMethod}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, paymentMethod: e.target.value })
                      }
                      className="w-full h-11 px-3 rounded-xl bg-[#141414] border border-[#2C2C2C] text-sm text-white focus:outline-none focus:border-[#C7F464]"
                    >
                      {isVerifiedRunningMember && (
                        <option value="CASH">
                          {orderForm.fulfillmentType === 'DELIVERY'
                            ? 'Cash on Delivery (৳0 Advance)'
                            : 'Cash at Ashkona Front Desk (৳0 Advance)'}
                        </option>
                      )}
                      <option value="BKASH">bKash Mobile Banking</option>
                      <option value="NAGAD">Nagad Mobile Banking</option>
                      <option value="ROCKET">Rocket Mobile Banking</option>
                      <option value="POS_CARD">Card / POS Payment</option>
                    </select>
                  </div>

                  {!isVerifiedRunningMember ? (
                    <Input
                      label={`Advance Amount Paid (Min ${formatBdt(minRequiredAdvanceBdt)}) *`}
                      type="number"
                      min={minRequiredAdvanceBdt}
                      max={finalPayableBdt}
                      required
                      value={orderForm.advanceAmountBdt}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, advanceAmountBdt: e.target.value })
                      }
                    />
                  ) : (
                    <div className="p-3 rounded-xl bg-[#141414] border border-[#2C2C2C] flex flex-col justify-center">
                      <span className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                        Required Advance
                      </span>
                      <span className="text-sm font-mono font-bold text-emerald-400">
                        ৳0 (Waived for Running Gym Student)
                      </span>
                    </div>
                  )}
                </div>

                {/* Official Contact Payment Number Banner for bKash / Nagad / Rocket */}
                {isMobileBankingMethod && (
                  <div className="p-3.5 rounded-xl bg-[#1B2210] border border-[#C7F464]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#C7F464] text-[#090909] flex items-center justify-center shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-mono uppercase tracking-wider text-[#C7F464] font-bold">
                          Official Icon Fitness {mobileMethodLabel} Number
                        </p>
                        <p className="font-mono text-base font-extrabold text-white tracking-wide">
                          {officialPaymentPhone}
                        </p>
                        <p className="text-[11px] text-[#A1A1AA]">
                          Send Money{' '}
                          {isVerifiedRunningMember
                            ? 'your payment'
                            : formatBdt(
                                Number(orderForm.advanceAmountBdt || minRequiredAdvanceBdt),
                              )}{' '}
                          to this contact number, then paste the TrxID below.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyPaymentPhone}
                      className="px-3 py-2 rounded-xl bg-[#141414] border border-[#C7F464]/50 text-xs font-mono font-bold text-white hover:border-[#C7F464] inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors"
                    >
                      {copiedPaymentPhone ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#C7F464]" />
                          <span>Copy Number</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {(!isVerifiedRunningMember ||
                  orderForm.paymentMethod === 'BKASH' ||
                  orderForm.paymentMethod === 'NAGAD' ||
                  orderForm.paymentMethod === 'ROCKET' ||
                  orderForm.paymentMethod === 'POS_CARD') && (
                  <Input
                    label={
                      isVerifiedRunningMember
                        ? 'Transaction Reference (TrxID — Optional)'
                        : 'Advance Payment TrxID / Reference *'
                    }
                    required={!isVerifiedRunningMember}
                    placeholder={
                      isVerifiedRunningMember
                        ? 'Enter TrxID if paying online'
                        : 'Required: Enter bKash / Nagad / Card TrxID (min 4 chars)'
                    }
                    value={orderForm.transactionReference}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        transactionReference: e.target.value,
                      })
                    }
                  />
                )}

                <Input
                  label="Size / Flavor / Pickup Note (Optional)"
                  placeholder="e.g. Glove size L, Chocolate Whey, Pickup evening 7 PM"
                  value={orderForm.pickupNote}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, pickupNote: e.target.value })
                  }
                />
              </div>

              {/* Sticky Cost Breakdown & Final Submit Actions */}
              <div className="space-y-3 pt-2 border-t border-[#2C2C2C]">
                {deliveryFeeBdt > 0 && (
                  <div className="p-3 rounded-xl bg-[#141414] border border-[#2C2C2C] space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-[#A1A1AA]">
                      <span>
                        Products Total{effectiveDiscountBdt > 0 ? ' (After Discount)' : ''}
                      </span>
                      <span className="text-white">
                        {formatBdt(Math.max(0, totalCartBdt - effectiveDiscountBdt))}
                      </span>
                    </div>
                    <div className="flex justify-between text-amber-400 font-semibold">
                      <span>
                        Delivery Charge (Separate •{' '}
                        {orderForm.deliveryArea === 'OUTSIDE_DHAKA'
                          ? 'Outside Dhaka'
                          : 'Dhaka City'}
                        )
                      </span>
                      <span>+{formatBdt(deliveryFeeBdt)}</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    {effectiveDiscountBdt > 0 && (
                      <div className="flex items-center gap-2 text-xs font-mono text-[#A1A1AA]">
                        <span className="line-through">{formatBdt(totalCartBdt)}</span>
                        <span className="text-emerald-400 font-semibold">
                          -{formatBdt(effectiveDiscountBdt)} saved
                        </span>
                      </div>
                    )}
                    <span className="text-xs font-mono uppercase text-[#A1A1AA] block">
                      Total Payable Amount
                    </span>
                    <span className="font-display text-3xl text-[#C7F464]">
                      {formatBdt(finalPayableBdt)}
                    </span>
                    {!isVerifiedRunningMember && finalPayableBdt > 0 && (
                      <p className="text-[11px] font-mono text-amber-400 mt-0.5">
                        Advance Now:{' '}
                        {formatBdt(Number(orderForm.advanceAmountBdt || minRequiredAdvanceBdt))}{' '}
                        •{' '}
                        {orderForm.fulfillmentType === 'DELIVERY'
                          ? 'Due on Delivery:'
                          : 'Due at Desk:'}{' '}
                        {formatBdt(
                          Math.max(
                            0,
                            finalPayableBdt -
                              Number(orderForm.advanceAmountBdt || minRequiredAdvanceBdt),
                          ),
                        )}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2.5">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setCheckoutStep('BAG')}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Bag
                      </span>
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      className="ifg-btn-primary"
                      isLoading={placingOrder || verifyingMember}
                      disabled={Boolean(
                        normalizedMemberCode &&
                          !isVerifiedRunningMember &&
                          memberVerifyState?.checkedCode === normalizedMemberCode,
                      )}
                    >
                      {isVerifiedRunningMember
                        ? `Confirm Order (${formatBdt(finalPayableBdt)})`
                        : `Confirm w/ ${formatBdt(
                            Number(orderForm.advanceAmountBdt || minRequiredAdvanceBdt),
                          )} Advance`}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}

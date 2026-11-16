'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Download } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { formatBdt, formatDateTime } from '@/lib/api';
import { formatVerifiedByLabel, amountInWordsBdt, formatPaymentMethod } from '@/lib/receipt-helpers';
import { QrCodeSvg } from '@/components/shared/QrCodeSvg';
import { downloadOrderPaymentSlip } from '@/lib/download-order-slip';

function PosQrVerificationStrip({ code }: { code: string }) {
  const [qrUrl, setQrUrl] = useState(`/verify/order/${encodeURIComponent(code)}`);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setQrUrl(`${window.location.origin}/verify/order/${encodeURIComponent(code)}`);
    }
  }, [code]);

  return (
    <div className="flex flex-col items-center gap-1.5 pt-1">
      <QrCodeSvg value={qrUrl} size={104} />
      <span
        className="text-[9px] font-bold uppercase tracking-wider"
        style={{ color: '#475569' }}
      >
        Scan QR to Verify Receipt &amp; Payment Status
      </span>
    </div>
  );
}

function SupershopSlipDocument({ order }: { order: any }) {
  const status = String(order?.status || 'PENDING').toUpperCase();
  const isCompleted = status === 'COMPLETED';
  const orderNumber = String(order?.orderNumber || 'IFG-ORD');
  const slipNumber =
    order?.slipNumber ||
    (isCompleted
      ? orderNumber.startsWith('IFG-ORD-')
        ? orderNumber.replace('IFG-ORD-', 'IFG-SLIP-')
        : `IFG-SLIP-${orderNumber}`
      : orderNumber);

  const totalBdt = Math.max(0, Number(order?.totalAmountBdt || 0));
  const discountAmountBdt = Math.max(0, Number(order?.discountAmountBdt || 0));
  const subtotalBdt =
    order?.subtotalBdt !== null && order?.subtotalBdt !== undefined
      ? Math.max(0, Number(order.subtotalBdt))
      : totalBdt + discountAmountBdt;
  const cashierLabel =
    formatVerifiedByLabel(
      order?.processedByUser?.fullName || '',
      order?.processedByUser?.role || '',
    ) || 'Ashkona POS Desk';

  const items: any[] = Array.isArray(order?.items) ? order.items : [];
  const totalQty = items.reduce((s, item) => s + Number(item.quantity || 0), 0);

  const statusText =
    status === 'COMPLETED'
      ? 'PAID & COMPLETED'
      : status === 'CANCELLED'
        ? 'CANCELLED'
        : status === 'READY_FOR_PICKUP'
          ? 'READY FOR PICKUP'
          : status === 'CONFIRMED'
            ? 'CONFIRMED'
            : 'PENDING PAYMENT';

  return (
    <div
      id="official-payment-receipt"
      className="mx-auto w-full max-w-[380px] rounded-xl border shadow-md overflow-hidden font-mono print:shadow-none print:rounded-none"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: '#CBD5E1',
        color: '#0F172A',
      }}
    >
      {/* Top Perforated Accent Strip */}
      <div
        className="h-2 w-full"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, #0F172A 0px, #0F172A 8px, #C7F464 8px, #C7F464 16px)',
        }}
      />

      <div className="p-5 sm:p-6 space-y-3.5 text-[11px] leading-snug">
        {/* Supershop Store Header */}
        <div className="text-center space-y-1 pb-3 border-b border-dashed" style={{ borderColor: '#94A3B8' }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <img
              src="/logo.jpg"
              alt="Icon Fitness Gym"
              className="w-8 h-8 rounded object-contain border"
              style={{ backgroundColor: '#000000', borderColor: '#334155' }}
            />
            <span className="text-sm font-bold tracking-wider uppercase" style={{ color: '#0F172A' }}>
              ICON FITNESS GYM
            </span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#334155' }}>
            PRO SHOP &amp; SUPPLEMENTS COUNTER
          </p>
          <p className="text-[10px]" style={{ color: '#475569' }}>
            Ashkona, Dakshinkhan, Dhaka-1230
          </p>
          <p className="text-[10px]" style={{ color: '#475569' }}>
            Hotline: +880 1685-475975
          </p>
          <div className="pt-1.5">
            <span
              className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: isCompleted ? '#0F172A' : '#F1F5F9',
                color: isCompleted ? '#C7F464' : '#0F172A',
              }}
            >
              {isCompleted ? 'CASH MEMO / SALES SLIP' : 'ORDER VOUCHER'}
            </span>
          </div>
        </div>

        {/* POS Slip Metadata */}
        <div className="space-y-1 pb-3 border-b border-dashed text-[11px]" style={{ borderColor: '#94A3B8' }}>
          <div className="flex justify-between gap-2">
            <span style={{ color: '#64748B' }}>SLIP NO :</span>
            <span className="font-bold text-right" style={{ color: '#0F172A' }}>
              {slipNumber}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span style={{ color: '#64748B' }}>ORDER   :</span>
            <span className="text-right" style={{ color: '#334155' }}>
              {orderNumber}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span style={{ color: '#64748B' }}>DATE    :</span>
            <span className="text-right" style={{ color: '#0F172A' }}>
              {formatDateTime(isCompleted ? order?.updatedAt || order?.createdAt : order?.createdAt)}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span style={{ color: '#64748B' }}>CASHIER :</span>
            <span className="text-right font-semibold" style={{ color: '#0F172A' }}>
              {cashierLabel}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span style={{ color: '#64748B' }}>CUSTOMER:</span>
            <span className="text-right font-semibold" style={{ color: '#0F172A' }}>
              {order?.customerName || 'Walk-In'}
            </span>
          </div>
          {order?.customerPhone && (
            <div className="flex justify-between gap-2">
              <span style={{ color: '#64748B' }}>PHONE   :</span>
              <span className="text-right" style={{ color: '#334155' }}>
                {order.customerPhone}
              </span>
            </div>
          )}
          {order?.memberCode && (
            <div className="flex justify-between gap-2">
              <span style={{ color: '#64748B' }}>MEMBER  :</span>
              <span className="text-right font-semibold" style={{ color: '#0F172A' }}>
                {order.memberCode}
                {order.isMemberVerified ? ' (Verified)' : ''}
              </span>
            </div>
          )}
          <div className="flex justify-between gap-2">
            <span style={{ color: '#64748B' }}>MODE    :</span>
            <span className="text-right font-semibold" style={{ color: '#0F172A' }}>
              {order?.fulfillmentType === 'DELIVERY'
                ? `Online Delivery (${order?.deliveryArea === 'OUTSIDE_DHAKA' ? 'Nationwide' : 'Dhaka'})`
                : 'Ashkona Desk Pickup'}
            </span>
          </div>
          {order?.fulfillmentType === 'DELIVERY' && order?.deliveryAddress && (
            <div className="flex justify-between gap-2">
              <span style={{ color: '#64748B' }}>ADDRESS :</span>
              <span className="text-right max-w-[230px]" style={{ color: '#334155' }}>
                {order.deliveryAddress}
              </span>
            </div>
          )}
          <div className="flex justify-between gap-2">
            <span style={{ color: '#64748B' }}>STATUS  :</span>
            <span
              className="text-right font-bold"
              style={{
                color:
                  status === 'COMPLETED'
                    ? '#047857'
                    : status === 'CANCELLED'
                      ? '#BE123C'
                      : '#B45309',
              }}
            >
              {statusText}
            </span>
          </div>
        </div>

        {/* Itemized POS Lines */}
        <div className="pb-3 border-b border-dashed" style={{ borderColor: '#94A3B8' }}>
          <div
            className="grid grid-cols-12 gap-1 pb-1.5 mb-2 border-b text-[10px] font-bold uppercase"
            style={{ borderColor: '#CBD5E1', color: '#475569' }}
          >
            <span className="col-span-6">ITEM</span>
            <span className="col-span-2 text-center">QTY</span>
            <span className="col-span-2 text-right">RATE</span>
            <span className="col-span-2 text-right">AMT</span>
          </div>

          <div className="space-y-2">
            {items.map((item: any, idx: number) => (
              <div key={item.id || idx} className="grid grid-cols-12 gap-1 items-start">
                <div className="col-span-6 pr-1">
                  <p className="font-bold leading-tight" style={{ color: '#0F172A' }}>
                    {idx + 1}. {item.productName}
                  </p>
                  {(item.product?.sku || item.product?.unitLabel) && (
                    <p className="text-[9px]" style={{ color: '#64748B' }}>
                      {[item.product?.sku, item.product?.unitLabel]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  )}
                </div>
                <span className="col-span-2 text-center font-semibold" style={{ color: '#0F172A' }}>
                  {item.quantity}
                </span>
                <span className="col-span-2 text-right" style={{ color: '#334155' }}>
                  {Number(item.unitPriceBdt || 0).toLocaleString()}
                </span>
                <span className="col-span-2 text-right font-bold" style={{ color: '#0F172A' }}>
                  {Number(item.subtotalBdt || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {order?.pickupNote && (
            <p className="text-[10px] mt-2.5 pt-1.5 border-t border-dotted" style={{ borderColor: '#CBD5E1', color: '#475569' }}>
              Note: {order.pickupNote}
            </p>
          )}
        </div>

        {/* Totals Summary */}
        <div className="space-y-1.5 pb-3 border-b border-dashed" style={{ borderColor: '#94A3B8' }}>
          <div className="flex justify-between text-[11px]" style={{ color: '#475569' }}>
            <span>ITEMS / QTY</span>
            <span>
              {items.length} item{items.length === 1 ? '' : 's'} / {totalQty} pcs
            </span>
          </div>
          <div className="flex justify-between text-[11px]" style={{ color: '#475569' }}>
            <span>SUBTOTAL</span>
            <span>{formatBdt(subtotalBdt)}</span>
          </div>
          <div className="flex justify-between text-[11px]" style={{ color: discountAmountBdt > 0 ? '#047857' : '#475569' }}>
            <span>
              {order?.discountCode ? `DISCOUNT (${order.discountCode})` : 'DISCOUNT / PROMO'}
            </span>
            <span>{discountAmountBdt > 0 ? `-${formatBdt(discountAmountBdt)}` : '৳0'}</span>
          </div>
          {Number(order?.deliveryFeeBdt || 0) > 0 && (
            <div className="flex justify-between text-[11px]" style={{ color: '#B45309' }}>
              <span>DELIVERY CHARGE (SEPARATE)</span>
              <span className="font-semibold">+{formatBdt(order.deliveryFeeBdt)}</span>
            </div>
          )}
          <div
            className="flex justify-between items-baseline pt-2 mt-1 border-t-2 text-sm font-bold"
            style={{ borderColor: '#0F172A', color: '#0F172A' }}
          >
            <span>{isCompleted ? 'NET PAID' : 'TOTAL PAYABLE'}</span>
            <span className="text-lg">{formatBdt(totalBdt)}</span>
          </div>
          {Number(order?.advancePaidBdt || 0) > 0 && (
            <>
              <div className="flex justify-between text-[11px] font-semibold" style={{ color: '#047857' }}>
                <span>ADVANCE PAID</span>
                <span>{formatBdt(order.advancePaidBdt)}</span>
              </div>
              {!isCompleted && (
                <div className="flex justify-between text-[11px] font-bold" style={{ color: '#B45309' }}>
                  <span>BALANCE DUE</span>
                  <span>
                    {formatBdt(Math.max(0, totalBdt - Number(order.advancePaidBdt || 0)))}
                  </span>
                </div>
              )}
            </>
          )}
          <div className="flex justify-between text-[11px] pt-0.5" style={{ color: '#334155' }}>
            <span>PAYMENT MODE</span>
            <span className="font-semibold">{formatPaymentMethod(order?.paymentMethod)}</span>
          </div>
          {order?.transactionReference && (
            <div className="flex justify-between text-[11px]" style={{ color: '#334155' }}>
              <span>TRX REF</span>
              <span className="font-semibold">{order.transactionReference}</span>
            </div>
          )}
          <p className="text-[10px] pt-1" style={{ color: '#475569' }}>
            In Words: {amountInWordsBdt(totalBdt)}
          </p>
        </div>

        {/* Scannable QR Verification & Simple Retail Footer */}
        <div className="text-center space-y-2 pt-0.5">
          <PosQrVerificationStrip code={orderNumber} />
          <p className="text-[10px] font-bold pt-1" style={{ color: '#0F172A' }}>
            THANK YOU FOR SHOPPING WITH ICON FITNESS!
          </p>
          <p className="text-[9px]" style={{ color: '#64748B' }}>
            Please check items &amp; change before leaving counter.
          </p>
        </div>
      </div>

      {/* Bottom Serrated Cut Edge Visual */}
      <div
        className="h-2 w-full"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, #F1F5F9 0px, #F1F5F9 6px, #FFFFFF 6px, #FFFFFF 12px)',
        }}
      />
    </div>
  );
}

export function StoreOrderSlipModal({
  isOpen,
  onClose,
  order,
}: {
  isOpen: boolean;
  onClose: () => void;
  order?: any | null;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isOpen && order) {
      document.body.classList.add('receipt-modal-open');
    } else {
      document.body.classList.remove('receipt-modal-open');
    }
    return () => {
      document.body.classList.remove('receipt-modal-open');
    };
  }, [isOpen, order]);

  if (!order) return null;

  const isCompleted = String(order.status || '').toUpperCase() === 'COMPLETED';
  const slipCode =
    order.slipNumber ||
    String(order.orderNumber || 'ORDER').replace('IFG-ORD-', 'IFG-SLIP-');

  const handlePrint = () => {
    if (typeof document === 'undefined') return;
    const prevTitle = document.title;
    const safeSlug = String(slipCode).replace(/[^A-Za-z0-9-_]/g, '-');
    document.title = `IconFitnessGym-CashMemo-${safeSlug}`;
    const restore = () => {
      document.title = prevTitle;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
    setTimeout(restore, 1000);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          isCompleted
            ? `Store Cash Memo — #${slipCode}`
            : `Order Slip Preview — ${order.orderNumber}`
        }
        description="POS Retail Cash Memo Slip • Icon Fitness Pro Shop"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="max-h-[70vh] overflow-y-auto py-1">
            <SupershopSlipDocument order={order} />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => downloadOrderPaymentSlip(order)}
            >
              Download Slip (PNG)
            </Button>
            <Button
              variant="primary"
              className="ifg-btn-primary"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
            >
              Print POS Slip
            </Button>
          </div>
        </div>
      </Modal>

      {mounted &&
        isOpen &&
        createPortal(
          <div id="receipt-print-portal" className="hidden print:block">
            <SupershopSlipDocument order={order} />
          </div>,
          document.body,
        )}
    </>
  );
}

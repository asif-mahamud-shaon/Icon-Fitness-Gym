'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  ShieldCheck,
} from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { formatBdt, formatDate, formatDateTime } from '@/lib/api';
import {
  amountInWordsBdt,
  formatVerifiedByLabel,
  formatPaymentMethod,
} from '@/lib/receipt-helpers';
import { QrCodeSvg } from '@/components/shared/QrCodeSvg';

interface NormalizedReceipt {
  receiptNumber: string;
  hasOfficialReceipt: boolean;
  status: string;
  issuedToName: string;
  issuedToEmail: string;
  issuedToPhone: string;
  memberCode: string;
  issuedAt?: string | Date | null;
  paidAt?: string | Date | null;
  paymentMethod: string;
  transactionReference: string;
  senderPhone: string;
  planName: string;
  durationDays?: number | null;
  periodStart?: string | Date | null;
  periodEnd?: string | Date | null;
  grossAmountBdt: number;
  discountBdt: number;
  netAmountBdt: number;
  refundedAmountBdt: number;
  refundReason: string;
  verifiedByName: string;
  notes: string;
  recordId: string;
}

function normalizeReceipt(
  receiptProp?: any | null,
  paymentProp?: any | null,
): NormalizedReceipt | null {
  if (!receiptProp && !paymentProp) return null;

  const paymentObj =
    paymentProp ||
    (receiptProp && ('netAmountBdt' in receiptProp || 'amountBdt' in receiptProp)
      ? receiptProp
      : receiptProp?.payment) ||
    null;

  const receiptObj =
    (receiptProp && 'receiptNumber' in receiptProp ? receiptProp : null) ||
    paymentProp?.receipt ||
    paymentProp?.paymentReceipt ||
    null;

  const meta = (receiptObj?.receiptDataJson || {}) as Record<string, any>;

  const status = String(
    paymentObj?.status ||
      (receiptObj?.receiptNumber ? 'VERIFIED_PAID' : 'PENDING'),
  ).toUpperCase();

  const receiptNumber =
    receiptObj?.receiptNumber ||
    paymentObj?.receiptNumber ||
    (status === 'PENDING' ? 'PENDING APPROVAL' : 'PROVISIONAL');

  const hasOfficialReceipt = Boolean(
    receiptObj?.receiptNumber || paymentObj?.receiptNumber,
  );

  const issuedToName =
    receiptObj?.issuedToName ||
    paymentObj?.memberProfile?.user?.fullName ||
    `${paymentObj?.memberProfile?.user?.firstName || ''} ${paymentObj?.memberProfile?.user?.lastName || ''}`.trim() ||
    'Registered Member';

  const issuedToEmail =
    receiptObj?.issuedToEmail || paymentObj?.memberProfile?.user?.email || '';

  const issuedToPhone =
    receiptObj?.issuedToPhone || paymentObj?.memberProfile?.user?.phone || '';

  const memberCode =
    paymentObj?.memberProfile?.memberCode || meta.memberCode || '';

  const grossAmountBdt = Math.max(
    0,
    Number(
      paymentObj?.amountBdt ??
        receiptObj?.amountPaidBdt ??
        paymentObj?.netAmountBdt ??
        paymentObj?.amount ??
        0,
    ),
  );
  const discountBdt = Math.max(0, Number(paymentObj?.discountBdt ?? 0));
  const netAmountBdt = Math.max(
    0,
    Number(
      paymentObj?.netAmountBdt ??
        receiptObj?.amountPaidBdt ??
        (grossAmountBdt > 0 ? grossAmountBdt - discountBdt : 0),
    ),
  );

  const planObj =
    paymentObj?.membership?.plan || paymentObj?.membership?.membershipPlan;

  return {
    receiptNumber,
    hasOfficialReceipt,
    status,
    issuedToName,
    issuedToEmail,
    issuedToPhone,
    memberCode,
    issuedAt:
      receiptObj?.issuedAt ||
      paymentObj?.verifiedAt ||
      paymentObj?.paidAt ||
      paymentObj?.createdAt,
    paidAt: paymentObj?.paidAt || paymentObj?.createdAt || receiptObj?.issuedAt,
    paymentMethod: String(
      receiptObj?.paymentMethod ||
        paymentObj?.paymentMethod ||
        paymentObj?.method ||
        'CASH',
    ),
    transactionReference: String(
      paymentObj?.transactionReference || meta.transactionReference || '',
    ),
    senderPhone: String(paymentObj?.senderPhone || ''),
    planName:
      receiptObj?.planName || planObj?.name || 'Gym Membership Subscription',
    durationDays: planObj?.durationDays ?? null,
    periodStart: paymentObj?.membership?.startDate || null,
    periodEnd: paymentObj?.membership?.endDate || null,
    grossAmountBdt,
    discountBdt,
    netAmountBdt,
    refundedAmountBdt: Math.max(0, Number(paymentObj?.refundedAmountBdt ?? 0)),
    refundReason: String(paymentObj?.refundReason || ''),
    verifiedByName: formatVerifiedByLabel(
      paymentObj?.verifiedByUser?.fullName ||
        receiptObj?.issuedByUser?.fullName ||
        '',
      paymentObj?.verifiedByUser?.role ||
        receiptObj?.issuedByUser?.role ||
        '',
    ),
    notes: String(paymentObj?.notes || ''),
    recordId: String(
      paymentObj?.id || receiptObj?.paymentId || receiptObj?.id || '',
    ),
  };
}

function ReceiptVerifyQr({ code }: { code: string }) {
  const [qrUrl, setQrUrl] = useState(`/verify/receipt/${encodeURIComponent(code)}`);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setQrUrl(`${window.location.origin}/verify/receipt/${encodeURIComponent(code)}`);
    }
  }, [code]);

  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <QrCodeSvg value={qrUrl} size={66} />
      <span
        className="text-[8px] font-mono uppercase tracking-wider"
        style={{ color: '#71717A' }}
      >
        Scan to Verify
      </span>
    </div>
  );
}

function StatusStamp({ status }: { status: string }) {
  if (status === 'VERIFIED_PAID') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider border"
        style={{
          backgroundColor: '#F0FDF4',
          borderColor: '#BBF7D0',
          color: '#15803D',
        }}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Verified &amp; Paid
      </span>
    );
  }
  if (status === 'REFUNDED') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider border"
        style={{
          backgroundColor: '#EFF6FF',
          borderColor: '#BFDBFE',
          color: '#1D4ED8',
        }}
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Refunded
      </span>
    );
  }
  if (status === 'REJECTED') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider border"
        style={{
          backgroundColor: '#FFF1F2',
          borderColor: '#FECDD3',
          color: '#BE123C',
        }}
      >
        <XCircle className="w-3.5 h-3.5" />
        Rejected
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider border"
      style={{
        backgroundColor: '#FFFBEB',
        borderColor: '#FDE68A',
        color: '#B45309',
      }}
    >
      <Clock className="w-3.5 h-3.5" />
      Pending Verification
    </span>
  );
}

function ReceiptDocument({ data }: { data: NormalizedReceipt }) {
  const documentHeading =
    data.status === 'PENDING'
      ? 'PROVISIONAL PAYMENT VOUCHER'
      : data.status === 'REFUNDED'
        ? 'REFUNDED PAYMENT RECEIPT'
        : data.status === 'REJECTED'
          ? 'REJECTED PAYMENT RECORD'
          : 'OFFICIAL PAYMENT RECEIPT';

  const shortRef = data.recordId
    ? data.recordId.slice(0, 8).toUpperCase()
    : 'N/A';

  const isAuthorized =
    data.status === 'VERIFIED_PAID' ||
    data.status === 'REFUNDED' ||
    data.hasOfficialReceipt;

  return (
    <div
      id="official-payment-receipt"
      className="relative rounded-2xl overflow-hidden border shadow-md print:rounded-none print:border print:shadow-none flex flex-col md:flex-row print:flex-row"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: '#D4D4D8',
        color: '#111827',
      }}
    >
      {/* LEFT OBSIDIAN & GOLD BRAND SPINE */}
      <aside
        className="md:w-64 print:w-60 shrink-0 p-6 sm:p-7 flex flex-col justify-between gap-6 border-b md:border-b-0 md:border-r-4 print:border-b-0 print:border-r-4"
        style={{
          backgroundColor: '#0B0B0E',
          borderColor: '#D97706',
          color: '#FAFAFA',
        }}
      >
        <div className="space-y-6">
          {/* Crest & Wordmark */}
          <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-3">
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl p-1.5 flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: '#141418',
                borderColor: '#27272A',
              }}
            >
              <img
                src="/Image/logo-watermark.png"
                alt="Icon Fitness Gym Crest"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p
                className="text-[10px] font-mono font-bold uppercase tracking-[0.24em]"
                style={{ color: '#F59E0B' }}
              >
                Official Membership
              </p>
              <h2
                className="text-lg font-black uppercase tracking-tight mt-0.5 leading-tight"
                style={{ color: '#FFFFFF' }}
              >
                Icon Fitness Gym
              </h2>
            </div>
          </div>

          {/* Key Metadata Stack */}
          <div
            className="grid grid-cols-2 md:grid-cols-1 gap-3.5 pt-4 border-t text-xs"
            style={{ borderColor: '#27272A' }}
          >
            <div>
              <p
                className="text-[9px] font-mono uppercase tracking-[0.2em]"
                style={{ color: '#71717A' }}
              >
                Invoice / Receipt No.
              </p>
              <p
                className="font-mono font-bold text-xs mt-0.5 break-all tabular-nums"
                style={{ color: '#FBBF24' }}
              >
                {data.hasOfficialReceipt
                  ? `#${data.receiptNumber}`
                  : data.receiptNumber}
              </p>
            </div>

            <div>
              <p
                className="text-[9px] font-mono uppercase tracking-[0.2em]"
                style={{ color: '#71717A' }}
              >
                {data.hasOfficialReceipt ? 'Issued Date & Time' : 'Submitted On'}
              </p>
              <p
                className="font-mono font-semibold text-xs mt-0.5 tabular-nums"
                style={{ color: '#F4F4F5' }}
              >
                {formatDateTime(data.issuedAt)}
              </p>
            </div>

            {data.paidAt && data.paidAt !== data.issuedAt && (
              <div>
                <p
                  className="text-[9px] font-mono uppercase tracking-[0.2em]"
                  style={{ color: '#71717A' }}
                >
                  Payment Date
                </p>
                <p
                  className="font-mono font-semibold text-xs mt-0.5 tabular-nums"
                  style={{ color: '#F4F4F5' }}
                >
                  {formatDate(data.paidAt)}
                </p>
              </div>
            )}

            <div>
              <p
                className="text-[9px] font-mono uppercase tracking-[0.2em]"
                style={{ color: '#71717A' }}
              >
                Payment Channel
              </p>
              <p className="font-semibold text-xs mt-0.5" style={{ color: '#F4F4F5' }}>
                {formatPaymentMethod(data.paymentMethod)}
              </p>
            </div>

            <div>
              <p
                className="text-[9px] font-mono uppercase tracking-[0.2em]"
                style={{ color: '#71717A' }}
              >
                TrxID / Ledger Ref
              </p>
              <p
                className="font-mono text-xs mt-0.5 break-all"
                style={{ color: '#E4E4E7' }}
              >
                {data.transactionReference || 'Front Desk'} &middot; {shortRef}
              </p>
            </div>
          </div>
        </div>

        {/* Branch Footer inside Spine */}
        <div
          className="pt-4 border-t text-[10px] space-y-1 leading-relaxed"
          style={{ borderColor: '#27272A', color: '#A1A1AA' }}
        >
          <p className="font-bold uppercase tracking-wider" style={{ color: '#E4E4E7' }}>
            Ashkona Flagship Branch
          </p>
          <p>Ashkona, Dakshinkhan, Dhaka-1230</p>
          <p className="font-mono">+880 1685-475975</p>
          <p>info@iconfitnessgym.com</p>
        </div>
      </aside>

      {/* RIGHT INVOICE DOCUMENT WITH CENTERED EMBOSSED LOGO WATERMARK */}
      <div
        className="relative flex-1 p-6 sm:p-8 flex flex-col justify-between overflow-hidden"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        {/* PROPER CENTERED GYM CREST WATERMARK (NO SQUARE BACKGROUND) */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-0 flex items-center justify-center z-0"
        >
          <img
            src="/Image/logo-watermark.png"
            alt=""
            className="w-[290px] h-[290px] sm:w-[360px] sm:h-[360px] object-contain"
            style={{
              opacity: 0.065,
              filter: 'grayscale(25%) contrast(1.08)',
            }}
          />
        </div>

        {/* FOREGROUND CONTENT (CRISP & READABLE OVER WATERMARK) */}
        <div className="relative z-10 space-y-6">
          {/* Document Header & Status Stamp */}
          <div
            className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b"
            style={{ borderColor: '#E4E4E7' }}
          >
            <div>
              <p
                className="text-[10px] font-mono font-bold uppercase tracking-[0.22em]"
                style={{ color: '#B45309' }}
              >
                Icon Fitness Gym &bull; Official Ledger Document
              </p>
              <h1
                className="text-xl sm:text-2xl font-black tracking-tight uppercase mt-1"
                style={{ color: '#09090B' }}
              >
                {documentHeading}
              </h1>
            </div>
            <StatusStamp status={data.status} />
          </div>

          {/* Billed To & Verification Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <p
                className="text-[10px] font-mono font-bold uppercase tracking-[0.18em]"
                style={{ color: '#71717A' }}
              >
                Billed To / Member
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-extrabold" style={{ color: '#09090B' }}>
                  {data.issuedToName}
                </p>
                {data.memberCode && (
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                    style={{
                      backgroundColor: '#FEF3C7',
                      borderColor: '#FCD34D',
                      color: '#92400E',
                    }}
                  >
                    {data.memberCode}
                  </span>
                )}
              </div>
              {data.issuedToPhone && (
                <p className="text-xs font-mono tabular-nums" style={{ color: '#3F3F46' }}>
                  Phone: {data.issuedToPhone}
                </p>
              )}
              {data.issuedToEmail && (
                <p className="text-xs truncate" style={{ color: '#52525B' }}>
                  Email: {data.issuedToEmail}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:text-right">
              <p
                className="text-[10px] font-mono font-bold uppercase tracking-[0.18em]"
                style={{ color: '#71717A' }}
              >
                Authorization &amp; Audit
              </p>
              {data.verifiedByName && (
                <p className="text-xs font-semibold" style={{ color: '#09090B' }}>
                  Verified By: {data.verifiedByName}
                </p>
              )}
              {data.senderPhone && (
                <p className="text-xs font-mono tabular-nums" style={{ color: '#3F3F46' }}>
                  Sender: {data.senderPhone}
                </p>
              )}
              {data.periodStart && data.periodEnd && (
                <p className="text-xs font-mono tabular-nums" style={{ color: '#3F3F46' }}>
                  Active: {formatDate(data.periodStart)} &ndash;{' '}
                  {formatDate(data.periodEnd)}
                </p>
              )}
            </div>
          </div>

          {/* Transparent Invoice Particulars Table (Letting Watermark Show Through Cleanly) */}
          <div
            className="border-t-2 border-b overflow-x-auto"
            style={{ borderTopColor: '#0B0B0E', borderBottomColor: '#E4E4E7' }}
          >
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr
                  className="border-b text-[10px] font-mono font-bold uppercase tracking-[0.16em]"
                  style={{ borderColor: '#E4E4E7', color: '#71717A' }}
                >
                  <th className="py-2.5 pr-4">Membership Plan &amp; Coverage</th>
                  <th className="py-2.5 px-3 hidden sm:table-cell">Validity</th>
                  <th className="py-2.5 pl-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-4 pr-4 align-top">
                    <p className="font-bold text-sm" style={{ color: '#09090B' }}>
                      {data.planName}
                    </p>
                    {data.notes && (
                      <p className="text-[11px] mt-1" style={{ color: '#52525B' }}>
                        Note: {data.notes}
                      </p>
                    )}
                  </td>
                  <td
                    className="py-4 px-3 align-top font-mono text-xs hidden sm:table-cell whitespace-nowrap"
                    style={{ color: '#3F3F46' }}
                  >
                    {data.durationDays ? `${data.durationDays} Days` : 'Standard'}
                  </td>
                  <td
                    className="py-4 pl-3 align-top text-right font-mono font-bold tabular-nums"
                    style={{ color: '#09090B' }}
                  >
                    {formatBdt(data.grossAmountBdt)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals & Amount in Words */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div className="space-y-2 max-w-sm">
              <div
                className="pl-3 border-l-2"
                style={{ borderColor: '#D97706' }}
              >
                <p
                  className="text-[9px] font-mono font-bold uppercase tracking-[0.18em]"
                  style={{ color: '#71717A' }}
                >
                  In Words (BDT)
                </p>
                <p className="text-xs font-bold mt-0.5" style={{ color: '#09090B' }}>
                  {amountInWordsBdt(data.netAmountBdt)}
                </p>
              </div>
              {data.status === 'REFUNDED' && data.refundedAmountBdt > 0 && (
                <p className="text-xs font-semibold" style={{ color: '#1D4ED8' }}>
                  Refund Issued: {formatBdt(data.refundedAmountBdt)}
                  {data.refundReason ? ` — ${data.refundReason}` : ''}
                </p>
              )}
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span style={{ color: '#52525B' }}>Gross Subtotal</span>
                <span className="font-mono font-semibold tabular-nums" style={{ color: '#09090B' }}>
                  {formatBdt(data.grossAmountBdt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: data.discountBdt > 0 ? '#15803D' : '#71717A' }}>
                  Discount
                </span>
                <span
                  className="font-mono font-semibold tabular-nums"
                  style={{ color: data.discountBdt > 0 ? '#15803D' : '#71717A' }}
                >
                  {data.discountBdt > 0 ? `-${formatBdt(data.discountBdt)}` : '৳0'}
                </span>
              </div>
              {data.status === 'REFUNDED' && data.refundedAmountBdt > 0 && (
                <div className="flex items-center justify-between">
                  <span style={{ color: '#1D4ED8' }}>Refunded</span>
                  <span className="font-mono font-semibold tabular-nums" style={{ color: '#1D4ED8' }}>
                    -{formatBdt(data.refundedAmountBdt)}
                  </span>
                </div>
              )}

              <div
                className="mt-2 pt-2.5 border-t-2 flex items-center justify-between"
                style={{ borderColor: '#0B0B0E' }}
              >
                <span
                  className="font-mono font-extrabold uppercase tracking-wider text-[11px]"
                  style={{ color: '#09090B' }}
                >
                  {data.status === 'PENDING' ? 'Total Submitted' : 'Total Paid'}
                </span>
                <span
                  className="font-mono text-2xl font-black tabular-nums"
                  style={{ color: '#B45309' }}
                >
                  {formatBdt(data.netAmountBdt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Signature & Security Notice */}
        <div
          className="relative z-10 mt-8 pt-5 pb-1 border-t flex flex-col sm:flex-row sm:items-end justify-between gap-5"
          style={{ borderColor: '#E4E4E7' }}
        >
          <div className="flex items-center gap-3.5 max-w-sm">
            <ReceiptVerifyQr code={data.receiptNumber} />
            <div className="space-y-1">
              <p
                className="inline-flex items-center gap-1.5 text-[11px] font-bold"
                style={{ color: '#09090B' }}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: '#D97706' }} />
                Audited in Icon Fitness Gym Ledger
              </p>
              <p className="text-[10px] leading-relaxed" style={{ color: '#71717A' }}>
                Scan QR with any phone camera to verify receipt authenticity and
                payment status online.
              </p>
            </div>
          </div>

          <div className="sm:text-right shrink-0 flex flex-col items-start sm:items-end">
            {isAuthorized && (
              <div className="h-14 flex items-end justify-start sm:justify-end mb-1 px-1">
                <img
                  src="/Image/owner-signature.png"
                  alt="Owner Signature — Saddam Hoisan"
                  className="h-14 w-auto max-w-[185px] object-contain object-bottom select-none pointer-events-none"
                />
              </div>
            )}
            <div
              className="inline-block border-t pt-1.5 min-w-[205px]"
              style={{ borderColor: '#A1A1AA' }}
            >
              <p
                className="text-xs font-black uppercase tracking-wider"
                style={{ color: '#09090B' }}
              >
                Saddam Hoisan
              </p>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: '#71717A' }}>
                {isAuthorized
                  ? 'Proprietor & Owner • Icon Fitness Gym'
                  : 'Pending Owner Authorization'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReceiptModal({
  isOpen,
  onClose,
  receipt,
  payment,
}: {
  isOpen: boolean;
  onClose: () => void;
  receipt?: any | null;
  payment?: any | null;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isOpen) {
      document.body.classList.add('receipt-modal-open');
    } else {
      document.body.classList.remove('receipt-modal-open');
    }
    return () => {
      document.body.classList.remove('receipt-modal-open');
    };
  }, [isOpen]);

  const normalized = normalizeReceipt(receipt, payment);
  if (!normalized) return null;

  const handlePrint = () => {
    if (typeof document === 'undefined') return;
    const prevTitle = document.title;
    const safeReceipt = normalized.receiptNumber.replace(/[^A-Za-z0-9-_]/g, '-');
    document.title = `IconFitnessGym-Receipt-${safeReceipt}`;
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
          normalized.hasOfficialReceipt
            ? `Official Payment Receipt — #${normalized.receiptNumber}`
            : `Payment Voucher — ${normalized.receiptNumber}`
        }
        description="A4 Print-Ready Official Receipt issued by Icon Fitness Gym (Ashkona, Dhaka)"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <ReceiptDocument data={normalized} />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-[#A1A1AA]">
              Tip: Select <span className="font-mono">Save as PDF</span> and enable{' '}
              <span className="font-mono">Background graphics</span> for full header styling.
            </p>
            <div className="flex items-center justify-end gap-3 shrink-0">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="primary"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={handlePrint}
              >
                Print / Save PDF
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {mounted &&
        isOpen &&
        createPortal(
          <div id="receipt-print-portal" className="hidden print:block">
            <ReceiptDocument data={normalized} />
          </div>,
          document.body,
        )}
    </>
  );
}

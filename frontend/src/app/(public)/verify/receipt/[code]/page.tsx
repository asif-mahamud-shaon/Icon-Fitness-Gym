'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { apiFetch, formatBdt, formatDate, formatDateTime } from '@/lib/api';
import { formatPaymentMethod, formatVerifiedByLabel } from '@/lib/receipt-helpers';
import { Card, StatusBadge, Button, Skeleton } from '@/components/ui';

export default function VerifyReceiptPage() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(String(params?.code || ''));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setError('');
    apiFetch<any>(`/payments/receipts/verify/${encodeURIComponent(code)}`)
      .then((res) => setData(res))
      .catch((err: any) =>
        setError(err?.message || 'Unable to verify this official gym receipt.'),
      )
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#A1A1AA] hover:text-[#C7F464]"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Icon Fitness Gym
      </Link>

      {loading ? (
        <Skeleton className="h-80 rounded-3xl" />
      ) : error || !data ? (
        <Card className="p-8 rounded-3xl border border-rose-500/40 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
          <div className="space-y-1">
            <h1 className="font-display text-3xl uppercase text-white">
              Receipt Not Verified
            </h1>
            <p className="text-sm text-[#A1A1AA]">
              {error || `Receipt "${code}" was not found in Icon Fitness Gym ledger.`}
            </p>
          </div>
          <Link href="/" className="inline-block">
            <Button variant="primary">Go to Home</Button>
          </Link>
        </Card>
      ) : (
        <Card className="p-6 sm:p-8 rounded-3xl border border-[#C7F464]/50 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2C2C2C]">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#1B2210] border border-[#C7F464]/45 flex items-center justify-center text-[#C7F464] shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-mono uppercase tracking-widest text-[#C7F464] font-bold">
                  OFFICIAL MEMBERSHIP LEDGER RECEIPT
                </p>
                <h1 className="font-display text-2xl sm:text-3xl uppercase text-white mt-0.5">
                  {data.receiptNumber}
                </h1>
                <p className="text-xs font-mono text-[#A1A1AA] mt-0.5">
                  Issued {formatDateTime(data.issuedAt)}
                </p>
              </div>
            </div>
            <StatusBadge status={data.status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-1">
              <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">Member</p>
              <p className="text-sm font-bold text-white">{data.issuedToName}</p>
              <p className="text-xs font-mono text-[#A1A1AA]">{data.maskedPhone}</p>
              {data.memberCode && (
                <p className="text-xs font-mono text-emerald-400 inline-flex items-center gap-1 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {data.memberCode}
                </p>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-1">
              <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                Plan &amp; Authorization
              </p>
              <p className="text-sm font-bold text-white">{data.planName}</p>
              {data.periodStart && data.periodEnd && (
                <p className="text-xs font-mono text-[#A1A1AA] inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#C7F464]" />
                  {formatDate(data.periodStart)} – {formatDate(data.periodEnd)}
                </p>
              )}
              {data.issuedBy && (
                <p className="text-xs font-mono text-[#A1A1AA]">
                  Verified By:{' '}
                  {formatVerifiedByLabel(data.issuedBy.fullName, data.issuedBy.role)}
                </p>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-2 text-xs font-mono">
            <div className="flex justify-between text-[#A1A1AA]">
              <span>Payment Method</span>
              <span className="inline-flex items-center gap-1 text-white">
                <CreditCard className="w-3.5 h-3.5 text-[#C7F464]" />
                {formatPaymentMethod(data.paymentMethod)}
              </span>
            </div>
            {data.transactionReference && (
              <div className="flex justify-between text-[#A1A1AA]">
                <span>Transaction Reference</span>
                <span className="text-white">{data.transactionReference}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-[#2C2C2C]">
              <span className="text-white">Net Verified Paid</span>
              <span className="text-[#C7F464]">{formatBdt(data.netAmountBdt)}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

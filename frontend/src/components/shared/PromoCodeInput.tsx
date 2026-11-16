'use client';

import React, { useEffect, useState } from 'react';
import { Tag, X } from 'lucide-react';
import { apiFetch, formatBdt } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui';

export interface AppliedPromoSummary {
  code: string;
  discountType: string;
  discountValue: number;
  discountAmountBdt: number;
  description?: string | null;
}

interface PromoCodeInputProps {
  subtotalBdt: number;
  appliedPromo: AppliedPromoSummary | null;
  onChange: (promo: AppliedPromoSummary | null) => void;
}

export function PromoCodeInput({
  subtotalBdt,
  appliedPromo,
  onChange,
}: PromoCodeInputProps) {
  const { toast } = useToast();
  const [input, setInput] = useState(appliedPromo?.code || '');
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!appliedPromo?.code || subtotalBdt <= 0) return;
    apiFetch<any>('/store/discount-codes/validate', {
      method: 'POST',
      body: JSON.stringify({ code: appliedPromo.code, subtotalBdt }),
    })
      .then((res) => {
        if (
          Number(res.discountAmountBdt || 0) !==
          Number(appliedPromo.discountAmountBdt || 0)
        ) {
          onChange(res);
        }
        setError('');
      })
      .catch((err: any) => {
        onChange(null);
        setError(err.message || 'Promo code no longer applies to this order.');
      });
  }, [subtotalBdt, appliedPromo?.code, appliedPromo?.discountAmountBdt, onChange]);

  const handleApply = async () => {
    const trimmed = input.trim().toUpperCase();
    if (!trimmed) {
      setError('Enter a promo or discount code first.');
      return;
    }
    setApplying(true);
    setError('');
    try {
      const res = await apiFetch<any>('/store/discount-codes/validate', {
        method: 'POST',
        body: JSON.stringify({ code: trimmed, subtotalBdt }),
      });
      onChange(res);
      setInput(res.code);
      toast({
        title: `Promo ${res.code} Applied`,
        description: `Saved ${formatBdt(res.discountAmountBdt)} on this order.`,
        variant: 'success',
      });
    } catch (err: any) {
      onChange(null);
      setError(err.message || 'Invalid or expired discount code.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
        Discount / Promo Code (Optional)
      </label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value.toUpperCase());
              if (error) setError('');
            }}
            placeholder="Enter promo code (e.g. IFG15-XXXX)"
            className="w-full h-11 pl-9 pr-3 rounded-xl bg-[#141414] border border-[#2C2C2C] font-mono text-sm uppercase text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#C7F464]"
          />
        </div>
        {appliedPromo ? (
          <Button
            type="button"
            variant="secondary"
            className="h-11 shrink-0"
            leftIcon={<X className="w-3.5 h-3.5" />}
            onClick={() => {
              onChange(null);
              setInput('');
              setError('');
            }}
          >
            Remove
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            className="h-11 shrink-0"
            isLoading={applying}
            onClick={handleApply}
          >
            Apply Code
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-rose-400 font-mono">{error}</p>}
      {appliedPromo && (
        <div className="px-3 py-2 rounded-xl bg-[#1B2210] border border-[#C7F464]/40 flex items-center justify-between text-xs font-mono text-[#C7F464]">
          <span>
            Applied {appliedPromo.code}
            {appliedPromo.discountType === 'PERCENTAGE'
              ? ` (${appliedPromo.discountValue}% OFF)`
              : ` (${formatBdt(appliedPromo.discountValue)} OFF)`}
          </span>
          <span className="font-bold">
            -{formatBdt(Math.min(subtotalBdt, appliedPromo.discountAmountBdt))}
          </span>
        </div>
      )}
    </div>
  );
}

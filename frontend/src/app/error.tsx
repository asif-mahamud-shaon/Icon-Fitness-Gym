'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalAppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log minimal error summary in client diagnostics without exposing sensitive state
    if (process.env.NODE_ENV !== 'production') {
      console.error('Unhandled page boundary error:', error?.message);
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full rounded-3xl border border-[#2C2C2C] bg-[#171717] p-8 text-center space-y-4">
        <p className="text-xs font-mono uppercase tracking-widest text-[#C7F464]">
          Icon Fitness Gym
        </p>
        <h1 className="font-display text-3xl uppercase text-white">
          Something Went Wrong
        </h1>
        <p className="text-sm text-[#A1A1AA]">
          We hit an unexpected rendering issue on this view. You can safely retry or return to the homepage.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-[#C7F464] text-[#090909] text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border border-[#2C2C2C] text-sm font-semibold text-white hover:border-[#C7F464]/50 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

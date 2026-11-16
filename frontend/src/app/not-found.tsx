import React from 'react';
import Link from 'next/link';
import { Dumbbell, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#090909] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#171717] border border-[#303030] flex items-center justify-center text-[#C7F464] mb-6">
        <Dumbbell className="w-8 h-8" />
      </div>
      <p className="text-xs font-mono uppercase tracking-[0.25em] text-[#C7F464]">
        ERROR 404 • ROUTE NOT FOUND
      </p>
      <h1 className="font-display text-5xl sm:text-7xl uppercase tracking-wide mt-2">
        OUT OF BOUNDS
      </h1>
      <p className="text-sm sm:text-base text-[#A1A1AA] max-w-md mt-3">
        The page or resource you requested does not exist on the Icon Fitness
        Gym Ashkona platform.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        <Link href="/">
          <Button
            variant="primary"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Homepage
          </Button>
        </Link>
        <Link href="/membership">
          <Button variant="secondary">Explore Memberships</Button>
        </Link>
      </div>
    </div>
  );
}


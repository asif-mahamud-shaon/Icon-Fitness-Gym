import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';

export default function CancellationPolicyPage() {
  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16 space-y-12">
      <div className="dark-media-card relative rounded-3xl overflow-hidden border border-[#2C2C2C] bg-[#090909] p-6 sm:p-10 lg:p-12 shadow-2xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15">
          <FileText className="w-4 h-4 text-[#C7F464]" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#C7F464]">
            CLASS BOOKING &amp; MEMBERSHIP FREEZE GOVERNANCE
          </span>
        </div>
        <h1 className="font-display text-4xl sm:text-6xl uppercase tracking-wide text-white leading-[0.95]">
          CANCELLATION &amp; <span className="text-[#C7F464]">FREEZE POLICY</span>
        </h1>
        <p className="text-sm sm:text-base text-zinc-300 max-w-2xl leading-relaxed">
          Clear rules governing group class seat releases, 2-hour cancellation
          cutoffs, and administrative membership freeze requests at Icon Fitness
          Gym Ashkona.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-7 rounded-3xl space-y-4 border border-[#2C2C2C]">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-[#C7F464] !text-[#090909] font-mono text-xs font-bold">
              SECTION 01
            </span>
            <h2 className="font-display text-2xl uppercase tracking-wide text-white">
              Group Class Booking Cancellations
            </h2>
          </div>
          <p className="text-sm text-[#A1A1AA] leading-relaxed">
            To guarantee fair seat availability across our barbell strength,
            HIIT, and mobility classes, reservations must be cancelled through
            your Member Portal at least <strong className="text-white">2 hours prior</strong> to the
            scheduled class start time.
          </p>
          <div className="p-4 rounded-2xl bg-[#090909] border border-[#262626] space-y-2 text-xs text-white/90">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#C7F464] shrink-0 mt-0.5" />
              <span>
                Cancelled seats are immediately released back to the public
                schedule for waitlisted members.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#C7F464] shrink-0 mt-0.5" />
              <span>
                Bookings cannot be cancelled online within 2 hours of class
                start time.
              </span>
            </p>
          </div>
        </Card>

        <Card className="p-7 rounded-3xl space-y-4 border border-[#2C2C2C]">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-[#C7F464] !text-[#090909] font-mono text-xs font-bold">
              SECTION 02
            </span>
            <h2 className="font-display text-2xl uppercase tracking-wide text-white">
              Membership Freeze &amp; Medical Extensions
            </h2>
          </div>
          <p className="text-sm text-[#A1A1AA] leading-relaxed">
            Quarterly (90-Day) and Annual (365-Day) memberships are eligible for
            administrative freeze requests in the event of documented medical
            recovery or extended travel outside Dhaka.
          </p>
          <div className="p-4 rounded-2xl bg-[#090909] border border-[#262626] space-y-2 text-xs text-white/90">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#C7F464] shrink-0 mt-0.5" />
              <span>
                Freeze days extend your membership expiry date by the exact
                approved duration upon reactivation.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#C7F464] shrink-0 mt-0.5" />
              <span>
                Submit freeze requests at the Ashkona Front Desk or via your
                Member Portal support inquiry.
              </span>
            </p>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/terms">
          <Button
            variant="secondary"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Full Terms &amp; Conditions
          </Button>
        </Link>
        <Link href="/privacy-policy">
          <Button
            variant="secondary"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Privacy &amp; Biometric Policy
          </Button>
        </Link>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  ArrowRight,
  ShieldCheck,
  ScanFace,
  Clock,
  CreditCard,
  Sparkles,
  Dumbbell,
  Users,
  CalendarCheck,
  Award,
  PhoneCall,
} from 'lucide-react';
import { apiFetch, formatBdt, computePlanPricing, getCachedApiData } from '@/lib/api';
import { MembershipPlan } from '@/types';
import {
  Card,
  Button,
  Skeleton,
  EmptyState,
  StatusBadge,
} from '@/components/ui';

export default function MembershipPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>(
    () => getCachedApiData<MembershipPlan[]>('/membership-plans/public') || [],
  );
  const [loading, setLoading] = useState(
    () => !getCachedApiData<MembershipPlan[]>('/membership-plans/public')?.length,
  );

  useEffect(() => {
    apiFetch<MembershipPlan[]>('/membership-plans/public')
      .then(setPlans)
      .catch(() => [])
      .finally(() => setLoading(false));
  }, []);

  const cleanPlanName = (name: string) =>
    name.replace(/\s*\(Configurable Tier\)/gi, '').trim();

  const cleanPlanText = (text?: string | null) =>
    (text || '')
      .replace(
        /\s*Pricing and admission fees are managed in Admin\s*->\s*Membership Plans\./gi,
        '',
      )
      .replace(/\s*Configurable rate\s*[—-]\s*[^.]+\./gi, '')
      .trim();

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-16 space-y-16">
      {/* =====================================================================
          1. CINEMATIC HERO BANNER
          ===================================================================== */}
      <section className="dark-media-card relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#2C2C2C] bg-[#090909] shadow-2xl">
        <img
          src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=960&q=75"
          alt="Icon Fitness Gym Ashkona Strength Floor"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/55" />

        <div className="relative z-10 p-5 sm:p-12 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-end">
          <div className="lg:col-span-8 space-y-4 sm:space-y-5">
            <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-black/80 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-[#C7F464]" />
              <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-[#C7F464]">
                MEMBERSHIP &amp; PRICING • ASHKONA, DHAKA
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl xl:text-7xl uppercase tracking-wide text-white leading-[0.94]">
              COMMIT TO YOUR{' '}
              <span className="text-[#C7F464]">STRONGEST</span> ERA.
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl">
              Clear BDT pricing with zero surprise fees. Select your ideal
              membership duration, submit payment in under 60 seconds, and
              unlock Smart Face Gate entry, workout blueprints, and class
              reservations after Admin verification.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link href="/register">
                <Button
                  variant="primary"
                  size="lg"
                  className="ifg-btn-primary rounded-xl"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Join Icon Fitness Now
                </Button>
              </Link>
              <Link href="/facilities">
                <Button
                  variant="secondary"
                  size="lg"
                  className="rounded-xl bg-black/75 border-white/25 text-white hover:border-[#C7F464]"
                >
                  Explore Facilities &amp; Zones
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-3">
            {[
              {
                icon: <ScanFace className="w-4 h-4 text-[#C7F464]" />,
                label: 'Smart Gate',
                value: 'Face ID Sync',
              },
              {
                icon: <Clock className="w-4 h-4 text-[#C7F464]" />,
                label: 'Ladies Window',
                value: '1:00–3:30 PM',
              },
              {
                icon: <CreditCard className="w-4 h-4 text-[#C7F464]" />,
                label: 'Pay Options',
                value: 'bKash / Nagad / Cash',
              },
              {
                icon: <ShieldCheck className="w-4 h-4 text-[#C7F464]" />,
                label: 'Activation',
                value: 'Admin Verified',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-2xl bg-black/75 border border-white/15 backdrop-blur-md space-y-1.5"
              >
                {stat.icon}
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  {stat.label}
                </p>
                <p className="text-xs sm:text-sm font-semibold text-white">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. MEMBERSHIP PLAN CARDS
          ===================================================================== */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
              SELECT YOUR TIER
            </span>
            <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-wide text-white mt-1">
              OFFICIAL CLUB PLANS
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#A1A1AA] max-w-md">
            Every tier includes full training floor access during Ashkona club
            hours, Member Portal access, and dedicated locker rooms.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[480px] rounded-3xl" />
            <Skeleton className="h-[480px] rounded-3xl" />
            <Skeleton className="h-[480px] rounded-3xl" />
          </div>
        ) : plans.length === 0 ? (
          <EmptyState
            title="No Membership Plans Published"
            description="Membership tiers are currently being updated by Icon Fitness Gym administration. Please contact our front desk for assistance."
            action={
              <Link href="/contact">
                <Button variant="primary">Contact Front Desk</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => {
              const title = cleanPlanName(plan.name);
              const description = cleanPlanText(plan.description);
              const eligibility = cleanPlanText(plan.eligibilityConditions);
              const pricing = computePlanPricing(plan);

              return (
                <Card
                  key={plan.id}
                  className={`flex flex-col justify-between relative rounded-3xl p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 ${
                    plan.isFeatured
                      ? 'border-[#C7F464] ring-1 ring-[#C7F464]/45 shadow-2xl'
                      : 'border-[#2C2C2C] hover:border-[#C7F464]/50'
                  }`}
                >
                  {plan.isFeatured && (
                    <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-[#C7F464] text-[#090909] text-[10px] font-mono font-bold uppercase tracking-wider shadow-md flex items-center gap-1">
                      <Award className="w-3 h-3" /> Most Popular
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Tier Header */}
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#C7F464]">
                          {plan.durationDays} Days • {plan.durationType}
                        </span>
                        <StatusBadge
                          status={
                            plan.includesPersonalTrainer ? 'FEATURED' : 'ACTIVE'
                          }
                        />
                      </div>
                      <h3 className="font-display text-3xl uppercase tracking-wide text-white mt-2">
                        {title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#A1A1AA] mt-2 leading-relaxed">
                        {description}
                      </p>
                    </div>

                    {/* Pricing Breakdown Box */}
                    <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-2">
                      {pricing.hasDiscount && pricing.badgeText && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#C7F464]/15 border border-[#C7F464]/40 text-[#C7F464] text-[10px] font-mono font-bold uppercase tracking-wider">
                            {pricing.badgeText}
                          </span>
                          <span className="text-[11px] font-mono text-[#C7F464]">
                            Save {formatBdt(pricing.totalDiscount)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-baseline gap-2.5 flex-wrap">
                        <span className="font-display text-4xl sm:text-5xl text-white">
                          {formatBdt(pricing.discountedPrice)}
                        </span>
                        {pricing.hasDiscount && (
                          <span className="font-mono text-base text-[#A1A1AA] line-through">
                            {formatBdt(pricing.basePrice)}
                          </span>
                        )}
                        <span className="text-xs font-mono text-[#A1A1AA]">
                          / {plan.durationDays} days
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#262626] text-[11px] font-mono text-[#A1A1AA]">
                        <span>
                          Admission: {formatBdt(pricing.admissionFee)}
                        </span>
                        <span className="text-[#C7F464] font-semibold">
                          First Total: {formatBdt(pricing.netFirstTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Quick Quota Pill Row */}
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-[#141414] border border-[#262626]">
                        <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                          Group Classes
                        </span>
                        <span className="text-white font-semibold mt-0.5 block">
                          Up to {plan.maxClassesPerWeek}/week
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#141414] border border-[#262626]">
                        <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                          Coach Review
                        </span>
                        <span className="text-white font-semibold mt-0.5 block">
                          {plan.includesPersonalTrainer
                            ? 'Included'
                            : 'Optional'}
                        </span>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wider text-white mb-3 font-semibold">
                        Included Privileges
                      </p>
                      <ul className="space-y-2.5 text-xs sm:text-sm text-[#A1A1AA]">
                        {plan.benefits.map((benefit) => (
                          <li key={benefit} className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-[#C7F464]/15 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-3 h-3 text-[#C7F464]" />
                            </span>
                            <span className="leading-snug">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {(eligibility || plan.renewalRules) && (
                      <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626] space-y-1.5 text-xs text-[#A1A1AA]">
                        {eligibility && (
                          <p>
                            <strong className="text-white">Validity:</strong>{' '}
                            {eligibility}
                          </p>
                        )}
                        {plan.renewalRules && (
                          <p>
                            <strong className="text-white">Renewal:</strong>{' '}
                            {plan.renewalRules}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-6 mt-6 border-t border-[#262626]">
                    <Link
                      href={`/register?planId=${plan.id}`}
                      className="block"
                    >
                      <Button
                        variant={plan.isFeatured ? 'primary' : 'secondary'}
                        size="lg"
                        className={`w-full rounded-xl ${
                          plan.isFeatured ? 'ifg-btn-primary' : ''
                        }`}
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        Select {title}
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================================================
          3. HOW REGISTRATION & APPROVAL WORKS (3 STEPS)
          ===================================================================== */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
            STREAMLINED ONBOARDING
          </span>
          <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white mt-1">
            FROM SIGNUP TO TRAINING IN 3 STEPS
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              step: '01',
              icon: <Users className="w-5 h-5 text-[#C7F464]" />,
              title: 'Create Member Profile',
              desc: 'Fill in your registration details, select your preferred membership tier, and receive your unique IFG Member ID immediately.',
            },
            {
              step: '02',
              icon: <CreditCard className="w-5 h-5 text-[#C7F464]" />,
              title: 'Submit Plan Payment',
              desc: 'Complete payment via bKash, Nagad, Rocket, Bank Transfer, Card POS, or Cash at our Ashkona desk and submit your TrxID once.',
            },
            {
              step: '03',
              icon: <ShieldCheck className="w-5 h-5 text-[#C7F464]" />,
              title: 'Admin Approval & Portal Unlock',
              desc: 'Once our Ashkona Admin verifies your payment and issues your digital receipt, your Member Portal & Face ID access unlock.',
            },
          ].map((item) => (
            <Card
              key={item.step}
              className="p-6 rounded-3xl border border-[#2C2C2C] space-y-4 hover:border-[#C7F464]/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-center">
                  {item.icon}
                </div>
                <span className="font-mono text-xs font-bold text-[#C7F464] px-2.5 py-1 rounded-full bg-[#C7F464]/15">
                  STEP {item.step}
                </span>
              </div>
              <h3 className="font-display text-2xl uppercase text-white">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                {item.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* =====================================================================
          4. COMPARISON MATRIX
          ===================================================================== */}
      {!loading && plans.length > 0 && (
        <section className="space-y-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
              SIDE-BY-SIDE BREAKDOWN
            </span>
            <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white mt-1">
              PLAN COMPARISON MATRIX
            </h2>
          </div>

          <Card className="p-0 overflow-hidden rounded-3xl border border-[#2C2C2C]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#303030] bg-[#141414] text-xs font-mono uppercase text-[#A1A1AA]">
                    <th className="py-4 px-6">Feature / Metric</th>
                    {plans.map((p) => (
                      <th key={p.id} className="py-4 px-6 text-white font-bold">
                        {cleanPlanName(p.name)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]">
                  <tr>
                    <td className="py-4 px-6 text-[#A1A1AA]">Duration</td>
                    {plans.map((p) => (
                      <td
                        key={p.id}
                        className="py-4 px-6 font-mono text-white"
                      >
                        {p.durationDays} Days ({p.durationType})
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-[#A1A1AA]">
                      Plan Fee (BDT)
                    </td>
                    {plans.map((p) => {
                      const pricing = computePlanPricing(p);
                      return (
                        <td
                          key={p.id}
                          className="py-4 px-6 font-mono font-bold text-[#C7F464]"
                        >
                          <span>{formatBdt(pricing.discountedPrice)}</span>
                          {pricing.hasDiscount && (
                            <span className="ml-2 text-xs text-[#A1A1AA] font-normal line-through">
                              {formatBdt(pricing.basePrice)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-[#A1A1AA]">
                      Active Discount
                    </td>
                    {plans.map((p) => {
                      const pricing = computePlanPricing(p);
                      return (
                        <td
                          key={p.id}
                          className="py-4 px-6 font-mono text-xs text-[#C7F464]"
                        >
                          {pricing.hasDiscount
                            ? `-${formatBdt(pricing.totalDiscount)}${pricing.badgeText ? ` (${pricing.badgeText})` : ''}`
                            : '—'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-[#A1A1AA]">Admission Fee</td>
                    {plans.map((p) => (
                      <td
                        key={p.id}
                        className="py-4 px-6 font-mono text-white"
                      >
                        {formatBdt(p.admissionFeeBdt)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-[#A1A1AA]">
                      First-Cycle Total Payable
                    </td>
                    {plans.map((p) => {
                      const pricing = computePlanPricing(p);
                      return (
                        <td
                          key={p.id}
                          className="py-4 px-6 font-mono font-semibold text-white"
                        >
                          {formatBdt(pricing.netFirstTotal)}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-[#A1A1AA]">
                      Weekly Group Class Quota
                    </td>
                    {plans.map((p) => (
                      <td
                        key={p.id}
                        className="py-4 px-6 font-mono text-white"
                      >
                        Up to {p.maxClassesPerWeek} / week
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-[#A1A1AA]">
                      Personal Trainer Review
                    </td>
                    {plans.map((p) => (
                      <td key={p.id} className="py-4 px-6 text-white">
                        {p.includesPersonalTrainer
                          ? 'Included'
                          : 'Optional Add-On'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-[#A1A1AA]">
                      Dedicated Ladies-Only Hours (1:00–3:30 PM)
                    </td>
                    {plans.map((p) => (
                      <td key={p.id} className="py-4 px-6 text-white">
                        Included (Female Members)
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-[#A1A1AA]">
                      Smart Face Gate &amp; Workout Portal
                    </td>
                    {plans.map((p) => (
                      <td
                        key={p.id}
                        className="py-4 px-6 font-semibold text-[#C7F464]"
                      >
                        Included
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}

      {/* =====================================================================
          5. CLUB PRIVILEGES & POLICY LINKS + BOTTOM CTA
          ===================================================================== */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-6 rounded-3xl border border-[#2C2C2C] space-y-2.5">
          <Dumbbell className="w-5 h-5 text-[#C7F464]" />
          <h3 className="font-display text-xl uppercase text-white">
            Separate Ladies Facilities
          </h3>
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            Dedicated Ladies-Only hours (Sat–Thu 1:00 PM – 3:30 PM) with
            separate changing rooms, washrooms, and female coaching support.
          </p>
        </Card>
        <Card className="p-6 rounded-3xl border border-[#2C2C2C] space-y-2.5">
          <CalendarCheck className="w-5 h-5 text-[#C7F464]" />
          <h3 className="font-display text-xl uppercase text-white">
            Pause &amp; Renewal Flexibility
          </h3>
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            Need a temporary freeze or seamless renewal? Review our{' '}
            <Link
              href="/cancellation-policy"
              className="text-[#C7F464] hover:underline font-semibold"
            >
              Cancellation &amp; Freeze Policy
            </Link>{' '}
            and{' '}
            <Link
              href="/terms"
              className="text-[#C7F464] hover:underline font-semibold"
            >
              Club Terms
            </Link>
            .
          </p>
        </Card>
        <Card className="p-6 rounded-3xl border border-[#2C2C2C] space-y-2.5">
          <PhoneCall className="w-5 h-5 text-[#C7F464]" />
          <h3 className="font-display text-xl uppercase text-white">
            Ashkona Desk Assistance
          </h3>
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            Prefer an in-person tour before joining? Visit Ashkona Main Road or
            call{' '}
            <span className="text-[#C7F464] font-mono font-semibold">
              01685475975
            </span>
            .
          </p>
        </Card>
      </section>

      <section className="dark-media-card relative rounded-3xl overflow-hidden border border-[#2C2C2C] bg-[#090909] p-8 sm:p-12 shadow-2xl">
        <img
          src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1500&q=80"
          alt="Icon Fitness Gym Registration CTA"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/50" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
              ICON FITNESS GYM • ASHKONA, DHAKA
            </span>
            <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-wide text-white leading-none">
              READY TO LOCK IN YOUR MEMBERSHIP?
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Register online in under 60 seconds, complete your plan payment,
              and gain full portal &amp; floor access upon Admin verification.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href="/register">
              <Button
                variant="primary"
                size="lg"
                className="ifg-btn-primary rounded-xl"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Start Registration
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="secondary"
                size="lg"
                className="rounded-xl bg-black/75 border-white/25 text-white hover:border-[#C7F464]"
              >
                Visit Ashkona Desk
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

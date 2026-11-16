'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UserPlus,
  ArrowRight,
  CheckCircle2,
  ScanFace,
  ShieldCheck,
  Clock,
  Dumbbell,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiFetch, formatBdt, computePlanPricing } from '@/lib/api';
import { MembershipPlan } from '@/types';
import { Card, Input, Select, Button } from '@/components/ui';

function RegisterContent() {
  const { register } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlanId = searchParams?.get('planId') || '';

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    gender: 'MALE',
    fitnessGoal: 'FITNESS_IMPROVEMENT',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    selectedPlanId: initialPlanId,
  });

  useEffect(() => {
    apiFetch<MembershipPlan[]>('/membership-plans/public')
      .then((res) => {
        setPlans(res);
        if (!initialPlanId && res.length > 0) {
          const featured = res.find((p) => p.isFeatured) || res[0];
          setForm((prev) => ({ ...prev, selectedPlanId: featured.id }));
        }
      })
      .catch(() => []);
  }, [initialPlanId]);

  const activePlan = plans.find((p) => p.id === form.selectedPlanId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(form);
      toast({
        title: 'Account Created — Complete Payment Next',
        description: `Member ID ${user.memberCode} created. Submit your payment on the next screen for Admin verification.`,
        variant: 'info',
      });
      router.push('/register/payment');
    } catch (err: any) {
      toast({
        title: 'Registration Failed',
        description: err.message || 'Please check your registration details.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================================================================
            LEFT COLUMN (5 COLS): INTERACTIVE PLAN & BENEFITS SHOWCASE
            ================================================================ */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
          <div className="dark-media-card relative rounded-3xl overflow-hidden border border-[#2C2C2C] bg-[#090909] shadow-2xl p-6 sm:p-8 space-y-6">
            <img
              src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=85"
              alt="Icon Fitness Gym Onboarding"
              className="absolute inset-0 w-full h-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/60" />

            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/80 border border-white/15">
                <img
                  src="/logo.jpg"
                  alt="Icon Fitness Gym Logo"
                  className="w-5 h-5 rounded object-contain bg-black"
                />
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#C7F464]">
                  MEMBER ONBOARDING • ASHKONA, DHAKA
                </span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-wide text-white leading-[0.95]">
                JOIN{' '}
                <span className="text-[#C7F464]">ICON FITNESS GYM</span>{' '}
                TODAY.
              </h1>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Create your official Member Account in under 60 seconds to
                receive your digital Member ID, select your preferred training
                plan, and unlock portal workout tracking.
              </p>
            </div>

            {/* Interactive Plan Selector Cards */}
            {plans.length > 0 && (
              <div className="relative z-10 space-y-2.5">
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#C7F464]">
                  1-CLICK PLAN SELECTION
                </p>
                <div className="space-y-2">
                  {plans.map((p) => {
                    const selected = form.selectedPlanId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, selectedPlanId: p.id }))
                        }
                        className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                          selected
                            ? 'bg-[#C7F464]/20 border-[#C7F464] shadow-md'
                            : 'bg-black/75 border-white/15 hover:border-white/35'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {p.name}
                            </span>
                            {p.isFeatured && (
                              <span className="px-2 py-0.5 rounded-full bg-[#C7F464] !text-[#090909] text-[9px] font-mono font-bold uppercase">
                                Popular
                              </span>
                            )}
                            {(() => {
                              const pricing = computePlanPricing(p);
                              return pricing.hasDiscount && pricing.badgeText ? (
                                <span className="px-2 py-0.5 rounded-full bg-[#C7F464]/15 border border-[#C7F464]/40 text-[#C7F464] text-[9px] font-mono font-bold uppercase">
                                  {pricing.badgeText}
                                </span>
                              ) : null;
                            })()}
                          </div>
                          <span className="text-[11px] font-mono text-zinc-400">
                            {p.durationDays} Days • Max {p.maxClassesPerWeek}{' '}
                            Classes/Wk
                          </span>
                        </div>
                        {(() => {
                          const pricing = computePlanPricing(p);
                          return (
                            <div className="text-right shrink-0">
                              <span className="block font-mono text-base font-bold text-[#C7F464]">
                                {formatBdt(pricing.discountedPrice)}
                              </span>
                              {pricing.hasDiscount && (
                                <span className="block font-mono text-[11px] text-zinc-500 line-through">
                                  {formatBdt(pricing.basePrice)}
                                </span>
                              )}
                              <span className="block text-[10px] font-mono text-zinc-400">
                                {selected ? '● Selected' : 'Select'}
                              </span>
                            </div>
                          );
                        })()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Plan Benefits Preview */}
            {activePlan && (
              <div className="relative z-10 p-4 rounded-2xl bg-black/80 border border-white/15 space-y-2.5">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#C7F464]">
                  INCLUDED IN {activePlan.name.toUpperCase()}
                </p>
                <ul className="space-y-1.5 text-xs text-zinc-200">
                  {activePlan.benefits.slice(0, 4).map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C7F464] shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 3-Step Onboarding Process */}
            <div className="relative z-10 pt-4 border-t border-white/15 space-y-2.5 text-xs">
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                HOW ONBOARDING WORKS
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-black/75 border border-white/10">
                  <span className="font-mono text-[10px] text-[#C7F464] font-bold block">
                    STEP 01
                  </span>
                  <span className="text-[11px] text-white font-medium">
                    Instant ID
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/75 border border-white/10">
                  <span className="font-mono text-[10px] text-[#C7F464] font-bold block">
                    STEP 02
                  </span>
                  <span className="text-[11px] text-white font-medium">
                    Pay Plan Fee
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/75 border border-white/10">
                  <span className="font-mono text-[10px] text-[#C7F464] font-bold block">
                    STEP 03
                  </span>
                  <span className="text-[11px] text-white font-medium">
                    Admin Approval
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================
            RIGHT COLUMN (7 COLS): STRUCTURED 3-SECTION ONBOARDING FORM
            ================================================================ */}
        <div className="lg:col-span-7">
          <Card className="p-6 sm:p-10 rounded-3xl space-y-7 border border-[#2C2C2C] shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#262626]">
              <div>
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
                  OFFICIAL MEMBER REGISTRATION
                </span>
                <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white mt-1">
                  CREATE YOUR MEMBER ACCOUNT
                </h2>
              </div>
              <Link
                href="/login"
                className="text-xs font-mono uppercase tracking-wider text-[#C7F464] hover:underline"
              >
                Already a Member? Sign In →
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 01: Identity & Credentials */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#C7F464]/15 border border-[#C7F464]/30 text-[10px] font-mono font-bold uppercase text-[#C7F464]">
                    01 / IDENTITY &amp; LOGIN CREDENTIALS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name *"
                    required
                    placeholder="e.g. Tariqul Islam"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                  />
                  <Input
                    label="Phone Number *"
                    required
                    placeholder="e.g. 01711000000"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Email Address *"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                  <div className="relative">
                    <Input
                      label="Password * (Min 8 chars)"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-[34px] p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#C7F464] transition-colors"
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 02: Athletic Profile & Session Eligibility */}
              <div className="pt-4 border-t border-[#262626] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#C7F464]/15 border border-[#C7F464]/30 text-[10px] font-mono font-bold uppercase text-[#C7F464]">
                    02 / TRAINING PROFILE &amp; SESSION SCHEDULE
                  </span>
                  {form.gender === 'FEMALE' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/35 text-[10px] font-mono font-semibold text-pink-400">
                      ✓ Unlocks Ladies-Only Window (1:00–3:30 PM) &amp; General Slots
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Gender (For Biometric Session Gate)"
                    value={form.gender}
                    onChange={(e) =>
                      setForm({ ...form, gender: e.target.value })
                    }
                    options={[
                      {
                        value: 'MALE',
                        label: 'Male (General Sessions: 7–1:00 & 3:30–11)',
                      },
                      {
                        value: 'FEMALE',
                        label: 'Female (Ladies-Only 1:00–3:30 PM + General)',
                      },
                      { value: 'OTHER', label: 'Other' },
                    ]}
                  />
                  <Select
                    label="Primary Fitness Goal"
                    value={form.fitnessGoal}
                    onChange={(e) =>
                      setForm({ ...form, fitnessGoal: e.target.value })
                    }
                    options={[
                      {
                        value: 'FITNESS_IMPROVEMENT',
                        label: 'General Fitness & Conditioning',
                      },
                      {
                        value: 'MUSCLE_BUILDING',
                        label: 'Muscle Building & Hypertrophy',
                      },
                      {
                        value: 'WEIGHT_LOSS',
                        label: 'Weight Loss & Metabolic Fat Burn',
                      },
                      {
                        value: 'STRENGTH_TRAINING',
                        label: 'Barbell Strength & Power',
                      },
                      {
                        value: 'BEGINNER',
                        label: 'Beginner Machine & Form Orientation',
                      },
                    ]}
                  />
                </div>

                <Input
                  label="Residential Address (Ashkona / Dakshinkhan / Uttara)"
                  placeholder="e.g. Ashkona Main Road, Dakshinkhan, Dhaka-1230"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </div>

              {/* Section 03: Safety Contact & Membership Plan */}
              <div className="pt-4 border-t border-[#262626] space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#C7F464]/15 border border-[#C7F464]/30 text-[10px] font-mono font-bold uppercase text-[#C7F464]">
                    03 / EMERGENCY CONTACT &amp; MEMBERSHIP TIER
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Emergency Contact Name"
                    placeholder="e.g. Parent / Spouse Name"
                    value={form.emergencyContactName}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        emergencyContactName: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Emergency Contact Phone"
                    placeholder="e.g. 01811000000"
                    value={form.emergencyContactPhone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        emergencyContactPhone: e.target.value,
                      })
                    }
                  />
                </div>

                {plans.length > 0 && (
                  <Select
                    label="Selected Membership Plan"
                    value={form.selectedPlanId}
                    onChange={(e) =>
                      setForm({ ...form, selectedPlanId: e.target.value })
                    }
                    options={[
                      { value: '', label: 'Decide Later in Member Portal' },
                      ...plans.map((p) => {
                        const pricing = computePlanPricing(p);
                        return {
                          value: p.id,
                          label: pricing.hasDiscount
                            ? `${p.name} — ${formatBdt(pricing.discountedPrice)} (${pricing.badgeText || `Save ${formatBdt(pricing.totalDiscount)}`}, ${p.durationDays} Days)`
                            : `${p.name} — ${formatBdt(pricing.basePrice)} (${p.durationDays} Days)`,
                        };
                      }),
                    ]}
                  />
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full rounded-xl"
                  isLoading={loading}
                  leftIcon={<UserPlus className="w-4 h-4" />}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Complete Member Registration
                </Button>
              </div>
            </form>

            <div className="pt-4 border-t border-[#262626] flex flex-wrap items-center justify-between gap-3 text-xs text-[#A1A1AA]">
              <span>
                By registering, you agree to our{' '}
                <Link
                  href="/terms"
                  className="text-[#C7F464] hover:underline font-medium"
                >
                  Terms &amp; Conditions
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy-policy"
                  className="text-[#C7F464] hover:underline font-medium"
                >
                  Privacy Policy
                </Link>
                .
              </span>
              <Link
                href="/login"
                className="text-[#C7F464] font-semibold hover:underline"
              >
                Sign in to Member Portal →
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Brain,
  Check,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  HeartPulse,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { GymSettings } from '@/types';
import { resolveWebsiteConfig } from '@/lib/website-config';
import { Card, Button } from '@/components/ui';

type GoalKey = 'strength' | 'fatloss' | 'beginner' | 'ladies';

const WHY_PILLARS = [
  {
    code: '01 / COACHING SYSTEM',
    title: 'Structured Programming, Not Guesswork',
    description:
      'Every member receives coach-vetted workout blueprints inside the Member Portal—progressive overload splits for muscle gain, metabolic circuits for fat loss, and form-first foundations for beginners.',
    highlight: 'Portal-Synced Splits',
    icon: <Target className="w-5 h-5 text-[#C7F464]" />,
  },
  {
    code: '02 / CALIBRATED IRON',
    title: 'Competition Free-Weights & Pro Machines',
    description:
      'Train safely on biomechanically smooth cam-profiled selectorized machines, heavy squat cages, Olympic deadlift platforms, and calibrated 2.5 kg to 50 kg dumbbell racks inspected weekly.',
    highlight: '45+ Pro Stations',
    icon: <Dumbbell className="w-5 h-5 text-[#C7F464]" />,
  },
  {
    code: '03 / LADIES PRIVACY',
    title: '100% Exclusive Ladies-Only Hours',
    description:
      'From 1:00 PM to 3:30 PM (Sat–Thu), the entire floor is strictly reserved for women—supervised by certified Female Trainers with biometric turnstile enforcement.',
    highlight: 'Dedicated Female Coaches',
    icon: <Users className="w-5 h-5 text-pink-400" />,
  },
  {
    code: '04 / SMART ACCESS',
    title: 'Sub-Second Biometric Face ID Gate',
    description:
      'Walk straight onto the training floor with touchless facial verification—zero membership card hassles, automated slot enforcement, and live attendance history in your phone.',
    highlight: '< 0.8s Gate Check-In',
    icon: <ScanFace className="w-5 h-5 text-[#C7F464]" />,
  },
  {
    code: '05 / RECOVERY & CLIMATE',
    title: 'Full HVAC Climate Control & Floor Hygiene',
    description:
      'High-output air conditioning, acoustic shock-absorbing rubber flooring, sanitized cardio consoles, and strict towel + re-racking etiquette keep every session comfortable year-round.',
    highlight: 'Clean Indoor Standard',
    icon: <HeartPulse className="w-5 h-5 text-[#C7F464]" />,
  },
  {
    code: '06 / PRO GEAR & NUTRITION',
    title: '100% Authentic Supplements & Gear Desk',
    description:
      'Skip counterfeit online supplements. Pick up lab-authentic whey isolate, micronized creatine, padded lifting gloves, belts, and shakers directly from our verified Ashkona store.',
    highlight: 'Zero Counterfeit Risk',
    icon: <ShieldCheck className="w-5 h-5 text-[#C7F464]" />,
  },
];

const HEALTH_BENEFITS = [
  {
    title: 'Metabolic Longevity & Fat Oxidation',
    detail:
      'Combining progressive resistance with zone-2 & HIIT conditioning raises resting metabolic rate, improves insulin sensitivity, and protects lean muscle mass.',
    stat: '+24h Afterburn',
    icon: <Flame className="w-5 h-5 text-[#C7F464]" />,
  },
  {
    title: 'Postural Strength & Joint Resilience',
    detail:
      'Targeted upper-back, posterior-chain, and core bracing work reverses desk posture, strengthens tendons, and builds durable lower-back stability.',
    stat: 'Injury-Proof Mechanics',
    icon: <Zap className="w-5 h-5 text-[#C7F464]" />,
  },
  {
    title: 'Stress Release & Mental Clarity',
    detail:
      'High-focus training sessions lower chronic cortisol, elevate endorphins and deep sleep quality, and build sharp daily discipline outside the gym.',
    stat: 'Better Deep Sleep',
    icon: <Brain className="w-5 h-5 text-[#C7F464]" />,
  },
  {
    title: 'Accountability That Keeps You Showing Up',
    detail:
      'Automated attendance check-ins, trainer check-ups, and clear milestone tracking eliminate the 3-week drop-off common at unguided gyms.',
    stat: 'Measurable Streaks',
    icon: <Award className="w-5 h-5 text-[#C7F464]" />,
  },
];

const GOAL_TRACKS: Record<
  GoalKey,
  {
    label: string;
    badge: string;
    headline: string;
    summary: string;
    cadence: string;
    focusAreas: string[];
    ctaHref: string;
    ctaLabel: string;
  }
> = {
  strength: {
    label: 'Muscle & Strength',
    badge: 'HYPERTROPHY + POWER',
    headline: 'Build Dense Muscle & Raw Barbell Strength',
    summary:
      'Designed around compound barbell progressions (squat, bench, deadlift, overhead press) paired with high-tension cable and machine hypertrophy finishers.',
    cadence: '4–5 Days / Week • 60–75 Mins',
    focusAreas: [
      'Progressive overload rep & load tracking with coach feedback',
      'Competition squat cages, Olympic bars, and dumbbells up to 50 kg',
      'Isolation chest, lat pulldown, cable crossover & leg press stations',
      'Authentic protein & creatine support from the Icon Store desk',
    ],
    ctaHref: '/programs',
    ctaLabel: 'Browse Strength Programs',
  },
  fatloss: {
    label: 'Fat Loss & Conditioning',
    badge: 'METABOLIC SHRED',
    headline: 'Drop Body Fat Without Losing Lean Tone',
    summary:
      'High-efficiency resistance supersets paired with incline treadmill intervals, assault bike sprints, and sled conditioning to torch calories while preserving muscle.',
    cadence: '4–6 Days / Week • 45–60 Mins',
    focusAreas: [
      'Full-body metabolic circuits minimizing wasted rest between sets',
      'Climate-controlled cardio deck with incline treadmills & ergometers',
      'Practical sustainable nutrition guidance tailored to Bangladeshi meals',
      'Bi-weekly waist, weight, and stamina checkpoint reviews',
    ],
    ctaHref: '/programs',
    ctaLabel: 'Explore Fat-Loss Blueprints',
  },
  beginner: {
    label: 'Beginners & Form',
    badge: 'FIRST-TIME FRIENDLY',
    headline: 'Start Confidently — Zero Gym Intimidation',
    summary:
      'Never touched a barbell before? Our floor coaches walk you through machine pin settings, breathing, posture, and safe lifting mechanics from Day 1.',
    cadence: '3–4 Days / Week • 45–55 Mins',
    focusAreas: [
      'Day-1 machine orientation & mobility baseline assessment',
      'Guided machine pathways before transitioning to free weights',
      'Step-by-step exercise demos assigned inside your Member Portal',
      'Supportive, ego-free training culture welcoming all fitness levels',
    ],
    ctaHref: '/trainers',
    ctaLabel: 'Meet Our Coaches',
  },
  ladies: {
    label: 'Ladies Wellness',
    badge: '1:00 PM – 3:30 PM EXCLUSIVE',
    headline: 'Total Privacy, Glute-Core Toning & Empowerment',
    summary:
      'Enjoy a serene, completely private ladies-only training floor every afternoon (Sat–Thu) guided by certified female trainers focused on strength, stamina, and toning.',
    cadence: 'Daily Private Slot • Sat–Thu 1:00 PM – 3:30 PM',
    focusAreas: [
      'Strict Face ID access control blocking male entry during ladies hours',
      'Certified Female Trainers dedicated to posture, core & lower-body toning',
      'Safe, welcoming environment for modest and comfortable workouts',
      'Also full access to general floor hours whenever you prefer',
    ],
    ctaHref: '/schedule',
    ctaLabel: 'View Ladies-Only Schedule',
  },
};

const COMPARISON_ROWS = [
  {
    feature: 'Entrance & Attendance Security',
    typical: 'Paper register or manual card check',
    iconGym: 'Touchless Face ID turnstile + live digital log',
  },
  {
    feature: 'Dedicated Ladies-Only Window',
    typical: 'Mixed floor all day or cramped corner room',
    iconGym: 'Full private floor (1:00–3:30 PM) + Female Coaches',
  },
  {
    feature: 'Workout Guidance & Tracking',
    typical: 'Generic chart pasted on a wall',
    iconGym: 'Personal Member Portal with assigned routines & bookings',
  },
  {
    feature: 'Equipment Smoothness & Maintenance',
    typical: 'Frayed cables & mismatched loose plates',
    iconGym: 'Calibrated commercial fleet inspected & cleaned daily',
  },
  {
    feature: 'Billing & Official Receipts',
    typical: 'Handwritten slip with no digital record',
    iconGym: 'Instant official receipt PDF + promo discount support',
  },
  {
    feature: 'Supplements & Training Gear',
    typical: 'Unverified third-party sellers',
    iconGym: 'Authentic gym-desk store with official cash memo slip',
  },
];

const JOURNEY_STEPS = [
  {
    step: 'DAY 01',
    title: 'Enroll Online & Face Check-In',
    text: 'Pick your plan in 60 seconds, enroll your Face ID once, and walk through the smart gate with zero waiting.',
  },
  {
    step: 'WEEK 01',
    title: 'Form Check & Program Sync',
    text: 'Get matched with an appropriate training split, learn machine ergonomics, and establish safe working weights.',
  },
  {
    step: 'DAY 30',
    title: 'Strength & Stamina Surge',
    text: 'Notice cleaner energy, deeper sleep, tighter waist measurements, and noticeable confidence on compound lifts.',
  },
  {
    step: 'DAY 90+',
    title: 'Visible Transformation & Habit Lock',
    text: 'Sustainable lean muscle, stronger posture, and a training routine that stays effortless for life.',
  },
];

export default function WhyIconPage() {
  const [selectedGoal, setSelectedGoal] = useState<GoalKey>('strength');
  const [settings, setSettings] = useState<GymSettings | null>(null);
  const activeGoal = GOAL_TRACKS[selectedGoal];

  useEffect(() => {
    apiFetch<GymSettings>('/settings/public')
      .then((res) => {
        if (res) setSettings(res);
      })
      .catch(() => undefined);
  }, []);

  const cms = resolveWebsiteConfig(settings);
  const whyCms = cms.whyIconPage;

  return (
    <div className="bg-[#090909] text-white">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-[#262626]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[780px] h-[360px] rounded-full bg-[#C7F464]/10 blur-[120px]"
        />

        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141414] border border-[#2C2C2C] text-[11px] font-mono uppercase tracking-[0.2em] text-[#C7F464]">
                <Sparkles className="w-3.5 h-3.5" />
                {whyCms?.heroBadge || 'Why Exercise at Icon Fitness Gym'}
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl uppercase tracking-wide leading-[0.95] text-white">
                {whyCms?.heroTitleLine1 || 'Built For Results.'}{' '}
                <span className="text-[#C7F464]">
                  {whyCms?.heroTitleAccent || 'Engineered For Consistency.'}
                </span>
              </h1>

              <p className="text-sm sm:text-base text-[#A1A1AA] max-w-2xl leading-relaxed">
                {whyCms?.heroSubtitle ||
                  'Great transformations don’t come from crowded floors or guesswork. At Icon Fitness Gym (Ashkona, Dhaka), calibrated commercial iron, structured coaching, exclusive ladies-only hours, and smart biometric access come together so every workout counts.'}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href="/register">
                  <Button
                    variant="primary"
                    size="lg"
                    className="ifg-btn-primary rounded-xl"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Start Your Membership
                  </Button>
                </Link>
                <Link href="/membership">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="rounded-xl"
                    rightIcon={<ArrowUpRight className="w-4 h-4 text-[#C7F464]" />}
                  >
                    Compare Plans
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Metrics Bento Card */}
            <div className="lg:col-span-5">
              <Card className="p-5 sm:p-6 rounded-3xl border border-[#2C2C2C] bg-[#141414] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#C7F464]">
                    Icon Floor Standard
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Open 7 Days
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-[#202020] border border-[#303030]">
                    <p className="font-display text-3xl text-[#C7F464]">45+</p>
                    <p className="text-xs font-bold text-white mt-1">Pro Stations</p>
                    <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                      Free weights, cables &amp; cardio
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#202020] border border-[#303030]">
                    <p className="font-display text-3xl text-white">&lt; 0.8s</p>
                    <p className="text-xs font-bold text-white mt-1">Face ID Gate</p>
                    <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                      Touchless biometric entry
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#202020] border border-[#303030]">
                    <p className="font-display text-3xl text-pink-400">2 HRS</p>
                    <p className="text-xs font-bold text-white mt-1">Ladies Exclusive</p>
                    <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                      Daily 1:00 PM – 3:30 PM
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#202020] border border-[#303030]">
                    <p className="font-display text-3xl text-white">50 KG</p>
                    <p className="text-xs font-bold text-white mt-1">Max Dumbbell</p>
                    <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                      Full 2.5 kg progression pairs
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 6 CORE REASONS GRID */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-16 space-y-8">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
            The Icon Advantage
          </p>
          <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            6 Reasons Members Stay Stronger Here
          </h2>
          <p className="text-sm text-[#A1A1AA]">
            Every zone, schedule window, and digital workflow in our Ashkona club is built to remove friction between you and your best workout.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {WHY_PILLARS.map((pillar) => (
            <Card
              key={pillar.code}
              className="p-6 rounded-3xl border border-[#2C2C2C] bg-[#141414] flex flex-col justify-between gap-5 hover:border-[#C7F464] transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#A1A1AA]">
                    {pillar.code}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-[#202020] border border-[#303030] flex items-center justify-center">
                    {pillar.icon}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white leading-snug">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  {pillar.description}
                </p>
              </div>
              <div className="pt-3 border-t border-[#262626]">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#C7F464]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {pillar.highlight}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* INTERACTIVE GOAL EXPLORER */}
      <section className="border-y border-[#262626] bg-[#0D0D0D]">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-16 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
                Personalized Training Paths
              </p>
              <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
                Select Your Goal — See How We Train You
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(GOAL_TRACKS) as GoalKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedGoal(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border transition-all ${
                    selectedGoal === key
                      ? 'bg-[#C7F464] text-[#090909] border-[#C7F464]'
                      : 'bg-[#141414] text-[#A1A1AA] border-[#2C2C2C] hover:text-white hover:border-[#C7F464]'
                  }`}
                >
                  {GOAL_TRACKS[key].label}
                </button>
              ))}
            </div>
          </div>

          <Card className="p-6 sm:p-8 rounded-3xl border border-[#2C2C2C] bg-[#141414]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-[#1B2210] border border-[#C7F464]/35 text-[10px] font-mono font-bold uppercase tracking-widest text-[#C7F464]">
                  {activeGoal.badge}
                </span>
                <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-white">
                  {activeGoal.headline}
                </h3>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">
                  {activeGoal.summary}
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-mono text-white bg-[#202020] border border-[#303030] px-3.5 py-2 rounded-xl">
                  <Clock className="w-4 h-4 text-[#C7F464]" />
                  <span>Recommended Cadence: {activeGoal.cadence}</span>
                </div>
                <div className="pt-2">
                  <Link href={activeGoal.ctaHref}>
                    <Button
                      variant="primary"
                      className="ifg-btn-primary rounded-xl"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      {activeGoal.ctaLabel}
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-3">
                <p className="text-xs font-mono uppercase tracking-widest text-[#A1A1AA]">
                  Included Icon Support For This Goal
                </p>
                <div className="space-y-2.5">
                  {activeGoal.focusAreas.map((item) => (
                    <div
                      key={item}
                      className="p-3.5 rounded-2xl bg-[#202020] border border-[#303030] flex items-start gap-3"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#C7F464] shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-white/90">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* SCIENCE BENEFITS & GYM COMPARISON */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-16 space-y-12">
        <div className="space-y-6">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
              Health &amp; Longevity Impact
            </p>
            <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
              What Consistent Training Unlocks For You
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HEALTH_BENEFITS.map((b) => (
              <Card
                key={b.title}
                className="p-5 rounded-3xl border border-[#2C2C2C] bg-[#141414] flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#1B2210] flex items-center justify-center">
                    {b.icon}
                  </div>
                  <h3 className="text-sm font-bold text-white">{b.title}</h3>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    {b.detail}
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold text-[#C7F464] pt-2 border-t border-[#262626]">
                  {b.stat}
                </span>
              </Card>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="space-y-5">
          <div className="max-w-2xl space-y-1.5">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
              Side-By-Side Standard
            </p>
            <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-white">
              Typical Local Gym vs. Icon Fitness Gym
            </h2>
          </div>

          <div className="rounded-3xl border border-[#2C2C2C] bg-[#141414] overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#262626] bg-[#171717] text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA]">
                  <th className="py-3.5 px-5">Training Standard</th>
                  <th className="py-3.5 px-5">Typical Gym</th>
                  <th className="py-3.5 px-5 text-[#C7F464]">Icon Fitness Gym</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C2C2C]">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="hover:bg-[#171717]/60">
                    <td className="py-3.5 px-5 font-semibold text-white">
                      {row.feature}
                    </td>
                    <td className="py-3.5 px-5 text-[#A1A1AA]">
                      <span className="inline-flex items-start gap-2">
                        <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{row.typical}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-white font-medium">
                      <span className="inline-flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#C7F464] shrink-0 mt-0.5" />
                        <span>{row.iconGym}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 90-Day Roadmap */}
        <div className="space-y-5">
          <div className="max-w-2xl space-y-1.5">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
              Your First 90 Days
            </p>
            <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-white">
              From First Check-In To Visible Results
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {JOURNEY_STEPS.map((step) => (
              <div
                key={step.step}
                className="p-5 rounded-3xl bg-[#141414] border border-[#2C2C2C] space-y-2.5"
              >
                <span className="inline-block px-2.5 py-0.5 rounded-lg bg-[#1B2210] text-[#C7F464] font-mono text-[11px] font-bold">
                  {step.step}
                </span>
                <h3 className="text-sm font-bold text-white">{step.title}</h3>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Final Conversion CTA Banner */}
        <Card className="p-7 sm:p-10 rounded-3xl border border-[#303030] bg-[#141414] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#C7F464]">
              Ready To Train At Ashkona&apos;s Premier Gym?
            </span>
            <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
              Experience Icon Fitness Gym In Person
            </h2>
            <p className="text-sm text-[#A1A1AA]">
              Enroll online in under a minute, or book a walk-in floor tour with our reception &amp; coaching team at Ashkona, Dakshinkhan, Dhaka-1230.
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
                Join Online Now
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="secondary" size="lg" className="rounded-xl">
                Book Floor Tour
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}

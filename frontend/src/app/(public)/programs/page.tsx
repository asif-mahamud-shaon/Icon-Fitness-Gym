'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Dumbbell,
  Flame,
  Clock,
  Calendar,
  CheckCircle2,
  Layers,
  Target,
  Sparkles,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { WorkoutProgram } from '@/types';
import {
  ENRICHED_PROGRAM_META,
  mergeWithSignaturePrograms,
} from '@/lib/programs-catalog';
import { Card, Button, StatusBadge, Skeleton } from '@/components/ui';

const GOAL_FILTERS: Array<{ label: string; value: string }> = [
  { label: 'All Blueprints', value: 'ALL' },
  { label: 'Muscle Building', value: 'MUSCLE_BUILDING' },
  { label: 'Weight Loss & HIIT', value: 'WEIGHT_LOSS' },
  { label: 'Strength & Power', value: 'STRENGTH_TRAINING' },
  { label: 'Ladies & Toning', value: 'FITNESS_IMPROVEMENT' },
  { label: 'Beginner Foundation', value: 'BEGINNER' },
  { label: '1-on-1 Custom', value: 'CUSTOM' },
];

const PERIODIZATION_PHASES = [
  {
    phase: 'PHASE 01',
    title: 'Biomechanics & Mobility Screening',
    desc: 'Every member begins with a movement screen at our Ashkona floor to calibrate machine heights, squat depth, and joint alignment.',
  },
  {
    phase: 'PHASE 02',
    title: 'Portal Blueprint Assignment',
    desc: 'Your coach assigns a structured 4-to-12 week program directly into your Member Portal with exact sets, reps, tempo, and rest timers.',
  },
  {
    phase: 'PHASE 03',
    title: 'Progressive Overload Tracking',
    desc: 'Each week systematically increases working load, rep density, or time-under-tension across free weights, cables, and conditioning stations.',
  },
  {
    phase: 'PHASE 04',
    title: 'Deload & Body Composition Review',
    desc: 'Every 4th week includes a structured recovery deload and coach progress check to transition into your next training block.',
  },
];

export default function ProgramsPage() {
  const [apiPrograms, setApiPrograms] = useState<WorkoutProgram[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<WorkoutProgram[]>('/workouts/public')
      .then(setApiPrograms)
      .catch(() => [])
      .finally(() => setLoading(false));
  }, []);

  const displayedPrograms = mergeWithSignaturePrograms(
    apiPrograms,
    selectedGoal,
  );

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16 space-y-20">
      {/* ====================================================================
          1. CINEMATIC HERO BANNER
          ==================================================================== */}
      <div className="dark-media-card relative rounded-3xl overflow-hidden border border-[#2C2C2C] bg-[#090909] shadow-2xl">
        <div className="relative min-h-[400px] sm:min-h-[440px] flex flex-col justify-between p-6 sm:p-10 lg:p-14">
          <img
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=85"
            alt="Icon Fitness Gym Structured Workout Programs"
            className="absolute inset-0 w-full h-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/45" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/80 border border-white/15">
              <Dumbbell className="w-4 h-4 text-[#C7F464]" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#C7F464]">
                PERIODIZED TRAINING SYSTEMS • ASHKONA, DHAKA
              </span>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-black/75 border border-white/15 text-[11px] font-mono uppercase text-white">
              6 SIGNATURE BLUEPRINTS • PORTAL TRACKED
            </span>
          </div>

          <div className="relative z-10 max-w-3xl space-y-4 my-8">
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl uppercase tracking-wide text-white leading-[0.94]">
              ENGINEERED{' '}
              <span className="text-[#C7F464]">WORKOUT BLUEPRINTS</span> FOR
              EVERY GOAL.
            </h1>
            <p className="text-sm sm:text-lg text-zinc-200 leading-relaxed max-w-2xl">
              Stop guessing on the gym floor. Follow our coach-architected
              hypertrophy, fat-loss, powerlifting, and ladies-toning programs
              with full exercise prescriptions, sets, reps, and rest intervals
              synced to your Member Portal.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-white/15">
            {[
              {
                label: 'CYCLE DURATION',
                value: '4 – 12 Weeks',
                sub: 'Progressive Periodized Blocks',
              },
              {
                label: 'WEEKLY FREQUENCY',
                value: '3 – 5 Days / Wk',
                sub: 'Structured Recovery Built-In',
              },
              {
                label: 'PORTAL INTEGRATION',
                value: 'Sets • Reps • Tempo',
                sub: 'Assigned to Your Account',
              },
              {
                label: 'COACHING SUPPORT',
                value: 'Male & Female Coaches',
                sub: 'General & Ladies-Only Slots',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="p-3.5 rounded-2xl bg-black/65 border border-white/10"
              >
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#C7F464]">
                  {item.label}
                </p>
                <p className="font-display text-2xl uppercase tracking-wide text-white mt-0.5">
                  {item.value}
                </p>
                <p className="text-[11px] text-zinc-300 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ====================================================================
          2. 4-PHASE PERIODIZATION METHODOLOGY
          ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {PERIODIZATION_PHASES.map((item) => (
          <Card
            key={item.phase}
            className="p-6 rounded-3xl space-y-3 border border-[#2C2C2C] hover:border-[#C7F464]/70 transition-all"
          >
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#C7F464]/15 border border-[#C7F464]/30 text-[10px] font-mono font-bold uppercase tracking-wider text-[#C7F464]">
              {item.phase}
            </span>
            <h2 className="font-display text-2xl uppercase tracking-wide text-white">
              {item.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
              {item.desc}
            </p>
          </Card>
        ))}
      </div>

      {/* ====================================================================
          3. GOAL FILTER PILL BAR & SIGNATURE BLUEPRINT GRID
          ==================================================================== */}
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
              SELECT TRAINING OBJECTIVE
            </p>
            <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-wide text-white mt-1">
              SIGNATURE WORKOUT PROGRAMS
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {GOAL_FILTERS.map((f) => {
              const active = selectedGoal === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setSelectedGoal(f.value)}
                  className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider border transition-all ${
                    active
                      ? 'bg-[#C7F464] !text-[#090909] border-[#C7F464] font-bold shadow-sm'
                      : 'bg-[#141414] text-[#A1A1AA] border-[#2C2C2C] hover:border-[#C7F464] hover:text-[#C7F464]'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[460px] rounded-3xl" />
            <Skeleton className="h-[460px] rounded-3xl" />
            <Skeleton className="h-[460px] rounded-3xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {displayedPrograms.map((program) => {
              const meta = ENRICHED_PROGRAM_META[program.slug] || {
                splitType: `${program.daysPerWeek}-Day Structured Split`,
                sessionMinutes: '50 – 65 Mins',
                caloriesPerSession: '400 – 550 kcal',
                equipmentFocus: [
                  'Commercial Free Weights',
                  'Selectorized Machines',
                  'Conditioning Turf',
                ],
                weeklyStructure: [
                  'Day 1: Primary Compound Progression',
                  'Day 2: Accessory Hypertrophy & Core',
                  'Day 3: Metabolic Conditioning & Mobility',
                ],
                targetAudience:
                  'Structured for measurable strength and body recomposition.',
              };

              return (
                <Card
                  key={program.slug}
                  className="p-0 rounded-3xl overflow-hidden flex flex-col justify-between border border-[#2C2C2C] hover:border-[#C7F464]/70 transition-all duration-300 hover:-translate-y-1.5 shadow-lg"
                >
                  <div>
                    {/* Visual Media Cover */}
                    <Link
                      href={`/programs/${program.slug}`}
                      className="dark-media-card group relative h-56 bg-[#090909] block overflow-hidden"
                    >
                      <img
                        src={
                          program.coverImageUrl ||
                          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80'
                        }
                        alt={program.title}
                        loading="lazy"
                        className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-5 flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <StatusBadge status={program.goal} />
                            <StatusBadge status={program.difficulty} />
                          </div>
                          <span className="w-9 h-9 rounded-full bg-black/75 border border-white/20 text-white group-hover:bg-[#C7F464] group-hover:text-[#090909] flex items-center justify-center transition-colors">
                            <ArrowUpRight className="w-4 h-4" />
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] font-mono uppercase tracking-wider text-[#C7F464]">
                            ● {meta.splitType}
                          </span>
                          <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-white group-hover:text-[#C7F464] transition-colors leading-tight mt-0.5">
                            {program.title}
                          </h3>
                        </div>
                      </div>
                    </Link>

                    {/* Body Details */}
                    <div className="p-6 space-y-5">
                      <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                        {program.description}
                      </p>

                      {/* 3 Key Metrics Strip */}
                      <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#090909] border border-[#262626] text-center">
                        <div>
                          <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                            Cycle
                          </p>
                          <p className="text-xs font-mono font-bold text-white mt-0.5">
                            {program.durationWeeks} Weeks
                          </p>
                        </div>
                        <div className="border-x border-[#262626]">
                          <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                            Frequency
                          </p>
                          <p className="text-xs font-mono font-bold text-[#C7F464] mt-0.5">
                            {program.daysPerWeek} Days/Wk
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                            Session
                          </p>
                          <p className="text-xs font-mono font-bold text-white mt-0.5">
                            {meta.sessionMinutes}
                          </p>
                        </div>
                      </div>

                      {/* Weekly Split Preview */}
                      <div className="space-y-2">
                        <p className="text-[11px] font-mono uppercase tracking-wider text-[#C7F464]">
                          Weekly Split Architecture
                        </p>
                        <ul className="space-y-1.5 text-xs text-[#A1A1AA]">
                          {meta.weeklyStructure.slice(0, 3).map((dayLine) => (
                            <li
                              key={dayLine}
                              className="flex items-start gap-2"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#C7F464] shrink-0 mt-0.5" />
                              <span className="text-white/90">{dayLine}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 pb-6 pt-3 border-t border-[#262626] flex items-center justify-between gap-3">
                    <Link
                      href={`/programs/${program.slug}`}
                      className="w-full block"
                    >
                      <Button
                        variant="primary"
                        className="w-full rounded-xl"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        Inspect Full Blueprint &amp; Sets
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ====================================================================
          4. PROGRAM SELECTION & GOAL MATRIX
          ==================================================================== */}
      <Card className="p-0 rounded-3xl overflow-hidden border border-[#2C2C2C]">
        <div className="p-6 sm:p-8 border-b border-[#2C2C2C] bg-[#141414] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
              TRAINING PRESCRIPTION GUIDE
            </p>
            <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-white mt-1">
              WHICH WORKOUT BLUEPRINT FITS YOUR GOAL?
            </h3>
          </div>
          <Link href="/register">
            <Button
              variant="primary"
              size="sm"
              className="rounded-xl"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Get Assigned in Portal
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#2C2C2C] bg-[#141414]/60 font-mono text-[11px] uppercase text-[#A1A1AA]">
                <th className="py-4 px-6">Blueprint Name</th>
                <th className="py-4 px-6">Primary Objective</th>
                <th className="py-4 px-6">Split &amp; Frequency</th>
                <th className="py-4 px-6">Avg. Burn / Session</th>
                <th className="py-4 px-6">Primary Gym Zones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {mergeWithSignaturePrograms(apiPrograms, 'ALL').map((prog) => {
                const meta = ENRICHED_PROGRAM_META[prog.slug];
                return (
                  <tr key={prog.slug} className="hover:bg-[#141414]/50">
                    <td className="py-4 px-6 font-bold text-white">
                      <Link
                        href={`/programs/${prog.slug}`}
                        className="hover:text-[#C7F464] transition-colors"
                      >
                        {prog.title}
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={prog.goal} />
                    </td>
                    <td className="py-4 px-6 font-mono text-white">
                      {prog.daysPerWeek} Days/Wk ({prog.durationWeeks} Wks)
                    </td>
                    <td className="py-4 px-6 font-mono text-[#C7F464]">
                      {meta?.caloriesPerSession || '400 – 580 kcal'}
                    </td>
                    <td className="py-4 px-6 text-[#A1A1AA]">
                      {meta?.equipmentFocus?.slice(0, 2).join(' • ') ||
                        'Strength & Cardio Zones'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Dumbbell,
  CheckCircle2,
  Clock,
  Flame,
  Calendar,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { WorkoutProgram } from '@/types';
import {
  ENRICHED_PROGRAM_META,
  resolveProgramBySlug,
} from '@/lib/programs-catalog';
import {
  Card,
  Button,
  StatusBadge,
  Skeleton,
  ErrorState,
} from '@/components/ui';

export default function ProgramDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || '';
  const [apiProgram, setApiProgram] = useState<WorkoutProgram | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    apiFetch<WorkoutProgram>(`/workouts/public/${slug}`)
      .then(setApiProgram)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [slug]);

  const program = resolveProgramBySlug(slug, apiProgram);

  if (loading && !program) {
    return (
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-16 space-y-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-16">
        <ErrorState
          title="Workout Program Not Found"
          message="Unable to load the requested workout program blueprint."
        />
      </div>
    );
  }

  const meta = ENRICHED_PROGRAM_META[program.slug] || {
    splitType: `${program.daysPerWeek}-Day Structured Split`,
    sessionMinutes: '50 – 65 Mins',
    caloriesPerSession: '400 – 560 kcal',
    equipmentFocus: [
      'Olympic Barbells & Power Racks',
      'Commercial Dumbbells',
      'Selectorized Strength Fleet',
    ],
    weeklyStructure: [
      'Day 1: Primary Compound Progression',
      'Day 2: Accessory Hypertrophy & Core',
      'Day 3: Metabolic Conditioning & Mobility',
    ],
    targetAudience:
      'Designed for progressive strength and body recomposition at Icon Fitness Gym Ashkona.',
  };

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16 space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/programs"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#A1A1AA] hover:text-[#C7F464] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Workout Programs</span>
        </Link>

        <span className="px-3.5 py-1 rounded-full bg-[#141414] border border-[#2C2C2C] text-[11px] font-mono uppercase text-[#C7F464]">
          ● PORTAL-ASSIGNABLE TRAINING BLUEPRINT
        </span>
      </div>

      {/* Hero Banner */}
      <div className="dark-media-card relative rounded-3xl overflow-hidden border border-[#2C2C2C] bg-[#090909] shadow-2xl">
        <div className="relative min-h-[340px] sm:min-h-[400px] p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
          <img
            src={
              program.coverImageUrl ||
              'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=85'
            }
            alt={program.title}
            className="absolute inset-0 w-full h-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/50" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={program.goal} />
              <StatusBadge status={program.difficulty} />
              <span className="px-3 py-1 rounded-full bg-black/75 border border-white/15 text-xs font-mono text-[#C7F464]">
                {meta.splitType}
              </span>
            </div>
            <span className="text-xs font-mono text-zinc-300">
              Designed by{' '}
              <strong className="text-white">
                {program.createdByTrainer?.user?.fullName ||
                  'Icon Fitness Coaching Roster'}
              </strong>
            </span>
          </div>

          <div className="relative z-10 max-w-3xl space-y-4 my-6">
            <h1 className="font-display text-4xl sm:text-6xl uppercase tracking-wide text-white leading-[0.95]">
              {program.title}
            </h1>
            <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">
              {program.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/register">
                <Button
                  variant="primary"
                  size="md"
                  className="rounded-xl"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Join Gym to Assign This Blueprint
                </Button>
              </Link>
              <Link href="/schedule">
                <Button variant="secondary" size="md" className="rounded-xl">
                  View Weekly Class Schedule
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-white/15">
            <div className="p-3.5 rounded-2xl bg-black/65 border border-white/10">
              <p className="text-[10px] font-mono uppercase text-[#C7F464]">
                DURATION
              </p>
              <p className="font-display text-2xl uppercase text-white mt-0.5">
                {program.durationWeeks} Weeks
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/65 border border-white/10">
              <p className="text-[10px] font-mono uppercase text-[#C7F464]">
                WEEKLY CADENCE
              </p>
              <p className="font-display text-2xl uppercase text-white mt-0.5">
                {program.daysPerWeek} Days / Week
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/65 border border-white/10">
              <p className="text-[10px] font-mono uppercase text-[#C7F464]">
                SESSION LENGTH
              </p>
              <p className="font-display text-2xl uppercase text-white mt-0.5">
                {meta.sessionMinutes}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/65 border border-white/10">
              <p className="text-[10px] font-mono uppercase text-[#C7F464]">
                EST. CALORIC OUTPUT
              </p>
              <p className="font-display text-2xl uppercase text-white mt-0.5">
                {meta.caloriesPerSession}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Split & Equipment Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7 p-6 sm:p-8 rounded-3xl space-y-5">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
              WEEKLY PERIODIZATION SPLIT
            </p>
            <h2 className="font-display text-3xl uppercase tracking-wide text-white mt-1">
              TRAINING SCHEDULE BREAKDOWN
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {meta.weeklyStructure.map((dayLine) => (
              <div
                key={dayLine}
                className="p-4 rounded-2xl bg-[#090909] border border-[#262626] flex items-start gap-3"
              >
                <CheckCircle2 className="w-4 h-4 text-[#C7F464] shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm font-medium text-white leading-snug">
                  {dayLine}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed pt-2 border-t border-[#262626]">
            <strong className="text-white">Ideal Candidate:</strong>{' '}
            {meta.targetAudience}
          </p>
        </Card>

        <Card className="lg:col-span-5 p-6 sm:p-8 rounded-3xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
                REQUIRED GYM ZONES
              </p>
              <h2 className="font-display text-3xl uppercase tracking-wide text-white mt-1">
                EQUIPMENT FOCUS
              </h2>
            </div>

            <div className="space-y-2.5">
              {meta.equipmentFocus.map((eq) => (
                <div
                  key={eq}
                  className="p-3.5 rounded-2xl bg-[#090909] border border-[#262626] flex items-center gap-3"
                >
                  <Dumbbell className="w-4 h-4 text-[#C7F464] shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    {eq}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#262626]">
            <Link href="/facilities" className="block">
              <Button variant="secondary" className="w-full rounded-xl">
                Explore Training Zones &amp; Equipment
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Exercise Prescription List */}
      <div className="space-y-5">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
            SETS • REPS • REST • TEMPO
          </p>
          <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white mt-1">
            STRUCTURED EXERCISE PRESCRIPTION
          </h2>
        </div>

        {!program.exercises || program.exercises.length === 0 ? (
          <Card className="p-6 rounded-3xl text-sm text-[#A1A1AA]">
            Exercise sequence is customized per member upon assignment in the
            Trainer Portal.
          </Card>
        ) : (
          <div className="space-y-4">
            {program.exercises.map((item) => (
              <Card
                key={item.id}
                className="p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[#2C2C2C] hover:border-[#C7F464]/60 transition-all"
              >
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-3 py-1 rounded-full bg-[#C7F464] !text-[#090909] font-mono text-xs font-bold">
                      Day {item.dayNumber} • Exercise #{item.orderIndex}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#141414] border border-[#303030] text-xs font-mono text-[#C7F464]">
                      {item.exercise.targetMuscleGroup}
                    </span>
                    {item.exercise.equipmentRequired && (
                      <span className="text-xs font-mono text-[#A1A1AA]">
                        • {item.exercise.equipmentRequired}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {item.exercise.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                    {item.exercise.instructions}
                  </p>
                  {item.notes && (
                    <p className="text-xs font-mono text-[#C7F464]">
                      Coach Execution Cue: {item.notes}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 shrink-0 bg-[#090909] border border-[#262626] rounded-2xl p-4 text-center min-w-[230px]">
                  <div>
                    <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                      Sets
                    </p>
                    <p className="text-xl font-mono font-bold text-white mt-0.5">
                      {item.sets}
                    </p>
                  </div>
                  <div className="border-x border-[#262626] px-2">
                    <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                      Reps
                    </p>
                    <p className="text-xl font-mono font-bold text-[#C7F464] mt-0.5">
                      {item.reps}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                      Rest
                    </p>
                    <p className="text-xl font-mono font-bold text-white mt-0.5">
                      {item.restSeconds}s
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  Dumbbell,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { TrainerProfile } from '@/types';
import {
  Card,
  Button,
  Skeleton,
  ErrorState,
  StatusBadge,
} from '@/components/ui';

export default function TrainerDetailPage() {
  const params = useParams<{ slug: string }>();
  const [trainer, setTrainer] = useState<TrainerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params?.slug) return;
    apiFetch<TrainerProfile>(`/trainers/public/${params.slug}`)
      .then(setTrainer)
      .catch((err) => setError(err.message || 'Trainer not found'))
      .finally(() => setLoading(false));
  }, [params?.slug]);

  if (loading) {
    return (
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-16 space-y-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !trainer) {
    return (
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-16">
        <ErrorState
          title="Trainer Profile Not Found"
          message={error || 'The requested trainer profile could not be loaded.'}
        />
      </div>
    );
  }

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-16 space-y-12">
      <Link
        href="/trainers"
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#C7F464] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to All Trainers
      </Link>

      <Card className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div>
          <img
            src={
              trainer.user.avatarUrl ||
              'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=800&q=80'
            }
            alt={trainer.user.fullName}
            className="w-full h-80 object-cover rounded-xl border border-[#303030]"
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-[#C7F464]">
              <Award className="w-4 h-4" />
              {trainer.experienceYears}+ Years Coaching Experience
            </span>
            <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-wide text-white mt-2">
              {trainer.user.fullName}
            </h1>
            <p className="text-base text-[#A1A1AA] mt-1">{trainer.headline}</p>
          </div>

          <p className="text-sm text-[#A1A1AA] leading-relaxed">
            {trainer.bio}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#303030]">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#C7F464] mb-3">
                Specializations
              </h3>
              <ul className="space-y-2 text-sm text-white">
                {trainer.specializations.map((s) => (
                  <li key={s} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C7F464] shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#C7F464] mb-3">
                Qualifications &amp; Credentials
              </h3>
              <ul className="space-y-2 text-sm text-white">
                {trainer.qualifications.map((q) => (
                  <li key={q} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C7F464] shrink-0" />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {trainer.availabilityJson && (
            <div className="p-4 rounded-xl bg-[#171717] border border-[#303030] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-mono uppercase text-[#C7F464]">
                  Floor &amp; Coaching Availability
                </p>
                <p className="text-sm text-white">
                  {trainer.availabilityJson.days?.join(', ') || 'Sat – Thu'} •{' '}
                  {trainer.availabilityJson.hours || '07:00 AM – 11:00 PM'}
                </p>
              </div>
              <Link href="/schedule">
                <Button variant="primary" size="sm">
                  Book Class Session
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Card>

      {/* Scheduled Classes Taught by Trainer */}
      {trainer.classSchedules && trainer.classSchedules.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-3xl uppercase tracking-wide text-white">
            WEEKLY CLASSES INSTRUCTED BY {trainer.user.fullName}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trainer.classSchedules.map((sch) => (
              <Card key={sch.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <StatusBadge status={sch.dayOfWeek} />
                  <span className="text-xs font-mono text-[#C7F464]">
                    {sch.startTime} – {sch.endTime}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {sch.gymClass?.title}
                </h3>
                <p className="text-xs text-[#A1A1AA]">
                  Zone: {sch.roomOrZone} • Capacity: {sch.bookedCount}/
                  {sch.capacity}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


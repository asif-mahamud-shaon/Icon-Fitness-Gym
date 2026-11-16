'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, Clock, ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { TrainerProfile } from '@/types';
import { Card, Button, Skeleton, EmptyState } from '@/components/ui';

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<TrainerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<TrainerProfile[]>('/trainers/public')
      .then(setTrainers)
      .catch(() => [])
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-16 space-y-12">
      <div className="max-w-3xl space-y-4">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
          COACHING &amp; INSTRUCTION
        </p>
        <h1 className="font-display text-5xl sm:text-6xl uppercase tracking-wide text-white">
          STRENGTH &amp; CONDITIONING COACHES
        </h1>
        <p className="text-base text-[#A1A1AA] leading-relaxed">
          Explore our certified coaching roster, specializations, professional
          qualifications, and daily training floor availability.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : trainers.length === 0 ? (
        <EmptyState
          title="No active trainer profiles published"
          description="Our coaching team profiles are currently being updated. Please check back shortly."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {trainers.map((trainer) => (
            <Card
              key={trainer.id}
              className="flex flex-col sm:flex-row gap-6 justify-between"
            >
              <img
                src={
                  trainer.user.avatarUrl ||
                  'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=800&q=80'
                }
                alt={trainer.user.fullName}
                loading="lazy"
                className="w-full sm:w-48 h-60 object-cover rounded-xl border border-[#303030] shrink-0"
              />
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#C7F464]">
                    <Award className="w-3.5 h-3.5" />
                    {trainer.experienceYears}+ Years Coaching Experience
                  </span>
                  <h2 className="text-2xl font-bold text-white">
                    {trainer.user.fullName}
                  </h2>
                  <p className="text-sm text-[#A1A1AA]">{trainer.headline}</p>
                  <p className="text-xs text-[#A1A1AA] line-clamp-3 leading-relaxed">
                    {trainer.bio}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {trainer.specializations.map((spec) => (
                      <span
                        key={spec}
                        className="text-[11px] px-2.5 py-0.5 rounded bg-[#171717] border border-[#303030] text-white"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  {trainer.availabilityJson?.hours && (
                    <p className="flex items-center gap-1.5 text-xs text-[#A1A1AA]">
                      <Clock className="w-3.5 h-3.5 text-[#C7F464]" />
                      <span>
                        Availability: {trainer.availabilityJson.hours}
                      </span>
                    </p>
                  )}

                  <div className="pt-2">
                    <Link href={`/trainers/${trainer.slug}`}>
                      <Button
                        variant="primary"
                        size="sm"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        Full Coach Profile &amp; Classes
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


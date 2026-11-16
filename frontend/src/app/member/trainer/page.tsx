'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, Mail, Phone, MapPin, Dumbbell } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card, Button, Skeleton, EmptyState } from '@/components/ui';

export default function MemberTrainerPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/members/me')
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Skeleton className="h-72" />;
  }

  const trainer = data?.member?.assignedTrainer;
  const initials = (trainer?.user?.fullName || 'TR')
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
          My Assigned Trainer
        </h1>
        <p className="text-xs font-mono text-[#A1A1AA] mt-1">
          Member Portal <span className="mx-1">&gt;</span>{' '}
          <span className="text-white">Assigned Coach Profile</span>
        </p>
      </div>

      {!trainer ? (
        <EmptyState
          title="No Personal Trainer Assigned Yet"
          description="Ask the Ashkona front desk or upgrade to a coaching plan to have a dedicated trainer assigned to your profile."
          action={
            <Link href="/trainers">
              <Button variant="primary" size="sm">
                Explore Gym Trainers
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Profile Card Matching Mockup 1 */}
          <Card className="lg:col-span-4 space-y-6">
            <div className="flex flex-col items-center text-center">
              {trainer.user?.avatarUrl ? (
                <img
                  src={trainer.user.avatarUrl}
                  alt={trainer.user?.fullName}
                  className="w-28 h-28 rounded-full object-cover border-2 border-[#C7F464]"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-[#171717] border-2 border-[#C7F464] flex items-center justify-center font-display text-3xl text-[#C7F464]">
                  {initials}
                </div>
              )}
              <h2 className="text-xl font-bold text-[#C7F464] mt-4">
                {trainer.user?.fullName}
              </h2>
              <p className="text-xs text-[#A1A1AA] mt-0.5">
                {trainer.headline}
              </p>
            </div>

            <div className="grid grid-cols-2 rounded-xl bg-[#171717] border border-[#2C2C2C] divide-x divide-[#2C2C2C] py-3">
              <div className="text-center px-2">
                <p className="text-base font-bold text-white font-mono">
                  {trainer.experienceYears}+ yrs
                </p>
                <p className="text-[11px] text-[#A1A1AA]">Experience</p>
              </div>
              <div className="text-center px-2">
                <p className="text-base font-bold text-white font-mono">
                  {trainer.gender || 'COACH'}
                </p>
                <p className="text-[11px] text-[#A1A1AA]">Division</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-[#2C2C2C] text-xs">
              <h3 className="text-sm font-bold text-white">Direct Contact</h3>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#171717] border border-[#2C2C2C] flex items-center justify-center text-[#C7F464] shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-[#A1A1AA]">Email</p>
                  <p className="text-white font-mono truncate">
                    {trainer.user?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#171717] border border-[#2C2C2C] flex items-center justify-center text-[#C7F464] shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-[#A1A1AA]">Phone</p>
                  <p className="text-white font-mono">{trainer.user?.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#171717] border border-[#2C2C2C] flex items-center justify-center text-[#C7F464] shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-[#A1A1AA]">Floor</p>
                  <p className="text-white">
                    Icon Fitness Gym, Ashkona Main Road, Dhaka
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Right Overview & Specializations */}
          <Card className="lg:col-span-8 space-y-6">
            <div className="space-y-2 border-b border-[#2C2C2C] pb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#C7F464]">
                <Award className="w-4 h-4" />
                Certified Performance Coach
              </span>
              <h3 className="text-xl font-bold text-white">Coaching Bio</h3>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                {trainer.bio}
              </p>
            </div>

            {trainer.specializations?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
                  Specializations
                </h4>
                <div className="flex flex-wrap gap-2">
                  {trainer.specializations.map((spec: string) => (
                    <span
                      key={spec}
                      className="text-xs px-3 py-1 rounded-lg bg-[#171717] border border-[#2C2C2C] text-[#C7F464] font-mono"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <Link href="/member/workouts">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Dumbbell className="w-4 h-4" />}
                >
                  Open Assigned Workout Program
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

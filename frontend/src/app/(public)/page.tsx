import React from 'react';
import { HomeClient, HomeInitialData } from '@/components/home/HomeClient';
import { GymSettings, MembershipPlan, TrainerProfile, WorkoutProgram } from '@/types';

export const dynamic = 'force-dynamic';

const RAW_INTERNAL_API =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:4000/api/v1';

const INTERNAL_API_URL = RAW_INTERNAL_API.replace(
  '://localhost:',
  '://127.0.0.1:',
);

let ssrHomeCache: { data: HomeInitialData; expiresAt: number } | null = null;

async function fetchPublicJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${INTERNAL_API_URL}${path}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(500),
    });
    if (!res.ok) return fallback;
    const json = await res.json();
    if (json && typeof json === 'object' && 'data' in json) {
      return (json.data as T) ?? fallback;
    }
    return (json as T) ?? fallback;
  } catch {
    return fallback;
  }
}

export default async function HomePage() {
  if (ssrHomeCache && ssrHomeCache.expiresAt > Date.now()) {
    return <HomeClient initialData={ssrHomeCache.data} />;
  }

  const [plans, trainers, programs, settings] = await Promise.all([
    fetchPublicJson<MembershipPlan[]>('/membership-plans/public', []),
    fetchPublicJson<TrainerProfile[]>('/trainers/public', []),
    fetchPublicJson<WorkoutProgram[]>('/workouts/public', []),
    fetchPublicJson<GymSettings | null>('/settings/public', null),
  ]);

  const initialData: HomeInitialData = {
    plans: Array.isArray(plans) ? plans : [],
    trainers: Array.isArray(trainers) ? trainers : [],
    programs: Array.isArray(programs) ? programs : [],
    settings,
  };

  if (initialData.plans.length > 0 || initialData.settings) {
    ssrHomeCache = {
      data: initialData,
      expiresAt: Date.now() + 8000,
    };
  }

  return <HomeClient initialData={initialData} />;
}

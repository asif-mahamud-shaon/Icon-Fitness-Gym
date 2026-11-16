'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar as CalendarIcon,
  Dumbbell,
  ArrowUpRight,
  Clock,
  ChevronLeft,
  ChevronRight,
  Award,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiFetch } from '@/lib/api';
import { Card, StatusBadge, Button, Skeleton, EmptyState } from '@/components/ui';

const DAY_ENUM_BY_JS: Record<number, string> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

const DAY_SHORT: Record<string, string> = {
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
};

function parseDurationMins(s: any): number {
  if (s?.gymClass?.durationMins) return Number(s.gymClass.durationMins);
  const [sh, sm] = String(s?.startTime || '0:0').split(':').map(Number);
  const [eh, em] = String(s?.endTime || '1:0').split(':').map(Number);
  const diff = eh * 60 + em - (sh * 60 + sm);
  return diff > 0 ? diff : 60;
}

export default function TrainerDashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    apiFetch('/trainers/me/dashboard')
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const trainer = data?.trainer;
  const assignedMembers: any[] = trainer?.assignedMembers || [];
  const classSchedules: any[] = trainer?.classSchedules || [];

  const activityData = useMemo(() => {
    const today = new Date();
    const out: Array<{ label: string; fullDate: string; hours: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayEnum = DAY_ENUM_BY_JS[d.getDay()];
      const mins = classSchedules
        .filter((s) => s.dayOfWeek === dayEnum)
        .reduce((sum, s) => sum + parseDurationMins(s), 0);
      out.push({
        label: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        fullDate: d.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
        }),
        hours: Number((mins / 60 || 0).toFixed(2)),
      });
    }
    return out;
  }, [classSchedules]);

  const scheduleDaySet = useMemo(() => {
    const set = new Set<string>();
    classSchedules.forEach((s) => set.add(s.dayOfWeek));
    return set;
  }, [classSchedules]);

  const calendarGrid = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();
    const cells: Array<{
      day: number;
      inCurrent: boolean;
      highlighted: boolean;
    }> = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      cells.push({ day: prevDays - i, inCurrent: false, highlighted: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      cells.push({
        day: d,
        inCurrent: true,
        highlighted: scheduleDaySet.has(DAY_ENUM_BY_JS[dt.getDay()]),
      });
    }
    while (cells.length % 7 !== 0 || cells.length < 35) {
      cells.push({
        day: cells.length - (startOffset + daysInMonth) + 1,
        inCurrent: false,
        highlighted: false,
      });
    }
    return cells;
  }, [calendarMonth, scheduleDaySet]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const initials = (trainer?.user?.fullName || 'TR')
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const monthLabel = calendarMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Coach Command Center
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Coach Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Overview</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/trainer/workouts">
            <Button variant="primary" size="sm" leftIcon={<Dumbbell className="w-4 h-4" />}>
              Workout Builder
            </Button>
          </Link>
          <Link href="/trainer/schedule">
            <Button variant="secondary" size="sm" leftIcon={<CalendarIcon className="w-4 h-4" />}>
              Class Attendance
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 12-Col Bento: Profile Summary + Activity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coach Card */}
        <Card className="lg:col-span-4 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Coach Profile</h2>
            <StatusBadge status={trainer?.isActive ? 'ACTIVE' : 'DEACTIVATED'} />
          </div>

          <div className="flex flex-col items-center text-center">
            {trainer?.user?.avatarUrl ? (
              <img
                src={trainer.user.avatarUrl}
                alt={trainer.user.fullName}
                className="w-24 h-24 rounded-full object-cover border-2 border-[#C7F464]"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#171717] border-2 border-[#C7F464] flex items-center justify-center font-display text-2xl text-[#C7F464]">
                {initials}
              </div>
            )}
            <h3 className="text-lg font-bold text-[#C7F464] mt-3">
              {trainer?.user?.fullName || 'Coach'}
            </h3>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              {trainer?.headline || 'Performance & Strength Coach'}
            </p>
          </div>

          <div className="grid grid-cols-3 rounded-xl bg-[#171717] border border-[#2C2C2C] divide-x divide-[#2C2C2C] py-3">
            <div className="text-center px-2">
              <p className="text-base font-bold text-white font-mono">
                {trainer?.experienceYears ?? 0} yrs
              </p>
              <p className="text-[11px] text-[#A1A1AA]">Experience</p>
            </div>
            <div className="text-center px-2">
              <p className="text-base font-bold text-white font-mono">
                {data?.stats?.assignedMembersCount ?? assignedMembers.length}
              </p>
              <p className="text-[11px] text-[#A1A1AA]">Members</p>
            </div>
            <div className="text-center px-2">
              <p className="text-base font-bold text-white font-mono">
                {data?.stats?.scheduledClassesCount ?? classSchedules.length}
              </p>
              <p className="text-[11px] text-[#A1A1AA]">Classes</p>
            </div>
          </div>

          {trainer?.specializations?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {trainer.specializations.map((spec: string) => (
                <span
                  key={spec}
                  className="text-[11px] px-2.5 py-0.5 rounded bg-[#171717] border border-[#2C2C2C] text-[#C7F464] font-mono inline-flex items-center gap-1"
                >
                  <Award className="w-3 h-3" />
                  {spec}
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* Right 8 Cols: Coaching Activity Chart + 3 Quick Metric Tiles */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#A1A1AA]">Assigned Roster</p>
                <p className="text-2xl font-bold text-white font-mono mt-1">
                  {data?.stats?.assignedMembersCount ?? assignedMembers.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#171717] border border-[#2C2C2C] flex items-center justify-center text-[#C7F464]">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#A1A1AA]">Weekly Sessions</p>
                <p className="text-2xl font-bold text-white font-mono mt-1">
                  {data?.stats?.scheduledClassesCount ?? classSchedules.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#171717] border border-[#2C2C2C] flex items-center justify-center text-[#C7F464]">
                <CalendarIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#A1A1AA]">Workouts Authored</p>
                <p className="text-2xl font-bold text-white font-mono mt-1">
                  {data?.stats?.authoredWorkoutsCount ?? 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#171717] border border-[#2C2C2C] flex items-center justify-center text-[#C7F464]">
                <Dumbbell className="w-5 h-5" />
              </div>
            </div>
          </div>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">
                  Coaching Activity (Last 12 Days)
                </h2>
                <p className="text-xs text-[#A1A1AA]">
                  Scheduled class hours across recent calendar days
                </p>
              </div>
              <span className="px-3 py-1 rounded-lg bg-[#C7F464] text-[#090909] text-xs font-bold">
                12 Days
              </span>
            </div>

            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="coachFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C7F464" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#C7F464" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2C" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const pt = payload[0].payload as { fullDate: string; hours: number };
                      return (
                        <div className="rounded-lg bg-[#090909] border border-[#2C2C2C] px-3 py-2 text-xs shadow-lg">
                          <p className="text-[#A1A1AA]">{pt.fullDate}</p>
                          <p className="text-[#C7F464] font-semibold">{pt.hours} Coaching Hrs</p>
                        </div>
                      );
                    }}
                  />
                  <Area type="monotone" dataKey="hours" stroke="#C7F464" strokeWidth={2.5} fill="url(#coachFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Grid: Monthly Calendar + Class Schedule + Assigned Members */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">{monthLabel}</h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous Month"
                onClick={() =>
                  setCalendarMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))
                }
                className="w-7 h-7 rounded-lg bg-[#171717] border border-[#2C2C2C] flex items-center justify-center text-[#A1A1AA] hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Next Month"
                onClick={() =>
                  setCalendarMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))
                }
                className="w-7 h-7 rounded-lg bg-[#171717] border border-[#2C2C2C] flex items-center justify-center text-[#A1A1AA] hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-y-2 text-center">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <span key={`${d}-${i}`} className="text-[11px] font-mono text-[#A1A1AA]">
                {d}
              </span>
            ))}
            {calendarGrid.map((c, idx) => (
              <div key={idx} className="flex items-center justify-center h-8">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono ${
                    c.highlighted
                      ? 'bg-[#C7F464] text-[#090909] font-bold'
                      : c.inCurrent
                        ? 'text-white'
                        : 'text-[#52525B]'
                  }`}
                >
                  {String(c.day).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Class Schedule */}
        <Card className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Weekly Schedule</h2>
            <Link
              href="/trainer/schedule"
              className="text-xs font-mono text-[#C7F464] hover:underline inline-flex items-center gap-1"
            >
              Attendance <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {classSchedules.length === 0 ? (
            <EmptyState
              title="No Assigned Classes"
              description="Classes assigned to you will appear here."
            />
          ) : (
            <div className="divide-y divide-[#2C2C2C] max-h-[260px] overflow-y-auto pr-1">
              {classSchedules.map((s: any) => (
                <div key={s.id} className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono text-[#C7F464]">
                      {DAY_SHORT[s.dayOfWeek] || s.dayOfWeek} • {s.startTime}
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {s.gymClass?.title}
                    </p>
                  </div>
                  <div className="text-right text-[11px] font-mono text-[#A1A1AA] shrink-0">
                    <p className="text-white">
                      {s.bookedCount ?? 0}/{s.capacity} Booked
                    </p>
                    <p className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {parseDurationMins(s)}m
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Assigned Members Quick List */}
        <Card className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">My Athletes</h2>
            <Link
              href="/trainer/members"
              className="text-xs font-mono text-[#C7F464] hover:underline inline-flex items-center gap-1"
            >
              Manage All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {assignedMembers.length === 0 ? (
            <EmptyState
              title="No Assigned Members"
              description="Members assigned to you by gym administration will appear here."
            />
          ) : (
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {assignedMembers.map((m: any) => (
                <Link
                  key={m.id}
                  href="/trainer/members"
                  className="p-3 rounded-xl bg-[#171717] border border-[#2C2C2C] hover:border-[#C7F464]/50 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {m.user?.fullName}
                    </p>
                    <p className="text-[11px] font-mono text-[#A1A1AA] truncate">
                      {m.memberCode} • {m.fitnessGoal?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-[#C7F464] shrink-0">
                    {m.workoutAssignments?.length || 0} plans
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

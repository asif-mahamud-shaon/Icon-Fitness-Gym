'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Award,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Mail,
  MapPin,
  Phone,
  Users,
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
import { Card, StatusBadge, Button } from '@/components/ui';

interface ClassScheduleItem {
  id: string;
  dayOfWeek:
    | 'SATURDAY'
    | 'SUNDAY'
    | 'MONDAY'
    | 'TUESDAY'
    | 'WEDNESDAY'
    | 'THURSDAY'
    | 'FRIDAY';
  startTime: string;
  endTime: string;
  capacity: number;
  gymClass: {
    title: string;
    durationMins?: number;
  };
  _count: {
    bookings: number;
  };
}

interface TrainerAttendanceItem {
  id: string;
  sessionDate: string;
  status: string;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
}

interface AssignedMemberItem {
  id: string;
  memberCode: string;
  fitnessGoal: string;
  user: {
    fullName: string;
    email: string;
    phone: string;
    avatarUrl: string | null;
    status: string;
  };
  memberships: Array<{
    plan: {
      name: string;
    };
  }>;
}

interface TrainerDetailsResponse {
  trainer: {
    id: string;
    slug: string;
    gender: 'MALE' | 'FEMALE';
    headline: string;
    bio: string;
    specializations: string[];
    qualifications: string[];
    experienceYears: number;
    availabilityJson: { days?: string[]; hours?: string } | null;
    isFeatured: boolean;
    isActive: boolean;
    user: {
      id: string;
      fullName: string;
      email: string;
      phone: string;
      avatarUrl: string | null;
      status: string;
      createdAt: string;
    };
    assignedMembers: AssignedMemberItem[];
    classSchedules: ClassScheduleItem[];
    workoutPrograms: Array<{
      id: string;
      title: string;
      difficulty?: string;
      durationWeeks?: number;
    }>;
    trainerAttendances: TrainerAttendanceItem[];
  };
  stats: {
    assignedMembersCount: number;
    scheduledClassesCount: number;
    authoredWorkoutsCount: number;
    attendanceSessionsCount: number;
  };
}

const DAY_ENUM_BY_JS_DAY: Record<number, ClassScheduleItem['dayOfWeek']> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

const DAY_SHORT: Record<ClassScheduleItem['dayOfWeek'], string> = {
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
};

function parseMinutes(hhmm: string): number {
  const parts = String(hhmm || '').split(':');
  const h = Number(parts[0] || 0);
  const m = Number(parts[1] || 0);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

function getScheduleDurationMins(item: ClassScheduleItem): number {
  if (item.gymClass?.durationMins && item.gymClass.durationMins > 0) {
    return item.gymClass.durationMins;
  }
  const diff = parseMinutes(item.endTime) - parseMinutes(item.startTime);
  return diff > 0 ? diff : 60;
}

function formatHoursTooltip(hours: number): string {
  const wholeHours = Math.floor(hours);
  const mins = Math.round((hours - wholeHours) * 60);
  if (wholeHours === 0) return `${mins} Minutes`;
  if (mins === 0) return `${wholeHours} Hour${wholeHours > 1 ? 's' : ''}`;
  return `${wholeHours} Hour${wholeHours > 1 ? 's' : ''} ${mins} Minutes`;
}

export default function AdminTrainerDetailsPage() {
  const params = useParams();
  const trainerId = String(params?.id || '');

  const [data, setData] = useState<TrainerDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeMode, setRangeMode] = useState<'12d' | '30d'>('12d');

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    if (!trainerId) return;
    let active = true;
    setLoading(true);
    setError(null);
    apiFetch<TrainerDetailsResponse>(`/trainers/${trainerId}/details`)
      .then((res) => {
        if (!active) return;
        setData(res);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : 'Unable to load trainer details.',
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [trainerId]);

  const scheduleDaySet = useMemo(() => {
    const set = new Set<ClassScheduleItem['dayOfWeek']>();
    (data?.trainer.classSchedules || []).forEach((s) => set.add(s.dayOfWeek));
    return set;
  }, [data]);

  const attendanceDateSet = useMemo(() => {
    const set = new Set<string>();
    (data?.trainer.trainerAttendances || []).forEach((a) => {
      if (a.sessionDate) {
        set.add(new Date(a.sessionDate).toISOString().slice(0, 10));
      }
    });
    return set;
  }, [data]);

  const activityData = useMemo(() => {
    const daysCount = rangeMode === '12d' ? 12 : 30;
    const today = new Date();
    const schedules = data?.trainer.classSchedules || [];
    const attendances = data?.trainer.trainerAttendances || [];
    const points: Array<{ label: string; fullDate: string; hours: number }> = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const dayEnum = DAY_ENUM_BY_JS_DAY[d.getDay()];

      const scheduledMins = schedules
        .filter((s) => s.dayOfWeek === dayEnum)
        .reduce((acc, s) => acc + getScheduleDurationMins(s), 0);

      const attMins = attendances
        .filter(
          (a) =>
            a.sessionDate &&
            new Date(a.sessionDate).toISOString().slice(0, 10) === iso,
        )
        .reduce((acc, a) => {
          if (a.checkedInAt && a.checkedOutAt) {
            const mins =
              (new Date(a.checkedOutAt).getTime() -
                new Date(a.checkedInAt).getTime()) /
              60000;
            return acc + (mins > 0 ? mins : 90);
          }
          return acc + 90;
        }, 0);

      const totalHours = Number(
        ((scheduledMins + attMins) / 60).toFixed(2),
      );
      const label = d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
      });
      const fullDate = d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
      });
      points.push({ label, fullDate, hours: totalHours });
    }
    return points;
  }, [data, rangeMode]);

  const calendarGrid = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    // Monday-first grid (M T W T F S S)
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: Array<{
      day: number;
      inCurrentMonth: boolean;
      dateObj: Date;
      isHighlighted: boolean;
    }> = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const dateObj = new Date(year, month - 1, prevMonthDays - i);
      cells.push({
        day: prevMonthDays - i,
        inCurrentMonth: false,
        dateObj,
        isHighlighted: false,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const iso = dateObj.toISOString().slice(0, 10);
      const dayEnum = DAY_ENUM_BY_JS_DAY[dateObj.getDay()];
      const isHighlighted =
        attendanceDateSet.has(iso) || scheduleDaySet.has(dayEnum);
      cells.push({
        day: d,
        inCurrentMonth: true,
        dateObj,
        isHighlighted,
      });
    }

    while (cells.length % 7 !== 0 || cells.length < 35) {
      const nextDay = cells.length - (startOffset + daysInMonth) + 1;
      const dateObj = new Date(year, month + 1, nextDay);
      cells.push({
        day: nextDay,
        inCurrentMonth: false,
        dateObj,
        isHighlighted: false,
      });
    }

    return cells;
  }, [calendarMonth, attendanceDateSet, scheduleDaySet]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 rounded-lg bg-[#141414] border border-[#2C2C2C] animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 h-[520px] rounded-2xl bg-[#141414] border border-[#2C2C2C] animate-pulse" />
          <div className="lg:col-span-8 space-y-6">
            <div className="h-[260px] rounded-2xl bg-[#141414] border border-[#2C2C2C] animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-[240px] rounded-2xl bg-[#141414] border border-[#2C2C2C] animate-pulse" />
              <div className="h-[240px] rounded-2xl bg-[#141414] border border-[#2C2C2C] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/trainers"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#C7F464] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Trainer List
        </Link>
        <Card className="p-8 text-center">
          <p className="text-sm text-white font-semibold">
            {error || 'Trainer not found'}
          </p>
        </Card>
      </div>
    );
  }

  const { trainer, stats } = data;
  const firstName = trainer.user.fullName.split(' ')[0] || 'Trainer';
  const initials = trainer.user.fullName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const monthLabel = calendarMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const rangeDateTitle =
    activityData.length > 0
      ? `${activityData[0].label} - ${activityData[activityData.length - 1].label}`
      : 'Recent Window';

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Trainer Details
          </h1>
          <div className="flex items-center gap-2 text-xs font-mono text-[#A1A1AA] mt-1">
            <Link
              href="/admin/trainers"
              className="hover:text-[#C7F464] transition-colors"
            >
              Trainer List
            </Link>
            <span>&gt;</span>
            <span className="text-white">Trainer Details</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={trainer.gender || 'MALE'} />
          <StatusBadge status={trainer.isActive ? 'ACTIVE' : 'DEACTIVATED'} />
          <Link href="/admin/trainers">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              All Trainers
            </Button>
          </Link>
        </div>
      </div>

      {/* Main 12-Col Layout Matching Mockup 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Profile, Contact & Certifications */}
        <Card className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Profile</h2>
            <span className="text-[11px] font-mono text-[#A1A1AA]">
              /{trainer.slug}
            </span>
          </div>

          {/* Avatar + Identity */}
          <div className="flex flex-col items-center text-center">
            {trainer.user.avatarUrl ? (
              <img
                src={trainer.user.avatarUrl}
                alt={trainer.user.fullName}
                className="w-28 h-28 rounded-full object-cover border-2 border-[#C7F464] shadow-lg"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-[#171717] border-2 border-[#C7F464] flex items-center justify-center font-display text-3xl text-[#C7F464]">
                {initials}
              </div>
            )}
            <h3 className="text-xl font-bold text-[#C7F464] mt-4">
              {trainer.user.fullName}
            </h3>
            <p className="text-xs text-[#A1A1AA] mt-0.5">{trainer.headline}</p>
          </div>

          {/* 3-Stat Strip */}
          <div className="grid grid-cols-3 rounded-xl bg-[#171717] border border-[#2C2C2C] divide-x divide-[#2C2C2C] py-3">
            <div className="text-center px-2">
              <p className="text-base font-bold text-white font-mono">
                {trainer.experienceYears} yrs
              </p>
              <p className="text-[11px] text-[#A1A1AA]">Experience</p>
            </div>
            <div className="text-center px-2">
              <p className="text-base font-bold text-white font-mono">
                {stats.assignedMembersCount}
              </p>
              <p className="text-[11px] text-[#A1A1AA]">Members</p>
            </div>
            <div className="text-center px-2">
              <p className="text-base font-bold text-white font-mono">
                {stats.scheduledClassesCount}
              </p>
              <p className="text-[11px] text-[#A1A1AA]">Classes</p>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3 pt-2 border-t border-[#2C2C2C]">
            <h3 className="text-sm font-bold text-white">Contact</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#171717] border border-[#2C2C2C] flex items-center justify-center text-[#A1A1AA] shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-[#A1A1AA]">Email</p>
                  <p className="text-white font-mono truncate">
                    {trainer.user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#171717] border border-[#2C2C2C] flex items-center justify-center text-[#A1A1AA] shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-[#A1A1AA]">Phone</p>
                  <p className="text-white font-mono">{trainer.user.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#171717] border border-[#2C2C2C] flex items-center justify-center text-[#A1A1AA] shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-[#A1A1AA]">Address</p>
                  <p className="text-white leading-relaxed">
                    Icon Fitness Gym, Ashkona Main Road, Dakshinkhan, Dhaka-1230
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Certifications & Specialties */}
          <div className="space-y-3 pt-2 border-t border-[#2C2C2C]">
            <h3 className="text-sm font-bold text-white">Certifications</h3>
            {trainer.qualifications && trainer.qualifications.length > 0 ? (
              <div className="space-y-2.5">
                {trainer.qualifications.map((q) => (
                  <div key={q} className="flex items-start gap-3 text-xs">
                    <div className="w-8 h-8 rounded-lg bg-[#171717] border border-[#2C2C2C] flex items-center justify-center text-[#C7F464] shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-white font-medium leading-snug">{q}</p>
                      <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                        Verified Coaching Credential
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#A1A1AA]">
                No formal certifications listed yet.
              </p>
            )}

            {trainer.specializations && trainer.specializations.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-1.5">
                {trainer.specializations.map((spec) => (
                  <span
                    key={spec}
                    className="text-[11px] px-2.5 py-0.5 rounded bg-[#171717] border border-[#303030] text-[#C7F464] font-mono"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* RIGHT COLUMN: Training Activity Chart, Calendar + Schedule, Assigned Members */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top Card: Training Activity */}
          <Card className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">
                  Training Activity
                </h2>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  Daily coaching & scheduled floor hours ({rangeDateTitle})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRangeMode('12d')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    rangeMode === '12d'
                      ? 'bg-[#C7F464] text-[#090909]'
                      : 'bg-[#171717] border border-[#2C2C2C] text-white hover:border-[#C7F464]/50'
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Last 12 Days
                </button>
                <button
                  type="button"
                  onClick={() => setRangeMode('30d')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    rangeMode === '30d'
                      ? 'bg-[#C7F464] text-[#090909]'
                      : 'bg-[#171717] border border-[#2C2C2C] text-white hover:border-[#C7F464]/50'
                  }`}
                >
                  30 Days
                </button>
              </div>
            </div>

            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={activityData}
                  margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="trainerActivityFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#C7F464"
                        stopOpacity={0.38}
                      />
                      <stop
                        offset="95%"
                        stopColor="#C7F464"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2C2C2C"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    stroke="#71717A"
                    tick={{ fill: '#A1A1AA', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#71717A"
                    tick={{ fill: '#A1A1AA', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v} Hr`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const pt = payload[0].payload as {
                        fullDate: string;
                        hours: number;
                      };
                      return (
                        <div className="rounded-lg bg-[#090909] border border-[#303030] px-3 py-2 text-xs shadow-xl">
                          <p className="text-[#A1A1AA]">{pt.fullDate}</p>
                          <p className="text-[#C7F464] font-semibold mt-0.5">
                            {formatHoursTooltip(pt.hours)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="#C7F464"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#trainerActivityFill)"
                    activeDot={{
                      r: 5,
                      fill: '#FFFFFF',
                      stroke: '#C7F464',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Bottom 2-Col Grid: Interactive Calendar + Trainer's Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Monthly Calendar */}
            <Card className="md:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">{monthLabel}</h2>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() =>
                      setCalendarMonth(
                        (prev) =>
                          new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                      )
                    }
                    className="w-7 h-7 rounded-lg bg-[#171717] border border-[#2C2C2C] flex items-center justify-center text-[#A1A1AA] hover:text-white hover:border-[#C7F464]/50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() =>
                      setCalendarMonth(
                        (prev) =>
                          new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                      )
                    }
                    className="w-7 h-7 rounded-lg bg-[#171717] border border-[#2C2C2C] flex items-center justify-center text-[#A1A1AA] hover:text-white hover:border-[#C7F464]/50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-y-2 text-center">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, idx) => (
                  <span
                    key={`${d}-${idx}`}
                    className="text-[11px] font-mono text-[#A1A1AA] pb-1"
                  >
                    {d}
                  </span>
                ))}
                {calendarGrid.map((cell, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-center h-8"
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono transition-colors ${
                        cell.isHighlighted
                          ? 'bg-[#C7F464] text-[#090909] font-bold shadow-sm'
                          : cell.inCurrentMonth
                            ? 'text-white'
                            : 'text-[#52525B]'
                      }`}
                    >
                      {String(cell.day).padStart(2, '0')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#2C2C2C] flex items-center justify-between text-[11px] text-[#A1A1AA]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C7F464]" />
                  Coaching / Scheduled Day
                </span>
                <span className="font-mono">
                  {stats.attendanceSessionsCount} check-ins
                </span>
              </div>
            </Card>

            {/* Trainer's Schedule */}
            <Card className="md:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">
                  {firstName}&apos;s Schedule
                </h2>
                <span className="text-xs font-mono text-[#A1A1AA]">
                  {trainer.classSchedules.length} weekly slots
                </span>
              </div>

              {trainer.classSchedules.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#A1A1AA]">
                  No group classes assigned to this trainer yet.
                </div>
              ) : (
                <div className="divide-y divide-[#2C2C2C] max-h-[290px] overflow-y-auto pr-1">
                  {trainer.classSchedules.map((slot) => {
                    const mins = getScheduleDurationMins(slot);
                    return (
                      <div
                        key={slot.id}
                        className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-4"
                      >
                        <div className="min-w-[84px]">
                          <p className="text-xs font-mono text-[#C7F464]">
                            {DAY_SHORT[slot.dayOfWeek]}
                          </p>
                          <p className="text-xs font-mono text-[#A1A1AA] mt-0.5">
                            {slot.startTime}
                          </p>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {slot.gymClass?.title || 'Group Session'}
                          </p>
                        </div>

                        <div className="text-right shrink-0 space-y-0.5 text-[11px] font-mono text-[#A1A1AA]">
                          <p className="inline-flex items-center justify-end gap-1 w-full text-white">
                            <Users className="w-3 h-3 text-[#C7F464]" />
                            {slot._count?.bookings ?? 0}/{slot.capacity}{' '}
                            Participants
                          </p>
                          <p className="inline-flex items-center justify-end gap-1 w-full">
                            <Clock className="w-3 h-3" />
                            {mins} Minutes
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Assigned Members & Authored Workouts */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-[#C7F464]" />
                <h2 className="text-base font-bold text-white">
                  Assigned Members ({stats.assignedMembersCount})
                </h2>
              </div>
              <Link
                href="/admin/members"
                className="text-xs font-mono text-[#C7F464] hover:underline"
              >
                Open Member List &rarr;
              </Link>
            </div>

            {trainer.assignedMembers.length === 0 ? (
              <p className="text-xs text-[#A1A1AA] py-4">
                No members currently assigned to this trainer.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trainer.assignedMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#171717] border border-[#2C2C2C]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {m.user.fullName}
                      </p>
                      <p className="text-[11px] font-mono text-[#A1A1AA] truncate">
                        {m.memberCode} •{' '}
                        {m.memberships?.[0]?.plan?.name || m.fitnessGoal}
                      </p>
                    </div>
                    <StatusBadge status={m.user.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

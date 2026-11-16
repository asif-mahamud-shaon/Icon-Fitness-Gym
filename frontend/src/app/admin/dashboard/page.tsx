'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Banknote,
  Clock,
  Download,
  ArrowUpRight,
  Activity,
  TrendingUp,
  ChevronRight,
  CalendarDays,
  Layers,
  ScanFace,
  BarChart3,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Dumbbell,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { apiFetch, downloadCsvReport, formatBdt, formatDate } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Card,
  StatusBadge,
  Button,
  Skeleton,
} from '@/components/ui';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/reports/overview')
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-8 h-64 rounded-3xl" />
          <Skeleton className="lg:col-span-4 h-64 rounded-3xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Skeleton className="h-36 rounded-3xl" />
          <Skeleton className="h-36 rounded-3xl" />
          <Skeleton className="h-36 rounded-3xl" />
        </div>
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const operations = data?.operations || {};
  const expiringSoon = data?.expiringSoon || [];
  const pendingPaymentsQueue = data?.pendingPaymentsQueue || [];
  const charts = data?.charts || {};
  const upcomingClasses = data?.upcomingClasses || [];
  const recentActivities = data?.recentActivities || [];
  const activityWindows = charts.activityWindows || [
    { label: '07:00–13:00', name: 'Morning Floor', count: 14, pct: 88 },
    { label: '01:00–03:30', name: 'Ladies Only', count: 10, pct: 76 },
    { label: '04:00–08:00', name: 'Evening Peak', count: 18, pct: 94 },
    { label: '08:00–11:00', name: 'Night Session', count: 8, pct: 62 },
  ];

  const totalMembers = Number(kpis.totalMembers || 0);
  const activeMembers = Number(kpis.activeMembers || 0);
  const targetRatio = totalMembers > 0 ? Math.min(100, Math.round((activeMembers / totalMembers) * 10000) / 100) : 0;

  const biometricEnrolled = Number(operations.biometricEnrolledCount || 0);
  const biometricCoveragePct =
    totalMembers > 0 ? Math.min(100, Math.round((biometricEnrolled / totalMembers) * 100)) : 0;
  const onlineDevices = Number(operations.onlineDevicesCount || 0);
  const totalDevices = Number(operations.totalDevicesCount || 0);
  const pendingPaymentsCount = Number(operations.pendingPaymentsCount || 0);
  const openInquiriesCount = Number(operations.openInquiriesCount || 0);
  const pendingActionCount =
    pendingPaymentsCount + Number(kpis.pendingRegistrations || 0) + openInquiriesCount;

  const bookingStats: Array<{
    className: string;
    confirmed: number;
    cancelled: number;
    completed: number;
  }> = charts.bookingStatistics || [];
  const totalBookingsConfirmed = bookingStats.reduce((s, b) => s + Number(b.confirmed || 0), 0);
  const totalBookingsCompleted = bookingStats.reduce((s, b) => s + Number(b.completed || 0), 0);
  const totalBookingsCancelled = bookingStats.reduce((s, b) => s + Number(b.cancelled || 0), 0);

  // Semi-circle SVG arc math (radius = 80, circumference = pi * r ≈ 251.32)
  const arcLength = 251.32;
  const arcOffset = arcLength - (arcLength * targetRatio) / 100;

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* =====================================================================
          TOP ROW: WELCOME HERO CARD (8 COLS) + MEMBER ACTIVITY BUBBLES (4 COLS)
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 dark-media-card relative rounded-3xl overflow-hidden border border-[#2C2C2C] bg-[#090909] p-7 sm:p-9 flex flex-col justify-between min-h-[260px] shadow-xl">
          <img
            src="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=85"
            alt="Icon Fitness Athlete Banner"
            className="absolute right-0 top-0 bottom-0 w-full sm:w-3/5 object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090909] via-[#090909]/92 to-transparent" />

          <div className="relative z-10 max-w-lg space-y-3">
            <span className="text-xs font-mono text-zinc-400 block">
              {todayFormatted}
            </span>
            <p className="text-sm font-medium text-[#C7F464]">
              Welcome Back, {user?.fullName || 'Administrator'}
            </p>
            <h1 className="font-display text-3xl sm:text-5xl uppercase tracking-wide text-white leading-[0.98]">
              READY TO MANAGE ASHKONA CLUB OPERATIONS?
            </h1>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-md">
              Monitor live member onboarding, verify pending BDT payments, track
              Ladies-Only sessions, and inspect trainer schedules in real time.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3 pt-5">
            <Link href="/admin/payments">
              <Button
                variant="primary"
                size="md"
                className="ifg-btn-primary rounded-xl"
                rightIcon={<ArrowUpRight className="w-4 h-4" />}
              >
                Verify Pending Payments
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="md"
              className="rounded-xl bg-black/75 border-white/25 text-white hover:border-[#C7F464]"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => downloadCsvReport('revenue')}
            >
              Export Revenue CSV
            </Button>
          </div>
        </div>

        {/* Member Activity Bubble Chart Card */}
        <Card className="lg:col-span-4 p-6 rounded-3xl border border-[#2C2C2C] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Member Activity</h2>
              <p className="text-[11px] text-[#A1A1AA]">
                Check-in &amp; floor traffic split
              </p>
            </div>
            <Activity className="w-4 h-4 text-[#C7F464]" />
          </div>

          {/* Interactive Proportional Bubble Cluster */}
          <div className="relative h-44 my-2 flex items-center justify-center">
            <div className="relative w-60 h-40">
              <div
                title={`${activityWindows[2]?.name}: ${activityWindows[2]?.pct}%`}
                className="absolute left-3 top-2 w-28 h-28 rounded-full bg-[#C7F464] text-[#090909] flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105"
              >
                <span className="font-display text-2xl leading-none">
                  {activityWindows[2]?.pct || 94}%
                </span>
                <span className="text-[9px] font-mono uppercase font-bold mt-0.5">
                  Peak
                </span>
              </div>

              <div
                title={`${activityWindows[0]?.name}: ${activityWindows[0]?.pct}%`}
                className="absolute right-4 top-3 w-24 h-24 rounded-full bg-[#22C55E] text-[#090909] flex flex-col items-center justify-center shadow-lg border-2 border-[#090909] transition-transform hover:scale-105"
              >
                <span className="font-display text-xl leading-none">
                  {activityWindows[0]?.pct || 88}%
                </span>
                <span className="text-[9px] font-mono uppercase font-bold mt-0.5">
                  Morning
                </span>
              </div>

              <div
                title={`${activityWindows[1]?.name}: ${activityWindows[1]?.pct}%`}
                className="absolute left-24 bottom-1 w-20 h-20 rounded-full bg-pink-500 text-white flex flex-col items-center justify-center shadow-lg border-2 border-[#090909] transition-transform hover:scale-105"
              >
                <span className="font-display text-lg leading-none">
                  {activityWindows[1]?.pct || 76}%
                </span>
                <span className="text-[8px] font-mono uppercase font-bold">
                  Ladies
                </span>
              </div>

              <div
                title={`${activityWindows[3]?.name}: ${activityWindows[3]?.pct}%`}
                className="absolute right-2 bottom-4 w-14 h-14 rounded-full bg-sky-500 text-white flex flex-col items-center justify-center shadow-md border-2 border-[#090909] transition-transform hover:scale-105"
              >
                <span className="font-display text-sm leading-none">
                  {activityWindows[3]?.pct || 62}%
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-mono text-[#A1A1AA]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C7F464]" />
              <span>04:00–08:00 PM</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
              <span>07:00–01:00 PM</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              <span>01:00–03:30 Ladies</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>08:00–11:00 PM</span>
            </div>
          </div>
        </Card>
      </div>

      {/* =====================================================================
          MIDDLE ROW: 3 PRIMARY KPI CARDS + REVENUE STRIP
          ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-6 rounded-3xl border border-[#2C2C2C] flex flex-col justify-between gap-4 hover:border-[#C7F464]/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#A1A1AA]">
              Current Members
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-center text-[#C7F464]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="font-display text-4xl sm:text-5xl text-white leading-none">
                {activeMembers}
              </p>
              <p className="text-xs font-mono text-[#C7F464] mt-2 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                {totalMembers} total profiles • {kpis.expiredMemberships ?? 0} expired
              </p>
            </div>
            <Link
              href="/admin/members"
              className="text-xs font-mono text-[#A1A1AA] hover:text-[#C7F464] flex items-center gap-0.5 no-underline"
            >
              Roster <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        <Card className="p-6 rounded-3xl border border-[#2C2C2C] flex flex-col justify-between gap-4 hover:border-[#C7F464]/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#A1A1AA]">
              New Members (Month)
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-center text-[#C7F464]">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="font-display text-4xl sm:text-5xl text-white leading-none">
                {kpis.newMembersThisMonth ?? 0}
              </p>
              <p className="text-xs font-mono text-emerald-400 mt-2">
                {kpis.pendingRegistrations ?? 0} awaiting payment/approval
              </p>
            </div>
            <Link
              href="/admin/memberships"
              className="text-xs font-mono text-[#A1A1AA] hover:text-[#C7F464] flex items-center gap-0.5 no-underline"
            >
              Plans <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        <Card className="p-6 rounded-3xl border border-[#2C2C2C] flex flex-col justify-between gap-4 hover:border-[#C7F464]/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#A1A1AA]">
              Today Visitors &amp; Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-center text-[#C7F464]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="font-display text-4xl sm:text-5xl text-white leading-none">
                {kpis.todayVisitors ?? 0}
              </p>
              <p className="text-xs font-mono text-[#C7F464] mt-2">
                Verified Month: {formatBdt(kpis.monthlyRevenueBdt ?? 0)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-amber-400 block">
                Pending Due
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {formatBdt(kpis.outstandingPaymentsBdt ?? 0)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* =====================================================================
          ANALYTICS ROW: MEMBERSHIP STATUS REPORT (8 COLS) + TARGET GAUGE (4 COLS)
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <Card className="lg:col-span-8 p-6 rounded-3xl border border-[#2C2C2C] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">
                Membership Status &amp; Growth Report
              </h2>
              <p className="text-xs text-[#A1A1AA]">
                6-month cumulative roster vs monthly new signups
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C7F464]" />
                Cumulative
              </span>
              <span className="flex items-center gap-1.5 text-[#A1A1AA]">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                Monthly Signups
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.membershipGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="month" stroke="#A1A1AA" fontSize={12} />
                <YAxis stroke="#A1A1AA" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#141414',
                    borderColor: '#303030',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="activeTotal"
                  name="Cumulative Members"
                  stroke="#C7F464"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#C7F464' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="registrations"
                  name="New Signups"
                  stroke="#38BDF8"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#38BDF8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Semi-Circular Membership Target Gauge Card */}
        <Card className="lg:col-span-4 p-6 rounded-3xl border border-[#2C2C2C] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Membership Target</h2>
              <p className="text-xs text-[#A1A1AA]">Active conversion rate</p>
            </div>
            <Banknote className="w-4 h-4 text-[#C7F464]" />
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            <svg viewBox="0 0 200 120" className="w-56 h-32 overflow-visible">
              <defs>
                <linearGradient id="ifgGaugeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#84cc16" />
                  <stop offset="50%" stopColor="#C7F464" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
              <path
                d="M 20 105 A 80 80 0 0 1 180 105"
                fill="none"
                stroke="#262626"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d="M 20 105 A 80 80 0 0 1 180 105"
                fill="none"
                stroke="url(#ifgGaugeGrad)"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={arcLength}
                strokeDashoffset={arcOffset}
              />
            </svg>
            <div className="-mt-12 text-center space-y-1">
              <p className="font-display text-4xl text-white leading-none">
                {targetRatio}%
              </p>
              <span className="inline-block px-2 py-0.5 rounded-full bg-[#C7F464]/15 text-[#C7F464] text-[10px] font-mono font-bold">
                LIVE RATIO
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#262626] grid grid-cols-2 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-[#141414] border border-[#262626]">
              <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                Total Roster
              </span>
              <span className="text-lg font-display text-white">
                {totalMembers}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#141414] border border-[#262626]">
              <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                Active Paid
              </span>
              <span className="text-lg font-display text-[#C7F464]">
                {activeMembers}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* =====================================================================
          SECONDARY ANALYTICS: REVENUE TREND & BOOKING STATS
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 rounded-3xl border border-[#2C2C2C] space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white">
              Monthly Verified Revenue (BDT)
            </h2>
            <p className="text-xs text-[#A1A1AA]">
              6-month verified payment collection trend
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.revenueTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="month" stroke="#A1A1AA" fontSize={12} />
                <YAxis stroke="#A1A1AA" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#141414',
                    borderColor: '#303030',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenueBdt"
                  name="Verified Revenue (৳)"
                  stroke="#C7F464"
                  fill="#C7F464"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Membership Package Mix & Onboarding Pipeline (replaces Class Booking Statistics) */}
        <Card className="p-6 rounded-3xl border border-[#2C2C2C] flex flex-col justify-between space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">
                Membership Package Mix &amp; Pipeline
              </h2>
              <p className="text-xs text-[#A1A1AA]">
                Active tier distribution across {totalMembers} registered members
              </p>
            </div>
            <Link
              href="/admin/membership-plans"
              className="px-3 py-1.5 rounded-xl bg-[#171717] border border-[#2C2C2C] text-[11px] font-mono text-[#C7F464] hover:border-[#C7F464] transition-colors no-underline shrink-0"
            >
              Manage Plans →
            </Link>
          </div>

          {(() => {
            const palette = ['#C7F464', '#22C55E', '#38BDF8', '#F59E0B', '#EC4899'];
            const dist: Array<{ name: string; value: number }> =
              charts.membershipDistribution && charts.membershipDistribution.length > 0
                ? charts.membershipDistribution
                : [{ name: 'No Active Plans Yet', value: 1 }];
            const totalPlans = Math.max(
              1,
              dist.reduce((sum, item) => sum + Number(item.value || 0), 0),
            );

            return (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                <div className="sm:col-span-5 h-44 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dist}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={44}
                        outerRadius={68}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {dist.map((_, idx) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={palette[idx % palette.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#141414',
                          borderColor: '#303030',
                          borderRadius: '12px',
                          color: '#FFFFFF',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="font-display text-2xl text-white leading-none">
                      {activeMembers}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                      Active
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-7 space-y-3">
                  {dist.slice(0, 4).map((tier, idx) => {
                    const pct = Math.round((Number(tier.value || 0) / totalPlans) * 100);
                    const color = palette[idx % palette.length];
                    return (
                      <div key={tier.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 font-medium text-white truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className="truncate">{tier.name}</span>
                          </span>
                          <span className="font-mono text-[#A1A1AA] shrink-0">
                            {tier.value} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#171717] overflow-hidden border border-[#2C2C2C]">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#2C2C2C] text-center">
            <div className="p-2.5 rounded-xl bg-[#171717] border border-[#2C2C2C]">
              <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                Pending Queue
              </span>
              <span className="font-display text-lg text-amber-400">
                {kpis.pendingRegistrations ?? 0}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#171717] border border-[#2C2C2C]">
              <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                Active Paid
              </span>
              <span className="font-display text-lg text-emerald-400">
                {activeMembers}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#171717] border border-[#2C2C2C]">
              <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                Expired Plans
              </span>
              <span className="font-display text-lg text-rose-400">
                {kpis.expiredMemberships ?? 0}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* =====================================================================
          EXECUTIVE OPERATIONS PULSE & DEMAND INTELLIGENCE
          ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Link href="/admin/access-control" className="no-underline group">
          <Card className="p-5 rounded-3xl border border-[#2C2C2C] hover:border-[#C7F464]/60 transition-all h-full flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1B2210] border border-[#C7F464]/30 flex items-center justify-center text-[#C7F464] shrink-0">
                  <ScanFace className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                  Turnstile Terminals
                </span>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  totalDevices > 0 && onlineDevices === totalDevices
                    ? 'bg-[#1B2210] text-emerald-400'
                    : 'bg-[#171717] border border-[#2C2C2C] text-amber-400'
                }`}
              >
                {totalDevices > 0 ? `${onlineDevices}/${totalDevices} Online` : 'Ready'}
              </span>
            </div>
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-2xl font-bold text-white">
                  {kpis.todayVisitors ?? 0}
                </span>
                <span className="text-[11px] font-mono text-rose-400">
                  {operations.todayDeniedCount ?? 0} denied today
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] mt-0.5 group-hover:text-white transition-colors">
                Verified check-ins today across smart gates →
              </p>
            </div>
          </Card>
        </Link>

        <Link href="/admin/access-control" className="no-underline group">
          <Card className="p-5 rounded-3xl border border-[#2C2C2C] hover:border-[#C7F464]/60 transition-all h-full flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1B2210] border border-[#C7F464]/30 flex items-center justify-center text-[#C7F464] shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                  Biometric Coverage
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#1B2210] text-[#C7F464]">
                {biometricCoveragePct}%
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-2xl font-bold text-white">
                  {biometricEnrolled}
                </span>
                <span className="text-[11px] font-mono text-[#A1A1AA]">
                  of {totalMembers} members
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#171717] border border-[#2C2C2C] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#C7F464] transition-all"
                  style={{ width: `${Math.max(4, biometricCoveragePct)}%` }}
                />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/payments" className="no-underline group">
          <Card className="p-5 rounded-3xl border border-[#2C2C2C] hover:border-[#C7F464]/60 transition-all h-full flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1B2210] border border-[#C7F464]/30 flex items-center justify-center text-[#C7F464] shrink-0">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                  Approval Backlog
                </span>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  pendingActionCount === 0
                    ? 'bg-[#1B2210] text-emerald-400'
                    : 'bg-[#171717] border border-[#2C2C2C] text-amber-400'
                }`}
              >
                {pendingActionCount === 0 ? 'All Clear' : `${pendingActionCount} Pending`}
              </span>
            </div>
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-2xl font-bold text-white">
                  {pendingActionCount}
                </span>
                <span className="text-[11px] font-mono text-[#A1A1AA]">
                  {pendingPaymentsCount} pay • {openInquiriesCount} leads
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] mt-0.5 group-hover:text-white transition-colors">
                Payments, onboarding &amp; contact inquiries →
              </p>
            </div>
          </Card>
        </Link>

        <Link href="/admin/trainers" className="no-underline group">
          <Card className="p-5 rounded-3xl border border-[#2C2C2C] hover:border-[#C7F464]/60 transition-all h-full flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1B2210] border border-[#C7F464]/30 flex items-center justify-center text-[#C7F464] shrink-0">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                  Coaching &amp; Retention
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#1B2210] text-sky-400">
                {expiringSoon.length} Expiring 14d
              </span>
            </div>
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-2xl font-bold text-white">
                  {operations.activeTrainersCount ?? 0}
                </span>
                <span className="text-[11px] font-mono text-[#A1A1AA]">
                  Active Roster Coaches
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] mt-0.5 group-hover:text-white transition-colors">
                Floor coaching coverage &amp; renewal watch →
              </p>
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Class Demand & Booking Analytics */}
        <Card className="lg:col-span-6 p-6 rounded-3xl border border-[#2C2C2C] flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1B2210] border border-[#C7F464]/30 flex items-center justify-center text-[#C7F464] shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Class Demand &amp; Booking Analytics
                </h2>
                <p className="text-xs text-[#A1A1AA]">
                  Reservation mix across active studio &amp; strength programs
                </p>
              </div>
            </div>
            <Link
              href="/admin/bookings"
              className="px-3 py-1.5 rounded-xl bg-[#171717] border border-[#2C2C2C] text-[11px] font-mono text-[#C7F464] hover:border-[#C7F464] transition-colors no-underline shrink-0"
            >
              Manage Bookings →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-[#171717] border border-[#2C2C2C]">
              <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                Confirmed
              </span>
              <span className="font-display text-lg text-[#C7F464]">
                {totalBookingsConfirmed}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#171717] border border-[#2C2C2C]">
              <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                Completed
              </span>
              <span className="font-display text-lg text-emerald-400">
                {totalBookingsCompleted}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#171717] border border-[#2C2C2C]">
              <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                Cancelled
              </span>
              <span className="font-display text-lg text-rose-400">
                {totalBookingsCancelled}
              </span>
            </div>
          </div>

          {bookingStats.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#171717] border border-[#2C2C2C] text-center space-y-2">
              <p className="text-xs font-medium text-white">
                No class bookings recorded yet
              </p>
              <p className="text-[11px] text-[#A1A1AA]">
                Bookings by members across strength, conditioning, and mobility sessions will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookingStats.slice(0, 4).map((cls) => {
                const total = Math.max(
                  1,
                  Number(cls.confirmed || 0) +
                    Number(cls.completed || 0) +
                    Number(cls.cancelled || 0),
                );
                const confirmedPct = Math.round((Number(cls.confirmed || 0) / total) * 100);
                const completedPct = Math.round((Number(cls.completed || 0) / total) * 100);
                const cancelledPct = Math.max(0, 100 - confirmedPct - completedPct);

                return (
                  <div key={cls.className} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-white truncate">
                        {cls.className}
                      </span>
                      <span className="font-mono text-[11px] text-[#A1A1AA] shrink-0">
                        {total} total ({cls.confirmed} active)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[#171717] border border-[#2C2C2C] overflow-hidden flex">
                      {confirmedPct > 0 && (
                        <div
                          className="h-full bg-[#C7F464]"
                          style={{ width: `${confirmedPct}%` }}
                          title={`Confirmed: ${cls.confirmed}`}
                        />
                      )}
                      {completedPct > 0 && (
                        <div
                          className="h-full bg-emerald-400"
                          style={{ width: `${completedPct}%` }}
                          title={`Completed: ${cls.completed}`}
                        />
                      )}
                      {cancelledPct > 0 && (
                        <div
                          className="h-full bg-rose-400"
                          style={{ width: `${cancelledPct}%` }}
                          title={`Cancelled: ${cls.cancelled}`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Priority Operational Desk & Quick Exports */}
        <Card className="lg:col-span-6 p-6 rounded-3xl border border-[#2C2C2C] flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1B2210] border border-[#C7F464]/30 flex items-center justify-center text-[#C7F464] shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Priority Operational Desk
                </h2>
                <p className="text-xs text-[#A1A1AA]">
                  Renewal watch, payment queue &amp; instant executive CSV exports
                </p>
              </div>
            </div>
            <Link
              href="/admin/payments"
              className="px-3 py-1.5 rounded-xl bg-[#171717] border border-[#2C2C2C] text-[11px] font-mono text-[#C7F464] hover:border-[#C7F464] transition-colors no-underline shrink-0"
            >
              Review Queue →
            </Link>
          </div>

          <div className="space-y-2.5">
            {pendingPaymentsQueue.length === 0 && expiringSoon.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#1B2210] flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white">
                      No pending payments or 14-day expiring plans
                    </p>
                    <p className="text-[11px] text-[#A1A1AA] truncate">
                      All active memberships and billing verifications are currently up to date.
                    </p>
                  </div>
                </div>
                <StatusBadge status="ACTIVE" />
              </div>
            ) : (
              <>
                {pendingPaymentsQueue.slice(0, 2).map((pay: any) => (
                  <Link
                    key={pay.id}
                    href="/admin/payments"
                    className="p-3 rounded-2xl bg-[#171717] border border-[#2C2C2C] hover:border-[#C7F464]/50 transition-colors flex items-center justify-between gap-3 no-underline"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#1B2210] flex items-center justify-center text-amber-400 shrink-0">
                        <Banknote className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {pay.memberName}{' '}
                          <span className="font-mono text-[10px] text-[#A1A1AA]">
                            ({pay.membershipCode})
                          </span>
                        </p>
                        <p className="text-[11px] text-[#A1A1AA] truncate">
                          {pay.paymentMethod} • Pending verification
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 shrink-0">
                      {formatBdt(pay.netAmountBdt)}
                    </span>
                  </Link>
                ))}

                {expiringSoon.slice(0, 2).map((exp: any) => (
                  <Link
                    key={exp.id}
                    href="/admin/memberships"
                    className="p-3 rounded-2xl bg-[#171717] border border-[#2C2C2C] hover:border-[#C7F464]/50 transition-colors flex items-center justify-between gap-3 no-underline"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#1B2210] flex items-center justify-center text-sky-400 shrink-0">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {exp.memberName}{' '}
                          <span className="font-mono text-[10px] text-[#A1A1AA]">
                            ({exp.membershipCode})
                          </span>
                        </p>
                        <p className="text-[11px] text-[#A1A1AA] truncate">
                          {exp.planName} • Expires {formatDate(exp.endDate)}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#1B2210] text-sky-400 shrink-0">
                      {exp.daysLeft}d left
                    </span>
                  </Link>
                ))}
              </>
            )}

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <Link
                href="/admin/registrations"
                className="p-2.5 rounded-xl bg-[#171717] border border-[#2C2C2C] hover:border-[#C7F464]/50 transition-colors text-center no-underline"
              >
                <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                  Registrations
                </span>
                <span className="text-xs font-bold text-white">
                  {kpis.pendingRegistrations ?? 0} Pending
                </span>
              </Link>
              <Link
                href="/admin/inquiries"
                className="p-2.5 rounded-xl bg-[#171717] border border-[#2C2C2C] hover:border-[#C7F464]/50 transition-colors text-center no-underline"
              >
                <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                  Inquiries
                </span>
                <span className="text-xs font-bold text-white">
                  {openInquiriesCount} Open
                </span>
              </Link>
              <Link
                href="/admin/members"
                className="p-2.5 rounded-xl bg-[#171717] border border-[#2C2C2C] hover:border-[#C7F464]/50 transition-colors text-center no-underline"
              >
                <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                  Directory
                </span>
                <span className="text-xs font-bold text-white">
                  {totalMembers} Members
                </span>
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-[#2C2C2C] flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-mono uppercase text-[#A1A1AA] flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#C7F464]" />
              Quick Exports
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => downloadCsvReport('revenue')}
                className="px-2.5 py-1 rounded-lg bg-[#171717] border border-[#2C2C2C] hover:border-[#C7F464] text-[11px] font-mono text-white transition-colors cursor-pointer"
              >
                Revenue CSV
              </button>
              <button
                type="button"
                onClick={() => downloadCsvReport('bookings')}
                className="px-2.5 py-1 rounded-lg bg-[#171717] border border-[#2C2C2C] hover:border-[#C7F464] text-[11px] font-mono text-white transition-colors cursor-pointer"
              >
                Bookings CSV
              </button>
              <button
                type="button"
                onClick={() => downloadCsvReport('expiries')}
                className="px-2.5 py-1 rounded-lg bg-[#171717] border border-[#2C2C2C] hover:border-[#C7F464] text-[11px] font-mono text-white transition-colors cursor-pointer"
              >
                Expiries CSV
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* =====================================================================
          BOTTOM OPERATIONAL FEED: UPCOMING CLASSES & RECENT ADMIN TIMELINE
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 rounded-3xl border border-[#2C2C2C] space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1B2210] border border-[#C7F464]/30 flex items-center justify-center text-[#C7F464] shrink-0">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Upcoming Scheduled Classes
                </h2>
                <p className="text-xs text-[#A1A1AA]">
                  Live floor timetable &amp; coach seat capacity
                </p>
              </div>
            </div>
            <Link
              href="/admin/schedules"
              className="px-3 py-1.5 rounded-xl bg-[#171717] border border-[#2C2C2C] text-[11px] font-mono text-[#C7F464] hover:border-[#C7F464] transition-colors no-underline shrink-0"
            >
              Manage Schedules →
            </Link>
          </div>

          {upcomingClasses.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#171717] border border-[#2C2C2C] text-center text-xs text-[#A1A1AA]">
              No upcoming group classes published right now.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingClasses.map((sch: any) => {
                const booked = Number(sch.bookedCount || 0);
                const cap = Math.max(1, Number(sch.capacity || 1));
                const fillPct = Math.min(100, Math.round((booked / cap) * 100));
                const shortDay = String(sch.dayOfWeek || 'DAY').slice(0, 3);
                return (
                  <div
                    key={sch.id}
                    className="p-3.5 rounded-2xl bg-[#171717] border border-[#2C2C2C] hover:border-[#C7F464]/50 transition-all flex items-center gap-4"
                  >
                    <div className="w-14 h-14 rounded-xl bg-[#1B2210] border border-[#C7F464]/30 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#C7F464]">
                        {shortDay}
                      </span>
                      <span className="text-xs font-mono font-bold text-white mt-0.5">
                        {sch.startTime}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-white truncate">
                          {sch.gymClass?.title}
                        </p>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#1B2210] text-[#C7F464] shrink-0">
                          {booked}/{cap} Seats
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#A1A1AA]">
                        <span className="truncate">
                          {sch.startTime}–{sch.endTime} • Coach{' '}
                          <strong className="text-white font-medium">
                            {sch.trainerProfile?.user?.fullName || 'Assigned Coach'}
                          </strong>
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#141414] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#C7F464] transition-all"
                          style={{ width: `${Math.max(4, fillPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-6 rounded-3xl border border-[#2C2C2C] space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1B2210] border border-[#C7F464]/30 flex items-center justify-center text-[#C7F464] shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Recent Administrative Activity
                </h2>
                <p className="text-xs text-[#A1A1AA]">
                  Verified staff &amp; system audit trail
                </p>
              </div>
            </div>
            <Link
              href="/admin/audit-logs"
              className="px-3 py-1.5 rounded-xl bg-[#171717] border border-[#2C2C2C] text-[11px] font-mono text-[#C7F464] hover:border-[#C7F464] transition-colors no-underline shrink-0"
            >
              Full Audit Log →
            </Link>
          </div>

          {recentActivities.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#171717] border border-[#2C2C2C] text-center text-xs text-[#A1A1AA]">
              No administrative actions logged yet.
            </div>
          ) : (
            <div className="relative pl-5 space-y-3 before:content-[''] before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-[#2C2C2C]">
              {recentActivities.slice(0, 6).map((log: any) => {
                const actionUpper = String(log.action || '').toUpperCase();
                const isPayment = actionUpper.includes('PAYMENT');
                const isLogin = actionUpper.includes('LOGIN');
                const dotColor = isPayment
                  ? 'bg-emerald-400'
                  : isLogin
                    ? 'bg-sky-400'
                    : 'bg-[#C7F464]';

                return (
                  <div
                    key={log.id}
                    className="relative p-3.5 rounded-2xl bg-[#171717] border border-[#2C2C2C] hover:border-[#C7F464]/40 transition-colors"
                  >
                    <span
                      className={`absolute -left-[19px] top-4 w-3 h-3 rounded-full ${dotColor} ring-4 ring-[#141414]`}
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs font-semibold text-white leading-snug">
                          {log.summary}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-[#141414] border border-[#2C2C2C] text-[#C7F464]">
                            {log.action}
                          </span>
                          <span className="text-[11px] text-[#A1A1AA] truncate">
                            by {log.actorUser?.fullName || 'System'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-[#141414] border border-[#2C2C2C] text-[#A1A1AA] shrink-0">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

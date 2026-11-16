'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Calendar,
  Dumbbell,
  CreditCard,
  Bell,
  FileText,
  ArrowUpRight,
  ScanFace,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { apiFetch, formatBdt, formatDate } from '@/lib/api';
import { Card, StatusBadge, Button, Skeleton, EmptyState } from '@/components/ui';

const ReceiptModal = dynamic(
  () => import('@/components/shared/ReceiptModal').then((m) => m.ReceiptModal),
  { ssr: false },
);

export default function MemberDashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  useEffect(() => {
    apiFetch('/members/me')
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const member = data?.member;
  const currentMembership = data?.currentMembership;
  const upcomingBookings = data?.upcomingBookings || [];
  const recentPayments = data?.recentPayments || [];
  const workoutAssignments = data?.workoutAssignments || [];
  const notifications = data?.notifications || [];

  const totalDays = currentMembership?.plan?.durationDays || 30;
  const daysRemaining = currentMembership?.endDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(currentMembership.endDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;
  const cyclePct =
    currentMembership && totalDays > 0
      ? Math.min(100, Math.round((daysRemaining / totalDays) * 100))
      : 0;

  return (
    <div className="space-y-6">
      {/* Executive Welcome Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="dark-media-card lg:col-span-8 relative overflow-hidden rounded-2xl bg-[#090909] border border-[#2C2C2C] p-6 sm:p-8 flex flex-col justify-between min-h-[210px]">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80"
            alt="Icon Fitness Member Training Floor"
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090909] via-[#090909]/85 to-transparent" />
          <div className="relative z-10 max-w-xl space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#C7F464]">
              <span>ID: {member?.memberCode}</span>
              <span>•</span>
              <span>{member?.fitnessGoal?.replace(/_/g, ' ')}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
              Welcome Back, {member?.user?.fullName || 'Member'}
            </h1>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              Manage your active membership, reserve floor classes, log your
              prescribed workout blocks, and verify turnstile access eligibility.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-2">
              <Link href="/member/bookings">
                <Button variant="primary" size="sm">
                  Book Class Seat
                </Button>
              </Link>
              <Link href="/member/access">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ScanFace className="w-3.5 h-3.5" />}
                >
                  Smart Entry Status
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Membership Validity Mini-Gauge Card */}
        <Card className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Active Cycle</h2>
            <StatusBadge status={currentMembership?.status || 'NONE'} />
          </div>
          <div>
            <p className="text-3xl font-bold text-white font-mono">
              {currentMembership ? `${daysRemaining} Days` : 'Inactive'}
            </p>
            <p className="text-xs text-[#A1A1AA] mt-1">
              {currentMembership?.plan?.name || 'No active plan'} •{' '}
              {currentMembership
                ? `Until ${formatDate(currentMembership.endDate)}`
                : 'Select plan'}
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-[#A1A1AA]">
              <span>Cycle Remaining</span>
              <span className="text-[#C7F464]">{cyclePct}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#171717] border border-[#2C2C2C] overflow-hidden">
              <div
                className="h-full bg-[#C7F464] transition-all"
                style={{ width: `${cyclePct}%` }}
              />
            </div>
          </div>
          <Link
            href="/member/membership"
            className="text-xs font-mono text-[#C7F464] hover:underline inline-flex items-center gap-1"
          >
            Manage Plan &amp; Receipts <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </Card>
      </div>

      {/* 4 KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Membership Status</p>
            <p className="text-xl font-bold text-white font-mono mt-1">
              {currentMembership?.status || 'NONE'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#171717] border border-[#2C2C2C] flex items-center justify-center text-[#C7F464]">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Upcoming Bookings</p>
            <p className="text-xl font-bold text-white font-mono mt-1">
              {upcomingBookings.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#171717] border border-[#2C2C2C] flex items-center justify-center text-[#C7F464]">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Workout Progress</p>
            <p className="text-xl font-bold text-white font-mono mt-1">
              {workoutAssignments[0]
                ? `${workoutAssignments[0].completionPercentage}%`
                : '0%'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#171717] border border-[#2C2C2C] flex items-center justify-center text-[#C7F464]">
            <Dumbbell className="w-5 h-5" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Recent Payments</p>
            <p className="text-xl font-bold text-white font-mono mt-1">
              {recentPayments.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#171717] border border-[#2C2C2C] flex items-center justify-center text-[#C7F464]">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">
              Upcoming Class Reservations
            </h2>
            <Link
              href="/member/bookings"
              className="text-xs font-mono text-[#C7F464] hover:underline"
            >
              Manage Bookings &rarr;
            </Link>
          </div>

          {upcomingBookings.length === 0 ? (
            <EmptyState
              title="No Upcoming Class Bookings"
              description="Reserve a seat in any weekly strength or conditioning class."
              action={
                <Link href="/member/bookings">
                  <Button variant="primary" size="sm">
                    Browse Schedule
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {upcomingBookings.slice(0, 4).map((b: any) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl bg-[#171717] border border-[#2C2C2C] flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {b.classSchedule?.gymClass?.title}
                    </p>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">
                      {b.classSchedule?.dayOfWeek} • {b.classSchedule?.startTime} –{' '}
                      {b.classSchedule?.endTime} • {b.classSchedule?.roomOrZone}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">
              Assigned Workout Program
            </h2>
            <Link
              href="/member/workouts"
              className="text-xs font-mono text-[#C7F464] hover:underline"
            >
              Open Workout Plan &rarr;
            </Link>
          </div>

          {workoutAssignments.length === 0 ? (
            <EmptyState
              title="No Workout Program Assigned Yet"
              description="Your trainer will assign a structured workout program to your account."
            />
          ) : (
            <div className="space-y-3">
              {workoutAssignments.slice(0, 2).map((wa: any) => (
                <div
                  key={wa.id}
                  className="p-4 rounded-xl bg-[#171717] border border-[#2C2C2C] space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-white">
                      {wa.workoutProgram?.title}
                    </h3>
                    <span className="text-xs font-mono text-[#C7F464]">
                      {wa.completionPercentage}% Complete
                    </span>
                  </div>
                  <p className="text-xs text-[#A1A1AA]">
                    {wa.trainerNotes || wa.workoutProgram?.description}
                  </p>
                  <div className="w-full h-2 rounded-full bg-[#141414] border border-[#2C2C2C] overflow-hidden">
                    <div
                      className="h-full bg-[#C7F464]"
                      style={{ width: `${wa.completionPercentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Bottom Row: Recent Payments & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">
              Recent Payment Records
            </h2>
            <Link
              href="/member/membership"
              className="text-xs font-mono text-[#C7F464] hover:underline"
            >
              All Payments &rarr;
            </Link>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-xs text-[#A1A1AA]">No payment records found.</p>
          ) : (
            <div className="space-y-2.5">
              {recentPayments.slice(0, 4).map((p: any) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-[#171717] border border-[#2C2C2C] flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {formatBdt(p.netAmountBdt)} • {p.paymentMethod}
                    </p>
                    <p className="text-xs text-[#A1A1AA]">
                      {p.membership?.plan?.name || 'Membership'} •{' '}
                      {formatDate(p.paidAt || p.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={p.status} />
                    {p.receipt && (
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<FileText className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedReceipt(p)}
                      >
                        Receipt
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#C7F464]" />
              <h2 className="text-base font-bold text-white">
                Recent Notifications
              </h2>
            </div>
            <Link
              href="/member/notifications"
              className="text-xs font-mono text-[#C7F464] hover:underline"
            >
              View All &rarr;
            </Link>
          </div>

          {notifications.length === 0 ? (
            <p className="text-xs text-[#A1A1AA]">No notifications yet.</p>
          ) : (
            <div className="space-y-2.5">
              {notifications.slice(0, 4).map((n: any) => (
                <div
                  key={n.id}
                  className="p-3.5 rounded-xl bg-[#171717] border border-[#2C2C2C] space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-white">{n.title}</p>
                    <span className="text-[11px] font-mono text-[#A1A1AA] shrink-0">
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-[#A1A1AA]">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <ReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        payment={selectedReceipt}
        receipt={selectedReceipt?.receipt || selectedReceipt}
      />
    </div>
  );
}

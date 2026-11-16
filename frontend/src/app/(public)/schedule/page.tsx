'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Users, MapPin, CalendarCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { ClassSchedule, DayOfWeek } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Card,
  Button,
  StatusBadge,
  Skeleton,
  EmptyState,
} from '@/components/ui';

const DAYS: Array<{ label: string; value: string }> = [
  { label: 'All Days', value: 'ALL' },
  { label: 'Saturday', value: 'SATURDAY' },
  { label: 'Sunday', value: 'SUNDAY' },
  { label: 'Monday', value: 'MONDAY' },
  { label: 'Tuesday', value: 'TUESDAY' },
  { label: 'Wednesday', value: 'WEDNESDAY' },
  { label: 'Thursday', value: 'THURSDAY' },
  { label: 'Friday', value: 'FRIDAY' },
];

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [bookingIdInFlight, setBookingIdInFlight] = useState<string | null>(
    null,
  );
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const q =
        selectedDay !== 'ALL'
          ? `?dayOfWeek=${encodeURIComponent(selectedDay as DayOfWeek)}`
          : '';
      const data = await apiFetch<ClassSchedule[]>(`/schedules/public${q}`);
      setSchedules(data);
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDay]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleBookClass = async (schedule: ClassSchedule) => {
    if (!user) {
      toast({
        title: 'Sign in required to book a seat',
        description: 'Redirecting you to the Member Portal login...',
        variant: 'info',
      });
      router.push('/login?redirect=/schedule');
      return;
    }

    if (user.role !== 'MEMBER') {
      router.push('/member/bookings');
      return;
    }

    setBookingIdInFlight(schedule.id);
    try {
      await apiFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          classScheduleId: schedule.id,
        }),
      });
      toast({
        title: 'Class Seat Booked!',
        description: `Your reservation for ${schedule.gymClass.title} (${schedule.dayOfWeek} ${schedule.startTime}) is confirmed.`,
        variant: 'success',
      });
      await loadSchedules();
    } catch (err: any) {
      toast({
        title: 'Booking Could Not Be Completed',
        description: err.message || 'Unable to book this session.',
        variant: 'error',
      });
    } finally {
      setBookingIdInFlight(null);
    }
  };

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-16 space-y-12">
      <div className="max-w-3xl space-y-4">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
          WEEKLY TIMETABLE &amp; LIVE SEAT CAPACITY
        </p>
        <h1 className="font-display text-5xl sm:text-6xl uppercase tracking-wide text-white">
          CLASS SCHEDULE
        </h1>
        <p className="text-base text-[#A1A1AA] leading-relaxed">
          Reserve your spot in our coach-led strength, conditioning, and
          mobility sessions. Seat counts update in real time with transactional
          overbooking protection.
        </p>
      </div>

      {/* Day Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {DAYS.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => setSelectedDay(d.value)}
            className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider border transition-colors ${
              selectedDay === d.value
                ? 'bg-[#C7F464] text-[#090909] border-[#C7F464] font-bold'
                : 'bg-[#171717] text-[#A1A1AA] border-[#303030] hover:text-white'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : schedules.length === 0 ? (
        <EmptyState
          title="No Scheduled Classes for Selected Day"
          description="Select another day of the week to view available sessions."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((sch) => {
            const available = Math.max(0, sch.capacity - sch.bookedCount);
            const isFull = available === 0;

            return (
              <Card
                key={sch.id}
                className="flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={sch.dayOfWeek} />
                    <span className="text-xs font-mono font-bold text-[#C7F464]">
                      {sch.startTime} – {sch.endTime}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-white">
                    {sch.gymClass.title}
                  </h2>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    {sch.gymClass.description}
                  </p>

                  <div className="pt-2 space-y-1.5 text-xs text-[#A1A1AA]">
                    <p className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-[#C7F464]" />
                      <span>
                        Coach:{' '}
                        <strong className="text-white">
                          {sch.trainerProfile?.user?.fullName || 'Assigned Coach'}
                        </strong>
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#C7F464]" />
                      <span>Zone: {sch.roomOrZone}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#C7F464]" />
                      <span>
                        Duration: {sch.gymClass.durationMinutes} mins • Cutoff:{' '}
                        {sch.cancellationCutoffHours}h prior
                      </span>
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#303030] space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#A1A1AA]">Available Seats:</span>
                    <span
                      className={
                        isFull
                          ? 'text-red-400 font-bold'
                          : 'text-emerald-400 font-bold'
                      }
                    >
                      {available} / {sch.capacity} Open
                    </span>
                  </div>

                  <Button
                    variant={isFull ? 'secondary' : 'primary'}
                    className="w-full"
                    disabled={isFull}
                    isLoading={bookingIdInFlight === sch.id}
                    leftIcon={<CalendarCheck className="w-4 h-4" />}
                    onClick={() => handleBookClass(sch)}
                  >
                    {isFull ? 'Session Full' : 'Book Class Seat'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


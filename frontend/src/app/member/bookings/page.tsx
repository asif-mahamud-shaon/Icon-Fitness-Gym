'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { CalendarCheck, XCircle, Search, Clock } from 'lucide-react';
import { apiFetch, formatDate } from '@/lib/api';
import { ClassSchedule } from '@/types';
import { useToast } from '@/context/ToastContext';
import { Card, Button, StatusBadge, Skeleton, EmptyState } from '@/components/ui';

export default function MemberBookingsPage() {
  const { toast } = useToast();
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsRes, schedulesRes] = await Promise.all([
        apiFetch<any[]>('/bookings/my'),
        apiFetch<ClassSchedule[]>('/schedules/public'),
      ]);
      setMyBookings(bookingsRes);
      setSchedules(schedulesRes);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSchedules = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return schedules;
    return schedules.filter(
      (s) =>
        Boolean(s.gymClass?.title?.toLowerCase().includes(q)) ||
        String(s.dayOfWeek).toLowerCase().includes(q) ||
        String(s.trainerProfile?.user?.fullName || '')
          .toLowerCase()
          .includes(q),
    );
  }, [schedules, search]);

  const handleBook = async (scheduleId: string) => {
    setActionId(scheduleId);
    try {
      await apiFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify({ classScheduleId: scheduleId }),
      });
      toast({
        title: 'Seat Reserved!',
        description: 'Your class booking is confirmed.',
        variant: 'success',
      });
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Booking Failed',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (bookingId: string) => {
    setActionId(bookingId);
    try {
      await apiFetch(`/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({
          cancellationReason: 'Cancelled by member via Member Portal',
        }),
      });
      toast({
        title: 'Booking Cancelled',
        description: 'Your seat has been released back to the class schedule.',
        variant: 'info',
      });
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Cancellation Restricted',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Class Bookings &amp; Schedule
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Member Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Reserve &amp; Manage Classes</span>
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#141414] border border-[#2C2C2C] rounded-xl px-3.5 h-10 w-full sm:w-72">
          <Search className="w-4 h-4 text-[#A1A1AA] shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter classes, day, coach..."
            className="w-full bg-transparent text-xs text-white placeholder:text-[#A1A1AA] focus:outline-none"
          />
        </div>
      </div>

      {/* Reservations Table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2C2C2C] flex items-center justify-between">
          <h2 className="text-base font-bold text-white">
            My Reservations &amp; History ({myBookings.length})
          </h2>
        </div>
        {myBookings.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No Class Bookings Yet"
              description="Select any available class slot below to book your first session."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#171717] border-b border-[#2C2C2C] text-xs font-semibold text-[#A1A1AA]">
                  <th className="py-3.5 px-5">Class</th>
                  <th className="py-3.5 px-5">Day &amp; Time</th>
                  <th className="py-3.5 px-5">Trainer</th>
                  <th className="py-3.5 px-5">Session Date</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C2C2C]">
                {myBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#171717]/60 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-white">
                      {b.classSchedule?.gymClass?.title}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs text-[#C7F464]">
                      {b.classSchedule?.dayOfWeek} •{' '}
                      {b.classSchedule?.startTime}–{b.classSchedule?.endTime}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#A1A1AA]">
                      {b.classSchedule?.trainerProfile?.user?.fullName || 'Coach'}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs text-white">
                      {formatDate(b.sessionDate)}
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {b.status === 'CONFIRMED' && (
                        <Button
                          variant="danger"
                          size="sm"
                          isLoading={actionId === b.id}
                          leftIcon={<XCircle className="w-3.5 h-3.5" />}
                          onClick={() => handleCancel(b.id)}
                        >
                          Cancel Seat
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Available Class Slots */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          Available Weekly Class Sessions ({filteredSchedules.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchedules.map((sch) => {
            const available = Math.max(0, sch.capacity - sch.bookedCount);
            const isFull = available === 0;

            return (
              <Card
                key={sch.id}
                className="flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={sch.dayOfWeek} />
                    <span className="text-xs font-mono text-[#C7F464] inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {sch.startTime} – {sch.endTime}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {sch.gymClass.title}
                  </h3>
                  <p className="text-xs text-[#A1A1AA]">
                    Coach: {sch.trainerProfile?.user?.fullName} •{' '}
                    {sch.roomOrZone}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#2C2C2C] space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#A1A1AA]">Seats Remaining</span>
                    <span
                      className={
                        isFull
                          ? 'text-red-400 font-bold'
                          : 'text-emerald-400 font-semibold'
                      }
                    >
                      {available} / {sch.capacity}
                    </span>
                  </div>
                  <Button
                    variant={isFull ? 'secondary' : 'primary'}
                    size="sm"
                    className="w-full"
                    disabled={isFull}
                    isLoading={actionId === sch.id}
                    leftIcon={<CalendarCheck className="w-4 h-4" />}
                    onClick={() => handleBook(sch.id)}
                  >
                    {isFull ? 'Class Full' : 'Reserve Seat'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Calendar, Clock, Search, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Card, Button, StatusBadge, Skeleton, EmptyState } from '@/components/ui';

export default function TrainerSchedulePage() {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [schRes, bookRes] = await Promise.all([
        apiFetch<any[]>('/schedules'),
        apiFetch<any>('/bookings'),
      ]);
      setSchedules(schRes);
      setBookings(bookRes.items || bookRes || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter(
      (b) =>
        String(b.memberProfile?.user?.fullName || '').toLowerCase().includes(q) ||
        String(b.memberProfile?.memberCode || '').toLowerCase().includes(q) ||
        String(b.classSchedule?.gymClass?.title || '').toLowerCase().includes(q),
    );
  }, [bookings, search]);

  const handleMarkAttendance = async (
    booking: any,
    status: 'PRESENT' | 'LATE' | 'ABSENT',
  ) => {
    try {
      await apiFetch('/attendance', {
        method: 'POST',
        body: JSON.stringify({
          classScheduleId: booking.classScheduleId,
          memberProfileId: booking.memberProfileId,
          bookingId: booking.id,
          sessionDate: booking.sessionDate,
          status,
        }),
      });
      toast({
        title: `Attendance Marked: ${status}`,
        description: `${booking.memberProfile?.user?.fullName} marked as ${status}.`,
        variant: 'success',
      });
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Attendance Error',
        description: err.message,
        variant: 'error',
      });
    }
  };

  if (loading) {
    return <Skeleton className="h-80" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Class Schedule &amp; Attendance
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Coach Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Schedule &amp; Check-In Roster</span>
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#141414] border border-[#2C2C2C] rounded-xl px-3.5 h-10 w-full sm:w-80">
          <Search className="w-4 h-4 text-[#A1A1AA] shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member or class..."
            className="w-full bg-transparent text-xs text-white placeholder:text-[#A1A1AA] focus:outline-none"
          />
        </div>
      </div>

      {/* Scheduled Sessions Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schedules.map((s) => (
          <Card key={s.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <StatusBadge status={s.dayOfWeek} />
              <span className="text-xs font-mono text-[#C7F464] inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {s.startTime} – {s.endTime}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">
              {s.gymClass?.title}
            </h3>
            <div className="flex items-center justify-between text-xs text-[#A1A1AA] pt-2 border-t border-[#2C2C2C]">
              <span>{s.roomOrZone}</span>
              <span className="font-mono text-white">
                {s.bookedCount}/{s.capacity} Reserved
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Attendance Roster Table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2C2C2C] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#C7F464]" />
            <h2 className="text-base font-bold text-white">
              Booked Member Roster ({filteredBookings.length})
            </h2>
          </div>
          <span className="text-xs font-mono text-[#A1A1AA]">
            Click status to record attendance
          </span>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Calendar className="w-6 h-6" />}
              title="No Class Bookings Found"
              description="When members reserve seats in your classes, they appear here for check-in."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#171717] border-b border-[#2C2C2C] text-xs font-semibold text-[#A1A1AA]">
                  <th className="py-3.5 px-5">Member</th>
                  <th className="py-3.5 px-5">Class &amp; Slot</th>
                  <th className="py-3.5 px-5">Booking Status</th>
                  <th className="py-3.5 px-5">Attendance</th>
                  <th className="py-3.5 px-5 text-right">Record Check-In</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C2C2C]">
                {filteredBookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-[#171717]/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-white">
                        {b.memberProfile?.user?.fullName}
                      </p>
                      <p className="text-xs font-mono text-[#A1A1AA]">
                        {b.memberProfile?.memberCode}
                      </p>
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="text-white font-medium">
                        {b.classSchedule?.gymClass?.title}
                      </p>
                      <p className="text-xs font-mono text-[#C7F464]">
                        {b.classSchedule?.dayOfWeek} {b.classSchedule?.startTime}
                      </p>
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={b.attendance?.status || 'UNRECORDED'} />
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex justify-end flex-wrap gap-1.5">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleMarkAttendance(b, 'PRESENT')}
                        >
                          Present
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleMarkAttendance(b, 'LATE')}
                        >
                          Late
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleMarkAttendance(b, 'ABSENT')}
                        >
                          Absent
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

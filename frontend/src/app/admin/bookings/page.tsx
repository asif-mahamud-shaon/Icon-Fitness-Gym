'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CalendarCheck, Plus, XCircle, Calendar, Users } from 'lucide-react';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Booking, ClassSchedule, MemberProfile, PaginatedResult } from '@/types';
import {
  Card,
  Button,
  Input,
  Select,
  StatusBadge,
  Modal,
  Skeleton,
  EmptyState,
} from '@/components/ui';

export default function AdminBookingsPage() {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    classScheduleId: '',
    memberProfileId: '',
    sessionDate: new Date().toISOString().slice(0, 10),
  });

  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState(
    'Cancelled by admin at front desk',
  );
  const [cancelling, setCancelling] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = statusFilter ? `?status=${statusFilter}&limit=50` : '?limit=50';
      const [bkRes, schRes, memRes] = await Promise.all([
        apiFetch<PaginatedResult<Booking>>(`/bookings${qs}`),
        apiFetch<ClassSchedule[]>('/schedules'),
        apiFetch<PaginatedResult<MemberProfile>>('/members?limit=100'),
      ]);
      setBookings(bkRes?.items || []);
      setSchedules(Array.isArray(schRes) ? schRes : []);
      setMembers(memRes?.items || []);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify(createForm),
      });
      showToast('success', 'Class seat booked for member.');
      setCreateOpen(false);
      loadData();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleCancelBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await apiFetch(`/bookings/${cancelTarget.id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ cancellationReason: cancelReason }),
      });
      showToast('success', 'Booking cancelled and seat released.');
      setCancelTarget(null);
      loadData();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Booking Management
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Class Reservations &amp; Seat Control</span>
          </p>
        </div>
        <Button
          onClick={() => {
            setCreateForm({
              classScheduleId: schedules[0]?.id || '',
              memberProfileId: members[0]?.id || '',
              sessionDate: new Date().toISOString().slice(0, 10),
            });
            setCreateOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> Assisted Member Booking
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Loaded Bookings</p>
            <p className="text-2xl font-bold text-white font-mono mt-0.5">{bookings.length}</p>
          </div>
          <CalendarCheck className="w-5 h-5 text-[#C7F464]" />
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Confirmed Seats</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">
              {bookings.filter((b: any) => b.status === 'CONFIRMED').length}
            </p>
          </div>
          <CalendarCheck className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Cancelled / No-Show</p>
            <p className="text-2xl font-bold text-amber-400 font-mono mt-0.5">
              {bookings.filter((b: any) => b.status === 'CANCELLED' || b.status === 'NO_SHOW').length}
            </p>
          </div>
          <XCircle className="w-5 h-5 text-amber-400" />
        </div>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-[#A1A1AA]">
          Bookings enforce active membership verification, seat capacity limits,
          and duplicate reservation protection.
        </p>
        <div className="w-full sm:w-64">
          <Select
            options={[
              { value: '', label: 'All Booking Statuses' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'COMPLETED', label: 'Completed / Attended' },
              { value: 'CANCELLED', label: 'Cancelled' },
              { value: 'NO_SHOW', label: 'No Show' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </Card>

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="w-6 h-6" />}
          title="No Class Bookings"
          description="Members can reserve class seats from the Member Portal, or staff can book on their behalf."
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#303030] bg-[#171717] text-[11px] font-mono uppercase text-[#A1A1AA]">
                  <th className="py-3.5 px-4">Member</th>
                  <th className="py-3.5 px-4">Class Session</th>
                  <th className="py-3.5 px-4">Session Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#303030] text-sm">
                {bookings.map((bk: any) => (
                  <tr key={bk.id} className="hover:bg-[#171717]/60">
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-white">
                        {bk.memberProfile?.user?.fullName || 'Member'}
                      </p>
                      <p className="text-xs font-mono text-[#C7F464]">
                        {bk.memberProfile?.memberCode}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-white font-medium">
                        {bk.classSchedule?.gymClass?.title ||
                          bk.classSchedule?.gymClass?.name ||
                          'Scheduled Session'}
                      </p>
                      <p className="text-xs text-[#A1A1AA]">
                        {bk.classSchedule?.dayOfWeek}{' '}
                        {bk.classSchedule?.startTime}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-zinc-300">
                      {new Date(
                        bk.sessionDate || bk.bookedAt,
                      ).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={bk.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {bk.status === 'CONFIRMED' && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            setCancelTarget(bk);
                            setCancelReason('Cancelled by staff at front desk');
                          }}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Assisted Booking Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Assisted Member Class Booking"
        maxWidth="max-w-2xl"
      >
        {(() => {
          const selMember = members.find((m) => m.id === createForm.memberProfileId);
          const selSchedule = schedules.find((s) => s.id === createForm.classScheduleId);
          const booked = selSchedule?.bookedCount ?? 0;
          const cap = selSchedule?.capacity ?? 20;
          const spotsLeft = Math.max(0, cap - booked);

          return (
            <form onSubmit={handleCreateBooking} className="space-y-5">
              {/* Live Reservation Preview Card */}
              <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#1B2210] border border-[#C7F464]/35 flex items-center justify-center text-[#C7F464] shrink-0">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">
                      Front-Desk Seat Reservation
                    </p>
                    <p className="text-sm font-bold text-white truncate">
                      {selMember?.user?.fullName || 'Choose a member'}
                    </p>
                    <p className="text-xs text-[#A1A1AA] truncate">
                      {selSchedule
                        ? `${selSchedule.gymClass?.title || selSchedule.gymClass?.name} • ${selSchedule.dayOfWeek} ${selSchedule.startTime}`
                        : 'Choose a scheduled class'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1B2210] border border-[#C7F464]/35 text-[11px] font-mono font-bold text-[#C7F464]">
                    <Users className="w-3 h-3" />
                    {spotsLeft} / {cap} seats open
                  </span>
                </div>
              </div>

              {/* Section 1: Member & Class Selection */}
              <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#A1A1AA]">
                  1 • Member & Class Selection
                </p>
                <Select
                  label="Member *"
                  required
                  options={members.map((m) => ({
                    value: m.id,
                    label: `${m.memberCode} — ${m.user?.fullName || 'Member'}`,
                  }))}
                  value={createForm.memberProfileId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, memberProfileId: e.target.value })
                  }
                />
                <Select
                  label="Scheduled Session *"
                  required
                  options={schedules.map((s) => ({
                    value: s.id,
                    label: `${s.gymClass?.title || s.gymClass?.name} — ${s.dayOfWeek} ${s.startTime} (${s.bookedCount}/${s.capacity})`,
                  }))}
                  value={createForm.classScheduleId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, classScheduleId: e.target.value })
                  }
                />
              </div>

              {/* Section 2: Target Date */}
              <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#A1A1AA]">
                    2 • Session Date
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#71717A]">
                    <Calendar className="w-3 h-3" />
                    Immediate booking confirmation
                  </span>
                </div>
                <Input
                  label="Session Date *"
                  type="date"
                  required
                  value={createForm.sessionDate}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, sessionDate: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-[#262626]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={creating}>
                  Confirm Seat Reservation
                </Button>
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* Cancel Booking Modal */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel Class Booking"
      >
        {cancelTarget && (
          <form onSubmit={handleCancelBooking} className="space-y-4">
            <Input
              label="Cancellation Reason"
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-[#303030]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCancelTarget(null)}
              >
                Back
              </Button>
              <Button type="submit" variant="danger" isLoading={cancelling}>
                Cancel Booking & Release Seat
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CheckSquare, Plus, Calendar, UserCheck, Check } from 'lucide-react';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  MemberProfile,
  Booking,
  ClassSchedule,
  PaginatedResult,
} from '@/types';
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

export default function AdminAttendancePage() {
  const { showToast } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    classScheduleId: '',
    memberProfileId: '',
    bookingId: '',
    sessionDate: new Date().toISOString().slice(0, 10),
    status: 'PRESENT',
    remarks: 'Checked in at Ashkona reception desk',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [attRes, schRes, memRes, bkRes] = await Promise.all([
        apiFetch<any[]>('/attendance'),
        apiFetch<ClassSchedule[]>('/schedules'),
        apiFetch<PaginatedResult<MemberProfile>>('/members?limit=100'),
        apiFetch<PaginatedResult<Booking>>(
          '/bookings?status=CONFIRMED&limit=100',
        ),
      ]);
      setRecords(Array.isArray(attRes) ? attRes : []);
      setSchedules(Array.isArray(schRes) ? schRes : []);
      setMembers(memRes?.items || []);
      setBookings(bkRes?.items || []);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/attendance', {
        method: 'POST',
        body: JSON.stringify({
          classScheduleId: form.classScheduleId,
          memberProfileId: form.memberProfileId,
          bookingId: form.bookingId || undefined,
          sessionDate: form.sessionDate,
          status: form.status,
          remarks: form.remarks || undefined,
        }),
      });
      showToast('success', 'Member attendance recorded.');
      setModalOpen(false);
      loadData();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const memberBookings = bookings.filter(
    (b) => b.memberProfileId === form.memberProfileId,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Attendance Tracking
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Floor Access &amp; Class Check-In</span>
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({
              classScheduleId: schedules[0]?.id || '',
              memberProfileId: members[0]?.id || '',
              bookingId: '',
              sessionDate: new Date().toISOString().slice(0, 10),
              status: 'PRESENT',
              remarks: 'Verified at reception desk',
            });
            setModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> Record Member Check-In
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Total Attendance Logs</p>
            <p className="text-2xl font-bold text-white font-mono mt-0.5">{records.length}</p>
          </div>
          <CheckSquare className="w-5 h-5 text-[#C7F464]" />
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Present Check-Ins</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">
              {records.filter((r) => r.status === 'PRESENT').length}
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400">VERIFIED</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Late / Absent</p>
            <p className="text-2xl font-bold text-amber-400 font-mono mt-0.5">
              {records.filter((r) => r.status === 'LATE' || r.status === 'ABSENT').length}
            </p>
          </div>
          <span className="text-xs font-mono text-amber-400">FLAGGED</span>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : records.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-6 h-6" />}
          title="No Attendance Logs Yet"
          description="Record member gym floor check-ins or class attendance from the front desk."
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#303030] bg-[#171717] text-[11px] font-mono uppercase text-[#A1A1AA]">
                  <th className="py-3.5 px-4">Member</th>
                  <th className="py-3.5 px-4">Session Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Class Session</th>
                  <th className="py-3.5 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#303030] text-sm">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#171717]/60">
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-white">
                        {rec.memberProfile?.user?.fullName || 'Member'}
                      </p>
                      <p className="text-xs font-mono text-[#C7F464]">
                        {rec.memberProfile?.memberCode}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-zinc-300">
                      {new Date(
                        rec.sessionDate || rec.recordedAt,
                      ).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-zinc-300">
                      {rec.classSchedule?.gymClass?.title ||
                        rec.classSchedule?.gymClass?.name ||
                        'Class Session'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#A1A1AA]">
                      {rec.remarks || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Member Attendance"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleMarkAttendance} className="space-y-5 max-h-[78vh] overflow-y-auto pr-1">
          {/* Live Check-in Preview Header */}
          <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-[#1B2210] border border-[#C7F464]/35 flex items-center justify-center text-[#C7F464] shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">
                  Live Reception Check-in
                </p>
                <p className="text-sm font-bold text-white truncate">
                  {members.find((m) => m.id === form.memberProfileId)?.user?.fullName ||
                    'Select a member to log'}
                </p>
                <p className="text-xs text-[#A1A1AA] truncate">
                  {schedules.find((s) => s.id === form.classScheduleId)?.gymClass?.title ||
                    schedules.find((s) => s.id === form.classScheduleId)?.gymClass?.name ||
                    'Select class session'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1B2210] border border-[#C7F464]/35 text-[11px] font-mono font-bold text-[#C7F464]">
                <Calendar className="w-3 h-3" />
                {form.sessionDate || 'Today'}
              </span>
              <StatusBadge status={form.status} />
            </div>
          </div>

          {/* Section 1: Member & Class Session */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#A1A1AA]">
              1 • Member & Session Assignment
            </p>
            <Select
              label="Member *"
              required
              options={members.map((m) => ({
                value: m.id,
                label: `${m.memberCode} — ${m.user?.fullName || 'Member'}`,
              }))}
              value={form.memberProfileId}
              onChange={(e) =>
                setForm({
                  ...form,
                  memberProfileId: e.target.value,
                  bookingId: '',
                })
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Class Schedule Session *"
                required
                options={schedules.map((s) => ({
                  value: s.id,
                  label: `${s.gymClass?.title || s.gymClass?.name} (${s.dayOfWeek} ${s.startTime})`,
                }))}
                value={form.classScheduleId}
                onChange={(e) =>
                  setForm({ ...form, classScheduleId: e.target.value })
                }
              />
              <Select
                label="Link Confirmed Booking"
                options={[
                  { value: '', label: 'Walk-in / General Session' },
                  ...memberBookings.map((b: any) => ({
                    value: b.id,
                    label: `${b.classSchedule?.gymClass?.title || 'Class'} (${new Date(b.sessionDate || b.bookedAt).toLocaleDateString()})`,
                  })),
                ]}
                value={form.bookingId}
                onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
              />
            </div>
          </div>

          {/* Section 2: Date, Status Pills & Remarks */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#A1A1AA]">
              2 • Attendance Verification
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase text-[#A1A1AA]">
                Attendance Status *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: 'PRESENT', label: 'Present' },
                  { value: 'LATE', label: 'Late' },
                  { value: 'ABSENT', label: 'Absent' },
                  { value: 'EXCUSED', label: 'Excused' },
                ].map((opt) => {
                  const active = form.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, status: opt.value })}
                      className={`inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        active
                          ? 'bg-[#C7F464] border-[#C7F464] text-[#0B0B0B] font-bold shadow-sm'
                          : 'bg-[#171717] border-[#2C2C2C] text-[#D4D4D8] hover:border-[#C7F464]/50 hover:text-white'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5" />}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Session Date *"
                type="date"
                required
                value={form.sessionDate}
                onChange={(e) =>
                  setForm({ ...form, sessionDate: e.target.value })
                }
              />
              <Input
                label="Front Desk Remarks"
                placeholder="Verified at Ashkona reception desk"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[#262626]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              Save Attendance Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

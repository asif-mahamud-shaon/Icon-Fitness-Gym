'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Clock, Plus, XCircle, Dumbbell, MapPin, Users } from 'lucide-react';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { ClassSchedule, GymClassItem, TrainerProfile, DayOfWeek } from '@/types';
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

const DAY_OPTIONS: Array<{ value: DayOfWeek; label: string }> = [
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
];

export default function AdminSchedulesPage() {
  const { showToast } = useToast();
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [classes, setClasses] = useState<GymClassItem[]>([]);
  const [trainers, setTrainers] = useState<TrainerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    gymClassId: '',
    trainerProfileId: '',
    dayOfWeek: 'SATURDAY' as DayOfWeek,
    startTime: '18:00',
    endTime: '19:00',
    roomOrZone: 'Main Ashkona Studio Floor',
    capacity: '20',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [schRes, clsRes, trRes] = await Promise.all([
        apiFetch<ClassSchedule[]>('/schedules'),
        apiFetch<GymClassItem[]>('/classes'),
        apiFetch<TrainerProfile[]>('/trainers'),
      ]);
      setSchedules(Array.isArray(schRes) ? schRes : []);
      setClasses(Array.isArray(clsRes) ? clsRes : []);
      setTrainers(Array.isArray(trRes) ? trRes : []);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/schedules', {
        method: 'POST',
        body: JSON.stringify({
          gymClassId: form.gymClassId,
          trainerProfileId: form.trainerProfileId,
          dayOfWeek: form.dayOfWeek,
          startTime: form.startTime,
          endTime: form.endTime,
          roomOrZone: form.roomOrZone,
          capacity: Number(form.capacity),
        }),
      });
      showToast('success', 'Class schedule slot published.');
      setModalOpen(false);
      loadData();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleCancel = async (sch: ClassSchedule) => {
    try {
      await apiFetch(`/schedules/${sch.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isCancelled: !sch.isCancelled }),
      });
      showToast(
        'success',
        `Schedule ${!sch.isCancelled ? 'cancelled' : 'restored'}.`,
      );
      loadData();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Class Schedules
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Timetable &amp; Seat Allocation</span>
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({
              gymClassId: classes[0]?.id || '',
              trainerProfileId: trainers[0]?.id || '',
              dayOfWeek: 'SATURDAY',
              startTime: '18:00',
              endTime: '19:00',
              roomOrZone: 'Main Ashkona Studio Floor',
              capacity: String(classes[0]?.defaultCapacity || 20),
            });
            setModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> Schedule Class Session
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Total Weekly Slots</p>
            <p className="text-2xl font-bold text-white font-mono mt-0.5">{schedules.length}</p>
          </div>
          <Clock className="w-5 h-5 text-[#C7F464]" />
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Active Slots</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">
              {schedules.filter((s) => !s.isCancelled).length}
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400">LIVE</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Total Seats Booked</p>
            <p className="text-2xl font-bold text-white font-mono mt-0.5">
              {schedules.reduce((sum, s) => sum + Number(s.bookedCount || 0), 0)}
            </p>
          </div>
          <span className="text-xs font-mono text-[#C7F464]">BOOKINGS</span>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-6 h-6" />}
          title="No Scheduled Sessions"
          description="Create weekly class schedule slots for members to reserve."
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#303030] bg-[#171717] text-[11px] font-mono uppercase text-[#A1A1AA]">
                  <th className="py-3.5 px-4">Class & Studio</th>
                  <th className="py-3.5 px-4">Day & Time</th>
                  <th className="py-3.5 px-4">Coach</th>
                  <th className="py-3.5 px-4">Seats Booked</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#303030] text-sm">
                {schedules.map((sch) => (
                  <tr key={sch.id} className="hover:bg-[#171717]/60">
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-white">
                        {sch.gymClass?.title || sch.gymClass?.name || 'Class'}
                      </p>
                      <p className="text-xs text-[#A1A1AA]">
                        {sch.roomOrZone || sch.roomName || 'Main Studio'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-zinc-300">
                      <span className="text-[#C7F464] block">
                        {sch.dayOfWeek}
                      </span>
                      {sch.startTime} – {sch.endTime}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300">
                      {sch.trainerProfile?.user?.fullName || 'Staff Coach'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span className="text-white font-bold">
                        {sch.bookedCount}
                      </span>{' '}
                      / <span className="text-[#A1A1AA]">{sch.capacity}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge
                        status={sch.isCancelled ? 'CANCELLED' : 'ACTIVE'}
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant={sch.isCancelled ? 'outline' : 'danger'}
                        onClick={() => toggleCancel(sch)}
                      >
                        <XCircle className="w-3.5 h-3.5" />{' '}
                        {sch.isCancelled ? 'Restore' : 'Cancel Slot'}
                      </Button>
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
        title="Schedule Class Session"
        maxWidth="max-w-2xl"
      >
        {(() => {
          const selClass = classes.find((c) => c.id === form.gymClassId);
          const selTrainer = trainers.find((t) => t.id === form.trainerProfileId);

          return (
            <form onSubmit={handleCreateSchedule} className="space-y-5 max-h-[78vh] overflow-y-auto pr-1">
              {/* Live Session Preview */}
              <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#1B2210] border border-[#C7F464]/35 flex items-center justify-center text-[#C7F464] shrink-0">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">
                      {form.dayOfWeek} • {form.startTime || '--:--'} – {form.endTime || '--:--'}
                    </p>
                    <p className="text-sm font-bold text-white truncate">
                      {selClass?.title || selClass?.name || 'Select class format'}
                    </p>
                    <p className="text-xs text-[#A1A1AA] truncate">
                      Coach: {selTrainer?.user?.fullName || 'Select trainer'} •{' '}
                      {form.roomOrZone || 'Studio Floor'}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1B2210] border border-[#C7F464]/35 text-[11px] font-mono font-bold text-[#C7F464] shrink-0">
                  <Users className="w-3 h-3" />
                  {form.capacity || 0} Seats
                </span>
              </div>

              {/* Section 1: Class Format & Coach */}
              <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#A1A1AA]">
                  1 • Class Format & Coach Assignment
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Gym Class Format *"
                    required
                    options={classes.map((c) => ({
                      value: c.id,
                      label: `${c.title || c.name} (${c.durationMinutes} min)`,
                    }))}
                    value={form.gymClassId}
                    onChange={(e) => setForm({ ...form, gymClassId: e.target.value })}
                  />
                  <Select
                    label="Assigned Trainer *"
                    required
                    options={trainers.map((t) => ({
                      value: t.id,
                      label: t.user?.fullName || 'Trainer',
                    }))}
                    value={form.trainerProfileId}
                    onChange={(e) =>
                      setForm({ ...form, trainerProfileId: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Section 2: Day of Week Pills, Timing & Studio */}
              <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#A1A1AA]">
                  2 • Weekly Slot, Capacity & Studio Zone
                </p>

                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase text-[#A1A1AA]">
                    Day of Week *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAY_OPTIONS.map((d) => {
                      const active = form.dayOfWeek === d.value;
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => setForm({ ...form, dayOfWeek: d.value })}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                            active
                              ? 'bg-[#C7F464] border-[#C7F464] text-[#0B0B0B] font-bold shadow-sm'
                              : 'bg-[#171717] border-[#2C2C2C] text-[#D4D4D8] hover:border-[#C7F464]/50 hover:text-white'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Start Time *"
                    type="time"
                    required
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  />
                  <Input
                    label="End Time *"
                    type="time"
                    required
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  />
                  <Input
                    label="Seat Capacity *"
                    type="number"
                    required
                    min={1}
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  />
                </div>

                <div className="relative">
                  <Input
                    label="Studio / Zone Name"
                    placeholder="e.g. Main Ashkona Studio Floor"
                    value={form.roomOrZone}
                    onChange={(e) => setForm({ ...form, roomOrZone: e.target.value })}
                  />
                  <MapPin className="w-4 h-4 text-[#71717A] absolute right-3.5 bottom-3 pointer-events-none" />
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
                  Publish Class Session
                </Button>
              </div>
            </form>
          );
        })()}
      </Modal>
    </div>
  );
}

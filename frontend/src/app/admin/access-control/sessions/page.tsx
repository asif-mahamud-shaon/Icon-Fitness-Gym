'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CalendarClock, Plus, Power, Edit, CalendarOff } from 'lucide-react';
import { apiFetch, formatDate } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Card,
  Button,
  StatusBadge,
  Modal,
  Input,
  Select,
  Textarea,
  Skeleton,
} from '@/components/ui';

const DAYS = [
  'ALL',
  'SATURDAY',
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
];

export default function AdminGymSessionsPage() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [dayFilter, setDayFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    sessionType: 'FEMALE_SESSION',
    dayOfWeek: 'SATURDAY',
    startTime: '14:15',
    endTime: '17:15',
    maxCapacity: '40',
    accessRulesNotes: '',
  });

  const [excModalOpen, setExcModalOpen] = useState(false);
  const [excForm, setExcForm] = useState({
    exceptionDate: new Date().toISOString().slice(0, 10),
    exceptionType: 'HOLIDAY',
    title: '',
    description: '',
    isGymClosed: true,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const q =
        dayFilter !== 'ALL'
          ? `?dayOfWeek=${encodeURIComponent(dayFilter)}`
          : '';
      const [sesRes, excRes] = await Promise.all([
        apiFetch<any[]>(`/access-control/sessions${q}`),
        apiFetch<any[]>('/access-control/session-exceptions').catch(() => []),
      ]);
      setSessions(sesRes);
      setExceptions(excRes);
    } finally {
      setLoading(false);
    }
  }, [dayFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingSession(null);
    setForm({
      name: 'Dedicated Ladies Session',
      sessionType: 'FEMALE_SESSION',
      dayOfWeek: dayFilter === 'ALL' ? 'SATURDAY' : dayFilter,
      startTime: '14:15',
      endTime: '17:15',
      maxCapacity: '40',
      accessRulesNotes:
        'Only Female Members with active memberships may enter. Requires a checked-in Female Trainer.',
    });
    setSessionModalOpen(true);
  };

  const openEditModal = (s: any) => {
    setEditingSession(s);
    setForm({
      name: s.name,
      sessionType: s.sessionType,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      maxCapacity: String(s.maxCapacity || 50),
      accessRulesNotes: s.accessRulesNotes || '',
    });
    setSessionModalOpen(true);
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        sessionType: form.sessionType,
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        maxCapacity: Number(form.maxCapacity),
        accessRulesNotes: form.accessRulesNotes,
      };

      if (editingSession) {
        await apiFetch(`/access-control/sessions/${editingSession.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast({ title: 'Gym Session Updated', variant: 'success' });
      } else {
        await apiFetch('/access-control/sessions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast({ title: 'Gym Session Created', variant: 'success' });
      }
      setSessionModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Session Configuration Error',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (s: any) => {
    try {
      await apiFetch(`/access-control/sessions/${s.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !s.isActive }),
      });
      toast({
        title: `Session ${!s.isActive ? 'Activated' : 'Deactivated'}`,
        variant: 'info',
      });
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Error Updating Session',
        description: err.message,
        variant: 'error',
      });
    }
  };

  const handleCreateException = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/access-control/session-exceptions', {
        method: 'POST',
        body: JSON.stringify(excForm),
      });
      toast({
        title: 'Holiday / Closure Exception Saved',
        variant: 'success',
      });
      setExcModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Exception Error',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-80" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            GYM SESSION MANAGEMENT
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span> Access Control{' '}
            <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Gender Sessions (Asia/Dhaka)</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openCreateModal}
          >
            New Session Window
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<CalendarOff className="w-4 h-4" />}
            onClick={() => setExcModalOpen(true)}
          >
            Add Holiday / Exception
          </Button>
        </div>
      </div>

      {/* Day Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {DAYS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDayFilter(d)}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider border transition-colors ${
              dayFilter === d
                ? 'bg-[#C7F464] text-[#090909] border-[#C7F464] font-bold'
                : 'bg-[#141414] text-[#A1A1AA] border-[#2C2C2C] hover:text-white'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sessions.map((s) => (
          <Card key={s.id} className="flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <StatusBadge status={s.sessionType} />
                <span className="text-xs font-mono text-[#C7F464] font-bold">
                  {s.dayOfWeek} • {s.startTime} – {s.endTime}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">{s.name}</h2>
              <p className="text-xs text-[#A1A1AA]">
                {s.accessRulesNotes ||
                  (s.sessionType === 'FEMALE_SESSION'
                    ? 'Female Members Only + Checked-In Female Trainer Required'
                    : 'Male & Female Members Permitted')}
              </p>

              {s.sessionType === 'FEMALE_SESSION' && (
                <div className="p-2.5 rounded-lg bg-[#171717] border border-[#303030] text-xs">
                  <span className="text-[#A1A1AA] block">
                    Assigned Female Trainer:
                  </span>
                  <span className="text-white font-semibold">
                    {s.trainerAssignments?.[0]?.trainerProfile?.user
                      ?.fullName || 'Unassigned (Entry Will Block)'}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#303030] flex items-center justify-between gap-2">
              <StatusBadge status={s.isActive ? 'ACTIVE' : 'DEACTIVATED'} />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Edit className="w-3.5 h-3.5" />}
                  onClick={() => openEditModal(s)}
                >
                  Edit
                </Button>
                <Button
                  variant={s.isActive ? 'danger' : 'primary'}
                  size="sm"
                  leftIcon={<Power className="w-3.5 h-3.5" />}
                  onClick={() => handleToggleActive(s)}
                >
                  {s.isActive ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Holiday / Closure Exceptions */}
      {exceptions.length > 0 && (
        <Card className="space-y-4">
          <h2 className="text-lg font-bold text-white uppercase font-display tracking-wide">
            Scheduled Holiday &amp; Closure Exceptions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exceptions.map((ex) => (
              <div
                key={ex.id}
                className="p-3.5 rounded-lg bg-[#171717] border border-[#303030] flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-bold text-white">{ex.title}</p>
                  <p className="text-xs text-[#A1A1AA]">
                    {formatDate(ex.exceptionDate)} • {ex.exceptionType}
                  </p>
                </div>
                <StatusBadge
                  status={ex.isGymClosed ? 'CLOSED' : 'MODIFIED_HOURS'}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Create / Edit Session Modal */}
      <Modal
        isOpen={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        title={
          editingSession
            ? 'Edit Gym Session Window'
            : 'Create Gym Session Window'
        }
        description="All session times are evaluated in Asia/Dhaka (UTC+06:00). Overlapping active sessions on the same day are automatically prevented."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveSession} className="space-y-5">
          {/* Live Session Window Summary Banner */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#C7F464]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#C7F464] text-[#090909] flex items-center justify-center shrink-0">
                <CalendarClock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#C7F464]">
                  {form.dayOfWeek} • {form.startTime || '—'} –{' '}
                  {form.endTime || '—'} (ASIA/DHAKA)
                </p>
                <p className="text-sm font-bold text-white truncate">
                  {form.name || 'New Gym Session Window'}
                </p>
                <p className="text-xs text-[#A1A1AA] truncate">
                  Capacity: {form.maxCapacity || 40} members •{' '}
                  {form.sessionType === 'FEMALE_SESSION'
                    ? 'Ladies Only + Checked-in Female Trainer'
                    : 'Open to Male & Female Members'}
                </p>
              </div>
            </div>
            <StatusBadge status={form.sessionType} />
          </div>

          <Input
            label="Session Name *"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Dedicated Ladies Session"
          />

          {/* Session Type Toggle Cards */}
          <div className="space-y-2">
            <span className="block text-xs font-mono font-semibold uppercase tracking-wider text-white">
              Access Policy Type *
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  value: 'FEMALE_SESSION',
                  title: 'FEMALE SESSION (Ladies Only)',
                  sub: 'Strictly blocks Male entry; requires checked-in Female Trainer',
                },
                {
                  value: 'MALE_SESSION',
                  title: 'GENERAL / MALE SESSION',
                  sub: 'Allows Male & eligible Female members with active membership',
                },
              ].map((st) => {
                const active = form.sessionType === st.value;
                return (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() =>
                      setForm({ ...form, sessionType: st.value })
                    }
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      active
                        ? 'bg-[#1B2210] border-[#C7F464]'
                        : 'bg-[#141414] border-[#2C2C2C] hover:border-[#C7F464]/50'
                    }`}
                  >
                    <p className="text-xs font-bold text-white">{st.title}</p>
                    <p className="text-[11px] font-mono text-[#A1A1AA] mt-0.5 leading-snug">
                      {st.sub}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day of Week Pills */}
          <div className="space-y-2">
            <span className="block text-xs font-mono font-semibold uppercase tracking-wider text-white">
              Day of Week *
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.filter((d) => d !== 'ALL').map((d) => {
                const active = form.dayOfWeek === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm({ ...form, dayOfWeek: d })}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold uppercase transition-colors ${
                      active
                        ? 'bg-[#C7F464] border-[#C7F464] !text-[#090909]'
                        : 'bg-[#141414] border-[#2C2C2C] text-[#A1A1AA] hover:border-[#C7F464]/50'
                    }`}
                  >
                    {d.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operating Time & Capacity */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
                Operating Hours (24h Asia/Dhaka) &amp; Capacity
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '07:00–13:00', s: '07:00', e: '13:00' },
                  { label: '13:00–15:30', s: '13:00', e: '15:30' },
                  { label: '15:30–23:00', s: '15:30', e: '23:00' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        startTime: preset.s,
                        endTime: preset.e,
                      })
                    }
                    className="px-2 py-0.5 rounded bg-[#171717] border border-[#2C2C2C] text-[10px] font-mono text-[#A1A1AA] hover:border-[#C7F464] hover:text-white"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Start Time (HH:mm) *"
                required
                placeholder="14:15"
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
              />
              <Input
                label="End Time (HH:mm) *"
                required
                placeholder="17:15"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
              <Input
                label="Max Capacity"
                type="number"
                value={form.maxCapacity}
                onChange={(e) =>
                  setForm({ ...form, maxCapacity: e.target.value })
                }
              />
            </div>
          </div>

          <Textarea
            label="Access Rules & Policy Notes"
            value={form.accessRulesNotes}
            onChange={(e) =>
              setForm({ ...form, accessRulesNotes: e.target.value })
            }
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#2C2C2C]">
            <span className="text-xs font-mono text-[#A1A1AA]">
              {form.dayOfWeek} • {form.startTime}–{form.endTime}
            </span>
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSessionModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="ifg-btn-primary"
                isLoading={submitting}
              >
                {editingSession ? 'Save Changes' : 'Create Session'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Exception Modal */}
      <Modal
        isOpen={excModalOpen}
        onClose={() => setExcModalOpen(false)}
        title="Add Holiday or Temporary Closure Exception"
      >
        <form onSubmit={handleCreateException} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date (Asia/Dhaka) *"
              type="date"
              required
              value={excForm.exceptionDate}
              onChange={(e) =>
                setExcForm({ ...excForm, exceptionDate: e.target.value })
              }
            />
            <Select
              label="Exception Type"
              value={excForm.exceptionType}
              onChange={(e) =>
                setExcForm({ ...excForm, exceptionType: e.target.value })
              }
              options={[
                { value: 'HOLIDAY', label: 'Public / Eid Holiday' },
                { value: 'TEMPORARY_CLOSURE', label: 'Temporary Maintenance' },
                { value: 'SPECIAL_EVENT', label: 'Special Gym Event' },
              ]}
            />
          </div>
          <Input
            label="Title *"
            required
            placeholder="e.g. Eid-ul-Fitr Holiday Closure"
            value={excForm.title}
            onChange={(e) => setExcForm({ ...excForm, title: e.target.value })}
          />
          <Textarea
            label="Description"
            value={excForm.description}
            onChange={(e) =>
              setExcForm({ ...excForm, description: e.target.value })
            }
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setExcModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Save Exception
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


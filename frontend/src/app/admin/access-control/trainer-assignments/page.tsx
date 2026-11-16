'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { UserRoundCheck, Plus, ShieldCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Card,
  Button,
  StatusBadge,
  Modal,
  Select,
  Textarea,
  Skeleton,
} from '@/components/ui';

export default function AdminFemaleTrainerAssignmentsPage() {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    gymSessionId: '',
    trainerProfileId: '',
    replacementTrainerProfileId: '',
    notes: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [assignRes, sesRes, trRes] = await Promise.all([
        apiFetch<any[]>('/access-control/trainer-assignments'),
        apiFetch<any[]>('/access-control/sessions'),
        apiFetch<any[]>('/trainers'),
      ]);
      setAssignments(assignRes);
      setSessions(sesRes);
      setTrainers(trRes);

      const femSessions = sesRes.filter(
        (s) => s.sessionType === 'FEMALE_SESSION',
      );
      const femTrainers = trRes.filter((t) => t.gender === 'FEMALE');

      setForm((prev) => ({
        ...prev,
        gymSessionId:
          prev.gymSessionId || femSessions[0]?.id || sesRes[0]?.id || '',
        trainerProfileId:
          prev.trainerProfileId || femTrainers[0]?.id || trRes[0]?.id || '',
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/access-control/trainer-assignments', {
        method: 'POST',
        body: JSON.stringify({
          gymSessionId: form.gymSessionId,
          trainerProfileId: form.trainerProfileId,
          replacementTrainerProfileId:
            form.replacementTrainerProfileId || undefined,
          notes: form.notes || undefined,
        }),
      });
      toast({
        title: 'Session Trainer Assignment Saved',
        description:
          'Remember: Physical trainer check-in is still required on the session day to unlock Female Session entry.',
        variant: 'success',
      });
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Assignment Rejected',
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

  const femaleTrainers = trainers.filter((t) => t.gender === 'FEMALE');

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            FEMALE TRAINER ASSIGNMENTS
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span> Access Control{' '}
            <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Session Duty Roster</span>
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setModalOpen(true)}
        >
          Assign / Replace Session Trainer
        </Button>
      </div>

      <div className="p-4 rounded-2xl bg-[#141414] border border-[#C7F464]/40 flex items-center gap-3 text-xs text-[#A1A1AA]">
        <ShieldCheck className="w-5 h-5 text-[#C7F464] shrink-0" />
        <span>
          <strong className="text-white">Mandatory Business Rule:</strong> Only
          a Female Trainer (gender: <span className="font-mono">FEMALE</span>)
          may be assigned to a <span className="font-mono">FEMALE_SESSION</span>
          . Schedule assignment alone does not unlock member entry—the assigned
          or replacement Female Trainer must also check in under Trainer
          Attendance.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments.map((a) => (
          <Card key={a.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <StatusBadge status={a.gymSession?.sessionType} />
              <span className="text-xs font-mono text-[#C7F464]">
                {a.gymSession?.dayOfWeek} • {a.gymSession?.startTime} –{' '}
                {a.gymSession?.endTime}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">
              {a.gymSession?.name}
            </h2>
            <div className="p-3.5 rounded-lg bg-[#171717] border border-[#303030] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#A1A1AA]">Primary Assigned Trainer:</span>
                <span className="font-semibold text-white">
                  {a.trainerProfile?.user?.fullName} (
                  {a.trainerProfile?.gender})
                </span>
              </div>
              {a.replacementTrainer && (
                <div className="flex items-center justify-between">
                  <span className="text-[#A1A1AA]">Replacement Trainer:</span>
                  <span className="font-semibold text-[#C7F464]">
                    {a.replacementTrainer?.user?.fullName} (
                    {a.replacementTrainer?.gender})
                  </span>
                </div>
              )}
              {a.notes && <p className="text-[#A1A1AA] pt-1">{a.notes}</p>}
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Assign Primary or Replacement Trainer to Session"
        description="Dedicated Female Sessions strictly require an active Female Trainer to be assigned and checked in."
        maxWidth="max-w-2xl"
      >
        {(() => {
          const selectedSession = sessions.find(
            (s) => s.id === form.gymSessionId,
          );
          const selectedPrimary = trainers.find(
            (t) => t.id === form.trainerProfileId,
          );
          const isFemaleSessionTarget =
            selectedSession?.sessionType === 'FEMALE_SESSION';
          const primaryMismatch = Boolean(
            isFemaleSessionTarget &&
              selectedPrimary &&
              selectedPrimary.gender !== 'FEMALE',
          );

          return (
            <form onSubmit={handleAssign} className="space-y-5">
              {/* Live Assignment Preview Banner */}
              <div className="p-4 rounded-2xl bg-[#141414] border border-[#C7F464]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#C7F464] text-[#090909] flex items-center justify-center shrink-0">
                    <UserRoundCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#C7F464]">
                      {selectedSession
                        ? `${selectedSession.dayOfWeek} • ${selectedSession.startTime}–${selectedSession.endTime}`
                        : 'SESSION COACH PAIRING'}
                    </p>
                    <p className="text-sm font-bold text-white truncate">
                      {selectedSession?.name || 'Select a Gym Session'}
                    </p>
                    <p className="text-xs text-[#A1A1AA] truncate">
                      Primary:{' '}
                      <strong className="text-white">
                        {selectedPrimary?.user?.fullName || 'Unselected'}
                      </strong>
                      {selectedPrimary?.gender
                        ? ` (${selectedPrimary.gender})`
                        : ''}
                    </p>
                  </div>
                </div>
                {selectedSession && (
                  <StatusBadge status={selectedSession.sessionType} />
                )}
              </div>

              {primaryMismatch && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/40 text-xs text-red-400">
                  <strong className="text-white">Policy Conflict:</strong>{' '}
                  Female Sessions require a <strong>FEMALE</strong> trainer as
                  Primary Coach. Please choose a Female Trainer below.
                </div>
              )}

              <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-4">
                <Select
                  label="1. Select Gym Session *"
                  value={form.gymSessionId}
                  onChange={(e) =>
                    setForm({ ...form, gymSessionId: e.target.value })
                  }
                  options={sessions.map((s) => ({
                    value: s.id,
                    label: `${s.dayOfWeek} • ${s.name} (${s.sessionType} ${s.startTime}-${s.endTime})`,
                  }))}
                />

                <div className="space-y-2">
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-white">
                    2. Primary Coach on Floor *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                    {trainers.map((t) => {
                      const active = form.trainerProfileId === t.id;
                      const blocked =
                        isFemaleSessionTarget && t.gender !== 'FEMALE';
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() =>
                            setForm({ ...form, trainerProfileId: t.id })
                          }
                          className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                            active
                              ? 'bg-[#1B2210] border-[#C7F464]'
                              : blocked
                              ? 'bg-[#171717] border-[#2C2C2C] opacity-55'
                              : 'bg-[#171717] border-[#2C2C2C] hover:border-[#C7F464]/50'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {t.user?.fullName}
                            </p>
                            <p className="text-[10px] font-mono text-[#A1A1AA]">
                              {t.gender || 'MALE'}
                              {t.specialization ? ` • ${t.specialization}` : ''}
                            </p>
                          </div>
                          <StatusBadge
                            status={t.gender === 'FEMALE' ? 'ACTIVE' : 'GENERAL'}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Select
                  label="3. Backup / Replacement Female Trainer (Optional)"
                  value={form.replacementTrainerProfileId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      replacementTrainerProfileId: e.target.value,
                    })
                  }
                  options={[
                    { value: '', label: '— None —' },
                    ...femaleTrainers.map((t) => ({
                      value: t.id,
                      label: `${t.user?.fullName} (${t.gender})`,
                    })),
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Textarea
                  label="Duty Notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Floor supervision, ladies check-in verification, or replacement shift notes..."
                />
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Primary Ladies Session supervision',
                    'Covers floor warm-up & equipment safety',
                    'Backup check-in authorized',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setForm({ ...form, notes: chip })}
                      className="px-2.5 py-1 rounded-lg bg-[#141414] border border-[#2C2C2C] text-[11px] font-mono text-[#A1A1AA] hover:text-white"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#2C2C2C]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="ifg-btn-primary"
                  isLoading={submitting}
                >
                  Save Assignment
                </Button>
              </div>
            </form>
          );
        })()}
      </Modal>
    </div>
  );
}


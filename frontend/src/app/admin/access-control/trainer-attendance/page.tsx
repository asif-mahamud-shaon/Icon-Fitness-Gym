'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { apiFetch, formatDateTime, formatDate } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Card,
  Button,
  StatusBadge,
  Modal,
  Select,
  Textarea,
  Skeleton,
  EmptyState,
} from '@/components/ui';

export default function AdminTrainerAttendancePage() {
  const { toast } = useToast();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    gymSessionId: '',
    trainerProfileId: '',
    status: 'PRESENT',
    replacementTrainerProfileId: '',
    notes: 'Verified physical presence on gym floor',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [attRes, sesRes, trRes] = await Promise.all([
        apiFetch<any[]>('/access-control/trainer-attendance'),
        apiFetch<any[]>('/access-control/sessions'),
        apiFetch<any[]>('/trainers'),
      ]);
      setAttendances(attRes);
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

  const handleRecordPresence = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/access-control/trainer-attendance', {
        method: 'POST',
        body: JSON.stringify({
          gymSessionId: form.gymSessionId,
          trainerProfileId: form.trainerProfileId,
          status: form.status,
          replacementTrainerProfileId:
            form.replacementTrainerProfileId || undefined,
          notes: form.notes,
        }),
      });
      toast({
        title: `Trainer Presence Recorded: ${form.status}`,
        description:
          form.status === 'PRESENT' || form.status === 'LATE'
            ? 'Female Session automatic member entry is now unlocked for this session.'
            : 'Trainer marked unavailable/absent. Female Session entry will remain blocked until a replacement Female Trainer checks in.',
        variant:
          form.status === 'PRESENT' || form.status === 'LATE'
            ? 'success'
            : 'info',
      });
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Failed to Record Trainer Attendance',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAction = async (
    record: any,
    status: string,
    checkOut = false,
  ) => {
    try {
      await apiFetch('/access-control/trainer-attendance', {
        method: 'POST',
        body: JSON.stringify({
          gymSessionId: record.gymSessionId,
          trainerProfileId: record.trainerProfileId,
          status,
          checkOut,
        }),
      });
      toast({
        title: checkOut
          ? 'Trainer Checked Out'
          : `Trainer Marked ${status}`,
        variant: 'success',
      });
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Action Failed',
        description: err.message,
        variant: 'error',
      });
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
            TRAINER PRESENCE LOG
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span> Access Control{' '}
            <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Trainer Attendance</span>
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<CheckCircle2 className="w-4 h-4" />}
          onClick={() => setModalOpen(true)}
        >
          Check In Trainer / Record Status
        </Button>
      </div>

      <div className="p-4 rounded-2xl bg-[#141414] border border-amber-500/40 flex items-center gap-3 text-xs text-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
        <span>
          <strong>Strict Presence Rule:</strong> Schedule assignment alone never
          satisfies Female Trainer presence. If the assigned Female Trainer has
          not checked in (or has checked out early), new Female Session member
          entries are automatically denied with{' '}
          <span className="font-mono">FEMALE_TRAINER_UNAVAILABLE</span>.
        </span>
      </div>

      {attendances.length === 0 ? (
        <EmptyState
          title="No Trainer Check-Ins Recorded Yet"
          description="Click 'Check In Trainer / Record Status' above to verify physical presence for today's sessions."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#171717] border-b border-[#2C2C2C] text-xs font-mono uppercase text-[#A1A1AA]">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Trainer</th>
                <th className="py-3.5 px-4">Gym Session</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Check-In / Out</th>
                <th className="py-3.5 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C2C2C]">
              {attendances.map((att) => (
                <tr
                  key={att.id}
                  className="hover:bg-[#171717]/60 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono text-xs text-[#A1A1AA]">
                    {formatDate(att.sessionDate)}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-white">
                      {att.trainerProfile?.user?.fullName}
                    </p>
                    <p className="text-xs font-mono text-[#C7F464]">
                      {att.trainerProfile?.gender}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-white font-medium">
                      {att.gymSession?.name}
                    </p>
                    <p className="text-xs font-mono text-[#A1A1AA]">
                      {att.gymSession?.dayOfWeek} •{' '}
                      {att.gymSession?.startTime}–{att.gymSession?.endTime}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={att.status} />
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-[#A1A1AA]">
                    <div>
                      In:{' '}
                      {att.checkedInAt ? formatDateTime(att.checkedInAt) : '—'}
                    </div>
                    <div>
                      Out:{' '}
                      {att.checkedOutAt
                        ? formatDateTime(att.checkedOutAt)
                        : 'Active on Floor'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleQuickAction(att, 'PRESENT', false)}
                      >
                        Mark Present
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<LogOut className="w-3.5 h-3.5" />}
                        onClick={() => handleQuickAction(att, 'PRESENT', true)}
                      >
                        Check Out
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleQuickAction(att, 'ABSENT', false)}
                      >
                        Mark Absent
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Verify Trainer Physical Check-In / Presence"
      >
        <form onSubmit={handleRecordPresence} className="space-y-4">
          <Select
            label="Gym Session *"
            value={form.gymSessionId}
            onChange={(e) =>
              setForm({ ...form, gymSessionId: e.target.value })
            }
            options={sessions.map((s) => ({
              value: s.id,
              label: `${s.dayOfWeek} • ${s.name} (${s.sessionType} ${s.startTime}-${s.endTime})`,
            }))}
          />
          <Select
            label="Trainer *"
            value={form.trainerProfileId}
            onChange={(e) =>
              setForm({ ...form, trainerProfileId: e.target.value })
            }
            options={trainers.map((t) => ({
              value: t.id,
              label: `${t.user?.fullName} (${t.gender || 'MALE'})`,
            }))}
          />
          <Select
            label="Physical Presence Status *"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { value: 'PRESENT', label: 'PRESENT (Checked In on Floor)' },
              { value: 'LATE', label: 'LATE (Checked In Late)' },
              { value: 'ABSENT', label: 'ABSENT (Not Present)' },
              { value: 'UNAVAILABLE', label: 'UNAVAILABLE' },
              { value: 'REPLACED', label: 'REPLACED by Backup Trainer' },
            ]}
          />
          <Textarea
            label="Verification Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Record Check-In Status
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


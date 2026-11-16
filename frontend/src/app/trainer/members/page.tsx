'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Dumbbell, Save, Plus, Search, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { WorkoutProgram } from '@/types';
import { useToast } from '@/context/ToastContext';
import {
  Card,
  Button,
  Modal,
  Select,
  Textarea,
  Skeleton,
  EmptyState,
} from '@/components/ui';

export default function TrainerMembersPage() {
  const { toast } = useToast();
  const [members, setMembers] = useState<any[]>([]);
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [assignModalMember, setAssignModalMember] = useState<any | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [trainerNotes, setTrainerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, progRes] = await Promise.all([
        apiFetch<any>('/trainers/me/dashboard').catch(() => null),
        apiFetch<WorkoutProgram[]>('/workouts'),
      ]);
      if (dashRes?.trainer?.assignedMembers) {
        setMembers(dashRes.trainer.assignedMembers);
      } else {
        const allRes = await apiFetch<any>('/members');
        setMembers(allRes.items || allRes || []);
      }
      setPrograms(progRes);
      if (progRes.length > 0 && !selectedProgramId) {
        setSelectedProgramId(progRes[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedProgramId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        String(m.user?.fullName || '').toLowerCase().includes(q) ||
        String(m.memberCode || '').toLowerCase().includes(q) ||
        String(m.fitnessGoal || '').toLowerCase().includes(q),
    );
  }, [members, search]);

  const handleAssignWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalMember) return;
    setSubmitting(true);
    try {
      await apiFetch('/workouts/assign', {
        method: 'POST',
        body: JSON.stringify({
          memberProfileId: assignModalMember.id,
          workoutProgramId: selectedProgramId,
          trainerNotes,
        }),
      });
      toast({
        title: 'Workout Program Assigned',
        description: `Assigned workout to ${assignModalMember.user?.fullName}.`,
        variant: 'success',
      });
      setAssignModalMember(null);
      setTrainerNotes('');
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Assignment Failed',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAssignmentNotes = async (
    assignmentId: string,
    notes: string,
    completionPercentage: number,
  ) => {
    try {
      await apiFetch(`/workouts/assignments/${assignmentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          trainerNotes: notes,
          completionPercentage,
        }),
      });
      toast({
        title: 'Trainer Notes Updated',
        variant: 'success',
      });
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Update Failed',
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
            Assigned Members
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Coach Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Members &amp; Coaching Notes</span>
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#141414] border border-[#2C2C2C] rounded-xl px-3.5 h-10 w-full sm:w-80">
          <Search className="w-4 h-4 text-[#A1A1AA] shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search athlete name, code, goal..."
            className="w-full bg-transparent text-xs text-white placeholder:text-[#A1A1AA] focus:outline-none"
          />
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Total Assigned</p>
            <p className="text-2xl font-bold text-white font-mono mt-0.5">
              {members.length}
            </p>
          </div>
          <Users className="w-5 h-5 text-[#C7F464]" />
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Active Prescriptions</p>
            <p className="text-2xl font-bold text-white font-mono mt-0.5">
              {members.reduce(
                (sum, m) => sum + (m.workoutAssignments?.length || 0),
                0,
              )}
            </p>
          </div>
          <Dumbbell className="w-5 h-5 text-[#C7F464]" />
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Available Templates</p>
            <p className="text-2xl font-bold text-white font-mono mt-0.5">
              {programs.length}
            </p>
          </div>
          <Plus className="w-5 h-5 text-[#C7F464]" />
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <EmptyState
          title="No Matching Members"
          description="No assigned athletes matched your search criteria."
        />
      ) : (
        <div className="space-y-5">
          {filteredMembers.map((member) => {
            const initials = (member.user?.fullName || 'MB')
              .split(' ')
              .map((p: string) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            return (
              <Card key={member.id} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2C2C2C] pb-4">
                  <div className="flex items-center gap-3.5">
                    {member.user?.avatarUrl ? (
                      <img
                        src={member.user.avatarUrl}
                        alt={member.user?.fullName}
                        className="w-12 h-12 rounded-full object-cover border border-[#C7F464]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#171717] border border-[#2C2C2C] flex items-center justify-center font-mono text-sm font-bold text-[#C7F464]">
                        {initials}
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {member.user?.fullName}{' '}
                        <span className="font-mono text-xs text-[#C7F464] ml-1">
                          {member.memberCode}
                        </span>
                      </h2>
                      <p className="text-xs text-[#A1A1AA] mt-0.5">
                        {member.user?.phone} • Goal:{' '}
                        {member.fitnessGoal?.replace(/_/g, ' ')} • Weight:{' '}
                        {member.weightKg || '—'} kg
                      </p>
                      {member.medicalConditions && (
                        <p className="text-xs text-amber-400 mt-1 font-medium">
                          Medical Note: {member.medicalConditions}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setAssignModalMember(member)}
                  >
                    Assign Workout Plan
                  </Button>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
                    Assigned Workout Programs ({member.workoutAssignments?.length || 0})
                  </p>
                  {(member.workoutAssignments || []).length === 0 ? (
                    <p className="text-xs text-[#A1A1AA] py-2">
                      No workout template assigned yet.
                    </p>
                  ) : (
                    (member.workoutAssignments || []).map((wa: any) => (
                      <div
                        key={wa.id}
                        className="p-4 rounded-xl bg-[#171717] border border-[#2C2C2C] space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white text-sm">
                            {wa.workoutProgram?.title}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#C7F464]/15 border border-[#C7F464]/30 font-mono text-xs text-[#C7F464]">
                            Progress: {wa.completionPercentage}%
                          </span>
                        </div>
                        {wa.memberProgressNotes && (
                          <p className="text-xs text-emerald-400">
                            Member Log: &ldquo;{wa.memberProgressNotes}&rdquo;
                          </p>
                        )}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            defaultValue={wa.trainerNotes || ''}
                            placeholder="Add coaching cue or weight progression note..."
                            id={`note-${wa.id}`}
                            className="flex-1 h-10 px-3.5 rounded-xl bg-[#141414] border border-[#2C2C2C] text-xs text-white focus:outline-none focus:border-[#C7F464]"
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Save className="w-3.5 h-3.5" />}
                            onClick={() => {
                              const el = document.getElementById(
                                `note-${wa.id}`,
                              ) as HTMLInputElement;
                              handleUpdateAssignmentNotes(
                                wa.id,
                                el?.value || '',
                                wa.completionPercentage,
                              );
                            }}
                          >
                            Update Note
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={Boolean(assignModalMember)}
        onClose={() => setAssignModalMember(null)}
        title={`Assign Workout Plan — ${assignModalMember?.user?.fullName || ''}`}
      >
        <form onSubmit={handleAssignWorkout} className="space-y-4">
          <Select
            label="Select Workout Program *"
            value={selectedProgramId}
            onChange={(e) => setSelectedProgramId(e.target.value)}
            options={programs.map((p) => ({
              value: p.id,
              label: `${p.title} (${String(p.goal || '').replace(/_/g, ' ')} • ${p.durationWeeks}w)`,
            }))}
          />
          <Textarea
            label="Trainer Coaching Instructions / Notes"
            placeholder="Specify target RPE, warm-up focus, or injury modifications..."
            value={trainerNotes}
            onChange={(e) => setTrainerNotes(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAssignModalMember(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Assign Program
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

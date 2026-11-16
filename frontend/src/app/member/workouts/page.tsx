'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Dumbbell, Save } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Card,
  Button,
  StatusBadge,
  Input,
  Skeleton,
  EmptyState,
} from '@/components/ui';

export default function MemberWorkoutsPage() {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [progressDrafts, setProgressDrafts] = useState<
    Record<string, { completionPercentage: number; memberProgressNotes: string }>
  >({});

  const loadWorkouts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any[]>('/workouts/my');
      setAssignments(res);
      const drafts: Record<
        string,
        { completionPercentage: number; memberProgressNotes: string }
      > = {};
      for (const item of res) {
        drafts[item.id] = {
          completionPercentage: item.completionPercentage ?? 0,
          memberProgressNotes: item.memberProgressNotes || '',
        };
      }
      setProgressDrafts(drafts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  const handleSaveProgress = async (assignmentId: string) => {
    const draft = progressDrafts[assignmentId];
    if (!draft) return;
    setSavingId(assignmentId);
    try {
      await apiFetch(`/workouts/assignments/${assignmentId}`, {
        method: 'PATCH',
        body: JSON.stringify(draft),
      });
      toast({
        title: 'Workout Progress Saved',
        description: 'Your trainer can now review your updated progress notes.',
        variant: 'success',
      });
      await loadWorkouts();
    } catch (err: any) {
      toast({
        title: 'Save Failed',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setSavingId(null);
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
      <div>
        <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
          My Assigned Workouts
        </h1>
        <p className="text-xs font-mono text-[#A1A1AA] mt-1">
          Member Portal <span className="mx-1">&gt;</span>{' '}
          <span className="text-white">Prescribed Exercises &amp; Log</span>
        </p>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          icon={<Dumbbell className="w-6 h-6" />}
          title="No Workout Program Assigned Yet"
          description="Your assigned trainer or gym administrator will assign a structured workout plan to your profile."
        />
      ) : (
        <div className="space-y-6">
          {assignments.map((item) => {
            const prog = item.workoutProgram;
            const draft = progressDrafts[item.id] || {
              completionPercentage: item.completionPercentage || 0,
              memberProgressNotes: item.memberProgressNotes || '',
            };

            return (
              <Card key={item.id} className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#2C2C2C] pb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={prog?.goal} />
                      <StatusBadge status={prog?.difficulty} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      {prog?.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#A1A1AA]">
                      {prog?.description}
                    </p>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-[#171717] border border-[#2C2C2C] text-right font-mono text-xs text-[#C7F464]">
                    {prog?.durationWeeks} Weeks • {prog?.daysPerWeek} Days/Wk
                  </div>
                </div>

                {item.trainerNotes && (
                  <div className="p-4 rounded-xl bg-[#171717] border border-[#C7F464]/50">
                    <p className="text-xs font-mono uppercase tracking-wider text-[#C7F464]">
                      Trainer Coaching Notes
                    </p>
                    <p className="text-sm text-white mt-1">
                      {item.trainerNotes}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
                    Exercise Prescription ({prog?.exercises?.length || 0} Movements)
                  </h3>
                  <div className="space-y-3">
                    {(prog?.exercises || []).map((exItem: any) => (
                      <div
                        key={exItem.id}
                        className="p-4 rounded-xl bg-[#171717] border border-[#2C2C2C] flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-[#C7F464] text-[#090909] font-mono text-xs font-bold">
                              Day {exItem.dayNumber} • #{exItem.orderIndex}
                            </span>
                            <span className="text-xs font-mono text-[#A1A1AA]">
                              {exItem.exercise?.targetMuscleGroup}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white">
                            {exItem.exercise?.name}
                          </h4>
                          <p className="text-xs text-[#A1A1AA]">
                            {exItem.exercise?.instructions}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 shrink-0 bg-[#141414] border border-[#2C2C2C] rounded-xl px-4 py-2.5 text-center">
                          <div>
                            <span className="block text-[10px] font-mono uppercase text-[#A1A1AA]">
                              Sets
                            </span>
                            <span className="font-mono font-bold text-white">
                              {exItem.sets}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-mono uppercase text-[#A1A1AA]">
                              Reps
                            </span>
                            <span className="font-mono font-bold text-[#C7F464]">
                              {exItem.reps}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-mono uppercase text-[#A1A1AA]">
                              Rest
                            </span>
                            <span className="font-mono font-bold text-white">
                              {exItem.restSeconds}s
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Member Progress Log */}
                <div className="pt-4 border-t border-[#2C2C2C] grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <Input
                    label="Completion Progress (%)"
                    type="number"
                    min={0}
                    max={100}
                    value={String(draft.completionPercentage)}
                    onChange={(e) =>
                      setProgressDrafts({
                        ...progressDrafts,
                        [item.id]: {
                          ...draft,
                          completionPercentage: Number(e.target.value),
                        },
                      })
                    }
                  />
                  <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 items-end">
                    <Input
                      label="My Training Log / Progress Notes"
                      placeholder="Log weights lifted, RPE, or questions for your trainer..."
                      value={draft.memberProgressNotes}
                      onChange={(e) =>
                        setProgressDrafts({
                          ...progressDrafts,
                          [item.id]: {
                            ...draft,
                            memberProgressNotes: e.target.value,
                          },
                        })
                      }
                    />
                    <Button
                      variant="primary"
                      isLoading={savingId === item.id}
                      leftIcon={<Save className="w-4 h-4" />}
                      onClick={() => handleSaveProgress(item.id)}
                    >
                      Save Log
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

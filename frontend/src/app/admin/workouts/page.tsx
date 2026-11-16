'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ClipboardList,
  Plus,
  UserCheck,
  Trash2,
  Edit3,
  Dumbbell,
  Camera,
  X,
} from 'lucide-react';
import { apiFetch, clearApiCache, getErrorMessage } from '@/lib/api';
import { compressImageFile } from '@/lib/media-upload';
import { useToast } from '@/context/ToastContext';
import {
  WorkoutProgram,
  ExerciseItem,
  MemberProfile,
  PaginatedResult,
  WorkoutGoal,
  DifficultyLevel,
} from '@/types';
import {
  Card,
  Button,
  Input,
  Textarea,
  Select,
  StatusBadge,
  Modal,
  Skeleton,
  EmptyState,
} from '@/components/ui';

export default function AdminWorkoutsPage() {
  const { showToast } = useToast();
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<WorkoutProgram | null>(null);
  const [saving, setSaving] = useState(false);
  const [programForm, setProgramForm] = useState({
    title: '',
    goal: 'STRENGTH_TRAINING' as WorkoutGoal,
    difficulty: 'INTERMEDIATE' as DifficultyLevel,
    durationWeeks: '8',
    daysPerWeek: '4',
    description: '',
    coverImageUrl: '',
    isPublic: true,
    isActive: true,
    exercises: [
      {
        exerciseId: '',
        dayNumber: 1,
        orderIndex: 1,
        sets: 4,
        reps: '8-10',
        restSeconds: 90,
        notes: 'Controlled eccentric',
      },
    ],
  });

  const [assignOpen, setAssignOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignForm, setAssignForm] = useState({
    memberProfileId: '',
    workoutProgramId: '',
    trainerNotes: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [progRes, exRes, memRes] = await Promise.all([
        apiFetch<WorkoutProgram[]>('/workouts'),
        apiFetch<ExerciseItem[]>('/exercises'),
        apiFetch<PaginatedResult<MemberProfile>>('/members?limit=100'),
      ]);
      setPrograms(Array.isArray(progRes) ? progRes : []);
      setExercises(Array.isArray(exRes) ? exRes : []);
      setMembers(memRes?.items || []);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingProgram(null);
    setProgramForm({
      title: '',
      goal: 'STRENGTH_TRAINING',
      difficulty: 'INTERMEDIATE',
      durationWeeks: '8',
      daysPerWeek: '4',
      description: '',
      coverImageUrl: '',
      isPublic: true,
      isActive: true,
      exercises: [
        {
          exerciseId: exercises[0]?.id || '',
          dayNumber: 1,
          orderIndex: 1,
          sets: 4,
          reps: '8-10',
          restSeconds: 90,
          notes: 'Maintain neutral spine',
        },
      ],
    });
    setCreateOpen(true);
  };

  const openEditModal = (prog: WorkoutProgram) => {
    setEditingProgram(prog);
    setProgramForm({
      title: prog.title,
      goal: prog.goal || 'FITNESS_IMPROVEMENT',
      difficulty: (prog.difficulty as DifficultyLevel) || 'INTERMEDIATE',
      durationWeeks: String(prog.durationWeeks ?? 8),
      daysPerWeek: String(prog.daysPerWeek ?? prog.sessionsPerWeek ?? 4),
      description: prog.description || '',
      coverImageUrl: prog.coverImageUrl || '',
      isPublic: prog.isPublic,
      isActive: prog.isActive,
      exercises:
        prog.exercises && prog.exercises.length > 0
          ? prog.exercises.map((item, idx) => ({
              exerciseId: item.exercise?.id || (item as any).exerciseId || '',
              dayNumber: Number(item.dayNumber ?? 1),
              orderIndex: Number(item.orderIndex ?? idx + 1),
              sets: Number(item.sets ?? 3),
              reps: String(item.reps ?? '10-12'),
              restSeconds: Number(item.restSeconds ?? 60),
              notes: item.notes || '',
            }))
          : [],
    });
    setCreateOpen(true);
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const validExercises = programForm.exercises
        .filter((item) => item.exerciseId)
        .map((item, idx) => ({
          exerciseId: item.exerciseId,
          dayNumber: Number(item.dayNumber || 1),
          orderIndex: idx + 1,
          sets: Number(item.sets || 3),
          reps: String(item.reps || '10-12'),
          restSeconds: Number(item.restSeconds || 60),
          notes: item.notes || undefined,
        }));

      const payload = {
        title: programForm.title,
        goal: programForm.goal,
        difficulty: programForm.difficulty,
        durationWeeks: Number(programForm.durationWeeks),
        daysPerWeek: Number(programForm.daysPerWeek),
        description: programForm.description,
        coverImageUrl: programForm.coverImageUrl.trim() || undefined,
        isPublic: programForm.isPublic,
        isActive: programForm.isActive,
        exercises: validExercises,
      };

      if (editingProgram) {
        await apiFetch(`/workouts/${editingProgram.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showToast('success', 'Workout program updated.');
      } else {
        await apiFetch('/workouts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('success', 'Workout program created.');
      }
      clearApiCache();
      setCreateOpen(false);
      loadData();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssigning(true);
    try {
      await apiFetch('/workouts/assign', {
        method: 'POST',
        body: JSON.stringify({
          memberProfileId: assignForm.memberProfileId,
          workoutProgramId: assignForm.workoutProgramId,
          trainerNotes: assignForm.trainerNotes || undefined,
        }),
      });
      showToast('success', 'Workout program assigned to member.');
      setAssignOpen(false);
      loadData();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Workout Programs
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Programming &amp; Member Prescriptions</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setAssignForm({
                memberProfileId: members[0]?.id || '',
                workoutProgramId: programs[0]?.id || '',
                trainerNotes: 'Focus on progressive overload and strict form.',
              });
              setAssignOpen(true);
            }}
          >
            <UserCheck className="w-4 h-4" /> Assign to Member
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4" /> Create Program
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Total Programs</p>
            <p className="text-2xl font-bold text-white font-mono mt-0.5">{programs.length}</p>
          </div>
          <ClipboardList className="w-5 h-5 text-[#C7F464]" />
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Public Templates</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">
              {programs.filter((p) => p.isPublic).length}
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400">CATALOG</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Exercise Movements</p>
            <p className="text-2xl font-bold text-white font-mono mt-0.5">{exercises.length}</p>
          </div>
          <span className="text-xs font-mono text-[#C7F464]">LIBRARY</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-6 h-6" />}
          title="No Workout Programs"
          description="Create structured training programs and assign them to members."
          action={<Button onClick={openCreateModal}>Create Program</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {programs.map((prog) => {
            const goalLabel = String(
              prog.goal || prog.category || 'FITNESS_IMPROVEMENT',
            ).replace(/_/g, ' ');
            const daysPerWeek = prog.daysPerWeek ?? prog.sessionsPerWeek ?? 4;

            return (
              <Card key={prog.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono uppercase tracking-widest text-[#C7F464]">
                      {goalLabel} • {prog.durationWeeks} Weeks
                    </span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={prog.difficulty} />
                      <StatusBadge status={prog.isPublic ? 'PUBLIC' : 'PRIVATE'} />
                    </div>
                  </div>
                  <h2 className="font-display text-2xl text-white uppercase tracking-wide">
                    {prog.title}
                  </h2>
                  <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
                    {prog.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-[#303030] space-y-2">
                    <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">
                      Prescribed Movements ({prog.exercises?.length || 0})
                    </p>
                    {(prog.exercises || []).slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs p-2 rounded bg-[#171717]"
                      >
                        <span className="text-white font-medium">
                          Day {item.dayNumber ?? 1}: {item.exercise?.name || 'Exercise'}
                        </span>
                        <span className="font-mono text-[#C7F464]">
                          {item.sets} × {item.reps}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#303030] flex items-center justify-between text-xs text-[#A1A1AA]">
                  <span>
                    {daysPerWeek} Days/Week
                    {prog.createdByTrainer?.user?.fullName
                      ? ` • By ${prog.createdByTrainer.user.fullName}`
                      : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEditModal(prog)}
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAssignForm({
                          memberProfileId: members[0]?.id || '',
                          workoutProgramId: prog.id,
                          trainerNotes: '',
                        });
                        setAssignOpen(true);
                      }}
                    >
                      Assign
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Workout Program Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title={
          editingProgram
            ? `Edit Program — ${editingProgram.title}`
            : 'Create Workout Program'
        }
        size="xl"
      >
        <form onSubmit={handleSaveProgram} className="space-y-4">
          {/* Program Cover Picture Upload & URL */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative w-full sm:w-36 h-24 rounded-xl overflow-hidden bg-[#171717] border border-[#2C2C2C] shrink-0">
              <img
                src={
                  programForm.coverImageUrl ||
                  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=720&q=75'
                }
                alt={programForm.title || 'Program Cover'}
                className="w-full h-full object-cover"
              />
              {programForm.coverImageUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setProgramForm((prev) => ({ ...prev, coverImageUrl: '' }))
                  }
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 border border-white/20 text-white hover:bg-red-500 flex items-center justify-center"
                  title="Reset cover picture"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold uppercase text-white">
                  Program Card Cover Picture
                </span>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B2210] border border-[#C7F464]/40 text-xs font-mono text-[#C7F464] cursor-pointer hover:bg-[#C7F464] hover:text-[#0B0B0B] transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                  Upload Cover Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const dataUrl = await compressImageFile(file, 1080, 0.85);
                        setProgramForm((prev) => ({
                          ...prev,
                          coverImageUrl: dataUrl,
                        }));
                        showToast('success', 'Program cover photo ready.');
                      } catch (err) {
                        showToast('error', getErrorMessage(err));
                      } finally {
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              <Input
                label="Or Paste Cover Image URL"
                placeholder="https://images.unsplash.com/..."
                value={programForm.coverImageUrl}
                onChange={(e) =>
                  setProgramForm({ ...programForm, coverImageUrl: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Program Title"
              required
              value={programForm.title}
              onChange={(e) =>
                setProgramForm({ ...programForm, title: e.target.value })
              }
              placeholder="Ashkona Strength & Hypertrophy Block"
            />
            <Select
              label="Training Goal"
              options={[
                { value: 'STRENGTH_TRAINING', label: 'Strength Training' },
                { value: 'MUSCLE_BUILDING', label: 'Muscle Building' },
                { value: 'WEIGHT_LOSS', label: 'Weight Loss' },
                { value: 'FITNESS_IMPROVEMENT', label: 'Fitness Improvement' },
                { value: 'BEGINNER', label: 'Beginner Program' },
                { value: 'CUSTOM', label: 'Custom Program' },
              ]}
              value={programForm.goal}
              onChange={(e) =>
                setProgramForm({
                  ...programForm,
                  goal: e.target.value as WorkoutGoal,
                })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Difficulty"
              options={[
                { value: 'BEGINNER', label: 'Beginner' },
                { value: 'INTERMEDIATE', label: 'Intermediate' },
                { value: 'ADVANCED', label: 'Advanced' },
                { value: 'ALL_LEVELS', label: 'All Levels' },
              ]}
              value={programForm.difficulty}
              onChange={(e) =>
                setProgramForm({
                  ...programForm,
                  difficulty: e.target.value as DifficultyLevel,
                })
              }
            />
            <Input
              label="Duration (Weeks)"
              type="number"
              min={1}
              value={programForm.durationWeeks}
              onChange={(e) =>
                setProgramForm({ ...programForm, durationWeeks: e.target.value })
              }
            />
            <Input
              label="Days / Week"
              type="number"
              min={1}
              max={7}
              value={programForm.daysPerWeek}
              onChange={(e) =>
                setProgramForm({ ...programForm, daysPerWeek: e.target.value })
              }
            />
          </div>

          <Textarea
            label="Program Description & Progression Guidelines"
            required
            value={programForm.description}
            onChange={(e) =>
              setProgramForm({ ...programForm, description: e.target.value })
            }
          />

          {/* Exercises Builder */}
          <div className="p-4 rounded-xl bg-[#090909] border border-[#303030] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#C7F464]">
                Program Exercises ({programForm.exercises.length})
              </span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  setProgramForm({
                    ...programForm,
                    exercises: [
                      ...programForm.exercises,
                      {
                        exerciseId: exercises[0]?.id || '',
                        dayNumber: 1,
                        orderIndex: programForm.exercises.length + 1,
                        sets: 3,
                        reps: '10-12',
                        restSeconds: 60,
                        notes: '',
                      },
                    ],
                  })
                }
              >
                <Plus className="w-3.5 h-3.5" /> Add Exercise Row
              </Button>
            </div>

            {programForm.exercises.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end p-3 rounded-lg bg-[#171717] border border-[#303030]"
              >
                <div className="sm:col-span-2">
                  <Select
                    label="Exercise"
                    options={exercises.map((ex) => ({
                      value: ex.id,
                      label: `${ex.name} (${ex.targetMuscleGroup || ex.muscleGroup || 'General'})`,
                    }))}
                    value={row.exerciseId}
                    onChange={(e) => {
                      const next = [...programForm.exercises];
                      next[idx].exerciseId = e.target.value;
                      setProgramForm({ ...programForm, exercises: next });
                    }}
                  />
                </div>
                <Input
                  label="Day #"
                  type="number"
                  min={1}
                  max={7}
                  value={String(row.dayNumber)}
                  onChange={(e) => {
                    const next = [...programForm.exercises];
                    next[idx].dayNumber = Number(e.target.value);
                    setProgramForm({ ...programForm, exercises: next });
                  }}
                />
                <Input
                  label="Sets"
                  type="number"
                  min={1}
                  value={String(row.sets)}
                  onChange={(e) => {
                    const next = [...programForm.exercises];
                    next[idx].sets = Number(e.target.value);
                    setProgramForm({ ...programForm, exercises: next });
                  }}
                />
                <Input
                  label="Reps"
                  value={row.reps}
                  onChange={(e) => {
                    const next = [...programForm.exercises];
                    next[idx].reps = e.target.value;
                    setProgramForm({ ...programForm, exercises: next });
                  }}
                />
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    const next = programForm.exercises.filter((_, i) => i !== idx);
                    setProgramForm({ ...programForm, exercises: next });
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
              <input
                type="checkbox"
                checked={programForm.isPublic}
                onChange={(e) =>
                  setProgramForm({ ...programForm, isPublic: e.target.checked })
                }
                className="accent-[#C7F464]"
              />
              Visible on Public Programs Page
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
              <input
                type="checkbox"
                checked={programForm.isActive}
                onChange={(e) =>
                  setProgramForm({ ...programForm, isActive: e.target.checked })
                }
                className="accent-[#C7F464]"
              />
              Active Program
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#303030]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              {editingProgram ? 'Update Program' : 'Save Workout Program'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Workout Program Modal */}
      <Modal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign Workout Program to Member"
        maxWidth="max-w-2xl"
      >
        {(() => {
          const selMember = members.find((m) => m.id === assignForm.memberProfileId);
          const selProgram = programs.find((p) => p.id === assignForm.workoutProgramId);
          const memberDisplayName =
            selMember?.user?.fullName ||
            `${selMember?.user?.firstName || ''} ${selMember?.user?.lastName || ''}`.trim() ||
            'Choose a member';

          return (
            <form onSubmit={handleAssignSubmit} className="space-y-5">
              {/* Live Assignment Preview Card */}
              <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#1B2210] border border-[#C7F464]/35 flex items-center justify-center text-[#C7F464] shrink-0">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">
                      Personal Coaching Blueprint
                    </p>
                    <p className="text-sm font-bold text-white truncate">
                      {memberDisplayName}
                    </p>
                    <p className="text-xs text-[#A1A1AA] truncate">
                      {selProgram
                        ? `${selProgram.title} • ${selProgram.daysPerWeek || 4} days/wk`
                        : 'Select a workout program'}
                    </p>
                  </div>
                </div>
                {selProgram && (
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-full bg-[#1B2210] border border-[#C7F464]/35 text-[11px] font-mono font-bold text-[#C7F464]">
                      {selProgram.durationWeeks} Weeks
                    </span>
                    <StatusBadge status={selProgram.difficulty || 'INTERMEDIATE'} />
                  </div>
                )}
              </div>

              {/* Section 1: Member & Program Target */}
              <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#A1A1AA]">
                  1 • Member & Training Blueprint
                </p>
                <Select
                  label="Member *"
                  required
                  options={members.map((m) => ({
                    value: m.id,
                    label: `${m.memberCode} — ${m.user?.fullName || `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.trim()}`,
                  }))}
                  value={assignForm.memberProfileId}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, memberProfileId: e.target.value })
                  }
                />
                <Select
                  label="Workout Program *"
                  required
                  options={programs.map((p) => ({
                    value: p.id,
                    label: `${p.title} (${p.durationWeeks} Weeks • ${p.difficulty || 'ALL'})`,
                  }))}
                  value={assignForm.workoutProgramId}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, workoutProgramId: e.target.value })
                  }
                />
              </div>

              {/* Section 2: Trainer Modifications */}
              <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-3">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#A1A1AA]">
                  2 • Coach Notes & Progression Adjustments
                </p>
                <Textarea
                  label="Trainer Notes & Modifications"
                  placeholder="e.g. Focus on controlled eccentric tempo; swap barbell back squat for goblet squat week 1–2..."
                  value={assignForm.trainerNotes}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, trainerNotes: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-[#262626]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setAssignOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={assigning}>
                  Confirm Program Assignment
                </Button>
              </div>
            </form>
          );
        })()}
      </Modal>
    </div>
  );
}

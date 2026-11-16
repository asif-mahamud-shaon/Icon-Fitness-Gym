'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Dumbbell, Search, ClipboardList } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { ExerciseItem, WorkoutProgram } from '@/types';
import { useToast } from '@/context/ToastContext';
import {
  Card,
  Button,
  StatusBadge,
  Modal,
  Input,
  Textarea,
  Select,
  Skeleton,
} from '@/components/ui';

export default function TrainerWorkoutsPage() {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [progForm, setProgForm] = useState({
    title: '',
    description: '',
    goal: 'MUSCLE_BUILDING',
    difficulty: 'INTERMEDIATE',
    durationWeeks: '8',
    daysPerWeek: '4',
  });

  const [exForm, setExForm] = useState({
    name: '',
    targetMuscleGroup: '',
    equipmentRequired: '',
    difficulty: 'INTERMEDIATE',
    instructions: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [progRes, exRes] = await Promise.all([
        apiFetch<WorkoutProgram[]>('/workouts'),
        apiFetch<ExerciseItem[]>('/exercises'),
      ]);
      setPrograms(progRes);
      setExercises(exRes);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPrograms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        String(p.goal || '').toLowerCase().includes(q),
    );
  }, [programs, search]);

  const filteredExercises = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(q) ||
        String(ex.targetMuscleGroup || '').toLowerCase().includes(q),
    );
  }, [exercises, search]);

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/workouts', {
        method: 'POST',
        body: JSON.stringify({
          ...progForm,
          durationWeeks: Number(progForm.durationWeeks),
          daysPerWeek: Number(progForm.daysPerWeek),
          exercises: exercises.slice(0, 3).map((ex, i) => ({
            exerciseId: ex.id,
            dayNumber: 1,
            orderIndex: i + 1,
            sets: 3,
            reps: '10-12',
            restSeconds: 60,
          })),
        }),
      });
      toast({
        title: 'Workout Program Created',
        variant: 'success',
      });
      setProgramModalOpen(false);
      setProgForm({
        title: '',
        description: '',
        goal: 'MUSCLE_BUILDING',
        difficulty: 'INTERMEDIATE',
        durationWeeks: '8',
        daysPerWeek: '4',
      });
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Error Creating Program',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/exercises', {
        method: 'POST',
        body: JSON.stringify(exForm),
      });
      toast({
        title: 'Exercise Added to Catalog',
        variant: 'success',
      });
      setExerciseModalOpen(false);
      setExForm({
        name: '',
        targetMuscleGroup: '',
        equipmentRequired: '',
        difficulty: 'INTERMEDIATE',
        instructions: '',
      });
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Error Creating Exercise',
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Workout Builder &amp; Library
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Coach Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Workouts &amp; Exercises</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-[#141414] border border-[#2C2C2C] rounded-xl px-3.5 h-10 w-full sm:w-64">
            <Search className="w-4 h-4 text-[#A1A1AA] shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter programs or exercises..."
              className="w-full bg-transparent text-xs text-white placeholder:text-[#A1A1AA] focus:outline-none"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setProgramModalOpen(true)}
          >
            New Program
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Dumbbell className="w-4 h-4" />}
            onClick={() => setExerciseModalOpen(true)}
          >
            Add Exercise
          </Button>
        </div>
      </div>

      {/* Programs List */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-[#C7F464]" />
          <h2 className="text-base font-bold text-white">
            Training Templates ({filteredPrograms.length})
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPrograms.map((p) => (
            <Card key={p.id} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <StatusBadge status={p.goal} />
                  <StatusBadge status={p.difficulty} />
                </div>
                <span className="text-xs font-mono text-[#C7F464]">
                  {p.durationWeeks}w • {p.daysPerWeek}d/wk
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">{p.title}</h3>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                {p.description}
              </p>
              <div className="pt-3 border-t border-[#2C2C2C] flex items-center justify-between text-xs font-mono text-[#A1A1AA]">
                <span>Exercises Configured</span>
                <span className="text-white font-semibold">
                  {p.exercises?.length || 0} Movements
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Exercise Catalog */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">
            Exercise Prescription Catalog ({filteredExercises.length})
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExercises.map((ex) => (
            <div
              key={ex.id}
              className="p-4 rounded-xl bg-[#171717] border border-[#2C2C2C] space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-white text-sm">{ex.name}</h3>
                <StatusBadge status={ex.difficulty} />
              </div>
              <p className="text-xs font-mono text-[#C7F464]">
                Target: {ex.targetMuscleGroup} • Equipment:{' '}
                {ex.equipmentRequired || 'Standard'}
              </p>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                {ex.instructions}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Create Workout Program Modal */}
      <Modal
        isOpen={programModalOpen}
        onClose={() => setProgramModalOpen(false)}
        title="Create New Workout Program"
      >
        <form onSubmit={handleCreateProgram} className="space-y-4">
          <Input
            label="Program Title *"
            required
            placeholder="e.g. 8-Week Upper/Lower Hypertrophy"
            value={progForm.title}
            onChange={(e) =>
              setProgForm({ ...progForm, title: e.target.value })
            }
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Goal"
              value={progForm.goal}
              onChange={(e) =>
                setProgForm({ ...progForm, goal: e.target.value })
              }
              options={[
                { value: 'MUSCLE_BUILDING', label: 'Muscle Building' },
                { value: 'WEIGHT_LOSS', label: 'Weight Loss' },
                { value: 'STRENGTH_TRAINING', label: 'Strength Training' },
                { value: 'FITNESS_IMPROVEMENT', label: 'Fitness Improvement' },
                { value: 'BEGINNER', label: 'Beginner' },
                { value: 'CUSTOM', label: 'Custom' },
              ]}
            />
            <Select
              label="Difficulty"
              value={progForm.difficulty}
              onChange={(e) =>
                setProgForm({ ...progForm, difficulty: e.target.value })
              }
              options={[
                { value: 'BEGINNER', label: 'Beginner' },
                { value: 'INTERMEDIATE', label: 'Intermediate' },
                { value: 'ADVANCED', label: 'Advanced' },
                { value: 'ALL_LEVELS', label: 'All Levels' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (Weeks)"
              type="number"
              value={progForm.durationWeeks}
              onChange={(e) =>
                setProgForm({ ...progForm, durationWeeks: e.target.value })
              }
            />
            <Input
              label="Days / Week"
              type="number"
              value={progForm.daysPerWeek}
              onChange={(e) =>
                setProgForm({ ...progForm, daysPerWeek: e.target.value })
              }
            />
          </div>
          <Textarea
            label="Program Description *"
            required
            value={progForm.description}
            onChange={(e) =>
              setProgForm({ ...progForm, description: e.target.value })
            }
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setProgramModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Create Program
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Exercise Modal */}
      <Modal
        isOpen={exerciseModalOpen}
        onClose={() => setExerciseModalOpen(false)}
        title="Add Exercise to Catalog"
      >
        <form onSubmit={handleCreateExercise} className="space-y-4">
          <Input
            label="Exercise Name *"
            required
            placeholder="e.g. Incline Dumbbell Press"
            value={exForm.name}
            onChange={(e) => setExForm({ ...exForm, name: e.target.value })}
          />
          <Input
            label="Target Muscle Group *"
            required
            placeholder="e.g. Upper Chest & Anterior Delts"
            value={exForm.targetMuscleGroup}
            onChange={(e) =>
              setExForm({ ...exForm, targetMuscleGroup: e.target.value })
            }
          />
          <Input
            label="Equipment Required"
            placeholder="e.g. Dumbbells & Incline Bench"
            value={exForm.equipmentRequired}
            onChange={(e) =>
              setExForm({ ...exForm, equipmentRequired: e.target.value })
            }
          />
          <Textarea
            label="Form & Execution Instructions *"
            required
            value={exForm.instructions}
            onChange={(e) =>
              setExForm({ ...exForm, instructions: e.target.value })
            }
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setExerciseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Save Exercise
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

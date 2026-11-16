'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Dumbbell, Plus, Edit3 } from 'lucide-react';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { ExerciseItem, DifficultyLevel } from '@/types';
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
  SearchInput,
} from '@/components/ui';

export default function AdminExercisesPage() {
  const { showToast } = useToast();
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExerciseItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    targetMuscleGroup: 'Chest',
    equipmentRequired: 'Barbell',
    difficulty: 'INTERMEDIATE' as DifficultyLevel,
    instructions: '',
    videoUrl: '',
    isActive: true,
  });

  const loadExercises = useCallback(async () => {
    setLoading(true);
    try {
      const qs = search ? `?muscleGroup=${encodeURIComponent(search)}` : '';
      const res = await apiFetch<ExerciseItem[]>(`/exercises${qs}`);
      setExercises(Array.isArray(res) ? res : []);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      targetMuscleGroup: 'Chest',
      equipmentRequired: 'Barbell',
      difficulty: 'INTERMEDIATE',
      instructions: '',
      videoUrl: '',
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (ex: ExerciseItem) => {
    setEditing(ex);
    setForm({
      name: ex.name,
      targetMuscleGroup: ex.targetMuscleGroup || ex.muscleGroup || 'Chest',
      equipmentRequired: ex.equipmentRequired || ex.equipment || '',
      difficulty: (ex.difficulty as DifficultyLevel) || 'INTERMEDIATE',
      instructions: ex.instructions || '',
      videoUrl: ex.videoUrl || '',
      isActive: ex.isActive ?? true,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        targetMuscleGroup: form.targetMuscleGroup,
        equipmentRequired: form.equipmentRequired || undefined,
        difficulty: form.difficulty,
        instructions: form.instructions,
        videoUrl: form.videoUrl || undefined,
        isActive: form.isActive,
      };
      if (editing) {
        await apiFetch(`/exercises/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showToast('success', 'Exercise updated.');
      } else {
        await apiFetch('/exercises', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('success', 'Exercise added to catalog.');
      }
      setModalOpen(false);
      loadExercises();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Exercise Catalog
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Biomechanics &amp; Movement Library</span>
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add Exercise
        </Button>
      </div>

      {/* KPI & Search Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Total Movements</p>
            <p className="text-2xl font-bold text-white font-mono mt-0.5">{exercises.length}</p>
          </div>
          <Dumbbell className="w-5 h-5 text-[#C7F464]" />
        </div>
        <div className="sm:col-span-2 p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Filter exercises by target muscle group..."
            className="w-full sm:w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <EmptyState
          icon={<Dumbbell className="w-6 h-6" />}
          title="No Exercises Found"
          description="Add movements to the catalog to build structured workout programs."
          action={<Button onClick={openCreate}>Add Exercise</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((ex) => (
            <Card key={ex.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#C7F464]">
                    {ex.targetMuscleGroup || ex.muscleGroup}
                  </span>
                  <StatusBadge status={ex.difficulty} />
                </div>
                <h3 className="font-display text-xl text-white uppercase tracking-wide">
                  {ex.name}
                </h3>
                <p className="text-xs font-mono text-[#A1A1AA] mt-0.5">
                  Equipment: {ex.equipmentRequired || ex.equipment || 'Bodyweight'}
                </p>
                <p className="text-xs text-zinc-300 mt-3 line-clamp-3 leading-relaxed">
                  {ex.instructions}
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[#303030] flex justify-end">
                <Button size="sm" variant="secondary" onClick={() => openEdit(ex)}>
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit Exercise — ${editing.name}` : 'Create Exercise'}
        description="Build reusable movement library entries with muscle group tags and form cues."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* Live Exercise Card Preview */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#C7F464]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#C7F464] text-[#090909] flex items-center justify-center shrink-0">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#C7F464]">
                  {form.targetMuscleGroup || 'MUSCLE GROUP'} •{' '}
                  {form.equipmentRequired || 'BODYWEIGHT'}
                </p>
                <p className="text-sm font-bold text-white truncate">
                  {form.name || 'New Movement Entry'}
                </p>
              </div>
            </div>
            <StatusBadge status={form.difficulty} />
          </div>

          <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-4">
            <Input
              label="Exercise Name *"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Barbell Back Squat"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  label="Target Muscle Group *"
                  required
                  value={form.targetMuscleGroup}
                  onChange={(e) =>
                    setForm({ ...form, targetMuscleGroup: e.target.value })
                  }
                  placeholder="Quadriceps / Glutes"
                />
                <div className="flex flex-wrap gap-1.5">
                  {['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'].map(
                    (mg) => (
                      <button
                        key={mg}
                        type="button"
                        onClick={() =>
                          setForm({ ...form, targetMuscleGroup: mg })
                        }
                        className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono ${
                          form.targetMuscleGroup === mg
                            ? 'bg-[#C7F464] border-[#C7F464] !text-[#090909] font-bold'
                            : 'bg-[#171717] border-[#2C2C2C] text-[#A1A1AA]'
                        }`}
                      >
                        {mg}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <Input
                label="Equipment Required"
                value={form.equipmentRequired}
                onChange={(e) =>
                  setForm({ ...form, equipmentRequired: e.target.value })
                }
                placeholder="Barbell / Squat Rack"
              />
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-mono uppercase text-[#A1A1AA]">
                Difficulty Level *
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    { value: 'BEGINNER', label: 'Beginner' },
                    { value: 'INTERMEDIATE', label: 'Intermediate' },
                    { value: 'ADVANCED', label: 'Advanced' },
                    { value: 'ALL_LEVELS', label: 'All Levels' },
                  ] as Array<{ value: DifficultyLevel; label: string }>
                ).map((d) => {
                  const active = form.difficulty === d.value;
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() =>
                        setForm({ ...form, difficulty: d.value })
                      }
                      className={`h-10 rounded-xl border text-xs font-mono font-bold transition-colors ${
                        active
                          ? 'bg-[#C7F464] border-[#C7F464] !text-[#090909]'
                          : 'bg-[#171717] border-[#2C2C2C] text-[#A1A1AA] hover:border-[#C7F464]/50'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-4">
            <Textarea
              label="Coaching Instructions & Cues *"
              required
              value={form.instructions}
              onChange={(e) =>
                setForm({ ...form, instructions: e.target.value })
              }
              placeholder="Brace core, maintain neutral spine, descend below parallel, drive through mid-foot."
            />
            <Input
              label="Reference Video URL (Optional)"
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2C2C2C]">
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
              isLoading={saving}
            >
              {editing ? 'Update Exercise' : 'Add Exercise'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, Plus, Building2, Edit3, Camera, X } from 'lucide-react';
import { apiFetch, clearApiCache, getErrorMessage } from '@/lib/api';
import { compressImageFile } from '@/lib/media-upload';
import { useToast } from '@/context/ToastContext';
import { GymClassItem, FacilityItem, DifficultyLevel } from '@/types';
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

export default function AdminClassesAndFacilitiesPage() {
  const { showToast } = useToast();
  const [classes, setClasses] = useState<GymClassItem[]>([]);
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<GymClassItem | null>(null);
  const [savingClass, setSavingClass] = useState(false);
  const [classForm, setClassForm] = useState({
    title: '',
    category: 'Conditioning',
    description: '',
    durationMinutes: '60',
    defaultCapacity: '20',
    difficulty: 'INTERMEDIATE' as DifficultyLevel,
    isPublished: true,
  });

  const [facilityModalOpen, setFacilityModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<FacilityItem | null>(
    null,
  );
  const [savingFacility, setSavingFacility] = useState(false);
  const [facilityForm, setFacilityForm] = useState({
    name: '',
    category: 'Strength',
    description: '',
    featuresText: '',
    imageUrl: '',
    isPublished: true,
    sortOrder: '0',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [clsRes, facRes] = await Promise.all([
        apiFetch<GymClassItem[]>('/classes'),
        apiFetch<FacilityItem[]>('/classes/facilities'),
      ]);
      setClasses(Array.isArray(clsRes) ? clsRes : []);
      setFacilities(Array.isArray(facRes) ? facRes : []);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingClass(true);
    try {
      const payload = {
        title: classForm.title,
        category: classForm.category,
        description: classForm.description,
        durationMinutes: Number(classForm.durationMinutes),
        defaultCapacity: Number(classForm.defaultCapacity),
        difficulty: classForm.difficulty,
        isPublished: classForm.isPublished,
      };
      if (editingClass) {
        await apiFetch(`/classes/${editingClass.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showToast('success', 'Gym class updated.');
      } else {
        await apiFetch('/classes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('success', 'Gym class created.');
      }
      setClassModalOpen(false);
      loadData();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setSavingClass(false);
    }
  };

  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFacility(true);
    try {
      const payload = {
        name: facilityForm.name,
        category: facilityForm.category,
        description: facilityForm.description,
        features: facilityForm.featuresText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        imageUrl: facilityForm.imageUrl.trim() || undefined,
        isPublished: facilityForm.isPublished,
        sortOrder: Number(facilityForm.sortOrder || 0),
      };
      if (editingFacility) {
        await apiFetch(`/classes/facilities/${editingFacility.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showToast('success', 'Facility zone updated.');
      } else {
        await apiFetch('/classes/facilities', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('success', 'Facility zone added.');
      }
      clearApiCache();
      setFacilityModalOpen(false);
      loadData();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setSavingFacility(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Gym Classes */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
              Classes &amp; Facilities
            </h1>
            <p className="text-xs font-mono text-[#A1A1AA] mt-1">
              Admin Portal <span className="mx-1">&gt;</span>{' '}
              <span className="text-white">Group Classes &amp; Configurable Zones</span>
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingClass(null);
              setClassForm({
                title: '',
                category: 'Conditioning',
                description: '',
                durationMinutes: '60',
                defaultCapacity: '20',
                difficulty: 'INTERMEDIATE',
                isPublished: true,
              });
              setClassModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" /> Create Class Format
          </Button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
            <div>
              <p className="text-xs text-[#A1A1AA]">Class Formats</p>
              <p className="text-2xl font-bold text-white font-mono mt-0.5">{classes.length}</p>
            </div>
            <Calendar className="w-5 h-5 text-[#C7F464]" />
          </div>
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
            <div>
              <p className="text-xs text-[#A1A1AA]">Published Classes</p>
              <p className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">
                {classes.filter((c) => c.isPublished).length}
              </p>
            </div>
            <Calendar className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
            <div>
              <p className="text-xs text-[#A1A1AA]">Facility Zones</p>
              <p className="text-2xl font-bold text-white font-mono mt-0.5">{facilities.length}</p>
            </div>
            <Building2 className="w-5 h-5 text-[#C7F464]" />
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-56 w-full" />
        ) : classes.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-6 h-6" />}
            title="No Classes Created"
            description="Create group training classes to schedule weekly sessions."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <Card key={cls.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono uppercase tracking-widest text-[#C7F464]">
                      {cls.category} • {cls.durationMinutes} Min
                    </span>
                    <StatusBadge
                      status={cls.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    />
                  </div>
                  <h3 className="font-display text-xl text-white uppercase tracking-wide">
                    {cls.title || cls.name}
                  </h3>
                  <p className="text-xs text-[#A1A1AA] mt-2">
                    {cls.description}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-[#303030] flex items-center justify-between text-xs">
                  <span className="font-mono text-zinc-300">
                    Default Cap: {cls.defaultCapacity} Seats
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingClass(cls);
                      setClassForm({
                        title: cls.title || cls.name || '',
                        category: cls.category,
                        description: cls.description,
                        durationMinutes: String(cls.durationMinutes),
                        defaultCapacity: String(cls.defaultCapacity),
                        difficulty:
                          (cls.difficulty as DifficultyLevel) || 'INTERMEDIATE',
                        isPublished: cls.isPublished,
                      });
                      setClassModalOpen(true);
                    }}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Configurable Gym Facilities */}
      <div className="space-y-6 pt-6 border-t border-[#303030]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#C7F464]">
              Public Website Facility Zones
            </span>
            <h2 className="font-display text-2xl text-white uppercase tracking-wide mt-1">
              Configurable Gym Facilities
            </h2>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setEditingFacility(null);
              setFacilityForm({
                name: '',
                category: 'Strength',
                description: '',
                featuresText: '',
                imageUrl: '',
                isPublished: true,
                sortOrder: String(facilities.length + 1),
              });
              setFacilityModalOpen(true);
            }}
          >
            <Building2 className="w-4 h-4" /> Add Facility Zone
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((fac) => (
            <Card key={fac.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#C7F464]">
                    {fac.category}
                  </span>
                  <StatusBadge
                    status={fac.isPublished ? 'PUBLISHED' : 'DRAFT'}
                  />
                </div>
                <h3 className="font-display text-xl text-white uppercase tracking-wide">
                  {fac.name}
                </h3>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  {fac.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(fac.features || fac.equipmentList || []).map(
                    (eq: string, i: number) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-md bg-[#171717] border border-[#2C2C2C] text-[11px] font-medium text-white"
                      >
                        {eq}
                      </span>
                    ),
                  )}
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-[#303030] flex justify-end">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditingFacility(fac);
                    setFacilityForm({
                      name: fac.name,
                      category: fac.category,
                      description: fac.description,
                      featuresText: (
                        fac.features ||
                        fac.equipmentList ||
                        []
                      ).join('\n'),
                      imageUrl: fac.imageUrl || '',
                      isPublished: fac.isPublished,
                      sortOrder: String(fac.sortOrder ?? 0),
                    });
                    setFacilityModalOpen(true);
                  }}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Zone
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Class Modal */}
      <Modal
        isOpen={classModalOpen}
        onClose={() => setClassModalOpen(false)}
        title={
          editingClass
            ? `Edit Class — ${editingClass.title || editingClass.name}`
            : 'Create Gym Class'
        }
        description="Define a group training format, duration, and seat capacity for the Ashkona class schedule."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveClass} className="space-y-5">
          {/* Live Class Card Preview */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#C7F464]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#C7F464] text-[#090909] flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#C7F464]">
                  {classForm.category || 'GROUP CLASS'} •{' '}
                  {classForm.durationMinutes || 60} MIN •{' '}
                  {classForm.defaultCapacity || 20} SEATS
                </p>
                <p className="text-sm font-bold text-white truncate">
                  {classForm.title || 'New Group Class Format'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={classForm.difficulty} />
              <StatusBadge
                status={classForm.isPublished ? 'PUBLISHED' : 'DRAFT'}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Class Title *"
                required
                value={classForm.title}
                onChange={(e) =>
                  setClassForm({ ...classForm, title: e.target.value })
                }
                placeholder="Ashkona HIIT Conditioning"
              />
              <div className="space-y-2">
                <Input
                  label="Category *"
                  required
                  value={classForm.category}
                  onChange={(e) =>
                    setClassForm({ ...classForm, category: e.target.value })
                  }
                  placeholder="Conditioning / Strength / Mobility"
                />
                <div className="flex flex-wrap gap-1.5">
                  {['Conditioning', 'Strength', 'HIIT', 'Mobility', 'Ladies'].map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() =>
                          setClassForm({ ...classForm, category: cat })
                        }
                        className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono ${
                          classForm.category === cat
                            ? 'bg-[#C7F464] border-[#C7F464] !text-[#090909] font-bold'
                            : 'bg-[#171717] border-[#2C2C2C] text-[#A1A1AA]'
                        }`}
                      >
                        {cat}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Duration (Minutes) *"
                type="number"
                required
                value={classForm.durationMinutes}
                onChange={(e) =>
                  setClassForm({
                    ...classForm,
                    durationMinutes: e.target.value,
                  })
                }
              />
              <Input
                label="Default Capacity (Seats) *"
                type="number"
                required
                value={classForm.defaultCapacity}
                onChange={(e) =>
                  setClassForm({
                    ...classForm,
                    defaultCapacity: e.target.value,
                  })
                }
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
                  const active = classForm.difficulty === d.value;
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() =>
                        setClassForm({ ...classForm, difficulty: d.value })
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
              label="Class Description & Outcomes *"
              required
              placeholder="Outline structure, interval format, and recommended experience level..."
              value={classForm.description}
              onChange={(e) =>
                setClassForm({ ...classForm, description: e.target.value })
              }
            />
            <label className="p-3 rounded-xl bg-[#171717] border border-[#2C2C2C] flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-white">
                  Publish class format to public schedule
                </p>
                <p className="text-[11px] font-mono text-[#A1A1AA]">
                  Visible on public /schedule and Member Class Bookings when active
                </p>
              </div>
              <input
                type="checkbox"
                checked={classForm.isPublished}
                onChange={(e) =>
                  setClassForm({ ...classForm, isPublished: e.target.checked })
                }
                className="w-4 h-4 accent-[#C7F464]"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2C2C2C]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setClassModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="ifg-btn-primary"
              isLoading={savingClass}
            >
              Save Class
            </Button>
          </div>
        </form>
      </Modal>

      {/* Facility Modal */}
      <Modal
        isOpen={facilityModalOpen}
        onClose={() => setFacilityModalOpen(false)}
        title={
          editingFacility
            ? `Edit Facility — ${editingFacility.name}`
            : 'Add Facility Zone'
        }
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveFacility} className="space-y-4">
          {/* Zone Picture Preview & Direct Upload */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative w-full sm:w-36 h-24 rounded-xl overflow-hidden bg-[#171717] border border-[#2C2C2C] shrink-0">
              <img
                src={
                  facilityForm.imageUrl ||
                  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=75'
                }
                alt={facilityForm.name || 'Facility Zone'}
                className="w-full h-full object-cover"
              />
              {facilityForm.imageUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setFacilityForm((prev) => ({ ...prev, imageUrl: '' }))
                  }
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 border border-white/20 text-white hover:bg-red-500 flex items-center justify-center"
                  title="Remove zone photo"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold uppercase text-white">
                  Training Zone Picture
                </span>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B2210] border border-[#C7F464]/40 text-xs font-mono text-[#C7F464] cursor-pointer hover:bg-[#C7F464] hover:text-[#0B0B0B] transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                  Upload Zone Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const dataUrl = await compressImageFile(file, 1200, 0.85);
                        setFacilityForm((prev) => ({ ...prev, imageUrl: dataUrl }));
                        showToast('success', 'Facility zone photo ready.');
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
                label="Or Paste Image URL"
                placeholder="https://images.unsplash.com/..."
                value={facilityForm.imageUrl}
                onChange={(e) =>
                  setFacilityForm({ ...facilityForm, imageUrl: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Facility Name"
              required
              value={facilityForm.name}
              onChange={(e) =>
                setFacilityForm({ ...facilityForm, name: e.target.value })
              }
              placeholder="Free Weights & Power Zone"
            />
            <Input
              label="Category"
              required
              value={facilityForm.category}
              onChange={(e) =>
                setFacilityForm({ ...facilityForm, category: e.target.value })
              }
              placeholder="Strength / Cardio / Amenities"
            />
          </div>
          <Textarea
            label="Description"
            required
            value={facilityForm.description}
            onChange={(e) =>
              setFacilityForm({ ...facilityForm, description: e.target.value })
            }
          />
          <Textarea
            label="Equipment & Feature Highlights (One per line)"
            value={facilityForm.featuresText}
            onChange={(e) =>
              setFacilityForm({ ...facilityForm, featuresText: e.target.value })
            }
          />
          <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
            <input
              type="checkbox"
              checked={facilityForm.isPublished}
              onChange={(e) =>
                setFacilityForm({
                  ...facilityForm,
                  isPublished: e.target.checked,
                })
              }
              className="accent-[#C7F464]"
            />
            Published on Public Website
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#303030]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFacilityModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={savingFacility}>
              Save Facility
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

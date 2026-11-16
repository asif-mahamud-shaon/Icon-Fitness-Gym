'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { UserPlus, Power, ArrowUpRight, Camera, Edit3, X } from 'lucide-react';
import { apiFetch, clearApiCache } from '@/lib/api';
import { compressImageFile } from '@/lib/media-upload';
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

export default function AdminTrainersPage() {
  const { toast } = useToast();
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<any | null>(null);
  const [updatingTrainer, setUpdatingTrainer] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    gender: 'MALE',
    avatarUrl: '',
    headline: '',
    bio: '',
    specializationsText: '',
    qualificationsText: '',
    experienceYears: '3',
    isFeatured: false,
  });

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    gender: 'MALE',
    password: 'Trainer@1234',
    avatarUrl: '',
    headline: '',
    bio: '',
    specializationsText: 'Strength Training, Hypertrophy',
    qualificationsText: 'Certified Strength Coach',
    experienceYears: '3',
  });

  const loadTrainers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any[]>('/trainers');
      setTrainers(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrainers();
  }, [loadTrainers]);

  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/trainers', {
        method: 'POST',
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          gender: form.gender,
          password: form.password,
          avatarUrl: form.avatarUrl || undefined,
          headline: form.headline,
          bio: form.bio,
          specializations: form.specializationsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          qualifications: form.qualificationsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          experienceYears: Number(form.experienceYears),
        }),
      });
      toast({ title: 'Trainer Profile Created', variant: 'success' });
      clearApiCache();
      setModalOpen(false);
      await loadTrainers();
    } catch (err: any) {
      toast({
        title: 'Failed to Create Trainer',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (trainer: any) => {
    try {
      await apiFetch(`/trainers/${trainer.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !trainer.isActive }),
      });
      clearApiCache();
      toast({
        title: `Trainer ${!trainer.isActive ? 'Activated' : 'Deactivated'}`,
        variant: 'info',
      });
      await loadTrainers();
    } catch (err: any) {
      toast({
        title: 'Error Updating Trainer',
        description: err.message,
        variant: 'error',
      });
    }
  };

  const openEditModal = (trainer: any) => {
    setEditingTrainer(trainer);
    setEditForm({
      fullName: trainer.user?.fullName || '',
      phone: trainer.user?.phone || '',
      gender: trainer.gender || 'MALE',
      avatarUrl: trainer.user?.avatarUrl || '',
      headline: trainer.headline || '',
      bio: trainer.bio || '',
      specializationsText: (trainer.specializations || []).join(', '),
      qualificationsText: (trainer.qualifications || []).join(', '),
      experienceYears: String(trainer.experienceYears ?? 3),
      isFeatured: Boolean(trainer.isFeatured),
    });
    setEditModalOpen(true);
  };

  const handleUpdateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrainer) return;
    setUpdatingTrainer(true);
    try {
      await apiFetch(`/trainers/${editingTrainer.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: editForm.fullName,
          phone: editForm.phone,
          gender: editForm.gender,
          avatarUrl: editForm.avatarUrl.trim() || null,
          headline: editForm.headline,
          bio: editForm.bio,
          specializations: editForm.specializationsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          qualifications: editForm.qualificationsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          experienceYears: Number(editForm.experienceYears || 0),
          isFeatured: editForm.isFeatured,
        }),
      });
      clearApiCache();
      toast({
        title: 'Trainer Profile & Photo Updated',
        description: 'Changes are live on the public website and trainers directory.',
        variant: 'success',
      });
      setEditModalOpen(false);
      await loadTrainers();
    } catch (err: any) {
      toast({
        title: 'Failed to Update Trainer',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setUpdatingTrainer(false);
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
            Trainer List
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Trainers &amp; Coaching Roster</span>
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setModalOpen(true)}
        >
          Add New Trainer
        </Button>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Total Trainers</p>
            <p className="text-2xl font-bold text-white font-mono mt-0.5">{trainers.length}</p>
          </div>
          <span className="text-xs font-mono text-[#C7F464]">ROSTER</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Active Coaches</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">
              {trainers.filter((t) => t.isActive).length}
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400">ONLINE</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Assigned Members</p>
            <p className="text-2xl font-bold text-white font-mono mt-0.5">
              {trainers.reduce((sum, t) => sum + Number(t._count?.assignedMembers ?? 0), 0)}
            </p>
          </div>
          <span className="text-xs font-mono text-[#C7F464]">CLIENTS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trainers.map((t) => {
          const initials = (t.user?.fullName || 'TR')
            .split(' ')
            .map((p: string) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
          return (
            <Card key={t.id} className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  {t.user?.avatarUrl ? (
                    <img
                      src={t.user.avatarUrl}
                      alt={t.user?.fullName || 'Trainer'}
                      className="w-12 h-12 rounded-full object-cover border border-[#C7F464] shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#171717] border border-[#303030] flex items-center justify-center font-display text-sm text-[#C7F464] shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <Link
                      href={`/admin/trainers/${t.id}`}
                      className="text-xl font-bold text-white hover:text-[#C7F464] transition-colors block truncate"
                    >
                      {t.user?.fullName}
                    </Link>
                    <p className="text-xs text-[#C7F464] font-mono truncate">
                      {t.user?.email} • {t.user?.phone}
                    </p>
                    <p className="text-xs text-[#A1A1AA] mt-1">{t.headline}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={t.gender || 'MALE'} />
                  <StatusBadge status={t.isActive ? 'ACTIVE' : 'DEACTIVATED'} />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(t.specializations || []).map((s: string) => (
                  <span
                    key={s}
                    className="text-[11px] px-2.5 py-0.5 rounded bg-[#171717] border border-[#303030] text-white"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div className="pt-3 border-t border-[#303030] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#A1A1AA]">
                <span>
                  Assigned Members: {t._count?.assignedMembers ?? 0} • Classes:{' '}
                  {t._count?.classSchedules ?? 0}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                    onClick={() => openEditModal(t)}
                  >
                    Edit Photo &amp; Info
                  </Button>
                  <Link href={`/admin/trainers/${t.id}`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                    >
                      View Details
                    </Button>
                  </Link>
                  <Button
                    variant={t.isActive ? 'danger' : 'secondary'}
                    size="sm"
                    leftIcon={<Power className="w-3.5 h-3.5" />}
                    onClick={() => handleToggleActive(t)}
                  >
                    {t.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Trainer Account & Public Profile"
        description="Provision a coach login and showcase card for the public Trainers & Coaching portal."
        maxWidth="max-w-2xl"
      >
        <form
          onSubmit={handleCreateTrainer}
          className="space-y-5 max-h-[75vh] overflow-y-auto pr-1"
        >
          {/* Live Coach Showcase Card Preview */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#C7F464]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-[#C7F464] text-[#090909] font-display text-lg flex items-center justify-center shrink-0">
                {(form.fullName || 'C')
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#C7F464]">
                  COACH • {form.experienceYears || 3} YRS EXPERIENCE
                </p>
                <p className="text-sm font-bold text-white truncate">
                  {form.fullName || 'New Certified Coach'}
                </p>
                <p className="text-xs text-[#A1A1AA] truncate">
                  {form.headline || 'Professional Headline Preview'}
                </p>
              </div>
            </div>
            <StatusBadge status={form.gender} />
          </div>

          <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-4">
            <Input
              label="Full Name *"
              required
              placeholder="e.g. Coach Tariqul Hasan"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email *"
                type="email"
                required
                placeholder="coach@iconfitnessgym.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                label="Phone *"
                required
                placeholder="+88017..."
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            {/* Gender Eligibility Toggle Cards */}
            <div className="space-y-2">
              <span className="block text-xs font-mono uppercase text-[#A1A1AA]">
                Coach Gender &amp; Floor Session Eligibility *
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    value: 'MALE',
                    title: 'Male Trainer',
                    sub: 'General & Male Sessions',
                  },
                  {
                    value: 'FEMALE',
                    title: 'Female Trainer',
                    sub: 'Eligible for Dedicated Ladies Sessions',
                  },
                ].map((g) => {
                  const active = form.gender === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setForm({ ...form, gender: g.value })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        active
                          ? 'bg-[#1B2210] border-[#C7F464]'
                          : 'bg-[#171717] border-[#2C2C2C] hover:border-[#C7F464]/50'
                      }`}
                    >
                      <p className="text-xs font-bold text-white">{g.title}</p>
                      <p className="text-[11px] font-mono text-[#A1A1AA] mt-0.5">
                        {g.sub}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <Input
                label="Experience (Years)"
                type="number"
                value={form.experienceYears}
                onChange={(e) =>
                  setForm({ ...form, experienceYears: e.target.value })
                }
              />
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-mono uppercase text-[#A1A1AA]">
                    Coach Portrait Photo
                  </label>
                  <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1B2210] border border-[#C7F464]/40 text-[11px] font-mono text-[#C7F464] cursor-pointer hover:bg-[#C7F464] hover:text-[#0B0B0B] transition-colors">
                    <Camera className="w-3 h-3" />
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const dataUrl = await compressImageFile(file, 800, 0.85);
                          setForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
                          toast({ title: 'Trainer Photo Ready', variant: 'success' });
                        } catch (err: any) {
                          toast({
                            title: 'Photo Upload Failed',
                            description: err.message,
                            variant: 'error',
                          });
                        } finally {
                          e.target.value = '';
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                <Input
                  placeholder="https://... or upload photo"
                  value={form.avatarUrl}
                  onChange={(e) =>
                    setForm({ ...form, avatarUrl: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-4">
            <Input
              label="Professional Headline *"
              required
              placeholder="e.g. Senior Strength & Powerlifting Coach"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
            />
            <Input
              label="Specializations (Comma-Separated)"
              value={form.specializationsText}
              onChange={(e) =>
                setForm({ ...form, specializationsText: e.target.value })
              }
            />
            <Input
              label="Qualifications (Comma-Separated)"
              value={form.qualificationsText}
              onChange={(e) =>
                setForm({ ...form, qualificationsText: e.target.value })
              }
            />
            <Textarea
              label="Coach Biography *"
              required
              placeholder="Years of floor coaching experience, notable client transformations, and coaching philosophy..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
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
              isLoading={submitting}
            >
              Create Trainer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Trainer Profile & Portrait Photo Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Coach — ${editForm.fullName || 'Trainer'}`}
        description="Update coach portrait picture, headline, biography, and public website display."
        maxWidth="max-w-2xl"
      >
        <form
          onSubmit={handleUpdateTrainer}
          className="space-y-5 max-h-[78vh] overflow-y-auto pr-1"
        >
          {/* Portrait Preview & Direct Upload */}
          <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-[#141414] border border-[#C7F464]/50 shrink-0">
              {editForm.avatarUrl ? (
                <img
                  src={editForm.avatarUrl}
                  alt={editForm.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display text-2xl text-[#C7F464]">
                  {(editForm.fullName || 'TR')
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
              {editForm.avatarUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setEditForm((prev) => ({ ...prev, avatarUrl: '' }))
                  }
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 border border-white/20 text-white hover:bg-red-500 flex items-center justify-center"
                  title="Remove photo"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold uppercase text-white">
                  Coach Card Picture (Shown on Website &amp; Roster)
                </span>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B2210] border border-[#C7F464]/40 text-xs font-mono text-[#C7F464] cursor-pointer hover:bg-[#C7F464] hover:text-[#0B0B0B] transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                  Upload Portrait Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const dataUrl = await compressImageFile(file, 900, 0.85);
                        setEditForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
                        toast({ title: 'New Portrait Selected', variant: 'success' });
                      } catch (err: any) {
                        toast({
                          title: 'Image Error',
                          description: err.message,
                          variant: 'error',
                        });
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
                value={editForm.avatarUrl}
                onChange={(e) =>
                  setEditForm({ ...editForm, avatarUrl: e.target.value })
                }
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                required
                value={editForm.fullName}
                onChange={(e) =>
                  setEditForm({ ...editForm, fullName: e.target.value })
                }
              />
              <Input
                label="Phone Number *"
                required
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Coach Gender"
                options={[
                  { value: 'MALE', label: 'Male Coach' },
                  { value: 'FEMALE', label: 'Female Coach (Ladies Session Eligible)' },
                ]}
                value={editForm.gender}
                onChange={(e) =>
                  setEditForm({ ...editForm, gender: e.target.value })
                }
              />
              <Input
                label="Experience (Years)"
                type="number"
                min={0}
                value={editForm.experienceYears}
                onChange={(e) =>
                  setEditForm({ ...editForm, experienceYears: e.target.value })
                }
              />
            </div>

            <Input
              label="Headline *"
              required
              value={editForm.headline}
              onChange={(e) =>
                setEditForm({ ...editForm, headline: e.target.value })
              }
            />
            <Input
              label="Specializations (Comma-Separated)"
              value={editForm.specializationsText}
              onChange={(e) =>
                setEditForm({ ...editForm, specializationsText: e.target.value })
              }
            />
            <Input
              label="Qualifications (Comma-Separated)"
              value={editForm.qualificationsText}
              onChange={(e) =>
                setEditForm({ ...editForm, qualificationsText: e.target.value })
              }
            />
            <Textarea
              label="Biography *"
              required
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
            />
            <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#171717] border border-[#2C2C2C] cursor-pointer">
              <div>
                <p className="text-xs font-bold text-white">Featured on Homepage Roster</p>
                <p className="text-[11px] text-[#A1A1AA]">
                  Prioritize this trainer in &ldquo;Meet Our Certified Trainers&rdquo;
                </p>
              </div>
              <input
                type="checkbox"
                checked={editForm.isFeatured}
                onChange={(e) =>
                  setEditForm({ ...editForm, isFeatured: e.target.checked })
                }
                className="h-4 w-4 accent-[#C7F464]"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2C2C2C]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={updatingTrainer}
            >
              Save Coach Photo &amp; Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


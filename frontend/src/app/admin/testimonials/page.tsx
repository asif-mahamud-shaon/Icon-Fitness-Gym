'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  MessageSquareQuote,
  Plus,
  CheckCircle2,
  Eye,
  EyeOff,
  Trash2,
  Star,
} from 'lucide-react';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { TestimonialItem } from '@/types';
import {
  Card,
  Button,
  Input,
  Textarea,
  StatusBadge,
  Modal,
  Skeleton,
  EmptyState,
} from '@/components/ui';

export default function AdminTestimonialsPage() {
  const { showToast } = useToast();
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    authorName: '',
    authorRole: 'Member — Ashkona Branch',
    rating: '5',
    content: '',
    isApproved: true,
    isPublished: true,
  });

  const loadTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<TestimonialItem[]>('/testimonials');
      setTestimonials(Array.isArray(res) ? res : []);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/testimonials', {
        method: 'POST',
        body: JSON.stringify({
          authorName: form.authorName,
          authorRole: form.authorRole,
          rating: Number(form.rating),
          content: form.content,
          isApproved: form.isApproved,
          isPublished: form.isPublished,
        }),
      });
      showToast('success', 'Member testimonial added.');
      setModalOpen(false);
      loadTestimonials();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, patch: Partial<TestimonialItem>) => {
    try {
      await apiFetch(`/testimonials/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      showToast('success', 'Testimonial updated.');
      loadTestimonials();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/testimonials/${id}`, { method: 'DELETE' });
      showToast('success', 'Testimonial deleted.');
      loadTestimonials();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Testimonials
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Verified Member Reviews &amp; Moderation</span>
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({
              authorName: '',
              authorRole: 'Verified Member — Ashkona',
              rating: '5',
              content: '',
              isApproved: true,
              isPublished: true,
            });
            setModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> Add Testimonial
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Total Reviews</p>
            <p className="text-2xl font-bold text-white font-mono mt-0.5">{testimonials.length}</p>
          </div>
          <MessageSquareQuote className="w-5 h-5 text-[#C7F464]" />
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Published Live</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">
              {testimonials.filter((t) => t.isPublished).length}
            </p>
          </div>
          <Eye className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Pending Approval</p>
            <p className="text-2xl font-bold text-amber-400 font-mono mt-0.5">
              {testimonials.filter((t) => !t.isApproved).length}
            </p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-amber-400" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-52 w-full" />
          ))}
        </div>
      ) : testimonials.length === 0 ? (
        <EmptyState
          icon={<MessageSquareQuote className="w-6 h-6" />}
          title="No Testimonials"
          description="Add verified member feedback to display on the public homepage."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <Card key={t.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1 text-[#C7F464]">
                    {Array.from({ length: t.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#C7F464]" />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge
                      status={t.isApproved ? 'APPROVED' : 'PENDING'}
                    />
                    <StatusBadge
                      status={t.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    />
                  </div>
                </div>
                <p className="text-sm text-zinc-200 italic leading-relaxed mb-4">
                  &ldquo;{t.content || t.quote}&rdquo;
                </p>
                <p className="font-semibold text-white text-sm">
                  {t.authorName}
                </p>
                <p className="text-xs text-[#A1A1AA]">{t.authorRole}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#303030] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {!t.isApproved && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdate(t.id, { isApproved: true })}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      handleUpdate(t.id, { isPublished: !t.isPublished })
                    }
                  >
                    {t.isPublished ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Publish
                      </>
                    )}
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(t.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Member Testimonial"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreate} className="space-y-5 max-h-[78vh] overflow-y-auto pr-1">
          {/* Live Testimonial Card Preview */}
          <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#1B2210] border border-[#C7F464]/35 flex items-center justify-center text-[#C7F464]">
                  <MessageSquareQuote className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    {form.authorName.trim() || 'Member Name'}
                  </p>
                  <p className="text-[11px] text-[#A1A1AA]">
                    {form.authorRole.trim() || 'Member — Ashkona Branch'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Number(form.rating || 5)
                        ? 'fill-[#C7F464] text-[#C7F464]'
                        : 'text-[#52525B]'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs italic text-[#D4D4D8] line-clamp-2">
              &ldquo;
              {form.content.trim() ||
                'Your live member story preview will appear here as you type...'}
              &rdquo;
            </p>
          </div>

          {/* Section 1: Author & Interactive Star Rating */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#A1A1AA]">
              1 • Member Profile & Rating
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Member Name *"
                required
                value={form.authorName}
                onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                placeholder="e.g. Tanvir Hossain"
              />
              <Input
                label="Role / Training Context"
                value={form.authorRole}
                onChange={(e) => setForm({ ...form, authorRole: e.target.value })}
                placeholder="Strength Member — Ashkona"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase text-[#A1A1AA]">
                Experience Rating *
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((score) => {
                  const selected = Number(form.rating) === score;
                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setForm({ ...form, rating: String(score) })}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-mono font-bold transition-all ${
                        selected
                          ? 'bg-[#C7F464] border-[#C7F464] text-[#0B0B0B] shadow-sm'
                          : 'bg-[#171717] border-[#2C2C2C] text-[#D4D4D8] hover:border-[#C7F464]/50'
                      }`}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          selected
                            ? 'fill-[#0B0B0B] text-[#0B0B0B]'
                            : 'fill-[#C7F464] text-[#C7F464]'
                        }`}
                      />
                      <span>{score}/5</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Quote & Publishing Controls */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#A1A1AA]">
              2 • Testimonial Story & Publishing
            </p>
            <Textarea
              label="Testimonial Content *"
              required
              placeholder="Share specific training results, coaching feedback, facility cleanliness, or transformation milestones..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#171717] border border-[#2C2C2C] cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-white">Verified Approval</p>
                  <p className="text-[11px] text-[#A1A1AA]">Mark story as admin-verified</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.isApproved}
                  onChange={(e) =>
                    setForm({ ...form, isApproved: e.target.checked })
                  }
                  className="h-4 w-4 accent-[#C7F464]"
                />
              </label>
              <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#171717] border border-[#2C2C2C] cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-white">Published on Website</p>
                  <p className="text-[11px] text-[#A1A1AA]">Display on public home & reviews</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) =>
                    setForm({ ...form, isPublished: e.target.checked })
                  }
                  className="h-4 w-4 accent-[#C7F464]"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[#262626]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              Save Testimonial
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

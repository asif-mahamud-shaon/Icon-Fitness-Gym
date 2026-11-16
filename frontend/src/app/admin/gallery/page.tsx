'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Cloud,
  Upload,
  Video,
  Link2,
  Check,
  Sparkles,
  X,
} from 'lucide-react';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { GalleryItem, MediaType } from '@/types';
import {
  Card,
  Button,
  Input,
  StatusBadge,
  Modal,
  Skeleton,
  EmptyState,
} from '@/components/ui';

const GALLERY_CATEGORIES = [
  { value: 'FACILITY', label: 'Facility' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'TRAINING', label: 'Training' },
  { value: 'EVENTS', label: 'Events' },
  { value: 'TRANSFORMATIONS', label: 'Transformations' },
];

function compressGalleryPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        const maxDim = 1400;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

function readVideoAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const maxBytes = 6.5 * 1024 * 1024;
    if (file.size > maxBytes) {
      reject(
        new Error(
          'Video file exceeds 6.5 MB direct upload limit. Compress it or paste an HTTPS video URL.',
        ),
      );
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read video file.'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

function isVideoMedia(mediaType?: string, mediaUrl?: string): boolean {
  if (mediaType === 'VIDEO') return true;
  if (!mediaUrl) return false;
  return (
    mediaUrl.startsWith('data:video/') ||
    /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(mediaUrl)
  );
}

export default function AdminGalleryPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [integrationStatus, setIntegrationStatus] = useState<{
    cloudinaryEnabled: boolean;
    configured: boolean;
    mode: string;
  }>({
    cloudinaryEnabled: false,
    configured: false,
    mode: 'CONFIGURABLE_URL_ADAPTER',
  });
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sourceMode, setSourceMode] = useState<'UPLOAD' | 'URL'>('UPLOAD');
  const [processingUpload, setProcessingUpload] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [form, setForm] = useState({
    title: '',
    caption: '',
    category: 'FACILITY',
    mediaType: 'IMAGE' as MediaType,
    mediaUrl: '',
    isPlaceholder: false,
    isPublished: true,
    sortOrder: '0',
  });

  const handleMediaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessingUpload(true);
    try {
      const isVid = file.type.startsWith('video/');
      const dataUrl = isVid
        ? await readVideoAsDataUrl(file)
        : await compressGalleryPhoto(file);
      const baseTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
      setForm((prev) => ({
        ...prev,
        mediaType: isVid ? 'VIDEO' : 'IMAGE',
        mediaUrl: dataUrl,
        title: prev.title.trim() ? prev.title : baseTitle || 'Icon Ashkona Gallery Item',
      }));
      setUploadedFileName(file.name);
      showToast('success', `${isVid ? 'Video' : 'Photo'} "${file.name}" ready to publish.`);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setProcessingUpload(false);
      e.target.value = '';
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadGallery = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/gallery');
      if (Array.isArray(res)) {
        setItems(res);
      } else {
        setItems(res?.items || []);
        if (res?.integrationStatus) {
          setIntegrationStatus(res.integrationStatus);
        }
      }
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const handleCreateMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mediaUrl.trim()) {
      showToast(
        'error',
        sourceMode === 'UPLOAD'
          ? 'Please upload an image or video file before saving.'
          : 'Please enter a valid media URL before saving.',
      );
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/gallery', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          caption: form.caption.trim() || undefined,
          category: form.category,
          mediaType: form.mediaType,
          mediaUrl: form.mediaUrl.trim(),
          isPlaceholder: form.isPlaceholder,
          isPublished: form.isPublished,
          sortOrder: Number(form.sortOrder || 0),
        }),
      });
      showToast('success', 'Gallery media item published successfully.');
      setCreateOpen(false);
      setUploadedFileName('');
      setForm({
        title: '',
        caption: '',
        category: 'FACILITY',
        mediaType: 'IMAGE',
        mediaUrl: '',
        isPlaceholder: false,
        isPublished: true,
        sortOrder: '0',
      });
      loadGallery();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (item: GalleryItem) => {
    try {
      await apiFetch(`/gallery/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublished: !item.isPublished }),
      });
      showToast(
        'success',
        `Media ${!item.isPublished ? 'published' : 'unpublished'}.`,
      );
      loadGallery();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/gallery/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      showToast('success', 'Gallery item deleted.');
      setDeleteTarget(null);
      loadGallery();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Gallery Management
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Visual Assets &amp; Facility Photography</span>
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({
              title: '',
              caption: '',
              category: 'FACILITY',
              mediaType: 'IMAGE',
              mediaUrl: '',
              isPlaceholder: false,
              isPublished: true,
              sortOrder: String(items.length + 1),
            });
            setCreateOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> Upload / Add Media
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Total Assets</p>
            <p className="text-2xl font-bold text-white font-mono mt-0.5">{items.length}</p>
          </div>
          <ImageIcon className="w-5 h-5 text-[#C7F464]" />
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Published Live</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">
              {items.filter((i) => i.isPublished).length}
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400">VISIBLE</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Adapter Mode</p>
            <p className="text-sm font-bold text-[#C7F464] font-mono mt-1">
              {integrationStatus.configured ? integrationStatus.mode : 'HTTPS URL'}
            </p>
          </div>
          <Cloud className="w-5 h-5 text-[#C7F464]" />
        </div>
      </div>

      {/* Cloudinary Adapter Status Banner */}
      <Card className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Cloud className="w-5 h-5 text-[#C7F464] shrink-0" />
          <div>
            <p className="text-xs font-semibold text-white">
              Cloudinary Media Adapter:{' '}
              <span className="text-[#C7F464]">
                {integrationStatus.configured
                  ? `Connected (${integrationStatus.mode})`
                  : 'Direct HTTPS Media URL Mode (Configure CLOUDINARY_* in .env for signed uploads)'}
              </span>
            </p>
            <p className="text-xs text-[#A1A1AA]">
              Items marked as <em>Placeholder</em> display a transparent notice
              on the public website until replaced with verified Ashkona gym
              photography.
            </p>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="w-6 h-6" />}
          title="No Gallery Media"
          description="Add photographs or training videos to showcase Icon Fitness Gym."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card
              key={item.id}
              className="p-0 overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 bg-[#171717] overflow-hidden">
                  {isVideoMedia(item.mediaType, item.mediaUrl) ? (
                    <video
                      src={item.mediaUrl}
                      controls
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      onError={(e) => {
                        e.currentTarget.style.opacity = '0.25';
                      }}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <StatusBadge
                      status={item.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    />
                    {item.isPlaceholder && <StatusBadge status="PLACEHOLDER" />}
                  </div>
                </div>
                <div className="p-5">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#C7F464]">
                    {item.category} • {item.mediaType}
                  </span>
                  <h3 className="font-display text-xl text-white uppercase tracking-wide mt-1">
                    {item.title}
                  </h3>
                  {item.caption && (
                    <p className="text-xs text-[#A1A1AA] mt-1">
                      {item.caption}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-5 py-3.5 border-t border-[#303030] bg-[#171717]/50 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => togglePublish(item)}
                >
                  {item.isPublished ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Unpublish
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Publish
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setDeleteTarget(item)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload / Add Media Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Gallery Media Item"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateMedia} className="space-y-5 max-h-[78vh] overflow-y-auto pr-1">
          {/* Live Preview Banner + Upload Switcher */}
          <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C7F464]" />
                <span className="text-xs font-mono font-bold uppercase text-white">
                  Media Source & Preview
                </span>
              </div>
              <div className="inline-flex p-1 rounded-xl bg-[#141414] border border-[#2C2C2C] gap-1">
                <button
                  type="button"
                  onClick={() => setSourceMode('UPLOAD')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                    sourceMode === 'UPLOAD'
                      ? 'bg-[#C7F464] text-[#0B0B0B]'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Direct Upload
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('URL')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                    sourceMode === 'URL'
                      ? 'bg-[#C7F464] text-[#0B0B0B]'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  External URL
                </button>
              </div>
            </div>

            {sourceMode === 'UPLOAD' ? (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
                <div className="sm:col-span-2 h-36 rounded-2xl bg-[#141414] border border-[#2C2C2C] overflow-hidden flex items-center justify-center relative">
                  {form.mediaUrl ? (
                    isVideoMedia(form.mediaType, form.mediaUrl) ? (
                      <video
                        src={form.mediaUrl}
                        controls
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={form.mediaUrl}
                        alt={form.title || 'Preview'}
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="text-center px-3 space-y-1">
                      <ImageIcon className="w-7 h-7 text-[#52525B] mx-auto" />
                      <p className="text-[11px] font-mono text-[#71717A]">
                        No file chosen yet
                      </p>
                    </div>
                  )}
                  {form.mediaUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, mediaUrl: '' }));
                        setUploadedFileName('');
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/75 border border-white/20 text-white hover:bg-red-500 flex items-center justify-center"
                      title="Remove uploaded media"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <label className="sm:col-span-3 h-36 rounded-2xl border-2 border-dashed border-[#C7F464]/45 bg-[#1B2210]/40 hover:bg-[#1B2210]/70 transition-colors cursor-pointer flex flex-col items-center justify-center p-4 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#C7F464]/15 border border-[#C7F464]/40 flex items-center justify-center text-[#C7F464]">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">
                      {processingUpload
                        ? 'Optimizing media for instant display...'
                        : uploadedFileName
                        ? `Selected: ${uploadedFileName}`
                        : 'Click to upload Photo or Training Video'}
                    </p>
                    <p className="text-[11px] font-mono text-[#A1A1AA]">
                      JPG / PNG / WebP (auto-compressed) or MP4 / WebM (up to 6.5 MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*,video/mp4,video/webm,video/quicktime"
                    onChange={handleMediaFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  label="Media URL (Cloudinary or HTTPS URL) *"
                  required={sourceMode === 'URL'}
                  value={form.mediaUrl}
                  onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                />
                {form.mediaUrl && (
                  <div className="h-36 rounded-2xl bg-[#141414] border border-[#2C2C2C] overflow-hidden">
                    {isVideoMedia(form.mediaType, form.mediaUrl) ? (
                      <video
                        src={form.mediaUrl}
                        controls
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={form.mediaUrl}
                        alt={form.title || 'URL Preview'}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 1: Title & Caption */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#A1A1AA]">
              1 • Media Details
            </p>
            <Input
              label="Media Title *"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Heavy Free Weight Zone — Ashkona Floor"
            />
            <div>
              <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                Caption / Description
              </label>
              <input
                type="text"
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
                placeholder="e.g. Olympic squat racks & calibrated bumper plates on Ashkona training floor"
                className="w-full h-11 px-3.5 rounded-xl bg-[#171717] border border-[#2C2C2C] text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-[#C7F464]"
              />
            </div>
          </div>

          {/* Section 2: Category, Format & Visibility */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#A1A1AA]">
              2 • Category, Format & Visibility
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase text-[#A1A1AA]">
                Gallery Category *
              </label>
              <div className="flex flex-wrap gap-2">
                {GALLERY_CATEGORIES.map((cat) => {
                  const selected = form.category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat.value })}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        selected
                          ? 'bg-[#C7F464] border-[#C7F464] text-[#0B0B0B] font-bold shadow-sm'
                          : 'bg-[#171717] border-[#2C2C2C] text-[#D4D4D8] hover:border-[#C7F464]/50 hover:text-white'
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5" />}
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-xs font-mono uppercase text-[#A1A1AA]">
                  Media Format
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, mediaType: 'IMAGE' })}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      form.mediaType === 'IMAGE'
                        ? 'bg-[#C7F464] border-[#C7F464] text-[#0B0B0B]'
                        : 'bg-[#171717] border-[#2C2C2C] text-[#D4D4D8] hover:border-[#C7F464]/50'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4 shrink-0" />
                    Photograph (IMAGE)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, mediaType: 'VIDEO' })}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      form.mediaType === 'VIDEO'
                        ? 'bg-[#C7F464] border-[#C7F464] text-[#0B0B0B]'
                        : 'bg-[#171717] border-[#2C2C2C] text-[#D4D4D8] hover:border-[#C7F464]/50'
                    }`}
                  >
                    <Video className="w-4 h-4 shrink-0" />
                    Training Video
                  </button>
                </div>
              </div>

              <Input
                label="Sort Order"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#171717] border border-[#2C2C2C] cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-white">Placeholder Asset</p>
                  <p className="text-[11px] text-[#A1A1AA]">Mark as replaceable temporary image</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.isPlaceholder}
                  onChange={(e) => setForm({ ...form, isPlaceholder: e.target.checked })}
                  className="h-4 w-4 accent-[#C7F464]"
                />
              </label>

              <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#171717] border border-[#2C2C2C] cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-white">Publish Immediately</p>
                  <p className="text-[11px] text-[#A1A1AA]">Show live on website /gallery</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="h-4 w-4 accent-[#C7F464]"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[#262626]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={saving || processingUpload}
            >
              Save & Publish Media
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Media Deletion"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-300">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white">{deleteTarget.title}</strong> from
              the gallery?
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-[#303030]">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                isLoading={deleting}
                onClick={handleConfirmDelete}
              >
                Permanently Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

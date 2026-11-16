'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Save,
  Globe,
  Settings as SettingsIcon,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  RotateCcw,
  Eye,
  EyeOff,
  Sparkles,
  Pin,
  Layers,
  LayoutTemplate,
  Camera,
  Image as ImageIcon,
  Dumbbell,
  UserCheck,
  Clock,
  ExternalLink,
  X,
} from 'lucide-react';
import { apiFetch, clearApiCache, getErrorMessage } from '@/lib/api';
import { compressImageFile } from '@/lib/media-upload';
import { ALL_SHOWCASE_ZONES } from '@/lib/facilities-catalog';
import {
  DEFAULT_WEBSITE_CONFIG,
  resolveWebsiteConfig,
} from '@/lib/website-config';
import { useToast } from '@/context/ToastContext';
import {
  GymSettings,
  NavPinItem,
  NavPinPlacement,
  WebsiteConfig,
} from '@/types';
import { Card, Button, Input, Textarea, Skeleton } from '@/components/ui';

type CmsSubTab =
  | 'header'
  | 'hero_media'
  | 'floor_zones'
  | 'programs_trainers'
  | 'sections_footer';

export function AdminSettingsWorkspace({
  defaultTab = 'general',
}: {
  defaultTab?: 'general' | 'website';
}) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'website'>(defaultTab);
  const [cmsSubTab, setCmsSubTab] = useState<CmsSubTab>('header');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [cmsPrograms, setCmsPrograms] = useState<any[]>([]);
  const [cmsTrainers, setCmsTrainers] = useState<any[]>([]);
  const [savingEntityId, setSavingEntityId] = useState<string | null>(null);

  const [form, setForm] = useState({
    gymName: 'Icon Fitness Gym',
    tagline: 'Discipline. Strength. Performance in Ashkona, Dhaka.',
    description: '',
    addressLine: 'Ashkona Main Road, Dakshinkhan, Dhaka-1230, Bangladesh',
    area: 'Ashkona, Dakshinkhan',
    city: 'Dhaka',
    country: 'Bangladesh',
    phonePrimary: '',
    phoneSecondary: '',
    whatsappNumber: '',
    emailOfficial: 'info@iconfitnessgym.com',
    googleMapsEmbedUrl: '',
    saturdayToThursdayHours: '06:00 AM – 11:00 PM',
    fridayHours: '03:00 PM – 10:00 PM',
    openingHoursNote: '',
    facebookUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    lockerPolicy: '',
    membershipFreezePolicy: '',
    allowSelfRegistration: true,
    requireManualApproval: false,
    bookingCutoffHoursDefault: '2',
    maxActiveBookingsMember: '5',
    isUsingPlaceholderData: false,
  });

  const [websiteConfig, setWebsiteConfig] = useState<WebsiteConfig>(
    DEFAULT_WEBSITE_CONFIG,
  );
  const [newPinLabel, setNewPinLabel] = useState('');
  const [newPinHref, setNewPinHref] = useState('');
  const [newPinPlacement, setNewPinPlacement] =
    useState<NavPinPlacement>('HEADER');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [res, progRes, trnRes] = await Promise.all([
        apiFetch<GymSettings>('/settings'),
        apiFetch<any[]>('/workouts').catch(() => []),
        apiFetch<any[]>('/trainers').catch(() => []),
      ]);
      setCmsPrograms(Array.isArray(progRes) ? progRes : []);
      setCmsTrainers(Array.isArray(trnRes) ? trnRes : []);
      if (res) {
        setForm({
          gymName: res.gymName || 'Icon Fitness Gym',
          tagline: res.tagline || '',
          description: res.description || '',
          addressLine:
            res.addressLine ||
            'Ashkona Main Road, Dakshinkhan, Dhaka-1230, Bangladesh',
          area: res.area || 'Ashkona, Dakshinkhan',
          city: res.city || 'Dhaka',
          country: res.country || 'Bangladesh',
          phonePrimary: res.phonePrimary || res.phone || '',
          phoneSecondary: res.phoneSecondary || '',
          whatsappNumber: res.whatsappNumber || '',
          emailOfficial: res.emailOfficial || res.email || '',
          googleMapsEmbedUrl: res.googleMapsEmbedUrl || '',
          saturdayToThursdayHours:
            res.openingHoursJson?.saturdayToThursday || '06:00 AM – 11:00 PM',
          fridayHours: res.openingHoursJson?.friday || '03:00 PM – 10:00 PM',
          openingHoursNote:
            res.openingHoursJson?.note || res.openingHoursNote || '',
          facebookUrl: res.socialLinksJson?.facebook || res.facebookUrl || '',
          instagramUrl:
            res.socialLinksJson?.instagram || res.instagramUrl || '',
          youtubeUrl: res.socialLinksJson?.youtube || res.youtubeUrl || '',
          lockerPolicy: res.policiesJson?.lockerPolicy || '',
          membershipFreezePolicy:
            res.policiesJson?.membershipFreezePolicy || '',
          allowSelfRegistration: Boolean(
            res.allowSelfRegistration ?? res.allowPublicRegistration ?? true,
          ),
          requireManualApproval: Boolean(
            res.requireManualApproval ?? res.requireMemberApproval ?? false,
          ),
          bookingCutoffHoursDefault: String(
            res.bookingCutoffHoursDefault ??
              res.bookingCancellationWindowHours ??
              2,
          ),
          maxActiveBookingsMember: String(
            res.maxActiveBookingsMember ?? res.maxAdvanceBookingDays ?? 5,
          ),
          isUsingPlaceholderData: Boolean(res.isUsingPlaceholderData),
        });
        setWebsiteConfig(resolveWebsiteConfig(res));
      }
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          gymName: form.gymName,
          tagline: form.tagline,
          description: form.description,
          addressLine: form.addressLine,
          area: form.area,
          city: form.city,
          country: form.country,
          phonePrimary: form.phonePrimary,
          phoneSecondary: form.phoneSecondary || null,
          whatsappNumber: form.whatsappNumber,
          emailOfficial: form.emailOfficial,
          googleMapsEmbedUrl: form.googleMapsEmbedUrl,
          openingHoursJson: {
            note: form.openingHoursNote,
            saturdayToThursday: form.saturdayToThursdayHours,
            friday: form.fridayHours,
          },
          socialLinksJson: {
            facebook: form.facebookUrl,
            instagram: form.instagramUrl,
            youtube: form.youtubeUrl,
          },
          policiesJson: {
            cancellationCutoffHours: Number(form.bookingCutoffHoursDefault),
            cleanShoesRequired: true,
            towelRequired: true,
            lockerPolicy: form.lockerPolicy,
            membershipFreezePolicy: form.membershipFreezePolicy,
          },
          allowSelfRegistration: form.allowSelfRegistration,
          requireManualApproval: form.requireManualApproval,
          bookingCutoffHoursDefault: Number(form.bookingCutoffHoursDefault),
          maxActiveBookingsMember: Number(form.maxActiveBookingsMember),
          isUsingPlaceholderData: form.isUsingPlaceholderData,
          websiteConfigJson: websiteConfig,
        }),
      });
      clearApiCache();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('ifg-settings-updated'));
      }
      showToast(
        'success',
        'Website CMS, header pins, and gym configuration saved live.',
      );
      loadSettings();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const updateNavPin = (index: number, patch: Partial<NavPinItem>) => {
    setWebsiteConfig((prev) => {
      const nextPins = [...prev.header.navPins];
      nextPins[index] = { ...nextPins[index], ...patch };
      return {
        ...prev,
        header: { ...prev.header, navPins: nextPins },
      };
    });
  };

  const moveNavPin = (index: number, dir: -1 | 1) => {
    setWebsiteConfig((prev) => {
      const nextPins = [...prev.header.navPins];
      const targetIdx = index + dir;
      if (targetIdx < 0 || targetIdx >= nextPins.length) return prev;
      const [moved] = nextPins.splice(index, 1);
      nextPins.splice(targetIdx, 0, moved);
      return {
        ...prev,
        header: { ...prev.header, navPins: nextPins },
      };
    });
  };

  const removeNavPin = (index: number) => {
    setWebsiteConfig((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        navPins: prev.header.navPins.filter((_, i) => i !== index),
      },
    }));
  };

  const addCustomPin = () => {
    const label = newPinLabel.trim();
    const href = newPinHref.trim();
    if (!label || !href) {
      showToast('error', 'Enter both a pin label and a route/URL.');
      return;
    }
    const id = `custom-${Date.now()}`;
    setWebsiteConfig((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        navPins: [
          ...prev.header.navPins,
          { id, label, href, placement: newPinPlacement, highlight: false },
        ],
      },
    }));
    setNewPinLabel('');
    setNewPinHref('');
  };

  const saveProgramQuick = async (prog: any) => {
    setSavingEntityId(prog.id);
    try {
      await apiFetch(`/workouts/${prog.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: prog.title,
          coverImageUrl: prog.coverImageUrl || '',
        }),
      });
      clearApiCache();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('ifg-settings-updated'));
      }
      showToast('success', `Updated cover & title for "${prog.title}".`);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setSavingEntityId(null);
    }
  };

  const saveTrainerQuick = async (trainer: any) => {
    setSavingEntityId(trainer.id);
    try {
      await apiFetch(`/trainers/${trainer.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: trainer.user?.fullName,
          avatarUrl: trainer.user?.avatarUrl || null,
          headline: trainer.headline,
          experienceYears: Number(trainer.experienceYears || 0),
        }),
      });
      clearApiCache();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('ifg-settings-updated'));
      }
      showToast(
        'success',
        `Updated photo & profile for "${trainer.user?.fullName || 'Coach'}".`,
      );
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setSavingEntityId(null);
    }
  };

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const headerPinsPreview = websiteConfig.header.navPins.filter(
    (p) => p.placement === 'HEADER',
  );
  const explorePinsPreview = websiteConfig.header.navPins.filter(
    (p) => p.placement === 'EXPLORE',
  );

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            {activeTab === 'website'
              ? 'Website & Picture CMS'
              : 'Gym Settings & Brand Info'}
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">
              Edit Website Sections, Pictures, Navigation Pins, Hours &amp; Policies
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/" target="_blank">
            <Button
              type="button"
              variant="secondary"
              rightIcon={<ExternalLink className="w-4 h-4" />}
            >
              Preview Website
            </Button>
          </Link>
          <Button type="submit" isLoading={saving}>
            <Save className="w-4 h-4" /> Publish &amp; Save All Changes
          </Button>
        </div>
      </div>

      {/* Mode Switch Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#141414] border border-[#2C2C2C] w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('website')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all ${
            activeTab === 'website'
              ? 'bg-[#C7F464] !text-[#090909] font-bold shadow-sm'
              : 'text-[#A1A1AA] hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" /> Website Sections &amp; Picture Editor
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all ${
            activeTab === 'general'
              ? 'bg-[#C7F464] !text-[#090909] font-bold shadow-sm'
              : 'text-[#A1A1AA] hover:text-white'
          }`}
        >
          <SettingsIcon className="w-4 h-4" /> General Info, Hours &amp; Policies
        </button>
      </div>

      {activeTab === 'website' ? (
        <div className="space-y-6">
          {/* CMS Section Navigation Pills */}
          <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-[#141414] border border-[#262626]">
            {[
              {
                key: 'header' as const,
                label: '1. Header & Nav Pins',
                icon: <Pin className="w-3.5 h-3.5" />,
              },
              {
                key: 'hero_media' as const,
                label: '2. Hero & Showcase Pictures',
                icon: <ImageIcon className="w-3.5 h-3.5" />,
              },
              {
                key: 'floor_zones' as const,
                label: '3. Training Floor Pictures',
                icon: <Layers className="w-3.5 h-3.5" />,
              },
              {
                key: 'programs_trainers' as const,
                label: '4. Programs & Trainers Photos',
                icon: <Dumbbell className="w-3.5 h-3.5" />,
              },
              {
                key: 'sections_footer' as const,
                label: '5. Timings, Why Icon & Footer',
                icon: <Clock className="w-3.5 h-3.5" />,
              },
            ].map((tab) => {
              const active = cmsSubTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setCmsSubTab(tab.key)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
                    active
                      ? 'bg-[#C7F464] !text-[#090909] shadow-sm'
                      : 'bg-[#171717] text-[#A1A1AA] hover:text-white border border-[#2C2C2C]'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {cmsSubTab === 'header' && (
            <>
          {/* Live Header Preview */}
          <Card className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-xl text-white uppercase tracking-wide flex items-center gap-2">
                  <Pin className="w-5 h-5 text-[#C7F464]" /> Live Header Navigation Preview
                </h2>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  Instant simulation of your public top bar. Changes take effect site-wide as soon as you publish.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setWebsiteConfig(DEFAULT_WEBSITE_CONFIG)}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset Default Website Layout
              </Button>
            </div>

            {/* Simulated Promo Banner */}
            {websiteConfig.header.showPromoBar && (
              <div className="rounded-xl bg-[#1B2210] border border-[#C7F464]/40 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-medium text-white">
                  {websiteConfig.header.promoText}
                </span>
                {websiteConfig.header.promoCtaLabel && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#C7F464] text-[#090909] font-bold uppercase text-[10px]">
                    {websiteConfig.header.promoCtaLabel}
                  </span>
                )}
              </div>
            )}

            {/* Simulated Header */}
            <div className="rounded-2xl bg-[#090909] border border-[#2C2C2C] p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.jpg"
                  alt="Logo"
                  className="w-9 h-9 rounded-lg object-contain bg-black border border-[#303030]"
                />
                <div>
                  <p className="font-display text-sm uppercase tracking-wider text-white leading-none">
                    {websiteConfig.header.brandTitle || 'ICON FITNESS GYM'}
                  </p>
                  <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-[#A1A1AA] mt-0.5">
                    {websiteConfig.header.brandSubtitle || 'ASHKONA • DHAKA'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 rounded-full bg-[#141414] border border-[#262626] px-2.5 py-1.5">
                {headerPinsPreview.map((pin) => (
                  <span
                    key={pin.id}
                    className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#171717] text-white border border-[#2C2C2C]"
                  >
                    {pin.label}
                  </span>
                ))}
                {explorePinsPreview.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#C7F464] text-[#090909]">
                    Explore ({explorePinsPreview.length})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[10px] font-mono">
                {websiteConfig.header.showThemeToggle && (
                  <span className="px-2.5 py-1 rounded-full bg-[#171717] border border-[#2C2C2C] text-white">
                    Theme
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full bg-[#171717] border border-[#2C2C2C] text-white">
                  {websiteConfig.header.ctaPrimaryLabel || 'Sign In'}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#C7F464] text-[#090909] font-bold">
                  {websiteConfig.header.ctaSecondaryLabel || 'Join Now'}
                </span>
              </div>
            </div>
          </Card>

          {/* 1. Header Navigation Pins Editor */}
          <Card className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-xl text-white uppercase tracking-wide">
                  1. Top Header Pins &amp; Explore Menu Builder
                </h2>
                <p className="text-xs text-[#A1A1AA]">
                  Choose exactly which pages are pinned in the main Header Bar, nested under Explore, or Hidden. Rename labels, reorder items, or add new links.
                </p>
              </div>
              <span className="text-xs font-mono text-[#C7F464]">
                {headerPinsPreview.length} Header Pins · {explorePinsPreview.length} Explore
              </span>
            </div>

            <div className="space-y-2.5">
              {websiteConfig.header.navPins.map((pin, idx) => (
                <div
                  key={pin.id}
                  className="p-3 rounded-xl bg-[#171717] border border-[#2C2C2C] flex flex-col lg:flex-row lg:items-center gap-3"
                >
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveNavPin(idx, -1)}
                      className="p-1.5 rounded-lg bg-[#141414] border border-[#2C2C2C] text-[#A1A1AA] hover:text-white disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === websiteConfig.header.navPins.length - 1}
                      onClick={() => moveNavPin(idx, 1)}
                      className="p-1.5 rounded-lg bg-[#141414] border border-[#2C2C2C] text-[#A1A1AA] hover:text-white disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
                    <input
                      type="text"
                      value={pin.label}
                      onChange={(e) =>
                        updateNavPin(idx, { label: e.target.value })
                      }
                      placeholder="Link Label"
                      className="w-full rounded-lg bg-[#090909] border border-[#2C2C2C] px-3 py-1.5 text-sm text-white focus:border-[#C7F464] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={pin.href}
                      onChange={(e) =>
                        updateNavPin(idx, { href: e.target.value })
                      }
                      placeholder="/route-or-url"
                      className="w-full rounded-lg bg-[#090909] border border-[#2C2C2C] px-3 py-1.5 text-xs font-mono text-[#A1A1AA] focus:text-white focus:border-[#C7F464] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {(['HEADER', 'EXPLORE', 'HIDDEN'] as NavPinPlacement[]).map(
                      (place) => (
                        <button
                          key={place}
                          type="button"
                          onClick={() =>
                            updateNavPin(idx, { placement: place })
                          }
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider border transition-all ${
                            pin.placement === place
                              ? place === 'HEADER'
                                ? 'bg-[#C7F464] !text-[#090909] border-[#C7F464] font-bold'
                                : place === 'EXPLORE'
                                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/40 font-bold'
                                  : 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-bold'
                              : 'bg-[#141414] text-[#A1A1AA] border-[#2C2C2C] hover:text-white'
                          }`}
                        >
                          {place === 'HEADER'
                            ? 'Header Bar'
                            : place === 'EXPLORE'
                              ? 'Explore'
                              : 'Hidden'}
                        </button>
                      ),
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        updateNavPin(idx, { highlight: !pin.highlight })
                      }
                      className={`p-1.5 rounded-lg border transition-colors ${
                        pin.highlight
                          ? 'bg-[#C7F464]/20 border-[#C7F464]/40 text-[#C7F464]'
                          : 'bg-[#141414] border-[#2C2C2C] text-[#A1A1AA] hover:text-white'
                      }`}
                      title="Highlight pin badge"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => removeNavPin(idx)}
                      className="p-1.5 rounded-lg bg-[#141414] border border-[#2C2C2C] text-[#A1A1AA] hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                      title="Remove Pin"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Pin Row */}
            <div className="p-3.5 rounded-xl bg-[#141414] border border-dashed border-[#303030] grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-4">
                <Input
                  label="Add Custom Pin Label"
                  placeholder="e.g. Trainers"
                  value={newPinLabel}
                  onChange={(e) => setNewPinLabel(e.target.value)}
                />
              </div>
              <div className="sm:col-span-4">
                <Input
                  label="Target Route / URL"
                  placeholder="/trainers or https://..."
                  value={newPinHref}
                  onChange={(e) => setNewPinHref(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
                  Placement
                </label>
                <select
                  value={newPinPlacement}
                  onChange={(e) =>
                    setNewPinPlacement(e.target.value as NavPinPlacement)
                  }
                  className="w-full h-11 rounded-xl bg-[#171717] border border-[#2C2C2C] px-3 text-sm text-white"
                >
                  <option value="HEADER">Header Bar</option>
                  <option value="EXPLORE">Explore Menu</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={addCustomPin}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add Pin
                </Button>
              </div>
            </div>
          </Card>

          {/* 2. Brand Text, Announcement Banner & Action Buttons */}
          <Card className="space-y-5">
            <h2 className="font-display text-xl text-white uppercase tracking-wide">
              2. Top Announcement Banner, Header Brand &amp; CTA Controls
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="Header Brand Title"
                value={websiteConfig.header.brandTitle}
                onChange={(e) =>
                  setWebsiteConfig((prev) => ({
                    ...prev,
                    header: { ...prev.header, brandTitle: e.target.value },
                  }))
                }
              />
              <Input
                label="Header Location Subtitle"
                value={websiteConfig.header.brandSubtitle}
                onChange={(e) =>
                  setWebsiteConfig((prev) => ({
                    ...prev,
                    header: { ...prev.header, brandSubtitle: e.target.value },
                  }))
                }
              />
              <Input
                label="Login Button Text"
                value={websiteConfig.header.ctaPrimaryLabel}
                onChange={(e) =>
                  setWebsiteConfig((prev) => ({
                    ...prev,
                    header: { ...prev.header, ctaPrimaryLabel: e.target.value },
                  }))
                }
              />
              <Input
                label="Join Button Text"
                value={websiteConfig.header.ctaSecondaryLabel}
                onChange={(e) =>
                  setWebsiteConfig((prev) => ({
                    ...prev,
                    header: {
                      ...prev.header,
                      ctaSecondaryLabel: e.target.value,
                    },
                  }))
                }
              />
            </div>

            <div className="p-4 rounded-xl bg-[#171717] border border-[#2C2C2C] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2.5 text-sm font-medium text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={websiteConfig.header.showPromoBar}
                    onChange={(e) =>
                      setWebsiteConfig((prev) => ({
                        ...prev,
                        header: {
                          ...prev.header,
                          showPromoBar: e.target.checked,
                        },
                      }))
                    }
                    className="accent-[#C7F464] w-4 h-4"
                  />
                  Show Top Announcement / Offer Bar Above Navbar
                </label>

                <div className="flex flex-wrap items-center gap-5">
                  <label className="flex items-center gap-2 text-xs text-[#A1A1AA] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={websiteConfig.header.showThemeToggle}
                      onChange={(e) =>
                        setWebsiteConfig((prev) => ({
                          ...prev,
                          header: {
                            ...prev.header,
                            showThemeToggle: e.target.checked,
                          },
                        }))
                      }
                      className="accent-[#C7F464]"
                    />
                    Show Light/Dark Button
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[#A1A1AA] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={websiteConfig.header.showPortalButton}
                      onChange={(e) =>
                        setWebsiteConfig((prev) => ({
                          ...prev,
                          header: {
                            ...prev.header,
                            showPortalButton: e.target.checked,
                          },
                        }))
                      }
                      className="accent-[#C7F464]"
                    />
                    Show Login / Join / Portal Pill
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-6">
                  <Input
                    label="Announcement Message"
                    value={websiteConfig.header.promoText}
                    onChange={(e) =>
                      setWebsiteConfig((prev) => ({
                        ...prev,
                        header: { ...prev.header, promoText: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="sm:col-span-3">
                  <Input
                    label="Banner CTA Text"
                    value={websiteConfig.header.promoCtaLabel}
                    onChange={(e) =>
                      setWebsiteConfig((prev) => ({
                        ...prev,
                        header: {
                          ...prev.header,
                          promoCtaLabel: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="sm:col-span-3">
                  <Input
                    label="Banner CTA Link"
                    value={websiteConfig.header.promoCtaHref}
                    onChange={(e) =>
                      setWebsiteConfig((prev) => ({
                        ...prev,
                        header: {
                          ...prev.header,
                          promoCtaHref: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </Card>
            </>
          )}

          {cmsSubTab === 'hero_media' && (
            <div className="space-y-6">
              {/* Hero Headlines & Action Buttons */}
              <Card className="space-y-4">
                <h2 className="font-display text-xl text-white uppercase tracking-wide flex items-center gap-2">
                  <LayoutTemplate className="w-5 h-5 text-[#C7F464]" /> Homepage Hero Copy &amp; Action Buttons
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Input
                    label="Hero Top Eyebrow Badge"
                    value={websiteConfig.hero.badge}
                    onChange={(e) =>
                      setWebsiteConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, badge: e.target.value },
                      }))
                    }
                  />
                  <Input
                    label="Headline Part 1"
                    value={websiteConfig.hero.headlineLine1}
                    onChange={(e) =>
                      setWebsiteConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, headlineLine1: e.target.value },
                      }))
                    }
                  />
                  <Input
                    label="Headline Lime Highlight"
                    value={websiteConfig.hero.headlineAccent}
                    onChange={(e) =>
                      setWebsiteConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, headlineAccent: e.target.value },
                      }))
                    }
                  />
                  <Input
                    label="Headline Ending"
                    value={websiteConfig.hero.headlineLine2}
                    onChange={(e) =>
                      setWebsiteConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, headlineLine2: e.target.value },
                      }))
                    }
                  />
                </div>

                <Textarea
                  label="Hero Subtitle Paragraph"
                  value={websiteConfig.hero.subtitle}
                  onChange={(e) =>
                    setWebsiteConfig((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, subtitle: e.target.value },
                    }))
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Input
                    label="Primary CTA Label"
                    value={websiteConfig.hero.primaryCtaLabel}
                    onChange={(e) =>
                      setWebsiteConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, primaryCtaLabel: e.target.value },
                      }))
                    }
                  />
                  <Input
                    label="Primary CTA Link"
                    value={websiteConfig.hero.primaryCtaHref}
                    onChange={(e) =>
                      setWebsiteConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, primaryCtaHref: e.target.value },
                      }))
                    }
                  />
                  <Input
                    label="Optional 2nd CTA Label"
                    placeholder="Leave blank to hide"
                    value={websiteConfig.hero.secondaryCtaLabel}
                    onChange={(e) =>
                      setWebsiteConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, secondaryCtaLabel: e.target.value },
                      }))
                    }
                  />
                  <Input
                    label="Optional 2nd CTA Link"
                    value={websiteConfig.hero.secondaryCtaHref}
                    onChange={(e) =>
                      setWebsiteConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, secondaryCtaHref: e.target.value },
                      }))
                    }
                  />
                </div>
              </Card>

              {/* Hero 4-Panel Accordion Showcase Cards (01-04) */}
              <Card className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-xl text-white uppercase tracking-wide flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-[#C7F464]" /> Hero Showcase Cards (01 – 04 Pictures)
                    </h2>
                    <p className="text-xs text-[#A1A1AA]">
                      Upload new photos or update titles, badges, subtitles, and links for the 4 expanding hero showcase panels.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={() =>
                      setWebsiteConfig((prev) => ({
                        ...prev,
                        heroSlides: DEFAULT_WEBSITE_CONFIG.heroSlides,
                      }))
                    }
                  >
                    Reset Hero Photos
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {(websiteConfig.heroSlides || DEFAULT_WEBSITE_CONFIG.heroSlides || []).map(
                    (slide, idx) => (
                      <div
                        key={slide.id || idx}
                        className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="w-full sm:w-32 h-24 rounded-xl overflow-hidden bg-[#141414] border border-[#2C2C2C] shrink-0">
                            <img
                              src={slide.image}
                              alt={slide.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2 py-0.5 rounded bg-[#1B2210] border border-[#C7F464]/35 text-[11px] font-mono font-bold text-[#C7F464]">
                                PANEL {slide.num} • {slide.shortLabel}
                              </span>
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
                                      const dataUrl = await compressImageFile(file, 1080, 0.85);
                                      setWebsiteConfig((prev) => {
                                        const list = [
                                          ...(prev.heroSlides || DEFAULT_WEBSITE_CONFIG.heroSlides || []),
                                        ];
                                        list[idx] = { ...list[idx], image: dataUrl };
                                        return { ...prev, heroSlides: list };
                                      });
                                      showToast('success', `Hero Slide ${slide.num} photo updated. Click Publish to go live.`);
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
                              label="Photo URL"
                              value={slide.image}
                              onChange={(e) => {
                                const val = e.target.value;
                                setWebsiteConfig((prev) => {
                                  const list = [
                                    ...(prev.heroSlides || DEFAULT_WEBSITE_CONFIG.heroSlides || []),
                                  ];
                                  list[idx] = { ...list[idx], image: val };
                                  return { ...prev, heroSlides: list };
                                });
                              }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            label="Slide Title"
                            value={slide.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWebsiteConfig((prev) => {
                                const list = [
                                  ...(prev.heroSlides || DEFAULT_WEBSITE_CONFIG.heroSlides || []),
                                ];
                                list[idx] = { ...list[idx], title: val };
                                return { ...prev, heroSlides: list };
                              });
                            }}
                          />
                          <Input
                            label="Vertical Tab Label"
                            value={slide.shortLabel}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWebsiteConfig((prev) => {
                                const list = [
                                  ...(prev.heroSlides || DEFAULT_WEBSITE_CONFIG.heroSlides || []),
                                ];
                                list[idx] = { ...list[idx], shortLabel: val };
                                return { ...prev, heroSlides: list };
                              });
                            }}
                          />
                          <Input
                            label="Top Badge"
                            value={slide.badge}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWebsiteConfig((prev) => {
                                const list = [
                                  ...(prev.heroSlides || DEFAULT_WEBSITE_CONFIG.heroSlides || []),
                                ];
                                list[idx] = { ...list[idx], badge: val };
                                return { ...prev, heroSlides: list };
                              });
                            }}
                          />
                          <Input
                            label="Stat Highlight Label"
                            value={slide.statLabel}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWebsiteConfig((prev) => {
                                const list = [
                                  ...(prev.heroSlides || DEFAULT_WEBSITE_CONFIG.heroSlides || []),
                                ];
                                list[idx] = { ...list[idx], statLabel: val };
                                return { ...prev, heroSlides: list };
                              });
                            }}
                          />
                        </div>
                        <Input
                          label="Slide Subtitle"
                          value={slide.subtitle}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWebsiteConfig((prev) => {
                              const list = [
                                ...(prev.heroSlides || DEFAULT_WEBSITE_CONFIG.heroSlides || []),
                              ];
                              list[idx] = { ...list[idx], subtitle: val };
                              return { ...prev, heroSlides: list };
                            });
                          }}
                        />
                      </div>
                    ),
                  )}
                </div>
              </Card>

              {/* Moving Floor Picture Stream + Bottom Transformation Banner */}
              <Card className="space-y-4">
                <h2 className="font-display text-xl text-white uppercase tracking-wide flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#C7F464]" /> Moving Picture Stream &amp; Transformation Banner
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(websiteConfig.showcaseStream || DEFAULT_WEBSITE_CONFIG.showcaseStream || []).map(
                    (card, idx) => (
                      <div
                        key={card.slug + idx}
                        className="p-3 rounded-xl bg-[#171717] border border-[#2C2C2C] space-y-2.5"
                      >
                        <div className="relative h-28 rounded-lg overflow-hidden bg-[#141414]">
                          <img
                            src={card.image}
                            alt={card.title}
                            className="w-full h-full object-cover"
                          />
                          <label className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/80 border border-[#C7F464]/50 text-[10px] font-mono text-[#C7F464] cursor-pointer hover:bg-[#C7F464] hover:text-[#0B0B0B] transition-colors">
                            <Camera className="w-3 h-3" />
                            Change Picture
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const dataUrl = await compressImageFile(file, 840, 0.84);
                                  setWebsiteConfig((prev) => {
                                    const list = [
                                      ...(prev.showcaseStream || DEFAULT_WEBSITE_CONFIG.showcaseStream || []),
                                    ];
                                    list[idx] = { ...list[idx], image: dataUrl };
                                    return { ...prev, showcaseStream: list };
                                  });
                                  showToast('success', 'Stream card image updated.');
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
                          label="Stream Card Title"
                          value={card.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWebsiteConfig((prev) => {
                              const list = [
                                ...(prev.showcaseStream || DEFAULT_WEBSITE_CONFIG.showcaseStream || []),
                              ];
                              list[idx] = { ...list[idx], title: val };
                              return { ...prev, showcaseStream: list };
                            });
                          }}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            label="Category Badge"
                            value={card.category}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWebsiteConfig((prev) => {
                                const list = [
                                  ...(prev.showcaseStream || DEFAULT_WEBSITE_CONFIG.showcaseStream || []),
                                ];
                                list[idx] = { ...list[idx], category: val };
                                return { ...prev, showcaseStream: list };
                              });
                            }}
                          />
                          <Input
                            label="Metric"
                            value={card.metric}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWebsiteConfig((prev) => {
                                const list = [
                                  ...(prev.showcaseStream || DEFAULT_WEBSITE_CONFIG.showcaseStream || []),
                                ];
                                list[idx] = { ...list[idx], metric: val };
                                return { ...prev, showcaseStream: list };
                              });
                            }}
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>

                {/* Bottom Transformation Banner */}
                {websiteConfig.transformationBanner && (
                  <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="w-full sm:w-44 h-24 rounded-xl overflow-hidden bg-[#171717] border border-[#2C2C2C] shrink-0">
                        <img
                          src={websiteConfig.transformationBanner.image}
                          alt="Transformation Banner"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-mono font-bold uppercase text-white">
                            Homepage Bottom Transformation Banner Image
                          </span>
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B2210] border border-[#C7F464]/40 text-xs font-mono text-[#C7F464] cursor-pointer hover:bg-[#C7F464] hover:text-[#0B0B0B] transition-colors">
                            <Camera className="w-3.5 h-3.5" />
                            Upload Banner Photo
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const dataUrl = await compressImageFile(file, 1280, 0.85);
                                  setWebsiteConfig((prev) => ({
                                    ...prev,
                                    transformationBanner: {
                                      ...prev.transformationBanner!,
                                      image: dataUrl,
                                    },
                                  }));
                                  showToast('success', 'Transformation banner photo updated.');
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
                          label="Banner Image URL"
                          value={websiteConfig.transformationBanner.image}
                          onChange={(e) =>
                            setWebsiteConfig((prev) => ({
                              ...prev,
                              transformationBanner: {
                                ...prev.transformationBanner!,
                                image: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        label="Headline White Part"
                        value={websiteConfig.transformationBanner.headlineLine1}
                        onChange={(e) =>
                          setWebsiteConfig((prev) => ({
                            ...prev,
                            transformationBanner: {
                              ...prev.transformationBanner!,
                              headlineLine1: e.target.value,
                            },
                          }))
                        }
                      />
                      <Input
                        label="Headline Lime Accent"
                        value={websiteConfig.transformationBanner.headlineAccent}
                        onChange={(e) =>
                          setWebsiteConfig((prev) => ({
                            ...prev,
                            transformationBanner: {
                              ...prev.transformationBanner!,
                              headlineAccent: e.target.value,
                            },
                          }))
                        }
                      />
                      <Input
                        label="Primary CTA Label"
                        value={websiteConfig.transformationBanner.primaryCtaLabel}
                        onChange={(e) =>
                          setWebsiteConfig((prev) => ({
                            ...prev,
                            transformationBanner: {
                              ...prev.transformationBanner!,
                              primaryCtaLabel: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {cmsSubTab === 'floor_zones' && (
            <div className="space-y-6">
              <Card className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-xl text-white uppercase tracking-wide flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#C7F464]" /> Explore Our Training Floor — Zone Pictures &amp; Titles
                    </h2>
                    <p className="text-xs text-[#A1A1AA]">
                      Change any Training Floor picture, badge, or zone name. Updates Homepage &ldquo;Explore Our Training Floor&rdquo; and the public Facilities pages.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={() =>
                      setWebsiteConfig((prev) => ({
                        ...prev,
                        zoneImages: {},
                        zoneOverrides: {},
                      }))
                    }
                  >
                    Reset Default Zone Photos
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#141414] border border-[#262626]">
                  <Input
                    label="Floor Eyebrow"
                    value={websiteConfig.sectionHeadings?.floorEyebrow || ''}
                    onChange={(e) =>
                      setWebsiteConfig((prev) => ({
                        ...prev,
                        sectionHeadings: {
                          ...prev.sectionHeadings,
                          floorEyebrow: e.target.value,
                        },
                      }))
                    }
                  />
                  <Input
                    label="Floor Main Heading"
                    value={websiteConfig.sectionHeadings?.floorTitle || ''}
                    onChange={(e) =>
                      setWebsiteConfig((prev) => ({
                        ...prev,
                        sectionHeadings: {
                          ...prev.sectionHeadings,
                          floorTitle: e.target.value,
                        },
                      }))
                    }
                  />
                  <Input
                    label="Section Button Label"
                    value={websiteConfig.sectionHeadings?.floorCtaLabel || ''}
                    onChange={(e) =>
                      setWebsiteConfig((prev) => ({
                        ...prev,
                        sectionHeadings: {
                          ...prev.sectionHeadings,
                          floorCtaLabel: e.target.value,
                        },
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ALL_SHOWCASE_ZONES.map((zone, idx) => {
                    const ov = websiteConfig.zoneOverrides?.[zone.slug] || {};
                    const activeImg =
                      ov.image ||
                      websiteConfig.zoneImages?.[zone.slug] ||
                      zone.heroImage;
                    const isHomepageCard = idx < 5;

                    return (
                      <div
                        key={zone.slug}
                        className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-3"
                      >
                        <div className="relative h-36 rounded-xl overflow-hidden bg-[#141414] border border-[#2C2C2C]">
                          <img
                            src={activeImg}
                            alt={ov.name || zone.name}
                            className="w-full h-full object-cover"
                          />
                          {isHomepageCard && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#C7F464] text-[#090909] text-[10px] font-mono font-bold uppercase">
                              Homepage Card #{idx + 1}
                            </span>
                          )}
                          {(ov.image || websiteConfig.zoneImages?.[zone.slug]) && (
                            <button
                              type="button"
                              onClick={() =>
                                setWebsiteConfig((prev) => {
                                  const nextImages = { ...(prev.zoneImages || {}) };
                                  delete nextImages[zone.slug];
                                  const nextOv = { ...(prev.zoneOverrides || {}) };
                                  if (nextOv[zone.slug]) {
                                    const copy = { ...nextOv[zone.slug] };
                                    delete copy.image;
                                    nextOv[zone.slug] = copy;
                                  }
                                  return {
                                    ...prev,
                                    zoneImages: nextImages,
                                    zoneOverrides: nextOv,
                                  };
                                })
                              }
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/80 border border-white/20 text-white hover:bg-red-500 flex items-center justify-center"
                              title="Revert to default photo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                          <label className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/80 border border-[#C7F464]/50 text-[11px] font-mono text-[#C7F464] cursor-pointer hover:bg-[#C7F464] hover:text-[#0B0B0B] transition-colors">
                            <Camera className="w-3 h-3" />
                            Upload Picture
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const dataUrl = await compressImageFile(file, 1200, 0.85);
                                  setWebsiteConfig((prev) => ({
                                    ...prev,
                                    zoneImages: {
                                      ...(prev.zoneImages || {}),
                                      [zone.slug]: dataUrl,
                                    },
                                    zoneOverrides: {
                                      ...(prev.zoneOverrides || {}),
                                      [zone.slug]: {
                                        ...(prev.zoneOverrides?.[zone.slug] || {}),
                                        image: dataUrl,
                                      },
                                    },
                                  }));
                                  showToast('success', `"${zone.name}" picture ready. Click Publish to apply.`);
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
                          label="Zone Display Title"
                          value={ov.name ?? zone.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWebsiteConfig((prev) => ({
                              ...prev,
                              zoneOverrides: {
                                ...(prev.zoneOverrides || {}),
                                [zone.slug]: {
                                  ...(prev.zoneOverrides?.[zone.slug] || {}),
                                  name: val,
                                },
                              },
                            }));
                          }}
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            label="Category Tag"
                            value={ov.category ?? zone.category}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWebsiteConfig((prev) => ({
                                ...prev,
                                zoneOverrides: {
                                  ...(prev.zoneOverrides || {}),
                                  [zone.slug]: {
                                    ...(prev.zoneOverrides?.[zone.slug] || {}),
                                    category: val,
                                  },
                                },
                              }));
                            }}
                          />
                          <Input
                            label="Highlight Badge"
                            value={
                              ov.highlight ??
                              (zone.keyMetrics?.[0]?.value || zone.features?.[0] || '')
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              setWebsiteConfig((prev) => ({
                                ...prev,
                                zoneOverrides: {
                                  ...(prev.zoneOverrides || {}),
                                  [zone.slug]: {
                                    ...(prev.zoneOverrides?.[zone.slug] || {}),
                                    highlight: val,
                                  },
                                },
                              }));
                            }}
                          />
                        </div>

                        <Input
                          label="Or Paste Image URL"
                          placeholder="https://..."
                          value={ov.image || websiteConfig.zoneImages?.[zone.slug] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWebsiteConfig((prev) => ({
                              ...prev,
                              zoneImages: {
                                ...(prev.zoneImages || {}),
                                [zone.slug]: val,
                              },
                              zoneOverrides: {
                                ...(prev.zoneOverrides || {}),
                                [zone.slug]: {
                                  ...(prev.zoneOverrides?.[zone.slug] || {}),
                                  image: val,
                                },
                              },
                            }));
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {cmsSubTab === 'programs_trainers' && (
            <div className="space-y-6">
              {/* Workout Programs Quick Picture & Heading Editor */}
              <Card className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-xl text-white uppercase tracking-wide flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-[#C7F464]" /> Workout Program Pictures &amp; Titles
                    </h2>
                    <p className="text-xs text-[#A1A1AA]">
                      Upload cover photos for Workout Programs shown on Homepage &amp; /programs. Click Save Photo on each card to save immediately.
                    </p>
                  </div>
                  <Link href="/admin/workouts">
                    <Button type="button" size="sm" variant="secondary">
                      Open Full Workout Programs Page
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {cmsPrograms.map((prog, idx) => (
                    <div
                      key={prog.id}
                      className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-3"
                    >
                      <div className="relative h-36 rounded-xl overflow-hidden bg-[#141414] border border-[#2C2C2C]">
                        <img
                          src={
                            prog.coverImageUrl ||
                            'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=720&q=75'
                          }
                          alt={prog.title}
                          className="w-full h-full object-cover"
                        />
                        <label className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/80 border border-[#C7F464]/50 text-[11px] font-mono text-[#C7F464] cursor-pointer hover:bg-[#C7F464] hover:text-[#0B0B0B] transition-colors">
                          <Camera className="w-3 h-3" />
                          Upload Cover
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const dataUrl = await compressImageFile(file, 1080, 0.85);
                                setCmsPrograms((prev) => {
                                  const next = [...prev];
                                  next[idx] = { ...next[idx], coverImageUrl: dataUrl };
                                  return next;
                                });
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
                        label="Program Title"
                        value={prog.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCmsPrograms((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], title: val };
                            return next;
                          });
                        }}
                      />
                      <Input
                        label="Cover Image URL"
                        value={prog.coverImageUrl || ''}
                        placeholder="https://..."
                        onChange={(e) => {
                          const val = e.target.value;
                          setCmsPrograms((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], coverImageUrl: val };
                            return next;
                          });
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        isLoading={savingEntityId === prog.id}
                        onClick={() => saveProgramQuick(prog)}
                      >
                        <Save className="w-3.5 h-3.5 mr-1.5" /> Save Program Picture
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Certified Trainers Quick Portrait & Headline Editor */}
              <Card className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-xl text-white uppercase tracking-wide flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-[#C7F464]" /> Certified Trainers Pictures &amp; Profiles
                    </h2>
                    <p className="text-xs text-[#A1A1AA]">
                      Upload portrait photos and edit headlines shown in &ldquo;Meet Our Certified Trainers&rdquo; on the Homepage &amp; /trainers.
                    </p>
                  </div>
                  <Link href="/admin/trainers">
                    <Button type="button" size="sm" variant="secondary">
                      Open Full Trainers Page
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cmsTrainers.map((trainer, idx) => (
                    <div
                      key={trainer.id}
                      className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-3"
                    >
                      <div className="relative h-40 rounded-xl overflow-hidden bg-[#141414] border border-[#2C2C2C]">
                        <img
                          src={
                            trainer.user?.avatarUrl ||
                            'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=640&q=75'
                          }
                          alt={trainer.user?.fullName || 'Trainer'}
                          className="w-full h-full object-cover"
                        />
                        <label className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/80 border border-[#C7F464]/50 text-[11px] font-mono text-[#C7F464] cursor-pointer hover:bg-[#C7F464] hover:text-[#0B0B0B] transition-colors">
                          <Camera className="w-3 h-3" />
                          Upload Portrait
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const dataUrl = await compressImageFile(file, 900, 0.85);
                                setCmsTrainers((prev) => {
                                  const next = [...prev];
                                  next[idx] = {
                                    ...next[idx],
                                    user: { ...(next[idx].user || {}), avatarUrl: dataUrl },
                                  };
                                  return next;
                                });
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
                        label="Coach Display Name"
                        value={trainer.user?.fullName || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCmsTrainers((prev) => {
                            const next = [...prev];
                            next[idx] = {
                              ...next[idx],
                              user: { ...(next[idx].user || {}), fullName: val },
                            };
                            return next;
                          });
                        }}
                      />
                      <Input
                        label="Headline"
                        value={trainer.headline || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCmsTrainers((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], headline: val };
                            return next;
                          });
                        }}
                      />
                      <Input
                        label="Portrait Image URL"
                        value={trainer.user?.avatarUrl || ''}
                        placeholder="https://..."
                        onChange={(e) => {
                          const val = e.target.value;
                          setCmsTrainers((prev) => {
                            const next = [...prev];
                            next[idx] = {
                              ...next[idx],
                              user: { ...(next[idx].user || {}), avatarUrl: val },
                            };
                            return next;
                          });
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        isLoading={savingEntityId === trainer.id}
                        onClick={() => saveTrainerQuick(trainer)}
                      >
                        <Save className="w-3.5 h-3.5 mr-1.5" /> Save Coach Picture
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {cmsSubTab === 'sections_footer' && (
            <div className="space-y-6">
              {/* Daily Timings & Section Headings */}
              <Card className="space-y-4">
                <h2 className="font-display text-xl text-white uppercase tracking-wide flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#C7F464]" /> Daily Floor &amp; Ladies Session Timings Banner
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3 rounded-xl bg-[#171717] border border-[#2C2C2C] space-y-2.5">
                    <Input
                      label="Morning Badge"
                      value={websiteConfig.sectionHeadings?.morningBadge || ''}
                      onChange={(e) =>
                        setWebsiteConfig((prev) => ({
                          ...prev,
                          sectionHeadings: { ...prev.sectionHeadings, morningBadge: e.target.value },
                        }))
                      }
                    />
                    <Input
                      label="Morning Hours"
                      value={websiteConfig.sectionHeadings?.morningTime || ''}
                      onChange={(e) =>
                        setWebsiteConfig((prev) => ({
                          ...prev,
                          sectionHeadings: { ...prev.sectionHeadings, morningTime: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-[#171717] border border-pink-500/35 space-y-2.5">
                    <Input
                      label="Ladies Slot Badge"
                      value={websiteConfig.sectionHeadings?.ladiesBadge || ''}
                      onChange={(e) =>
                        setWebsiteConfig((prev) => ({
                          ...prev,
                          sectionHeadings: { ...prev.sectionHeadings, ladiesBadge: e.target.value },
                        }))
                      }
                    />
                    <Input
                      label="Ladies Hours"
                      value={websiteConfig.sectionHeadings?.ladiesTime || ''}
                      onChange={(e) =>
                        setWebsiteConfig((prev) => ({
                          ...prev,
                          sectionHeadings: { ...prev.sectionHeadings, ladiesTime: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-[#171717] border border-[#2C2C2C] space-y-2.5">
                    <Input
                      label="Afternoon Badge"
                      value={websiteConfig.sectionHeadings?.afternoonBadge || ''}
                      onChange={(e) =>
                        setWebsiteConfig((prev) => ({
                          ...prev,
                          sectionHeadings: { ...prev.sectionHeadings, afternoonBadge: e.target.value },
                        }))
                      }
                    />
                    <Input
                      label="Afternoon Hours"
                      value={websiteConfig.sectionHeadings?.afternoonTime || ''}
                      onChange={(e) =>
                        setWebsiteConfig((prev) => ({
                          ...prev,
                          sectionHeadings: { ...prev.sectionHeadings, afternoonTime: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-[#171717] border border-amber-500/35 space-y-2.5">
                    <Input
                      label="Friday Badge"
                      value={websiteConfig.sectionHeadings?.fridayBadge || ''}
                      onChange={(e) =>
                        setWebsiteConfig((prev) => ({
                          ...prev,
                          sectionHeadings: { ...prev.sectionHeadings, fridayBadge: e.target.value },
                        }))
                      }
                    />
                    <Input
                      label="Friday Hours"
                      value={websiteConfig.sectionHeadings?.fridayTime || ''}
                      onChange={(e) =>
                        setWebsiteConfig((prev) => ({
                          ...prev,
                          sectionHeadings: { ...prev.sectionHeadings, fridayTime: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              </Card>

              {/* Advantage Pillars & Why Exercise at Icon Page Copy */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="space-y-4">
                  <h2 className="font-display text-xl text-white uppercase tracking-wide">
                    Homepage Advantage Pillars (4 Cards)
                  </h2>
                  <div className="space-y-3">
                    {(websiteConfig.advantagePillars || DEFAULT_WEBSITE_CONFIG.advantagePillars || []).map(
                      (pillar, idx) => (
                        <div
                          key={pillar.num + idx}
                          className="p-3 rounded-xl bg-[#171717] border border-[#2C2C2C] space-y-2"
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              label="Card Title"
                              value={pillar.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setWebsiteConfig((prev) => {
                                  const next = [
                                    ...(prev.advantagePillars || DEFAULT_WEBSITE_CONFIG.advantagePillars || []),
                                  ];
                                  next[idx] = { ...next[idx], title: val };
                                  return { ...prev, advantagePillars: next };
                                });
                              }}
                            />
                            <Input
                              label="Badge"
                              value={pillar.badge}
                              onChange={(e) => {
                                const val = e.target.value;
                                setWebsiteConfig((prev) => {
                                  const next = [
                                    ...(prev.advantagePillars || DEFAULT_WEBSITE_CONFIG.advantagePillars || []),
                                  ];
                                  next[idx] = { ...next[idx], badge: val };
                                  return { ...prev, advantagePillars: next };
                                });
                              }}
                            />
                          </div>
                          <Input
                            label="Description"
                            value={pillar.desc}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWebsiteConfig((prev) => {
                                const next = [
                                  ...(prev.advantagePillars || DEFAULT_WEBSITE_CONFIG.advantagePillars || []),
                                ];
                                next[idx] = { ...next[idx], desc: val };
                                return { ...prev, advantagePillars: next };
                              });
                            }}
                          />
                        </div>
                      ),
                    )}
                  </div>
                </Card>

                <Card className="space-y-4">
                  <h2 className="font-display text-xl text-white uppercase tracking-wide">
                    &ldquo;Why Exercise at Icon&rdquo; Page Hero Copy
                  </h2>
                  {websiteConfig.whyIconPage && (
                    <div className="space-y-3">
                      <Input
                        label="Eyebrow Badge"
                        value={websiteConfig.whyIconPage.heroBadge}
                        onChange={(e) =>
                          setWebsiteConfig((prev) => ({
                            ...prev,
                            whyIconPage: {
                              ...prev.whyIconPage!,
                              heroBadge: e.target.value,
                            },
                          }))
                        }
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="Title Part 1"
                          value={websiteConfig.whyIconPage.heroTitleLine1}
                          onChange={(e) =>
                            setWebsiteConfig((prev) => ({
                              ...prev,
                              whyIconPage: {
                                ...prev.whyIconPage!,
                                heroTitleLine1: e.target.value,
                              },
                            }))
                          }
                        />
                        <Input
                          label="Lime Highlight Title"
                          value={websiteConfig.whyIconPage.heroTitleAccent}
                          onChange={(e) =>
                            setWebsiteConfig((prev) => ({
                              ...prev,
                              whyIconPage: {
                                ...prev.whyIconPage!,
                                heroTitleAccent: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                      <Textarea
                        label="Subtitle Copy"
                        value={websiteConfig.whyIconPage.heroSubtitle}
                        onChange={(e) =>
                          setWebsiteConfig((prev) => ({
                            ...prev,
                            whyIconPage: {
                              ...prev.whyIconPage!,
                              heroSubtitle: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  )}
                </Card>
              </div>

              {/* Section Headings & Visibility + Footer */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="space-y-4">
                  <h2 className="font-display text-xl text-white uppercase tracking-wide flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#C7F464]" /> Homepage Sections Visibility
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        key: 'showTrainingZones' as const,
                        label: 'Training Zones & Picture Cards',
                      },
                      {
                        key: 'showScheduleBanner' as const,
                        label: 'Daily & Ladies-Only Timings',
                      },
                      {
                        key: 'showPrograms' as const,
                        label: 'Signature Workout Programs',
                      },
                      {
                        key: 'showTrainers' as const,
                        label: 'Certified Coaches Roster',
                      },
                      {
                        key: 'showPlans' as const,
                        label: 'Membership Pricing Plans',
                      },
                      {
                        key: 'showWhyIcon' as const,
                        label: 'Icon Pillars & Transformation CTA',
                      },
                    ].map((sec) => {
                      const enabled = websiteConfig.sections[sec.key];
                      return (
                        <button
                          key={sec.key}
                          type="button"
                          onClick={() =>
                            setWebsiteConfig((prev) => ({
                              ...prev,
                              sections: {
                                ...prev.sections,
                                [sec.key]: !prev.sections[sec.key],
                              },
                            }))
                          }
                          className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-colors ${
                            enabled
                              ? 'bg-[#171717] border-[#C7F464]/40 text-white'
                              : 'bg-[#141414] border-[#2C2C2C] text-[#A1A1AA]'
                          }`}
                        >
                          <span className="text-xs font-medium">{sec.label}</span>
                          {enabled ? (
                            <Eye className="w-4 h-4 text-[#C7F464] shrink-0" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Card>

                <Card className="space-y-4">
                  <h2 className="font-display text-xl text-white uppercase tracking-wide">
                    Public Footer Copy &amp; Legal Text
                  </h2>
                  <Textarea
                    label="Footer About / Club Summary"
                    value={websiteConfig.footer.brandDescription}
                    onChange={(e) =>
                      setWebsiteConfig((prev) => ({
                        ...prev,
                        footer: {
                          ...prev.footer,
                          brandDescription: e.target.value,
                        },
                      }))
                    }
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Copyright Line"
                      value={websiteConfig.footer.copyrightText}
                      onChange={(e) =>
                        setWebsiteConfig((prev) => ({
                          ...prev,
                          footer: {
                            ...prev.footer,
                            copyrightText: e.target.value,
                          },
                        }))
                      }
                    />
                    <Input
                      label="Bottom Tagline"
                      value={websiteConfig.footer.bottomBadgeText}
                      onChange={(e) =>
                        setWebsiteConfig((prev) => ({
                          ...prev,
                          footer: {
                            ...prev.footer,
                            bottomBadgeText: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Identity & Location */}
          <Card className="space-y-4">
            <h2 className="font-display text-xl text-white uppercase tracking-wide">
              1. Brand Identity &amp; Ashkona Location
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Gym Name"
                required
                value={form.gymName}
                onChange={(e) => setForm({ ...form, gymName: e.target.value })}
              />
              <Input
                label="Tagline"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              />
            </div>
            <Textarea
              label="About Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Street Address"
                value={form.addressLine}
                onChange={(e) =>
                  setForm({ ...form, addressLine: e.target.value })
                }
              />
              <Input
                label="Area"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
              />
              <Input
                label="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <Input
              label="Google Maps Embed URL"
              value={form.googleMapsEmbedUrl}
              onChange={(e) =>
                setForm({ ...form, googleMapsEmbedUrl: e.target.value })
              }
            />
          </Card>

          {/* Contact & Opening Hours */}
          <Card className="space-y-4">
            <h2 className="font-display text-xl text-white uppercase tracking-wide">
              2. Verified Contact Channels &amp; Opening Hours
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Primary Phone Number"
                value={form.phonePrimary}
                onChange={(e) =>
                  setForm({ ...form, phonePrimary: e.target.value })
                }
              />
              <Input
                label="WhatsApp Number"
                value={form.whatsappNumber}
                onChange={(e) =>
                  setForm({ ...form, whatsappNumber: e.target.value })
                }
              />
              <Input
                label="Official Email"
                type="email"
                value={form.emailOfficial}
                onChange={(e) =>
                  setForm({ ...form, emailOfficial: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#303030]">
              <Input
                label="Saturday – Thursday Hours"
                value={form.saturdayToThursdayHours}
                onChange={(e) =>
                  setForm({ ...form, saturdayToThursdayHours: e.target.value })
                }
              />
              <Input
                label="Friday Hours"
                value={form.fridayHours}
                onChange={(e) =>
                  setForm({ ...form, fridayHours: e.target.value })
                }
              />
            </div>
            <Input
              label="Opening Hours Note"
              value={form.openingHoursNote}
              onChange={(e) =>
                setForm({ ...form, openingHoursNote: e.target.value })
              }
            />
          </Card>

          {/* Registration & Booking Rules */}
          <Card className="space-y-4">
            <h2 className="font-display text-xl text-white uppercase tracking-wide">
              3. Registration &amp; Class Booking Rules
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Booking Cancellation Cutoff (Hours before class)"
                type="number"
                min={0}
                value={form.bookingCutoffHoursDefault}
                onChange={(e) =>
                  setForm({
                    ...form,
                    bookingCutoffHoursDefault: e.target.value,
                  })
                }
              />
              <Input
                label="Max Active Bookings Per Member"
                type="number"
                min={1}
                value={form.maxActiveBookingsMember}
                onChange={(e) =>
                  setForm({ ...form, maxActiveBookingsMember: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allowSelfRegistration}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      allowSelfRegistration: e.target.checked,
                    })
                  }
                  className="accent-[#C7F464]"
                />
                Allow Public Self-Registration
              </label>
              <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requireManualApproval}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      requireManualApproval: e.target.checked,
                    })
                  }
                  className="accent-[#C7F464]"
                />
                Require Manual Staff Approval Before Member Login
              </label>
              <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isUsingPlaceholderData}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      isUsingPlaceholderData: e.target.checked,
                    })
                  }
                  className="accent-[#C7F464]"
                />
                Display Placeholder Notice Banner on Public Contact Page
              </label>
            </div>
          </Card>

          {/* Policies */}
          <Card className="space-y-4">
            <h2 className="font-display text-xl text-white uppercase tracking-wide">
              4. Facility &amp; Membership Policies
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Textarea
                label="Locker Policy"
                value={form.lockerPolicy}
                onChange={(e) =>
                  setForm({ ...form, lockerPolicy: e.target.value })
                }
              />
              <Textarea
                label="Membership Freeze Policy"
                value={form.membershipFreezePolicy}
                onChange={(e) =>
                  setForm({ ...form, membershipFreezePolicy: e.target.value })
                }
              />
            </div>
          </Card>
        </div>
      )}
    </form>
  );
}

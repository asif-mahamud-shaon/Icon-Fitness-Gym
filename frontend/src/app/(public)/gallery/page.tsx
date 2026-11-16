'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Maximize2, X, Camera } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { GalleryItem } from '@/types';
import { StatusBadge, Button } from '@/components/ui';

interface ShowcasePhoto {
  id: string;
  title: string;
  caption: string;
  category: string;
  mediaType?: string;
  mediaUrl: string;
  zoneSlug: string;
  featured?: boolean;
}

function isVideoAsset(mediaType?: string, mediaUrl?: string): boolean {
  if (mediaType === 'VIDEO') return true;
  if (!mediaUrl) return false;
  return (
    mediaUrl.startsWith('data:video/') ||
    /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(mediaUrl)
  );
}

const CURATED_GALLERY_PHOTOS: ShowcasePhoto[] = [
  {
    id: 'gal-01',
    title: 'Heavy Free-Weight & Power Rack Arena',
    caption: 'Olympic squat cages, competition barbells & 25mm ballistic rubber floor',
    category: 'FACILITY',
    mediaUrl:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=85',
    zoneSlug: 'free-weights-barbell-bay',
    featured: true,
  },
  {
    id: 'gal-02',
    title: 'Two-Tier Commercial Dumbbell Progression',
    caption: 'Complete 2.5kg to 50kg urethane & rubber hex dumbbell pairs',
    category: 'EQUIPMENT',
    mediaUrl:
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=85',
    zoneSlug: 'free-weights-barbell-bay',
  },
  {
    id: 'gal-03',
    title: 'Olympic Deadlift & Bumper Plate Platforms',
    caption: 'Reinforced shock-drop platforms with calibrated IWF bumper plates',
    category: 'EQUIPMENT',
    mediaUrl:
      'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1200&q=85',
    zoneSlug: 'olympic-lifting-platforms',
  },
  {
    id: 'gal-04',
    title: 'Dedicated Ladies-Only Training Session',
    caption: '100% private daily female training slot (1:00 PM – 3:30 PM Sat–Thu)',
    category: 'LADIES STUDIO',
    mediaUrl:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=85',
    zoneSlug: 'dedicated-ladies-studio',
  },
  {
    id: 'gal-05',
    title: 'Dual Cable Crossover & Hypertrophy Lab',
    caption: 'Constant-tension adjustable pulley towers and isolation stations',
    category: 'EQUIPMENT',
    mediaUrl:
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=85',
    zoneSlug: 'pin-loaded-isolation-machines',
  },
  {
    id: 'gal-06',
    title: 'Commercial Motorized Treadmill & Cardio Deck',
    caption: '15% power-incline treadmills, assault air bikes & elliptical trainers',
    category: 'FACILITY',
    mediaUrl:
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1600&q=90',
    zoneSlug: 'cardio-endurance-deck',
    featured: true,
  },
  {
    id: 'gal-07',
    title: '45° Leg Press, Hack Squat & Glute Biomechanics',
    caption: 'Heavy lower-body plate-loaded sleds and hamstring isolation machines',
    category: 'EQUIPMENT',
    mediaUrl:
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=85',
    zoneSlug: 'lower-body-glute-bay',
  },
  {
    id: 'gal-08',
    title: '1-on-1 Personal Transformation Coaching',
    caption: 'Certified trainers guiding form, tempo, and progressive overload',
    category: 'TRAINING',
    mediaUrl:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=85',
    zoneSlug: 'personal-training-turf',
  },
  {
    id: 'gal-09',
    title: 'Battle Ropes & Athletic Conditioning Turf',
    caption: '50mm conditioning ropes, plyo boxes, kettlebells & sprint drills',
    category: 'TRAINING',
    mediaUrl:
      'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=85',
    zoneSlug: 'personal-training-turf',
  },
  {
    id: 'gal-10',
    title: 'Barbell Compound Strength & Hypertrophy',
    caption: 'Structured 8-week strength and muscle architecture programming',
    category: 'TRANSFORMATIONS',
    mediaUrl:
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=85',
    zoneSlug: 'olympic-lifting-platforms',
  },
  {
    id: 'gal-11',
    title: 'Metabolic HIIT & Functional Kettlebell Complex',
    caption: 'Explosive full-body conditioning and core stability work',
    category: 'TRAINING',
    mediaUrl:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=85',
    zoneSlug: 'personal-training-turf',
  },
  {
    id: 'gal-12',
    title: 'Female Coach Guided Toning & Glute Suite',
    caption: 'Supervised posture, core, and lower-body sculpting for female members',
    category: 'LADIES STUDIO',
    mediaUrl:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=85',
    zoneSlug: 'dedicated-ladies-studio',
  },
  {
    id: 'gal-13',
    title: 'Coach-Guided Upper-Body Hypertrophy',
    caption: 'Precision cable and free-weight isolation with certified coaches',
    category: 'TRANSFORMATIONS',
    mediaUrl:
      'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=1200&q=85',
    zoneSlug: 'strength-training-zone',
  },
  {
    id: 'gal-14',
    title: 'Endurance Spin & Air-Bike Studio',
    caption: 'High-calorie interval conditioning and cardiovascular stamina',
    category: 'FACILITY',
    mediaUrl:
      'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1200&q=85',
    zoneSlug: 'cardio-endurance-deck',
  },
  {
    id: 'gal-15',
    title: 'Selectorized Pin-Loaded Machine Lineup',
    caption: 'Guided biomechanical cam paths for safe progressive overload',
    category: 'FACILITY',
    mediaUrl:
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=85',
    zoneSlug: 'strength-training-zone',
  },
  {
    id: 'gal-16',
    title: 'Ladies Mobility, Core & Functional Conditioning',
    caption: 'Private, comfortable environment during the 1:00 PM – 3:30 PM slot',
    category: 'LADIES STUDIO',
    mediaUrl:
      'https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=1200&q=85',
    zoneSlug: 'dedicated-ladies-studio',
  },
  {
    id: 'gal-17',
    title: 'Secure Member Lockers & Changing Amenities',
    caption: 'Sanitized changing rooms, day-use lockers, prayer space & hydration',
    category: 'FACILITY',
    mediaUrl:
      'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=1200&q=85',
    zoneSlug: 'locker-and-member-amenities',
  },
  {
    id: 'gal-18',
    title: 'Athletic Strength & Conditioning Progression',
    caption: 'Real member strength milestones tracked inside the Member Portal',
    category: 'TRANSFORMATIONS',
    mediaUrl:
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1200&q=85',
    zoneSlug: 'free-weights-barbell-bay',
  },
];

const CATEGORIES = [
  { label: 'All Photos (18+)', value: 'ALL' },
  { label: 'Facility & Floor', value: 'FACILITY' },
  { label: 'Pro Equipment', value: 'EQUIPMENT' },
  { label: 'Ladies Studio', value: 'LADIES STUDIO' },
  { label: 'Live Training', value: 'TRAINING' },
  { label: 'Strength & Results', value: 'TRANSFORMATIONS' },
];

export default function GalleryPage() {
  const [dbItems, setDbItems] = useState<GalleryItem[]>([]);
  const [category, setCategory] = useState('ALL');
  const [lightboxPhoto, setLightboxPhoto] = useState<ShowcasePhoto | null>(
    null,
  );

  useEffect(() => {
    apiFetch<GalleryItem[]>('/gallery/public')
      .then(setDbItems)
      .catch(() => []);
  }, []);

  // Merge newly uploaded/published DB items first, followed by curated photos
  const curatedUrls = new Set(CURATED_GALLERY_PHOTOS.map((p) => p.mediaUrl));
  const extraDbPhotos: ShowcasePhoto[] = dbItems
    .filter((item) => item.mediaUrl && !curatedUrls.has(item.mediaUrl))
    .map((item) => ({
      id: item.id,
      title: item.title,
      caption: item.caption || 'Icon Fitness Gym Ashkona Training Floor',
      category: item.category.toUpperCase(),
      mediaType: item.mediaType,
      mediaUrl: item.mediaUrl,
      zoneSlug: 'free-weights-barbell-bay',
    }));

  const allPhotos = [...extraDbPhotos, ...CURATED_GALLERY_PHOTOS];
  const filteredPhotos =
    category === 'ALL'
      ? allPhotos
      : allPhotos.filter((p) => p.category === category);

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-16 space-y-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464] flex items-center gap-2">
            <Camera className="w-3.5 h-3.5" />
            <span>INSIDE ICON FITNESS GYM • ASHKONA, DHAKA</span>
          </p>
          <h1 className="font-display text-5xl sm:text-6xl uppercase tracking-wide text-white">
            FACILITY &amp; FLOOR GALLERY
          </h1>
          <p className="text-base text-[#A1A1AA] leading-relaxed">
            Explore our strength bays, Olympic lifting platforms, commercial
            cardio deck, and dedicated Ladies-Only training studio. Click any
            photo to enlarge or inspect the zone.
          </p>
        </div>

        <Link href="/facilities">
          <Button
            variant="secondary"
            rightIcon={<ArrowUpRight className="w-4 h-4" />}
          >
            Explore All Training Zones
          </Button>
        </Link>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2.5">
        {CATEGORIES.map((c) => {
          const isActive = category === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider border transition-all duration-200 ${
                isActive
                  ? 'bg-[#C7F464] !text-[#090909] border-[#C7F464] font-bold shadow-sm'
                  : 'bg-[#171717] text-[#A1A1AA] border-[#303030] hover:bg-[#C7F464]/15 hover:border-[#C7F464] hover:text-[#C7F464]'
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* High-Impact Bento Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPhotos.map((photo, idx) => {
          const isWide =
            category === 'ALL' && (idx === 0 || idx === 5 || idx === 11);
          return (
            <div
              key={photo.id}
              onClick={() => setLightboxPhoto(photo)}
              className={`dark-media-card group relative h-80 sm:h-96 rounded-3xl overflow-hidden border border-[#2C2C2C] hover:border-[#C7F464]/70 bg-[#0B0B0B] shadow-lg transition-all duration-300 ease-out hover:-translate-y-1.5 cursor-pointer ${
                isWide ? 'lg:col-span-2' : ''
              }`}
            >
              {isVideoAsset(photo.mediaType, photo.mediaUrl) ? (
                <video
                  src={photo.mediaUrl}
                  muted
                  loop
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              ) : (
                <img
                  src={photo.mediaUrl}
                  alt={photo.title}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.style.opacity = '0.25';
                  }}
                  className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/15 p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={photo.category} />
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/facilities/${photo.zoneSlug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 rounded-full bg-black/75 border border-white/20 text-[10px] font-mono font-bold uppercase text-[#C7F464] hover:bg-[#C7F464] hover:text-[#090909] transition-colors flex items-center gap-1"
                    >
                      <span>Zone Specs</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                    <span className="w-9 h-9 rounded-full bg-black/75 border border-white/20 text-white group-hover:bg-[#C7F464] group-hover:text-[#090909] flex items-center justify-center transition-colors">
                      <Maximize2 className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-white group-hover:text-[#C7F464] transition-colors leading-tight">
                    {photo.title}
                  </h2>
                  <p className="text-xs text-zinc-300 line-clamp-1">
                    {photo.caption}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Fullscreen Modal */}
      {lightboxPhoto && (
        <div
          className="dark-media-card fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-5xl w-full rounded-3xl overflow-hidden bg-[#0B0B0B] border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/80 border border-white/20 text-white hover:bg-[#C7F464] hover:text-[#090909] flex items-center justify-center transition-colors"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="h-[55vh] sm:h-[68vh] w-full bg-black">
              {isVideoAsset(lightboxPhoto.mediaType, lightboxPhoto.mediaUrl) ? (
                <video
                  src={lightboxPhoto.mediaUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                <img
                  src={lightboxPhoto.mediaUrl}
                  alt={lightboxPhoto.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="p-6 sm:p-8 bg-[#111111] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={lightboxPhoto.category} />
                  <span className="text-xs font-mono text-[#C7F464]">
                    ICON FITNESS GYM • ASHKONA
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-white pt-1">
                  {lightboxPhoto.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300">
                  {lightboxPhoto.caption}
                </p>
              </div>

              <Link
                href={`/facilities/${lightboxPhoto.zoneSlug}`}
                onClick={() => setLightboxPhoto(null)}
                className="shrink-0"
              >
                <Button
                  variant="primary"
                  rightIcon={<ArrowUpRight className="w-4 h-4" />}
                >
                  Open Zone Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

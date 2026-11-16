'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Camera } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { GymSettings, FacilityItem } from '@/types';
import { ALL_SHOWCASE_ZONES } from '@/lib/facilities-catalog';
import { resolveWebsiteConfig } from '@/lib/website-config';
import { Card, StatusBadge, Button } from '@/components/ui';

const PROFESSIONAL_FLOOR_GALLERY = [
  {
    title: 'Olympic Squat & Power Cages',
    tag: 'HEAVY IRON',
    slug: 'free-weights-barbell-bay',
    image:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=85',
  },
  {
    title: 'Commercial Dumbbell Progression',
    tag: '2.5KG – 50KG',
    slug: 'free-weights-barbell-bay',
    image:
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1000&q=85',
  },
  {
    title: 'Deadlift & Bumper Platforms',
    tag: 'POWERLIFTING',
    slug: 'olympic-lifting-platforms',
    image:
      'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1000&q=85',
  },
  {
    title: 'Dual Cable Crossover Lab',
    tag: 'HYPERTROPHY',
    slug: 'pin-loaded-isolation-machines',
    image:
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1000&q=85',
  },
  {
    title: 'Motorized Treadmill & Cardio Deck',
    tag: 'ENDURANCE',
    slug: 'cardio-endurance-deck',
    image:
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1400&q=90',
  },
  {
    title: 'Dedicated Ladies Training Window',
    tag: '1:00 PM – 3:30 PM',
    slug: 'dedicated-ladies-studio',
    image:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1000&q=85',
  },
  {
    title: '45° Leg Press & Glute Biomechanics',
    tag: 'LOWER BODY LAB',
    slug: 'lower-body-glute-bay',
    image:
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1000&q=85',
  },
  {
    title: 'Battle Ropes, Kettlebells & Sled Turf',
    tag: 'ATHLETIC HIIT',
    slug: 'personal-training-turf',
    image:
      'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1000&q=85',
  },
];

export default function FacilitiesPage() {
  const [dbFacilities, setDbFacilities] = useState<FacilityItem[]>([]);
  const [settings, setSettings] = useState<GymSettings | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<FacilityItem[]>('/classes/facilities/public').catch(() => []),
      apiFetch<GymSettings>('/settings/public').catch(() => null),
    ]).then(([facRes, setRes]) => {
      setDbFacilities(Array.isArray(facRes) ? facRes : []);
      if (setRes) setSettings(setRes);
    });
  }, []);

  const cms = resolveWebsiteConfig(settings);

  // Combine the 9 curated professional zones with any additional custom admin-created zones
  const catalogSlugs = new Set(ALL_SHOWCASE_ZONES.map((z) => z.slug));
  const extraDbZones = dbFacilities
    .filter((f) => !catalogSlugs.has(f.slug))
    .map((f) => ({
      slug: f.slug,
      name: f.name,
      category: f.category,
      highlight: f.features?.[0] || f.category,
      image:
        cms.zoneImages?.[f.slug] ||
        f.imageUrl ||
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
    }));

  const displayZones = [
    ...ALL_SHOWCASE_ZONES.map((z) => {
      const ov = cms.zoneOverrides?.[z.slug];
      return {
        slug: z.slug,
        name: ov?.name || z.name,
        category: ov?.category || z.category,
        highlight: ov?.highlight || z.keyMetrics?.[0]?.value || z.features?.[0] || z.category,
        image: ov?.image || cms.zoneImages?.[z.slug] || z.heroImage,
      };
    }),
    ...extraDbZones,
  ];

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-16 space-y-20">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
          FACILITIES &amp; EQUIPMENT ZONES
        </p>
        <h1 className="font-display text-5xl sm:text-6xl uppercase tracking-wide text-white">
          TRAINING FLOOR ARCHITECTURE
        </h1>
        <p className="text-base text-[#A1A1AA] leading-relaxed">
          Select any training zone below to inspect its complete equipment
          lineup, biomechanics specifications, and session timings.
        </p>
      </div>

      {/* 9-Zone Architectural Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayZones.map((zone, idx) => {
          const isWide = idx === 0 || idx === 5;
          return (
            <Link
              key={zone.slug}
              href={`/facilities/${zone.slug}`}
              className={`dark-media-card group relative h-80 sm:h-96 rounded-3xl overflow-hidden border border-[#2C2C2C] hover:border-[#C7F464]/70 bg-[#0B0B0B] shadow-lg transition-all duration-300 ease-out hover:-translate-y-1.5 block ${
                isWide ? 'lg:col-span-2' : ''
              }`}
            >
              <img
                src={zone.image}
                alt={zone.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent p-6 sm:p-8 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <StatusBadge status={zone.category} />
                  <span className="w-10 h-10 rounded-full bg-black/75 border border-white/20 text-white group-hover:bg-[#C7F464] group-hover:text-[#090909] group-hover:border-[#C7F464] flex items-center justify-center transition-colors shadow-md">
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#C7F464]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C7F464]" />
                    {zone.highlight}
                  </span>
                  <div className="flex items-end justify-between gap-4">
                    <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-white group-hover:text-[#C7F464] transition-colors leading-tight">
                      {zone.name}
                    </h2>
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold uppercase text-[#C7F464] shrink-0">
                      <span>Full Specs</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Professional Equipment & Floor Photography Grid */}
      <div className="space-y-8 pt-4 border-t border-[#262626]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464] flex items-center gap-2">
              <Camera className="w-3.5 h-3.5" />
              <span>INSIDE ICON FITNESS GYM ASHKONA</span>
            </p>
            <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-wide text-white mt-1">
              EQUIPMENT &amp; FLOOR SHOWCASE
            </h2>
          </div>
          <Link href="/gallery">
            <Button
              variant="secondary"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Open Full Gallery
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PROFESSIONAL_FLOOR_GALLERY.map((shot) => (
            <Link
              key={shot.title}
              href={`/facilities/${shot.slug}`}
              className="dark-media-card group relative h-64 rounded-3xl overflow-hidden border border-[#2C2C2C] hover:border-[#C7F464]/70 bg-[#0B0B0B] shadow-md transition-all duration-300 hover:-translate-y-1 block"
            >
              <img
                src={shot.image}
                alt={shot.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-black/75 border border-white/15 text-[10px] font-mono uppercase text-[#C7F464]">
                    {shot.tag}
                  </span>
                  <span className="w-8 h-8 rounded-full bg-black/75 border border-white/20 text-white group-hover:bg-[#C7F464] group-hover:text-[#090909] flex items-center justify-center transition-colors">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <h3 className="font-display text-xl uppercase tracking-wide text-white group-hover:text-[#C7F464] transition-colors">
                  {shot.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Card className="bg-[#171717] flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-white">
            Want to inspect the training floor in person?
          </h3>
          <p className="text-sm text-[#A1A1AA] mt-1">
            Visit Icon Fitness Gym in Ashkona or register online to get started.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/register">
            <Button
              variant="primary"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Join Now
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="secondary">Contact Front Desk</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

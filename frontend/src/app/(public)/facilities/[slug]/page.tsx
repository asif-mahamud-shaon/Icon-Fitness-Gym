'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Dumbbell,
  MapPin,
  ShieldCheck,
  Calendar,
  ScanFace,
  Sparkles,
  Lock,
  Flame,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { FacilityItem, GymSettings } from '@/types';
import {
  FACILITY_ZONES_CATALOG,
  resolveFacilityZoneDetail,
} from '@/lib/facilities-catalog';
import { resolveWebsiteConfig } from '@/lib/website-config';
import { Button, Card, StatusBadge } from '@/components/ui';

export default function FacilityDetailPage() {
  const params = useParams<{ slug: string }>();
  const rawSlug = params?.slug || 'free-weights-barbell-bay';

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
  const rawZone = resolveFacilityZoneDetail(rawSlug, dbFacilities);
  const zoneOverride = cms.zoneOverrides?.[rawZone.slug];
  const zone = {
    ...rawZone,
    name: zoneOverride?.name || rawZone.name,
    category: zoneOverride?.category || rawZone.category,
    heroImage:
      zoneOverride?.image || cms.zoneImages?.[rawZone.slug] || rawZone.heroImage,
  };
  const isLadiesZone = zone.slug === 'dedicated-ladies-studio';

  const otherZones = Object.values(FACILITY_ZONES_CATALOG).filter(
    (item) => item.slug !== zone.slug,
  );

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14 space-y-14">
      {/* Top Breadcrumb & Back Link */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/facilities"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#A1A1AA] hover:text-[#C7F464] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Training Zones</span>
        </Link>

        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141414] border text-[11px] font-mono ${
            isLadiesZone
              ? 'border-pink-500/40 text-pink-400'
              : 'border-[#2C2C2C] text-[#C7F464]'
          }`}
        >
          {isLadiesZone ? (
            <ShieldCheck className="w-3.5 h-3.5" />
          ) : (
            <ScanFace className="w-3.5 h-3.5" />
          )}
          <span>
            {isLadiesZone
              ? '100% PRIVATE FEMALE WINDOW & SEPARATE LADIES FACILITIES'
              : 'INCLUDED IN ALL MEMBERSHIPS'}
          </span>
        </div>
      </div>

      {/* ====================================================================
          1. HERO BANNER + 4 KEY ARCHITECTURAL METRICS
          ==================================================================== */}
      <div className="relative rounded-3xl overflow-hidden border border-[#2C2C2C] bg-[#141414] shadow-2xl">
        <div className="dark-media-card relative min-h-[380px] sm:min-h-[450px] w-full flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-[#0B0B0B]">
          <img
            src={zone.heroImage}
            alt={zone.name}
            className="absolute inset-0 w-full h-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/25" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <StatusBadge status={zone.category} />
            <span className="px-3.5 py-1.5 rounded-full bg-black/80 border border-white/15 text-[11px] font-mono uppercase tracking-wider text-[#C7F464]">
              {zone.tagline}
            </span>
          </div>

          <div className="relative z-10 max-w-3xl space-y-4 my-6">
            <h1 className="font-display text-4xl sm:text-6xl uppercase tracking-wide text-white leading-[0.95]">
              {zone.name}
            </h1>
            <p className="text-sm sm:text-base text-zinc-200 leading-relaxed max-w-2xl">
              {zone.summary}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/register">
                <Button
                  variant="primary"
                  size="md"
                  className="rounded-xl"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Join Icon Fitness
                </Button>
              </Link>
              <Link href="/membership">
                <Button variant="secondary" size="md" className="rounded-xl">
                  Membership Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Key Architectural Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-[#2C2C2C] bg-[#141414]">
          {zone.keyMetrics.map((metric, idx) => (
            <div
              key={metric.label}
              className={`p-5 ${
                idx < zone.keyMetrics.length - 1
                  ? 'border-b lg:border-b-0 lg:border-r border-[#2C2C2C]'
                  : ''
              }`}
            >
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA]">
                {metric.label}
              </p>
              <p
                className={`font-display text-2xl uppercase tracking-wide mt-0.5 ${
                  isLadiesZone && idx === 1 ? 'text-pink-400' : 'text-[#C7F464]'
                }`}
              >
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ====================================================================
          1B. DEDICATED PRIVATE AMENITIES SHOWCASE (SEPARATE LADIES CHANGING, WASHROOM & PRIVACY)
          ==================================================================== */}
      {zone.dedicatedAmenities && zone.dedicatedAmenities.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-pink-400">
                <Lock className="w-3.5 h-3.5" />
                <span>FEMALE PRIVACY &amp; SEPARATE FACILITIES</span>
              </span>
              <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white mt-1">
                SEPARATE LADIES CHANGING ROOM, WASHROOM &amp; PRIVATE AMENITIES
              </h2>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-pink-500/15 border border-pink-500/35 text-xs font-mono font-bold text-pink-400 self-start md:self-auto">
              ● 100% SEPARATE FEMALE WING
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {zone.dedicatedAmenities.map((item) => (
              <Card
                key={item.title}
                className="p-6 rounded-3xl space-y-3 border border-pink-500/30 hover:border-pink-400/70 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-[10px] font-mono font-bold uppercase tracking-wider text-pink-400">
                    {item.badge}
                  </span>
                  <ShieldCheck className="w-4 h-4 text-pink-400 shrink-0" />
                </div>
                <h3 className="font-display text-2xl uppercase tracking-wide text-white">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  {item.detail}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          2. MAIN EQUIPMENT, FLOOR OVERVIEW & OFFICIAL SESSION SCHEDULE
          ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Core Equipment & Highlights */}
        <Card className="lg:col-span-7 p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
              KEY ZONE HIGHLIGHTS
            </span>
            <h2 className="font-display text-3xl uppercase tracking-wide text-white">
              MAIN EQUIPMENT &amp; FLOOR FEATURES
            </h2>
            <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
              {zone.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {zone.features.map((feature) => (
              <div
                key={feature}
                className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#090909] border border-[#262626]"
              >
                <CheckCircle2 className="w-4 h-4 text-[#C7F464] shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-white font-medium leading-snug">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* Equipment Spec Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {zone.equipmentSpecs.map((item) => (
              <div
                key={item.name}
                className="p-4 rounded-2xl bg-[#090909] border border-[#262626] flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-[#C7F464]/15 border border-[#C7F464]/30 flex items-center justify-center text-[#C7F464] shrink-0 mt-0.5">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-[11px] font-mono text-[#C7F464]">
                    {item.spec}
                  </p>
                  <p className="text-[11px] text-[#A1A1AA] leading-snug">
                    {item.purpose}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Session Timings & Privacy Guarantee Sidebar */}
        <Card className="lg:col-span-5 p-6 sm:p-8 rounded-3xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
                OPERATING SCHEDULE
              </span>
              <h2 className="font-display text-3xl uppercase tracking-wide text-white mt-1">
                SESSION TIMINGS
              </h2>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#090909] border-2 border-pink-500/40 space-y-1">
                <div className="flex items-center justify-between text-xs font-mono text-pink-400">
                  <span>ONLY FEMALE (SAT–THU)</span>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <p className="text-sm font-bold text-white">
                  {zone.sessionAccess.ladiesHours}
                </p>
                <p className="text-[11px] text-[#A1A1AA]">
                  Certified Female Trainer on-floor + Smart Gate Male-Block +
                  Separate Ladies Changing &amp; Washroom
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#090909] border border-[#262626] space-y-1">
                <div className="flex items-center justify-between text-xs font-mono text-sky-400">
                  <span>ALL MEMBERS (SAT–THU)</span>
                  <Clock className="w-4 h-4" />
                </div>
                <p className="text-sm font-bold text-white">
                  {zone.sessionAccess.generalHours}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#090909] border border-amber-500/40 space-y-1">
                <div className="flex items-center justify-between text-xs font-mono text-amber-400">
                  <span>FRIDAY SCHEDULE</span>
                  <Calendar className="w-4 h-4" />
                </div>
                <p className="text-sm font-bold text-white">
                  {zone.sessionAccess.fridayHours}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] text-xs text-[#A1A1AA] leading-relaxed">
                <strong className="text-white block mb-1">
                  Member Access Policy:
                </strong>
                {zone.sessionAccess.accessNote}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#2C2C2C] flex flex-col sm:flex-row gap-3">
            <Link href="/schedule" className="flex-1">
              <Button variant="secondary" className="w-full rounded-xl">
                Class Schedule
              </Button>
            </Link>
            <a
              href="https://maps.app.goo.gl/MFtvSDWnRHwn1fNd6"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button
                variant="outline"
                className="w-full rounded-xl"
                leftIcon={<MapPin className="w-4 h-4 text-[#C7F464]" />}
              >
                Google Maps
              </Button>
            </a>
          </div>
        </Card>
      </div>

      {/* ====================================================================
          2B. RECOMMENDED TRAINING PROTOCOLS & SAFETY STANDARDS
          ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7 p-6 sm:p-8 rounded-3xl space-y-5">
          <div>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
              COACH-GUIDED ROUTINES
            </span>
            <h2 className="font-display text-3xl uppercase tracking-wide text-white mt-1">
              SUGGESTED TRAINING PROTOCOLS
            </h2>
          </div>

          <div className="space-y-3">
            {zone.trainingProtocols.map((proto) => (
              <div
                key={proto.title}
                className="p-4 rounded-2xl bg-[#090909] border border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#C7F464] shrink-0" />
                    <h3 className="text-sm font-bold text-white">
                      {proto.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed pl-6">
                    {proto.detail}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#C7F464]/15 border border-[#C7F464]/30 text-[10px] font-mono font-bold uppercase text-[#C7F464] shrink-0 self-start sm:self-center">
                  {proto.level}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-5 p-6 sm:p-8 rounded-3xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
                PRIVACY &amp; FLOOR ETIQUETTE
              </span>
              <h2 className="font-display text-3xl uppercase tracking-wide text-white mt-1">
                SAFETY &amp; HYGIENE RULES
              </h2>
            </div>

            <div className="space-y-2.5">
              {zone.safetyRules.map((rule) => (
                <div
                  key={rule}
                  className="p-3.5 rounded-2xl bg-[#090909] border border-[#262626] flex items-start gap-2.5 text-xs sm:text-sm text-white/90 leading-relaxed"
                >
                  <ShieldCheck className="w-4 h-4 text-[#C7F464] shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#262626] flex items-center justify-between text-xs">
            <span className="text-[#A1A1AA]">Questions about this zone?</span>
            <Link
              href="/contact"
              className="text-[#C7F464] font-semibold hover:underline"
            >
              Ask Front Desk →
            </Link>
          </div>
        </Card>
      </div>

      {/* ====================================================================
          3. ZONE PHOTO GALLERY (6 PROFESSIONAL FLOOR SHOTS)
          ==================================================================== */}
      <div className="space-y-5">
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
            VISUAL FLOOR TOUR
          </span>
          <h2 className="font-display text-3xl uppercase tracking-wide text-white mt-1">
            {zone.name} GALLERY
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {zone.galleryImages.map((imgUrl, idx) => (
            <div
              key={`${imgUrl}-${idx}`}
              className="dark-media-card relative h-60 rounded-3xl overflow-hidden border border-[#2C2C2C] bg-[#0B0B0B]"
            >
              <img
                src={imgUrl}
                alt={`${zone.name} view ${idx + 1}`}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ====================================================================
          4. EXPLORE OTHER TRAINING ZONES (CLEAN VISUAL CARDS)
          ==================================================================== */}
      <div className="space-y-6 pt-4 border-t border-[#262626]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-3xl uppercase tracking-wide text-white">
            OTHER TRAINING ZONES
          </h2>
          <Link href="/facilities">
            <Button
              variant="secondary"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              All Zones
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {otherZones.slice(0, 3).map((other) => (
            <Link
              key={other.slug}
              href={`/facilities/${other.slug}`}
              className="dark-media-card group relative h-64 rounded-3xl overflow-hidden border border-[#2C2C2C] hover:border-[#C7F464]/70 bg-[#0B0B0B] shadow-lg transition-all duration-300 hover:-translate-y-1.5 block"
            >
              <img
                src={other.heroImage}
                alt={other.name}
                loading="lazy"
                className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <StatusBadge status={other.category} />
                  <span className="w-9 h-9 rounded-full bg-black/75 border border-white/15 text-white group-hover:bg-[#C7F464] group-hover:text-[#090909] flex items-center justify-center transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase text-[#C7F464]">
                    {other.keyMetrics?.[0]?.value}
                  </span>
                  <h3 className="font-display text-2xl uppercase tracking-wide text-white group-hover:text-[#C7F464] transition-colors">
                    {other.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

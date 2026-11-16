'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  apiFetch,
  formatBdt,
  computePlanPricing,
  prefetchPublicCatalog,
  seedApiCache,
} from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { ALL_SHOWCASE_ZONES } from '@/lib/facilities-catalog';
import { resolveWebsiteConfig } from '@/lib/website-config';
import {
  GymSettings,
  MembershipPlan,
  TrainerProfile,
  WorkoutProgram,
} from '@/types';
import { Button, Card, StatusBadge } from '@/components/ui';

export interface HomeInitialData {
  plans: MembershipPlan[];
  trainers: TrainerProfile[];
  programs: WorkoutProgram[];
  settings: GymSettings | null;
}

const HERO_ACCORDION_CARDS = [
  {
    id: 'panel-01',
    slug: 'free-weights-barbell-bay',
    num: '01',
    shortLabel: 'STRENGTH FLOOR',
    badge: 'HEAVY IRON ZONE',
    title: 'Pro Strength & Free-Weight Arena',
    subtitle:
      'Competition power racks, calibrated Olympic plates & full commercial dumbbell lines up to 50kg.',
    statLabel: '45+ Stations',
    image:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=960&q=75',
  },
  {
    id: 'panel-02',
    slug: 'dedicated-ladies-studio',
    num: '02',
    shortLabel: 'LADIES SESSION',
    badge: 'SAT–THU • 1:00 PM – 3:30 PM',
    title: 'Dedicated Ladies-Only Window',
    subtitle:
      '100% private female training slot supervised on-floor by our certified Female Coach.',
    statLabel: 'Female Coach On-Floor',
    image:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=960&q=75',
  },
  {
    id: 'panel-03',
    slug: 'cardio-endurance-deck',
    num: '03',
    shortLabel: 'CARDIO & TURF',
    badge: 'ATHLETIC CONDITIONING',
    title: 'Functional Sled Turf & Cardio Deck',
    subtitle:
      'Commercial treadmills, stair climbers, battle ropes, kettlebells & explosive conditioning lanes.',
    statLabel: 'High-Output Zone',
    image:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=960&q=75',
  },
  {
    id: 'panel-04',
    slug: 'personal-training-turf',
    num: '04',
    shortLabel: 'EXPERT COACHES',
    badge: 'PERSONAL TRANSFORMATION',
    title: '1-on-1 Coaching & Custom Blueprints',
    subtitle:
      'Structured hypertrophy, fat-loss & strength programming guided by certified Dhaka trainers.',
    statLabel: 'Certified Roster',
    image:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=960&q=75',
  },
];

const MOVING_SHOWCASE_CARDS = [
  {
    slug: 'olympic-lifting-platforms',
    title: 'Olympic Lifting Platforms',
    category: 'FREE WEIGHTS',
    metric: 'Calibrated Plates & Bars',
    image:
      'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=640&q=75',
  },
  {
    slug: 'commercial-cardio-deck',
    title: 'Commercial Cardio Deck',
    category: 'ENDURANCE ZONE',
    metric: 'Treadmills • Ellipticals • Bikes',
    image:
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=640&q=75',
  },
  {
    slug: 'dedicated-ladies-studio',
    title: 'Dedicated Ladies Studio',
    category: '1:00 PM – 3:30 PM',
    metric: 'Female Trainer Supervised',
    image:
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=640&q=75',
  },
  {
    slug: 'pin-loaded-isolation-machines',
    title: 'Pin-Loaded Isolation Machines',
    category: 'HYPERTROPHY LAB',
    metric: 'Precision Biomechanics',
    image:
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=640&q=75',
  },
  {
    slug: 'athletic-sled-functional-turf',
    title: 'Athletic Sled & Functional Turf',
    category: 'CONDITIONING',
    metric: 'HIIT & Mobility Drills',
    image:
      'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=640&q=75',
  },
  {
    slug: 'coach-guided-barbell-sessions',
    title: 'Coach-Guided Barbell Sessions',
    category: 'EXPERT COACHING',
    metric: 'Form & Progression Tracking',
    image:
      'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=640&q=75',
  },
];

export function HomeClient({ initialData }: { initialData: HomeInitialData }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [activePanel, setActivePanel] = useState(0);
  const [isHoveringGallery, setIsHoveringGallery] = useState(false);

  const [plans, setPlans] = useState<MembershipPlan[]>(initialData.plans || []);
  const [trainers, setTrainers] = useState<TrainerProfile[]>(
    (initialData.trainers || []).slice(0, 4),
  );
  const [programs, setPrograms] = useState<WorkoutProgram[]>(
    (initialData.programs || []).slice(0, 3),
  );
  const [settings, setSettings] = useState<GymSettings | null>(
    initialData.settings || null,
  );

  const cms = resolveWebsiteConfig(settings);
  const heroCards =
    cms.heroSlides && cms.heroSlides.length > 0
      ? cms.heroSlides
      : HERO_ACCORDION_CARDS;
  const showcaseCards =
    cms.showcaseStream && cms.showcaseStream.length > 0
      ? cms.showcaseStream
      : MOVING_SHOWCASE_CARDS;
  const sh = cms.sectionHeadings || {};
  const pillars =
    cms.advantagePillars && cms.advantagePillars.length > 0
      ? cms.advantagePillars
      : [
          {
            num: '01 / SMART ENTRY',
            title: 'Touchless Face ID Gate',
            desc: 'Sub-second biometric verification automatically checks membership validity and session eligibility.',
            badge: 'AUTOMATED SECURITY',
          },
          {
            num: '02 / FEMALE PRIVACY',
            title: 'Dedicated Ladies Window',
            desc: '100% private daily slot (1:00 PM – 3:30 PM Sat–Thu) supervised on-floor by our certified Female Trainer.',
            badge: '100% COMFORT',
          },
          {
            num: '03 / PRO BIOMECHANICS',
            title: '45+ Commercial Stations',
            desc: 'Olympic deadlift platforms, 50kg dumbbell progression, dual cable towers, and AC cardio deck.',
            badge: 'HEAVY IRON GRADE',
          },
          {
            num: '04 / DIGITAL PORTAL',
            title: 'Live Member Dashboard',
            desc: 'Track structured workout blueprints, attendance streaks, class bookings, and instant plan renewals.',
            badge: 'CLOUD CONNECTED',
          },
        ];
  const banner = cms.transformationBanner;

  // Smooth auto-cycle for the 4-panel gallery when user is not interacting
  useEffect(() => {
    if (isHoveringGallery) return;
    const timer = setInterval(() => {
      setActivePanel((prev) => (prev + 1) % heroCards.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [isHoveringGallery, heroCards.length]);

  useEffect(() => {
    // Seed public navigation cache immediately from SSR payload so /membership, /trainers, /programs open in 0ms
    if (initialData.plans.length > 0) {
      seedApiCache('/membership-plans/public', initialData.plans);
    }
    if (initialData.trainers.length > 0) {
      seedApiCache('/trainers/public', initialData.trainers);
    }
    if (initialData.programs.length > 0) {
      seedApiCache('/workouts/public', initialData.programs);
    }
    if (initialData.settings) {
      seedApiCache('/settings/public', initialData.settings);
    }

    // Fallback fetch only if any SSR endpoint failed or timed out
    if (
      initialData.plans.length === 0 ||
      initialData.trainers.length === 0 ||
      initialData.programs.length === 0 ||
      !initialData.settings
    ) {
      Promise.all([
        initialData.plans.length === 0
          ? apiFetch<MembershipPlan[]>('/membership-plans/public').catch(() => [])
          : Promise.resolve(initialData.plans),
        initialData.trainers.length === 0
          ? apiFetch<TrainerProfile[]>('/trainers/public').catch(() => [])
          : Promise.resolve(initialData.trainers),
        initialData.programs.length === 0
          ? apiFetch<WorkoutProgram[]>('/workouts/public').catch(() => [])
          : Promise.resolve(initialData.programs),
        !initialData.settings
          ? apiFetch<GymSettings>('/settings/public').catch(() => null)
          : Promise.resolve(initialData.settings),
      ]).then(([plansRes, trainersRes, programsRes, settingsRes]) => {
        if (plansRes.length) setPlans(plansRes);
        if (trainersRes.length) setTrainers(trainersRes.slice(0, 4));
        if (programsRes.length) setPrograms(programsRes.slice(0, 3));
        if (settingsRes) setSettings(settingsRes);
      });
    }

    // Pre-warm remaining public routes when idle so tab switches happen in 0ms
    const idleTimer = window.setTimeout(() => {
      prefetchPublicCatalog();
    }, 250);

    const handleSettingsUpdated = () => {
      apiFetch<GymSettings>('/settings/public')
        .then((res) => {
          if (res) setSettings(res);
        })
        .catch(() => undefined);
    };
    window.addEventListener('ifg-settings-updated', handleSettingsUpdated);

    return () => {
      window.clearTimeout(idleTimer);
      window.removeEventListener('ifg-settings-updated', handleSettingsUpdated);
    };
  }, [initialData]);

  const activeMobileCard = heroCards[activePanel] || heroCards[0];

  return (
    <div className="space-y-12 sm:space-y-20 lg:space-y-24 pb-12 sm:pb-24 overflow-hidden">
      {/* ====================================================================
          1. HERO SECTION — MOBILE NATIVE SWITCHER + DESKTOP 4-PANEL ACCORDION
          ==================================================================== */}
      <section
        className={`relative overflow-hidden border-b transition-colors duration-300 ${
          isLight
            ? 'bg-gradient-to-b from-slate-50 via-white to-slate-100/80 border-slate-200'
            : 'bg-[#090909] border-[#222222]'
        }`}
        style={{
          backgroundImage: isLight
            ? 'radial-gradient(circle at 18% 20%, rgba(163, 230, 53, 0.14), transparent 42%), radial-gradient(circle at 85% 75%, rgba(251, 191, 36, 0.10), transparent 40%)'
            : 'radial-gradient(circle at 18% 20%, rgba(199, 244, 100, 0.08), transparent 42%), radial-gradient(circle at 85% 75%, rgba(245, 158, 11, 0.06), transparent 40%)',
        }}
      >
        <div className="relative max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-10 lg:gap-8 items-center">
            {/* LEFT COLUMN (5 COLS): ARCHITECTURAL HEADLINE & QUICK CTA */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#141414] border border-[#2C2C2C]">
                <span className="w-2 h-2 rounded-full bg-[#C7F464]" />
                <span className="text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-[#C7F464]">
                  {cms.hero.badge}
                </span>
              </div>

              <h1 className="font-display text-[40px] sm:text-6xl xl:text-[68px] uppercase tracking-wide text-white leading-[0.94]">
                {cms.hero.headlineLine1}{' '}
                <span className="text-[#C7F464]">{cms.hero.headlineAccent}</span>{' '}
                {cms.hero.headlineLine2}
              </h1>

              <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed">
                {cms.hero.subtitle || settings?.description}
              </p>

              {/* Primary CTA Button */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  href={cms.hero.primaryCtaHref || '/register'}
                  className="inline-block w-full sm:w-auto"
                >
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto rounded-2xl pl-8 pr-6 py-4 text-sm sm:text-base font-extrabold tracking-wider"
                    rightIcon={
                      <span className="w-7 h-7 rounded-full bg-[#090909]/15 flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-[#090909]" />
                      </span>
                    }
                  >
                    {cms.hero.primaryCtaLabel || 'Join Icon Fitness'}
                  </Button>
                </Link>
                {cms.hero.secondaryCtaLabel && cms.hero.secondaryCtaHref && (
                  <Link
                    href={cms.hero.secondaryCtaHref}
                    className="inline-block w-full sm:w-auto"
                  >
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full sm:w-auto rounded-2xl px-6 py-4 text-sm sm:text-base"
                    >
                      {cms.hero.secondaryCtaLabel}
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN (7 COLS): MOBILE HERO SWITCHER (<sm) + DESKTOP ACCORDION (sm+) */}
            <div
              className="lg:col-span-7"
              onMouseEnter={() => setIsHoveringGallery(true)}
              onMouseLeave={() => setIsHoveringGallery(false)}
            >
              {/* MOBILE COMPACT ZONE TABS + ACTIVE HERO CARD (<640px) */}
              <div className="sm:hidden space-y-3">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                  {heroCards.map((card, index) => {
                    const isActive = activePanel === index;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => {
                          setIsHoveringGallery(true);
                          setActivePanel(index);
                        }}
                        className={`px-3 py-2 rounded-full text-[11px] font-mono uppercase tracking-wider whitespace-nowrap border transition-colors shrink-0 ${
                          isActive
                            ? 'bg-[#C7F464] !text-[#090909] border-[#C7F464] font-bold shadow-xs'
                            : isLight
                              ? 'bg-white border-slate-200 text-slate-700'
                              : 'bg-[#141414] border-[#2C2C2C] text-[#A1A1AA]'
                        }`}
                      >
                        {card.num} • {card.shortLabel}
                      </button>
                    );
                  })}
                </div>

                <Link
                  href={`/facilities/${activeMobileCard.slug}`}
                  className="dark-media-card relative block h-[290px] w-full rounded-2xl overflow-hidden border border-[#C7F464]/50 bg-[#0B0B0B] shadow-xl"
                >
                  <img
                    src={activeMobileCard.image}
                    alt={activeMobileCard.title}
                    fetchPriority="high"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/20" />
                  <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-black/80 border border-white/20 text-[10px] font-mono font-bold uppercase tracking-wider text-[#C7F464]">
                      {activeMobileCard.badge}
                    </span>
                    <span className="w-8 h-8 rounded-full bg-[#C7F464] text-[#090909] flex items-center justify-center shadow-md shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="absolute inset-x-3.5 bottom-3.5 p-3.5 rounded-xl bg-black/80 border border-white/15">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#C7F464]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C7F464]" />
                      {activeMobileCard.statLabel}
                    </span>
                    <h2 className="font-display text-2xl uppercase tracking-wide text-white leading-tight mt-0.5">
                      {activeMobileCard.title}
                    </h2>
                    <p className="text-xs text-zinc-300 mt-1 line-clamp-2">
                      {activeMobileCard.subtitle}
                    </p>
                  </div>
                </Link>
              </div>

              {/* DESKTOP & TABLET 4-PANEL EXPANDING PHOTO GALLERY (sm+) */}
              <div className="hidden sm:flex flex-row gap-3 h-[490px] w-full select-none">
                {heroCards.map((card, index) => {
                  const isActive = activePanel === index;
                  return (
                    <div
                      key={card.id}
                      onMouseEnter={() => setActivePanel(index)}
                      onClick={() => setActivePanel(index)}
                      style={{
                        flex: isActive ? '3.8 1 0%' : '1 1 0%',
                        transition:
                          'flex 520ms cubic-bezier(0.22, 1, 0.36, 1), border-color 300ms ease',
                      }}
                      className={`dark-media-card relative rounded-3xl overflow-hidden cursor-pointer bg-[#0B0B0B] border will-change-auto ${
                        isActive
                          ? 'border-[#C7F464]/70 shadow-2xl'
                          : 'border-white/15 opacity-85 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={card.image}
                        alt={card.title}
                        fetchPriority={index === 0 ? 'high' : 'auto'}
                        decoding="async"
                        className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                          isActive ? 'scale-100' : 'scale-105'
                        }`}
                      />

                      <div
                        className={`absolute inset-0 transition-opacity duration-500 ${
                          isActive
                            ? 'bg-gradient-to-t from-black/95 via-black/35 to-black/15'
                            : 'bg-gradient-to-t from-black/90 via-black/55 to-black/30'
                        }`}
                      />

                      <div className="absolute top-4 inset-x-4 flex items-center justify-between gap-2">
                        <span
                          className={`w-9 h-9 rounded-xl font-mono text-xs font-bold flex items-center justify-center border transition-colors duration-300 ${
                            isActive
                              ? 'bg-[#C7F464] text-[#090909] border-[#C7F464]'
                              : 'bg-black/70 text-white border-white/20'
                          }`}
                        >
                          {card.num}
                        </span>

                        {isActive && (
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-black/75 border border-white/20 text-[10px] font-mono font-bold uppercase tracking-wider text-[#C7F464] truncate">
                              {card.badge}
                            </span>
                            <Link
                              href={`/facilities/${card.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="w-9 h-9 rounded-full bg-[#C7F464] text-[#090909] hover:scale-105 flex items-center justify-center transition-transform shadow-md"
                              aria-label={`Open full details for ${card.title}`}
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </Link>
                          </div>
                        )}
                      </div>

                      {!isActive && (
                        <div className="flex absolute inset-x-0 bottom-6 flex-col items-center justify-end pointer-events-none">
                          <span
                            className="font-mono text-[11px] font-semibold tracking-[0.24em] uppercase text-white/90 whitespace-nowrap"
                            style={{
                              writingMode: 'vertical-rl',
                              transform: 'rotate(180deg)',
                            }}
                          >
                            {card.shortLabel}
                          </span>
                        </div>
                      )}

                      <div
                        className={`absolute inset-x-5 bottom-5 transition-all duration-300 ${
                          isActive
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-3 pointer-events-none'
                        }`}
                      >
                        <Link
                          href={`/facilities/${card.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-5 rounded-2xl bg-black/80 md:backdrop-blur-md border border-white/15 hover:border-[#C7F464]/60 flex items-end justify-between gap-4 transition-colors block"
                        >
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#C7F464]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C7F464]" />
                              {card.statLabel}
                            </span>
                            <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-white leading-tight">
                              {card.title}
                            </h2>
                          </div>

                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 text-[11px] font-mono font-bold uppercase text-[#C7F464] shrink-0">
                            <span>Explore</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick Selector Pills (Desktop) */}
              <div className="hidden sm:flex mt-3.5 items-center justify-start gap-2 px-1">
                {heroCards.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActivePanel(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activePanel === idx
                        ? 'w-9 bg-[#C7F464]'
                        : 'w-2.5 bg-zinc-500/40 hover:bg-zinc-400'
                    }`}
                    aria-label={`Show ${item.shortLabel}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================
            2. ZERO-LAG GPU-ACCELERATED MOVING PICTURE CARD STREAM
            ================================================================== */}
        <div className="border-t border-[#222222] py-4 sm:py-5 bg-[#0D0D0D] overflow-hidden">
          <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 mb-3 flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] text-[#C7F464] truncate">
              {sh.streamLabel || '● LIVE TRAINING FLOOR PICTURE STREAM'}
            </span>
            <a
              href="https://maps.app.goo.gl/MFtvSDWnRHwn1fNd6"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] sm:text-[11px] font-mono text-[#A1A1AA] hover:text-[#C7F464] flex items-center gap-1 transition-colors shrink-0"
            >
              <MapPin className="w-3 h-3 text-[#C7F464]" />
              <span>ASHKONA • DAKSHINKHAN • DHAKA</span>
            </a>
          </div>

          <div className="relative flex overflow-hidden">
            <div className="ifg-smooth-marquee gap-3 sm:gap-4 px-3 sm:px-4">
              {[...showcaseCards, ...showcaseCards].map(
                (card, index) => (
                  <Link
                    key={`${card.slug}-${index}`}
                    href={`/facilities/${card.slug}`}
                    className="dark-media-card group relative w-64 sm:w-80 h-40 sm:h-44 rounded-2xl overflow-hidden border border-white/15 hover:border-[#C7F464]/70 bg-[#090909] shrink-0 block transition-colors"
                  >
                    <img
                      src={card.image}
                      alt={card.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-3.5 sm:p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-black/75 border border-white/15 text-[10px] font-mono uppercase text-[#C7F464]">
                          {card.category}
                        </span>
                        <span className="w-8 h-8 rounded-full bg-black/75 border border-white/20 text-white group-hover:bg-[#C7F464] group-hover:text-[#090909] group-hover:border-[#C7F464] flex items-center justify-center transition-colors shadow-md">
                          <ArrowUpRight className="w-4 h-4" />
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-[#C7F464] transition-colors tracking-wide">
                          {card.title}
                        </p>
                        <p className="text-[11px] font-mono text-zinc-300">
                          {card.metric}
                        </p>
                      </div>
                    </div>
                  </Link>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. INTERACTIVE PICTURE CARDS — TRAINING ZONES & FACILITIES
          ==================================================================== */}
      {cms.sections.showTrainingZones && (
      <section className="cv-auto max-w-container mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-7 sm:mb-10">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
              {sh.floorEyebrow || 'ARCHITECTURAL TRAINING ZONES'}
            </p>
            <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-wide text-white mt-1.5 sm:mt-2">
              {sh.floorTitle || 'EXPLORE OUR TRAINING FLOOR'}
            </h2>
          </div>
          <Link href="/facilities" className="self-start md:self-auto">
            <Button
              variant="secondary"
              size="sm"
              className="sm:h-11 sm:px-5 sm:text-sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {sh.floorCtaLabel || 'View All Facilities'}
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {ALL_SHOWCASE_ZONES.slice(0, 5).map((facility, idx) => {
            const isWide = idx === 0;
            const override = cms.zoneOverrides?.[facility.slug];
            const displayImage =
              override?.image || cms.zoneImages?.[facility.slug] || facility.heroImage;
            const displayName = override?.name || facility.name;
            const displayCategory = override?.category || facility.category;
            const highlight =
              override?.highlight ||
              facility.keyMetrics?.[0]?.value ||
              facility.features?.[0] ||
              facility.category;
            return (
              <Link
                key={facility.slug}
                href={`/facilities/${facility.slug}`}
                className={`dark-media-card group relative h-64 sm:h-80 lg:h-96 rounded-2xl sm:rounded-3xl overflow-hidden border border-[#2C2C2C] hover:border-[#C7F464]/70 bg-[#0B0B0B] shadow-lg transition-all duration-300 ease-out sm:hover:-translate-y-1.5 block ${
                  isWide ? 'lg:col-span-2' : ''
                }`}
              >
                <img
                  src={displayImage}
                  alt={displayName}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-5 sm:p-8 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={displayCategory} />
                    <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/75 border border-white/20 text-white group-hover:bg-[#C7F464] group-hover:text-[#090909] group-hover:border-[#C7F464] flex items-center justify-center transition-colors shadow-md">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#C7F464]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C7F464]" />
                      {highlight}
                    </span>
                    <div className="flex items-end justify-between gap-4">
                      <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-white group-hover:text-[#C7F464] transition-colors leading-tight">
                        {displayName}
                      </h3>
                      <span className="hidden sm:inline-flex items-center gap-1 text-xs font-mono font-bold uppercase text-[#C7F464] shrink-0">
                        <span>Explore</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      )}

      {/* ====================================================================
          4. DAILY SESSION SCHEDULE (7:00 AM - 11:00 PM & FRIDAY 5:00 - 11:00 PM)
          ==================================================================== */}
      {cms.sections.showScheduleBanner && (
      <section className="cv-auto max-w-container mx-auto px-4 sm:px-6 lg:px-10">
        <div className="rounded-2xl sm:rounded-3xl bg-[#141414] border border-[#2C2C2C] p-5 sm:p-10 space-y-6 sm:space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
                {sh.scheduleEyebrow || 'OFFICIAL OPERATING HOURS (ASIA/DHAKA)'}
              </span>
              <h2 className="font-display text-2xl sm:text-4xl uppercase tracking-wide text-white mt-1">
                {sh.scheduleTitle || 'DAILY GENERAL & LADIES-ONLY SESSION TIMINGS'}
              </h2>
            </div>
            <Link href="/schedule" className="self-start lg:self-auto">
              <Button
                variant="secondary"
                size="sm"
                className="sm:h-11 sm:px-5 sm:text-sm"
                rightIcon={<Calendar className="w-4 h-4" />}
              >
                {sh.scheduleCtaLabel || 'Full Weekly Class Schedule'}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="p-4 sm:p-6 rounded-2xl bg-[#090909] border border-[#262626] space-y-2.5 sm:space-y-3 transition-transform duration-300 sm:hover:-translate-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[11px] font-mono font-semibold uppercase">
                  {sh.morningBadge || 'SAT–THU • MORNING & MIDDAY'}
                </span>
                <Clock className="w-4 h-4 text-[#A1A1AA] shrink-0" />
              </div>
              <p className="text-xl sm:text-2xl font-mono font-bold text-white">
                {sh.morningTime || '07:00 AM – 01:00 PM'}
              </p>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                {sh.morningNote ||
                  'Open to All Members (Male & Female) with an active membership.'}
              </p>
            </div>

            <Link
              href="/facilities/dedicated-ladies-studio"
              className="group p-4 sm:p-6 rounded-2xl bg-[#090909] border-2 border-pink-500/40 hover:border-pink-400 space-y-2.5 sm:space-y-3 transition-all duration-300 sm:hover:-translate-y-1 block"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-md bg-pink-500/15 text-pink-400 border border-pink-500/30 text-[11px] font-mono font-semibold uppercase">
                  {sh.ladiesBadge || 'SAT–THU • ONLY FEMALE'}
                </span>
                <ArrowUpRight className="w-4 h-4 text-pink-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
              </div>
              <p className="text-xl sm:text-2xl font-mono font-bold text-white">
                {sh.ladiesTime || '01:00 PM – 03:30 PM'}
              </p>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                {sh.ladiesNote ||
                  'Exclusively for Female Members Only. Supervised on-floor by our certified Female Trainer.'}
              </p>
            </Link>

            <div className="p-4 sm:p-6 rounded-2xl bg-[#090909] border border-[#262626] space-y-2.5 sm:space-y-3 transition-transform duration-300 sm:hover:-translate-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-md bg-[#C7F464]/15 text-[#C7F464] border border-[#C7F464]/30 text-[11px] font-mono font-semibold uppercase">
                  {sh.afternoonBadge || 'SAT–THU • AFTERNOON & NIGHT'}
                </span>
                <Clock className="w-4 h-4 text-[#A1A1AA] shrink-0" />
              </div>
              <p className="text-xl sm:text-2xl font-mono font-bold text-white">
                {sh.afternoonTime || '03:30 PM – 11:00 PM'}
              </p>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                {sh.afternoonNote ||
                  'Open to All Members (Male & Female) for strength, cardio, and group training.'}
              </p>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl bg-[#090909] border border-amber-500/40 space-y-2.5 sm:space-y-3 transition-transform duration-300 sm:hover:-translate-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11px] font-mono font-semibold uppercase">
                  {sh.fridayBadge || 'FRIDAY SCHEDULE'}
                </span>
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              </div>
              <p className="text-xl sm:text-2xl font-mono font-bold text-white">
                {sh.fridayTime || '05:00 PM – 11:00 PM'}
              </p>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                {sh.fridayNote ||
                  'Friday evening session open to All Members (Male & Female) from 5:00 PM to 11:00 PM.'}
              </p>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ====================================================================
          5. PICTURE CARD SHOWCASE — WORKOUT PROGRAMS & COACHES
          ==================================================================== */}
      {(cms.sections.showPrograms || cms.sections.showTrainers) && (
      <section className="cv-auto max-w-container mx-auto px-4 sm:px-6 lg:px-10 space-y-14 sm:space-y-24">
        {/* Signature Workout Programs */}
        {cms.sections.showPrograms && (
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-7 sm:mb-10">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
                {sh.programsEyebrow || 'STRUCTURED TRAINING SYSTEMS'}
              </p>
              <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-wide text-white mt-1.5 sm:mt-2">
                {sh.programsTitle || 'WORKOUT PROGRAMS'}
              </h2>
            </div>
            <Link href="/programs" className="self-start md:self-auto">
              <Button
                variant="secondary"
                size="sm"
                className="sm:h-11 sm:px-5 sm:text-sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {sh.programsCtaLabel || 'All Workout Programs'}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {programs.map((program) => (
              <Link
                key={program.id}
                href={`/programs/${program.slug}`}
                className="dark-media-card group relative h-80 sm:h-96 rounded-2xl sm:rounded-3xl overflow-hidden border border-[#2C2C2C] hover:border-[#C7F464]/70 bg-[#0B0B0B] shadow-lg transition-all duration-300 ease-out sm:hover:-translate-y-1.5 block"
              >
                <img
                  src={
                    program.coverImageUrl ||
                    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=720&q=75'
                  }
                  alt={program.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent p-5 sm:p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <StatusBadge status={program.goal || program.category} />
                      <StatusBadge status={program.difficulty} />
                    </div>
                    <span className="w-9 h-9 rounded-full bg-black/75 border border-white/20 text-white group-hover:bg-[#C7F464] group-hover:text-[#090909] flex items-center justify-center transition-colors shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <h3 className="font-display text-2xl uppercase tracking-wide text-white group-hover:text-[#C7F464] transition-colors">
                      {program.title}
                    </h3>
                    <div className="pt-2.5 border-t border-white/15 flex items-center justify-between text-xs font-mono text-zinc-300">
                      <span>
                        {program.durationWeeks} Weeks • {program.daysPerWeek}
                        d/wk
                      </span>
                      <span className="text-[#C7F464] font-semibold flex items-center gap-1">
                        <span>View Blueprint</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        )}

        {/* Certified Coaches — Tall Portrait Picture Cards */}
        {cms.sections.showTrainers && (
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-7 sm:mb-10">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
                {sh.trainersEyebrow || 'EXPERT COACHING ROSTER'}
              </p>
              <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-wide text-white mt-1.5 sm:mt-2">
                {sh.trainersTitle || 'MEET OUR CERTIFIED TRAINERS'}
              </h2>
            </div>
            <Link href="/trainers" className="self-start md:self-auto">
              <Button
                variant="secondary"
                size="sm"
                className="sm:h-11 sm:px-5 sm:text-sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {sh.trainersCtaLabel || 'All Trainers'}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {trainers.map((trainer: any) => (
              <Link
                key={trainer.id}
                href={`/trainers/${trainer.slug}`}
                className="dark-media-card group relative h-80 sm:h-96 rounded-2xl sm:rounded-3xl overflow-hidden border border-[#2C2C2C] hover:border-[#C7F464]/70 bg-[#0B0B0B] shadow-lg transition-all duration-300 ease-out sm:hover:-translate-y-1.5 block"
              >
                <img
                  src={
                    trainer.user?.avatarUrl ||
                    'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=640&q=75'
                  }
                  alt={trainer.user?.fullName}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-black/75 border border-white/15 text-[10px] font-mono text-[#C7F464]">
                      {trainer.experienceYears}+ YRS EXP
                    </span>
                    <div className="flex items-center gap-1.5">
                      {trainer.gender && (
                        <StatusBadge
                          status={
                            trainer.gender === 'FEMALE'
                              ? 'FEMALE COACH'
                              : 'MALE COACH'
                          }
                        />
                      )}
                      <span className="w-8 h-8 rounded-full bg-black/75 border border-white/20 text-white group-hover:bg-[#C7F464] group-hover:text-[#090909] flex items-center justify-center transition-colors">
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-display text-2xl uppercase tracking-wide text-white group-hover:text-[#C7F464] transition-colors">
                      {trainer.user?.fullName}
                    </h3>
                    <p className="text-xs text-zinc-300 line-clamp-2">
                      {trainer.headline}
                    </p>
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-[#C7F464]">
                        <span>Coach Profile</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        )}
      </section>
      )}

      {/* ====================================================================
          6. MEMBERSHIP PLANS (DEDICATED SECTION)
          ==================================================================== */}
      {cms.sections.showPlans && plans.length > 0 && (
        <section className="cv-auto max-w-container mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-7 sm:mb-10">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
                {sh.plansEyebrow || 'MEMBERSHIP OPTIONS'}
              </p>
              <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-wide text-white mt-1.5 sm:mt-2">
                {sh.plansTitle || 'MEMBERSHIP PLANS'}
              </h2>
            </div>
            <Link href="/membership" className="self-start md:self-auto">
              <Button
                variant="secondary"
                size="sm"
                className="sm:h-11 sm:px-5 sm:text-sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {sh.plansCtaLabel || 'Compare All Plans'}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            {plans.map((plan) => {
              const pricing = computePlanPricing(plan);
              return (
                <Card
                  key={plan.id}
                  className={`flex flex-col justify-between rounded-2xl sm:rounded-3xl p-5 sm:p-7 relative transition-transform duration-300 sm:hover:-translate-y-1 ${
                    plan.isFeatured
                      ? 'border-[#C7F464] ring-1 ring-[#C7F464]/40'
                      : ''
                  }`}
                >
                  {plan.isFeatured && (
                    <div className="absolute -top-3 right-5 sm:right-6 px-3.5 py-1 rounded-full bg-[#C7F464] !text-[#090909] text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm">
                      Most Popular
                    </div>
                  )}

                  <div className="space-y-4 sm:space-y-5">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-mono uppercase text-[#C7F464]">
                          {plan.durationDays} Days ({plan.durationType})
                        </span>
                        {pricing.hasDiscount && pricing.badgeText && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#C7F464]/15 border border-[#C7F464]/40 text-[#C7F464] text-[10px] font-mono font-bold uppercase tracking-wider">
                            {pricing.badgeText}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                        {plan.name.replace(/\s*\(Configurable Tier\)/gi, '')}
                      </h3>
                      <p className="text-sm text-[#A1A1AA] mt-2">
                        {plan.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#303030]">
                      <div className="flex items-baseline gap-2.5 flex-wrap">
                        <span className="text-3xl sm:text-4xl font-mono font-bold text-white">
                          {formatBdt(pricing.discountedPrice)}
                        </span>
                        {pricing.hasDiscount && (
                          <span className="text-base font-mono text-[#A1A1AA] line-through">
                            {formatBdt(pricing.basePrice)}
                          </span>
                        )}
                        <span className="text-xs font-mono text-[#A1A1AA]">
                          / {plan.durationDays} days
                        </span>
                      </div>
                      {pricing.hasDiscount && (
                        <p className="text-xs font-mono text-[#C7F464] mt-1.5">
                          Save {formatBdt(pricing.totalDiscount)} on plan fee
                        </p>
                      )}
                    </div>

                    <ul className="space-y-2 sm:space-y-2.5 text-sm text-[#A1A1AA]">
                      {plan.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-[#C7F464] shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-5 sm:pt-6 mt-5 sm:mt-6 border-t border-[#303030]">
                    <Link href={`/register?planId=${plan.id}`} className="block">
                      <Button
                        variant={plan.isFeatured ? 'primary' : 'secondary'}
                        className="w-full rounded-xl"
                      >
                        Join with{' '}
                        {plan.name.replace(/\s*\(Configurable Tier\)/gi, '')}
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* ====================================================================
          7. THE ICON FITNESS ADVANTAGE — SMART ECOSYSTEM & TRANSFORMATION BANNER
          ==================================================================== */}
      {cms.sections.showWhyIcon && (
      <section className="cv-auto max-w-container mx-auto px-4 sm:px-6 lg:px-10 space-y-6 sm:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {pillars.map((pillar) => (
            <Card
              key={pillar.num}
              className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col justify-between space-y-3 sm:space-y-4 border border-[#2C2C2C] hover:border-[#C7F464]/70 transition-all duration-300 sm:hover:-translate-y-1"
            >
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#C7F464]">
                    {pillar.num}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#C7F464]/15 border border-[#C7F464]/30 text-[10px] font-mono uppercase text-[#C7F464]">
                    {pillar.badge}
                  </span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl uppercase tracking-wide text-white">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Cinematic Visual Transformation Banner */}
        <div className="dark-media-card relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#2C2C2C] bg-[#0B0B0B] shadow-2xl">
          <img
            src={
              banner?.image ||
              'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=960&q=75'
            }
            alt="Icon Fitness Gym Transformation Floor"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/70" />

          <div className="relative p-6 sm:p-12 lg:p-14 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
            <div className="max-w-2xl space-y-3.5 sm:space-y-4">
              <div className="inline-flex items-center gap-2.5 sm:gap-3 px-3 sm:px-3.5 py-1.5 rounded-full bg-black/80 border border-white/20">
                <img
                  src="/logo.jpg"
                  alt="Icon Fitness Gym"
                  width={24}
                  height={24}
                  decoding="async"
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-md object-contain bg-black"
                />
                <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-[#C7F464]">
                  {banner?.eyebrowBadge || 'ICON FITNESS GYM • ASHKONA, DHAKA'}
                </span>
              </div>

              <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl uppercase tracking-wide text-white leading-[0.95]">
                {banner?.headlineLine1 || 'STEP ONTO THE FLOOR.'}{' '}
                <span className="text-[#C7F464]">
                  {banner?.headlineAccent || 'BUILD YOUR STRONGEST SELF.'}
                </span>
              </h2>

              <p className="text-xs sm:text-base text-zinc-200 leading-relaxed max-w-xl">
                {banner?.subtitle ||
                  'Register online in under 60 seconds to receive your digital Member ID, unlock touchless Smart Face entry, and train with Dhaka’s premier coaching team.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full lg:w-auto">
              <Link href={banner?.primaryCtaHref || '/register'} className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto rounded-xl px-6 sm:px-8 shadow-lg font-extrabold text-sm sm:text-base"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  {banner?.primaryCtaLabel || 'Start Membership Registration'}
                </Button>
              </Link>
              <Link href={banner?.secondaryCtaHref || '/facilities'} className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto rounded-xl px-6 sm:px-8 font-bold text-sm sm:text-base"
                  rightIcon={<ArrowUpRight className="w-4 h-4" />}
                >
                  {banner?.secondaryCtaLabel || 'Explore All Training Zones'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      )}
    </div>
  );
}


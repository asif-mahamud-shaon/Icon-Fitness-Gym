'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Target,
  Dumbbell,
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
  ScanFace,
  Users,
  Sparkles,
  Flame,
  HeartPulse,
  MapPin,
  Phone,
  Award,
  Layers,
  Calendar,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { GymSettings } from '@/types';
import { Card, Button, StatusBadge } from '@/components/ui';

const ECOSYSTEM_PILLARS = [
  {
    code: '01 / BIOMETRIC GATE',
    title: 'Touchless Face ID Access Control',
    description:
      'Sub-second facial recognition at our Ashkona entrance automatically verifies active membership status and enforces gender-specific session schedules without physical cards.',
    metric: '< 0.8s Verification',
    icon: <ScanFace className="w-5 h-5 text-[#C7F464]" />,
  },
  {
    code: '02 / HEAVY IRON ARCHITECTURE',
    title: 'Calibrated Free-Weight & Power Arena',
    description:
      'Equipped with commercial competition squat cages, deadlift platforms, Olympic barbells, bumper plates, and a complete 2.5 kg to 50 kg rubber hex dumbbell progression.',
    metric: 'Up to 50 KG Pairs',
    icon: <Dumbbell className="w-5 h-5 text-[#C7F464]" />,
  },
  {
    code: '03 / PRECISION BIOMECHANICS',
    title: 'Selectorized & Plate-Loaded Fleet',
    description:
      'Ergonomically cam-profiled pin-loaded isolation stations, dual adjustable cable crossover towers, 45-degree leg presses, hack squats, and chest/shoulder press machines.',
    metric: '45+ Pro Stations',
    icon: <Layers className="w-5 h-5 text-[#C7F464]" />,
  },
  {
    code: '04 / DEDICATED FEMALE PRIVACY',
    title: '100% Exclusive Ladies-Only Window',
    description:
      'Every Saturday through Thursday from 01:00 PM to 03:30 PM, the entire training floor is reserved exclusively for female members under certified Female Trainer supervision.',
    metric: '1:00 PM – 3:30 PM Daily',
    icon: <Users className="w-5 h-5 text-pink-400" />,
  },
  {
    code: '05 / METABOLIC & CARDIO DECK',
    title: 'Endurance & Functional Sled Turf',
    description:
      'Climate-controlled cardio deck featuring commercial incline treadmills, elliptical cross-trainers, assault air bikes, rowing ergometers, battle ropes, and plyometric turf.',
    metric: 'Full HVAC Climate Control',
    icon: <HeartPulse className="w-5 h-5 text-[#C7F464]" />,
  },
  {
    code: '06 / DIGITAL MEMBER PORTAL',
    title: 'Cloud Workout & Booking Ecosystem',
    description:
      'Every member receives a personal digital portal to follow coach-assigned workout blueprints, reserve group class seats in real time, and download verified payment receipts.',
    metric: '24/7 Cloud Sync',
    icon: <Sparkles className="w-5 h-5 text-[#C7F464]" />,
  },
];

const CLUB_STANDARDS = [
  {
    title: 'Clean Indoor Athletic Footwear & Sweat Towel',
    detail:
      'To protect our commercial flooring and upholstery hygiene, all members must wear clean indoor training shoes and carry a personal workout towel on the training floor.',
  },
  {
    title: 'Strict Weight Re-Racking & Floor Discipline',
    detail:
      'Return all dumbbells, Olympic plates, EZ-bars, and cable attachments to their designated storage racks immediately upon completing your working sets.',
  },
  {
    title: 'Dedicated Ladies-Only Window Enforcement',
    detail:
      'From 01:00 PM to 03:30 PM (Saturday–Thursday), our automated access control gate strictly restricts floor entry to active female members and female coaching staff.',
  },
  {
    title: '2-Hour Group Class Cancellation Cutoff',
    detail:
      'Group conditioning and strength classes operate on strict seat capacities. Cancel bookings at least 2 hours prior to start time so waitlisted members can claim the spot.',
  },
  {
    title: 'Coaching Guidance & Safe Spotting Protocol',
    detail:
      'Use safety spotter arms inside power cages during heavy compound lifts or request assistance from our on-floor certified male and female trainers.',
  },
  {
    title: 'Verified Digital Membership & Billing Transparency',
    detail:
      'Every membership activation and renewal processed via Cash, bKash, Nagad, Rocket, or POS Card generates an auditable digital receipt inside your Member Portal.',
  },
];

export default function AboutPage() {
  const [settings, setSettings] = useState<GymSettings | null>(null);

  useEffect(() => {
    apiFetch<GymSettings>('/settings/public')
      .then(setSettings)
      .catch(() => null);
  }, []);

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16 space-y-20">
      {/* ====================================================================
          1. CINEMATIC ARCHITECTURAL HERO BANNER
          ==================================================================== */}
      <div className="dark-media-card relative rounded-3xl overflow-hidden border border-[#2C2C2C] bg-[#090909] shadow-2xl">
        <div className="relative min-h-[440px] sm:min-h-[480px] flex flex-col justify-between p-6 sm:p-10 lg:p-14">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=85"
            alt="Icon Fitness Gym Ashkona Training Floor"
            className="absolute inset-0 w-full h-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/45" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-black/80 border border-white/15">
              <img
                src="/logo.jpg"
                alt="Icon Fitness Gym Logo"
                className="w-6 h-6 rounded-md object-contain bg-black"
              />
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#C7F464]">
                ABOUT ICON FITNESS GYM • ASHKONA, DHAKA
              </span>
            </div>

            <span className="px-3.5 py-1.5 rounded-full bg-black/75 border border-white/15 text-[11px] font-mono uppercase tracking-wider text-white">
              EST. ASHKONA • DAKSHINKHAN • DHAKA-1230
            </span>
          </div>

          <div className="relative z-10 max-w-3xl space-y-5 my-8">
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl uppercase tracking-wide text-white leading-[0.94]">
              BUILT ON{' '}
              <span className="text-[#C7F464]">
                IRON DISCIPLINE, BIOMECHANICS
              </span>{' '}
              &amp; COMMUNITY.
            </h1>
            <p className="text-sm sm:text-lg text-zinc-200 leading-relaxed max-w-2xl">
              {settings?.description ||
                'Icon Fitness Gym is North Dhaka’s premier strength, conditioning, and personal transformation club in Ashkona—combining heavy commercial equipment, certified coaching, dedicated ladies-only training windows, and smart biometric access.'}
            </p>
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link href="/register">
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-xl px-7"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Join Icon Fitness
                </Button>
              </Link>
              <Link href="/facilities">
                <Button
                  variant="secondary"
                  size="lg"
                  className="rounded-xl px-7"
                  rightIcon={<ArrowUpRight className="w-4 h-4" />}
                >
                  Explore 9 Training Zones
                </Button>
              </Link>
            </div>
          </div>

          {/* 4-Metric Bottom Bar */}
          <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-white/15">
            {[
              {
                label: 'TRAINING FLOOR',
                value: '9 Specialized Zones',
                sub: 'Strength, Cardio, Turf & Amenities',
              },
              {
                label: 'COMMERCIAL FLEET',
                value: '45+ Pro Stations',
                sub: 'Olympic Racks & 50KG Dumbbells',
              },
              {
                label: 'FEMALE PRIVACY SLOT',
                value: '1:00 PM – 3:30 PM',
                sub: 'Sat–Thu • Female Coach Supervised',
              },
              {
                label: 'SMART ACCESS GATE',
                value: 'Face ID Check-In',
                sub: 'Automated Schedule & Tier Validation',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-3.5 rounded-2xl bg-black/65 border border-white/10"
              >
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#C7F464]">
                  {stat.label}
                </p>
                <p className="font-display text-2xl uppercase tracking-wide text-white mt-0.5">
                  {stat.value}
                </p>
                <p className="text-[11px] text-zinc-300 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ====================================================================
          2. MISSION, PHILOSOPHY & VISUAL STORY SPLIT
          ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="p-7 rounded-3xl flex flex-col justify-between space-y-4 border border-[#2C2C2C] hover:border-[#C7F464]/70 transition-all">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-[#141414] border border-[#303030] flex items-center justify-center text-[#C7F464]">
                <Target className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#C7F464] block">
                01 / OUR MISSION IN ASHKONA
              </span>
              <h2 className="text-2xl font-bold text-white uppercase font-display tracking-wide">
                International Gym Standards in North Dhaka
              </h2>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                We founded Icon Fitness Gym so athletes, professionals, students,
                and homemakers in Ashkona, Dakshinkhan, and Uttara never have to
                compromise on equipment quality, floor hygiene, or structured
                coaching. Every square foot is designed for serious, measurable
                physical progress.
              </p>
            </div>
            <div className="pt-3 border-t border-[#262626] text-xs font-mono text-[#C7F464]">
              ● Result-Driven Community Culture
            </div>
          </Card>

          <Card className="p-7 rounded-3xl flex flex-col justify-between space-y-4 border border-[#2C2C2C] hover:border-[#C7F464]/70 transition-all">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-[#141414] border border-[#303030] flex items-center justify-center text-[#C7F464]">
                <Flame className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#C7F464] block">
                02 / TRAINING METHODOLOGY
              </span>
              <h2 className="text-2xl font-bold text-white uppercase font-display tracking-wide">
                Science-Backed Progressive Overload
              </h2>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                We reject random, unstructured workouts. Whether your goal is
                lean muscle hypertrophy, metabolic fat loss, or foundational
                strength, our coaches assign periodized training blueprints with
                clear sets, reps, tempo, and rest intervals tracked directly in
                your Member Portal.
              </p>
            </div>
            <div className="pt-3 border-t border-[#262626] text-xs font-mono text-[#C7F464]">
              ● Structured Periodized Blueprints
            </div>
          </Card>

          <Card className="sm:col-span-2 p-7 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-[#2C2C2C] hover:border-[#C7F464]/70 transition-all">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#C7F464]">
                <Award className="w-4 h-4" />
                <span>03 / CERTIFIED MALE &amp; FEMALE COACHING ROSTER</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-white">
                ON-FLOOR SUPERVISION FOR EVERY FITNESS LEVEL
              </h3>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                First-time beginners receive full machine orientation and posture
                screening, while experienced lifters benefit from advanced
                biomechanical cues, safe spotting, and quarterly program
                adjustments.
              </p>
            </div>
            <Link href="/trainers" className="shrink-0">
              <Button
                variant="secondary"
                className="rounded-xl"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Meet Our Coaches
              </Button>
            </Link>
          </Card>
        </div>

        {/* Visual Showcase Stack */}
        <div className="lg:col-span-5 grid grid-cols-1 gap-6">
          <div className="dark-media-card relative h-64 sm:h-full min-h-[320px] rounded-3xl overflow-hidden border border-[#2C2C2C] bg-[#090909]">
            <img
              src="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=85"
              alt="Heavy Free Weight Zone at Icon Fitness Gym"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent p-7 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <StatusBadge status="ASHKONA FLAGSHIP CLUB" />
                <span className="px-3 py-1 rounded-full bg-black/75 border border-white/15 text-[11px] font-mono text-[#C7F464]">
                  DHAKA-1230
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-mono uppercase tracking-wider text-[#C7F464]">
                  ZERO COMPROMISE ENVIRONMENT
                </p>
                <h3 className="font-display text-3xl uppercase tracking-wide text-white leading-tight">
                  COMMERCIAL IRON, FULL AIR-CONDITIONING &amp; SMART SECURITY.
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Designed for high-output training with rubberized shock-absorbing
                  flooring, Olympic lifting platforms, and dedicated recovery
                  zones.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          3. THE 6 PILLARS OF ICON FITNESS ARCHITECTURE
          ==================================================================== */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
              INFRASTRUCTURE &amp; TECHNOLOGY
            </p>
            <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-wide text-white mt-1">
              6 PILLARS OF THE ICON FITNESS ECOSYSTEM
            </h2>
          </div>
          <Link href="/gallery">
            <Button
              variant="secondary"
              className="rounded-xl"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View 18-Photo Facility Gallery
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ECOSYSTEM_PILLARS.map((pillar) => (
            <Card
              key={pillar.code}
              className="p-6 sm:p-7 rounded-3xl flex flex-col justify-between space-y-5 border border-[#2C2C2C] hover:border-[#C7F464]/70 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#303030] flex items-center justify-center">
                    {pillar.icon}
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#141414] border border-[#303030] text-[10px] font-mono uppercase text-[#C7F464]">
                    {pillar.metric}
                  </span>
                </div>
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#C7F464]">
                  {pillar.code}
                </p>
                <h3 className="font-display text-2xl uppercase tracking-wide text-white">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ====================================================================
          4. OFFICIAL OPERATING WINDOWS & CLUB GOVERNANCE STANDARDS
          ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 5 Cols: Official Daily Session Windows */}
        <Card className="lg:col-span-5 p-7 rounded-3xl space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
                OFFICIAL OPERATING HOURS (ASIA/DHAKA)
              </p>
              <h2 className="font-display text-3xl uppercase tracking-wide text-white mt-1">
                DAILY TRAINING WINDOWS
              </h2>
              <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
                Our smart biometric gate and front-desk check-in system
                automatically enforce the following daily session windows:
              </p>
            </div>

            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-[#090909] border border-[#262626] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase text-sky-400">
                    SAT–THU • MORNING &amp; MIDDAY
                  </span>
                  <Clock className="w-4 h-4 text-sky-400" />
                </div>
                <p className="text-lg font-mono font-bold text-white">
                  07:00 AM – 01:00 PM
                </p>
                <p className="text-xs text-[#A1A1AA]">
                  Open to <strong className="text-white">All Members (Male &amp; Female)</strong>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#090909] border-2 border-pink-500/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase text-pink-400">
                    SAT–THU • LADIES ONLY WINDOW
                  </span>
                  <ShieldCheck className="w-4 h-4 text-pink-400" />
                </div>
                <p className="text-lg font-mono font-bold text-white">
                  01:00 PM – 03:30 PM
                </p>
                <p className="text-xs text-[#A1A1AA]">
                  Strictly <strong className="text-white">Female Members Only</strong> • Supervised by Female Coach
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#090909] border border-[#262626] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase text-[#C7F464]">
                    SAT–THU • AFTERNOON &amp; NIGHT
                  </span>
                  <Clock className="w-4 h-4 text-[#C7F464]" />
                </div>
                <p className="text-lg font-mono font-bold text-white">
                  03:30 PM – 11:00 PM
                </p>
                <p className="text-xs text-[#A1A1AA]">
                  Open to <strong className="text-white">All Members (Male &amp; Female)</strong>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#090909] border border-amber-500/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase text-amber-400">
                    FRIDAY SCHEDULE
                  </span>
                  <Calendar className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-lg font-mono font-bold text-white">
                  05:00 PM – 11:00 PM
                </p>
                <p className="text-xs text-[#A1A1AA]">
                  Evening session open to <strong className="text-white">All Members (Male &amp; Female)</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#262626] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#A1A1AA]">
              <MapPin className="w-4 h-4 text-[#C7F464]" />
              <span>Ashkona Main Road, Dakshinkhan, Dhaka</span>
            </div>
            <div className="flex items-center gap-2 text-white font-mono">
              <Phone className="w-3.5 h-3.5 text-[#C7F464]" />
              <span>01685475975</span>
            </div>
          </div>
        </Card>

        {/* Right 7 Cols: 6 Club Etiquette & Safety Standards */}
        <Card className="lg:col-span-7 p-7 rounded-3xl space-y-6">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
              FLOOR ETIQUETTE &amp; MEMBER GOVERNANCE
            </p>
            <h2 className="font-display text-3xl uppercase tracking-wide text-white mt-1">
              GYM POLICIES &amp; SAFETY STANDARDS
            </h2>
            <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
              Every member agrees to uphold these six operational standards to
              maintain a clean, respectful, and high-performance training floor.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CLUB_STANDARDS.map((rule) => (
              <div
                key={rule.title}
                className="p-4 rounded-2xl bg-[#090909] border border-[#262626] space-y-2"
              >
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#C7F464] shrink-0 mt-0.5" />
                  <h3 className="text-sm font-bold text-white leading-snug">
                    {rule.title}
                  </h3>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed pl-6">
                  {rule.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#262626] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <Link href="/terms">
                <Button variant="secondary" size="sm" className="rounded-lg">
                  Full Terms &amp; Conditions
                </Button>
              </Link>
              <Link href="/privacy-policy">
                <Button variant="secondary" size="sm" className="rounded-lg">
                  Privacy &amp; Biometric Policy
                </Button>
              </Link>
            </div>
            <Link href="/membership">
              <Button
                variant="primary"
                size="sm"
                className="rounded-lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                View Membership Plans
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

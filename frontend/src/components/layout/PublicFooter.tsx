'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  Mail,
  Phone,
  ShieldCheck,
  ArrowRight,
  ArrowUpRight,
  ArrowUp,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import {
  DEFAULT_WEBSITE_CONFIG,
  resolveWebsiteConfig,
} from '@/lib/website-config';
import { GymSettings } from '@/types';

const EXPLORE_LINKS = [
  { href: '/why-icon', label: 'Why Exercise at Icon' },
  { href: '/about', label: 'About Icon Fitness' },
  { href: '/facilities', label: 'Training Facilities' },
  { href: '/membership', label: 'Membership Plans' },
  { href: '/store', label: 'Gear & Supplements' },
  { href: '/trainers', label: 'Coaches & Trainers' },
  { href: '/programs', label: 'Workout Programs' },
  { href: '/schedule', label: 'Class Schedule' },
  { href: '/gallery', label: 'Facility Gallery' },
  { href: '/contact', label: 'Contact & Visit' },
];

const PORTAL_LINKS = [
  { href: '/register', label: 'Online Registration' },
  { href: '/login', label: 'Member Portal Login' },
  { href: '/member/dashboard', label: 'Member Dashboard' },
  { href: '/trainer/dashboard', label: 'Trainer Portal' },
  { href: '/admin/dashboard', label: 'Admin Command Center' },
];

const POLICY_LINKS = [
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/cancellation-policy', label: 'Cancellation Policy' },
];

export function PublicFooter() {
  const year = new Date().getFullYear();
  const [settings, setSettings] = useState<GymSettings | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const res = await apiFetch<GymSettings>('/settings/public');
      if (res) setSettings(res);
    } catch {
      // safe fallback
    }
  }, []);

  useEffect(() => {
    loadSettings();
    const handleUpdate = () => loadSettings();
    window.addEventListener('ifg-settings-updated', handleUpdate);
    return () => window.removeEventListener('ifg-settings-updated', handleUpdate);
  }, [loadSettings]);

  const cms = settings ? resolveWebsiteConfig(settings) : DEFAULT_WEBSITE_CONFIG;
  const displayPhone =
    settings?.phonePrimary &&
    !settings.phonePrimary.includes('[Pending')
      ? settings.phonePrimary
      : '+880 1685-475975';
  const displayEmail = settings?.emailOfficial || 'info@iconfitnessgym.com';
  const displayAddress =
    settings?.addressLine || 'Ashkona Main Road, Dakshinkhan, Dhaka-1230';
  const satThuHours =
    settings?.openingHoursJson?.saturdayToThursday || '07:00 AM – 11:00 PM';
  const fridayHours =
    settings?.openingHoursJson?.friday || '05:00 PM – 11:00 PM';

  return (
    <footer className="relative bg-[#090909] border-t border-[#303030] text-[#A1A1AA] overflow-hidden">
      {/* Top Lime Architectural Accent */}
      <div
        aria-hidden="true"
        className="h-px w-full bg-gradient-to-r from-transparent via-[#C7F464]/70 to-transparent"
      />

      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 pt-10 sm:pt-14 pb-24 lg:pb-10">
        {/* Top Row: Brand Identity + Quick Action Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 pb-10 border-b border-[#262626] items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-black border border-[#303030] flex items-center justify-center shrink-0">
                <img
                  src="/logo.jpg"
                  alt="Icon Fitness Gym Official Logo"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="block font-display text-2xl sm:text-3xl tracking-wider uppercase text-white leading-none">
                  {cms.header.brandTitle || settings?.gymName || 'ICON FITNESS GYM'}
                </span>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C7F464]">
                    {cms.header.brandSubtitle || 'ASHKONA • DAKSHINKHAN • DHAKA'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-[#141414] border border-[#262626] px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    Smart Face Access &amp; Live Portal
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed max-w-2xl">
              {cms.footer.brandDescription}
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-[#141414] border border-[#303030] p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#C7F464] font-semibold">
                  START TRAINING TODAY
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#A1A1AA]">
                  INSTANT DIGITAL ID
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white font-medium leading-snug">
                Register online in under 60 seconds or sign in to manage your
                membership, bookings &amp; workout plan.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C7F464] hover:bg-[#d4f882] text-[#090909] font-bold text-xs sm:text-sm px-4 py-2.5 transition-colors"
                >
                  <span>Join Online Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#171717] hover:bg-[#202020] border border-[#303030] text-white font-semibold text-xs sm:text-sm px-4 py-2.5 transition-colors"
                >
                  <span>Member Portal</span>
                  <ArrowUpRight className="w-4 h-4 text-[#C7F464]" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 py-10">
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl bg-[#141414] border border-[#262626] p-5">
              <div className="flex items-center justify-between gap-2 mb-3.5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#C7F464]" />
                  <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-white">
                    Club Operating Hours
                  </h3>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                  Open 7 Days
                </span>
              </div>

              <div className="divide-y divide-[#262626] font-mono text-xs">
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <span className="text-[#A1A1AA]">Sat – Thu (General)</span>
                  <span className="text-white font-semibold">{satThuHours}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <span className="text-pink-400 font-semibold">
                    Sat – Thu (Ladies Only)
                  </span>
                  <span className="text-pink-400 font-semibold">
                    01:00 PM – 03:30 PM
                  </span>
                </div>
                <div className="pt-2.5 flex items-center justify-between gap-3">
                  <span className="text-amber-400 font-semibold">
                    Friday Floor
                  </span>
                  <span className="text-amber-400 font-semibold">
                    {fridayHours}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={`tel:${displayPhone.replace(/\s+/g, '')}`}
                className="group rounded-xl bg-[#141414] border border-[#262626] hover:border-[#C7F464]/50 p-3.5 flex items-center gap-3 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-[#1B1F14] flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-[#C7F464]" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-mono uppercase tracking-wider">
                    Hotline
                  </span>
                  <span className="block text-xs font-semibold text-white group-hover:text-[#C7F464] transition-colors truncate">
                    {displayPhone}
                  </span>
                </div>
              </a>

              <a
                href={`mailto:${displayEmail}`}
                className="group rounded-xl bg-[#141414] border border-[#262626] hover:border-[#C7F464]/50 p-3.5 flex items-center gap-3 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-[#1B1F14] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[#C7F464]" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-mono uppercase tracking-wider">
                    Email Desk
                  </span>
                  <span className="block text-xs font-semibold text-white group-hover:text-[#C7F464] transition-colors truncate">
                    {displayEmail}
                  </span>
                </div>
              </a>

              <a
                href="https://maps.app.goo.gl/MFtvSDWnRHwn1fNd6"
                target="_blank"
                rel="noopener noreferrer"
                className="sm:col-span-2 group rounded-xl bg-[#141414] border border-[#262626] hover:border-[#C7F464]/50 p-3.5 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#1B1F14] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-[#C7F464]" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-mono uppercase tracking-wider">
                      Visit Our Training Floor
                    </span>
                    <span className="block text-xs font-semibold text-white group-hover:text-[#C7F464] transition-colors truncate">
                      {displayAddress}
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#A1A1AA] group-hover:text-[#C7F464] shrink-0 transition-colors" />
              </a>
            </div>
          </div>

          {/* Right Link Matrix */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-white mb-4">
                Explore Club
              </h3>
              <ul className="space-y-2.5 text-sm">
                {EXPLORE_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1.5 hover:text-[#C7F464] transition-colors"
                    >
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-white mb-4">
                Portals &amp; Access
              </h3>
              <ul className="space-y-2.5 text-sm">
                {PORTAL_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1.5 hover:text-[#C7F464] transition-colors"
                    >
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1 flex flex-col justify-between gap-6">
              <div>
                <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-white mb-4">
                  Policies
                </h3>
                <ul className="space-y-2.5 text-sm">
                  {POLICY_LINKS.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-1.5 hover:text-[#C7F464] transition-colors"
                      >
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-[#141414] border border-[#262626] p-3.5 space-y-1">
                <span className="block text-[10px] font-mono uppercase tracking-widest text-[#C7F464]">
                  Service Coverage
                </span>
                <p className="text-xs leading-relaxed">
                  Ashkona • Dakshinkhan • Airport Road • Uttara Sector 1–14
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Back-to-Top Strip */}
        <div className="pt-6 border-t border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-center sm:text-left">
            © {year} {cms.footer.copyrightText}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#A1A1AA]">
              {cms.footer.bottomBadgeText}
            </span>
            <a
              href="#"
              aria-label="Back to top"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#171717] border border-[#303030] hover:border-[#C7F464] px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-white hover:text-[#C7F464] transition-colors"
            >
              <span>Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

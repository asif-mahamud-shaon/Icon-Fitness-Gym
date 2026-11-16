'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  UserCheck,
  ArrowRight,
  LayoutDashboard,
  ChevronDown,
  Calendar,
  Users,
  Image as ImageIcon,
  Info,
  Sun,
  Moon,
  Dumbbell,
  Sparkles,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { apiFetch } from '@/lib/api';
import {
  DEFAULT_WEBSITE_CONFIG,
  resolveWebsiteConfig,
} from '@/lib/website-config';
import { GymSettings, WebsiteConfig } from '@/types';
import { Button } from '@/components/ui';

const ROUTE_META: Record<string, { desc: string; icon: React.ReactNode }> = {
  '/why-icon': {
    desc: 'What sets our Ashkona training floor apart',
    icon: <Sparkles className="w-4 h-4 text-[#C7F464]" />,
  },
  '/programs': {
    desc: 'Structured hypertrophy & fat-loss blueprints',
    icon: <Dumbbell className="w-4 h-4 text-[#C7F464]" />,
  },
  '/schedule': {
    desc: 'Daily general & ladies-only timings',
    icon: <Calendar className="w-4 h-4 text-[#C7F464]" />,
  },
  '/trainers': {
    desc: 'Meet our male & female coaches',
    icon: <Users className="w-4 h-4 text-[#C7F464]" />,
  },
  '/gallery': {
    desc: 'Inside our Ashkona training floor',
    icon: <ImageIcon className="w-4 h-4 text-[#C7F464]" />,
  },
  '/about': {
    desc: 'Our mission, philosophy & standards',
    icon: <Info className="w-4 h-4 text-[#C7F464]" />,
  },
};

export function PublicNavbar() {
  const pathname = usePathname();
  const { user, getDefaultPortalRoute } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [websiteConfig, setWebsiteConfig] = useState<WebsiteConfig>(
    DEFAULT_WEBSITE_CONFIG,
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadWebsiteConfig = useCallback(async () => {
    try {
      const settings = await apiFetch<GymSettings>('/settings/public');
      if (settings) {
        setWebsiteConfig(resolveWebsiteConfig(settings));
      }
    } catch {
      // keep fallback config safely
    }
  }, []);

  useEffect(() => {
    loadWebsiteConfig();
    const handleUpdate = () => loadWebsiteConfig();
    window.addEventListener('ifg-settings-updated', handleUpdate);
    return () => window.removeEventListener('ifg-settings-updated', handleUpdate);
  }, [loadWebsiteConfig]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const headerCfg = websiteConfig.header;
  const headerLinks = headerCfg.navPins.filter((p) => p.placement === 'HEADER');
  const exploreLinks = headerCfg.navPins.filter((p) => p.placement === 'EXPLORE');
  const mobileLinks = headerCfg.navPins.filter((p) => p.placement !== 'HIDDEN');

  const isMoreActive = exploreLinks.some(
    (item) =>
      item.href !== '/' && pathname?.startsWith(item.href),
  );

  const renderLink = (
    href: string,
    className: string,
    children: React.ReactNode,
    onClick?: () => void,
  ) => {
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
          className={className}
        >
          {children}
        </a>
      );
    }
    return (
      <Link key={href} href={href} onClick={onClick} className={className}>
        {children}
      </Link>
    );
  };

  return (
    <>
      {headerCfg.showPromoBar && headerCfg.promoText && (
        <div className="bg-[#1B2210] border-b border-[#C7F464]/35 text-xs py-2 px-4">
          <div className="max-w-container mx-auto flex flex-wrap items-center justify-center gap-3 text-center">
            <span className="inline-flex items-center gap-1.5 font-medium text-white">
              <Megaphone className="w-3.5 h-3.5 text-[#C7F464] shrink-0" />
              {headerCfg.promoText}
            </span>
            {headerCfg.promoCtaLabel && headerCfg.promoCtaHref && (
              <Link
                href={headerCfg.promoCtaHref}
                className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#C7F464] !text-[#090909] font-bold uppercase tracking-wider text-[10px]"
              >
                <span>{headerCfg.promoCtaLabel}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 w-full bg-[#090909]/95 md:backdrop-blur-md border-b border-[#262626] transition-colors">
        <div className="max-w-container mx-auto px-3.5 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          {/* Official Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 group focus:outline-none min-w-0"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-black border border-[#303030] group-hover:border-[#C7F464] flex items-center justify-center shrink-0 shadow-md transition-colors">
              <img
                src="/logo.jpg"
                alt="Icon Fitness Gym Official Logo"
                width={48}
                height={48}
                decoding="async"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="whitespace-nowrap min-w-0">
              <span className="block font-display text-lg sm:text-2xl tracking-wider uppercase text-white leading-none">
                {headerCfg.brandTitle || 'ICON FITNESS GYM'}
              </span>
              <span className="block text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.2em] text-[#A1A1AA] mt-0.5 sm:mt-1">
                {headerCfg.brandSubtitle || 'ASHKONA • DHAKA'}
              </span>
            </div>
          </Link>

          {/* Clean, Focused Desktop Navigation — Configurable Pins */}
          <nav
            aria-label="Primary Navigation"
            className={`hidden lg:flex items-center gap-1 rounded-full px-2 py-1.5 border transition-colors ${
              isLight
                ? 'bg-slate-100/90 border-slate-200/90 shadow-xs'
                : 'bg-[#141414] border-[#262626]'
            }`}
          >
            {headerLinks.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname?.startsWith(item.href);

              return renderLink(
                item.href,
                `px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-[#C7F464] !text-[#090909] shadow-sm font-bold'
                    : isLight
                      ? 'text-slate-600 hover:bg-[#C7F464]/45 hover:text-slate-950'
                      : 'text-[#A1A1AA] hover:bg-[#C7F464]/15 hover:text-[#C7F464]'
                }`,
                item.label,
              );
            })}

            {/* Explore Dropdown */}
            {exploreLinks.length > 0 && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setMoreOpen((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${
                    isMoreActive || moreOpen
                      ? 'bg-[#C7F464] !text-[#090909] font-bold shadow-sm'
                      : isLight
                        ? 'text-slate-600 hover:bg-[#C7F464]/45 hover:text-slate-950'
                        : 'text-[#A1A1AA] hover:bg-[#C7F464]/15 hover:text-[#C7F464]'
                  }`}
                  aria-expanded={moreOpen}
                >
                  <span>Explore</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      moreOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {moreOpen && (
                  <div
                    className={`absolute right-0 mt-3 w-72 rounded-2xl border shadow-2xl p-2 z-50 ${
                      isLight
                        ? 'bg-white border-slate-200'
                        : 'bg-[#141414] border-[#303030]'
                    }`}
                  >
                    {exploreLinks.map((item) => {
                      const active = pathname?.startsWith(item.href);
                      const meta = ROUTE_META[item.href] || {
                        desc: item.highlight ? 'Featured destination' : 'Quick navigation link',
                        icon: <Sparkles className="w-4 h-4 text-[#C7F464]" />,
                      };
                      return renderLink(
                        item.href,
                        `flex items-start gap-3 p-3 rounded-xl transition-all ${
                          active
                            ? isLight
                              ? 'bg-[#C7F464]/40 text-slate-950'
                              : 'bg-[#C7F464]/15 text-[#C7F464]'
                            : isLight
                              ? 'hover:bg-[#C7F464]/25 text-slate-700 hover:text-slate-950'
                              : 'hover:bg-[#C7F464]/10 text-[#A1A1AA] hover:text-white'
                        }`,
                        <>
                          <div
                            className={`p-2 rounded-lg border shrink-0 mt-0.5 ${
                              isLight
                                ? 'bg-[#C7F464]/25 border-[#84cc16]/40'
                                : 'bg-[#090909] border-[#262626]'
                            }`}
                          >
                            {meta.icon}
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                              <span>{item.label}</span>
                              {item.highlight && (
                                <span className="px-1.5 py-0.5 rounded bg-[#C7F464]/20 text-[#C7F464] text-[9px] font-mono">
                                  NEW
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-[#A1A1AA] mt-0.5 leading-snug">
                              {meta.desc}
                            </p>
                          </div>
                        </>,
                        () => setMoreOpen(false),
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Desktop Auth / Portal CTA + Theme Switcher */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {headerCfg.showThemeToggle && (
              <button
                type="button"
                onClick={toggleTheme}
                className={`h-9 px-3.5 rounded-full border flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider transition-all ${
                  isLight
                    ? 'bg-slate-100/95 border-slate-200 text-slate-800 hover:bg-[#C7F464]/35 hover:border-[#84cc16]'
                    : 'bg-[#141414] border-[#2C2C2C] text-white hover:bg-[#C7F464]/15 hover:border-[#C7F464] hover:text-[#C7F464]'
                }`}
                title={
                  theme === 'dark'
                    ? 'Switch to White/Light Mode'
                    : 'Switch to Dark Mode'
                }
                aria-label="Toggle Dark / Light Theme"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-slate-700" />
                    <span>Dark</span>
                  </>
                )}
              </button>
            )}

            {headerCfg.showPortalButton &&
              (user ? (
                <Link href={getDefaultPortalRoute(user.role)}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="whitespace-nowrap !rounded-full px-4"
                    leftIcon={<LayoutDashboard className="w-4 h-4" />}
                  >
                    {user.role === 'MEMBER'
                      ? 'Member Portal'
                      : user.role === 'TRAINER'
                        ? 'Trainer Portal'
                        : 'Admin Portal'}
                  </Button>
                </Link>
              ) : (
                <div
                  className={`inline-flex items-center p-1 rounded-full border transition-all duration-300 ${
                    isLight
                      ? 'bg-slate-100/95 border-slate-200/90 shadow-xs hover:border-[#84cc16]/60'
                      : 'bg-[#141414] border-[#2C2C2C] shadow-[0_4px_20px_rgba(0,0,0,0.45)] hover:border-[#C7F464]/45'
                  }`}
                >
                  <Link
                    href="/login"
                    className={`inline-flex items-center gap-1.5 pl-3.5 pr-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-200 ${
                      pathname === '/login'
                        ? isLight
                          ? 'bg-[#C7F464]/45 text-slate-950 font-bold'
                          : 'bg-[#C7F464]/20 text-[#C7F464] font-bold'
                        : isLight
                          ? 'text-slate-700 hover:text-slate-950 hover:bg-[#C7F464]/35'
                          : 'text-zinc-300 hover:text-[#C7F464] hover:bg-[#C7F464]/15'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-[#C7F464] shrink-0" />
                    <span>{headerCfg.ctaPrimaryLabel || 'Sign In'}</span>
                  </Link>

                  <Link
                    href="/register"
                    className="group inline-flex items-center gap-1.5 pl-4 pr-2.5 py-1.5 rounded-full bg-[#C7F464] hover:bg-[#d5fb76] !text-[#090909] text-xs font-bold uppercase tracking-wider whitespace-nowrap shadow-[0_2px_12px_rgba(199,244,100,0.3)] hover:shadow-[0_4px_18px_rgba(199,244,100,0.5)] transition-all duration-200"
                  >
                    <span>{headerCfg.ctaSecondaryLabel || 'Join Now'}</span>
                    <span className="w-5 h-5 rounded-full bg-[#090909]/15 flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                      <ArrowRight className="w-3 h-3 text-[#090909]" />
                    </span>
                  </Link>
                </div>
              ))}
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden shrink-0">
            {headerCfg.showPortalButton &&
              (user ? (
                <Link
                  href={getDefaultPortalRoute(user.role)}
                  className="md:hidden h-9 px-3 rounded-full bg-[#C7F464] !text-[#090909] text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1 shadow-xs"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Portal</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className={`md:hidden h-9 px-3 rounded-full border text-[11px] font-semibold uppercase tracking-wider inline-flex items-center gap-1 ${
                    isLight
                      ? 'bg-slate-100 border-slate-200 text-slate-800'
                      : 'bg-[#171717] border-[#303030] text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#C7F464]" />
                  <span>{headerCfg.ctaPrimaryLabel || 'Login'}</span>
                </Link>
              ))}
            {headerCfg.showThemeToggle && (
              <button
                type="button"
                onClick={toggleTheme}
                className="w-9 h-9 rounded-lg bg-[#171717] border border-[#303030] text-white inline-flex items-center justify-center"
                aria-label="Toggle Dark / Light Theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="w-9 h-9 rounded-lg bg-[#171717] border border-[#303030] text-white inline-flex items-center justify-center"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="lg:hidden bg-[#141414] border-b border-[#303030] px-4 pt-3 pb-6 space-y-3 max-h-[calc(100dvh-4rem)] overflow-y-auto shadow-2xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {mobileLinks.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname?.startsWith(item.href);
                return renderLink(
                  item.href,
                  `px-3.5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'bg-[#C7F464] !text-[#090909] font-bold'
                      : isLight
                        ? 'bg-slate-100 text-slate-800 hover:bg-[#C7F464]/40'
                        : 'bg-[#202020] text-white hover:bg-[#C7F464]/15 hover:text-[#C7F464]'
                  }`,
                  item.label,
                  () => setMobileOpen(false),
                );
              })}
            </div>

            {headerCfg.showPortalButton && (
              <div className="pt-3 border-t border-[#262626]">
                {user ? (
                  <Link
                    href={getDefaultPortalRoute(user.role)}
                    onClick={() => setMobileOpen(false)}
                    className="w-full block"
                  >
                    <Button variant="primary" className="w-full !rounded-full">
                      Open {user.role} Portal
                    </Button>
                  </Link>
                ) : (
                  <div
                    className={`grid grid-cols-2 p-1 rounded-full border ${
                      isLight
                        ? 'bg-slate-100 border-slate-200'
                        : 'bg-[#090909] border-[#2C2C2C]'
                    }`}
                  >
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                        isLight
                          ? 'text-slate-700 hover:bg-[#C7F464]/35 hover:text-slate-950'
                          : 'text-zinc-300 hover:bg-[#C7F464]/15 hover:text-[#C7F464]'
                      }`}
                    >
                      <UserCheck className="w-4 h-4 text-[#C7F464]" />
                      <span>{headerCfg.ctaPrimaryLabel || 'Sign In'}</span>
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-[#C7F464] !text-[#090909] text-xs font-bold uppercase tracking-wider shadow-sm"
                    >
                      <span>{headerCfg.ctaSecondaryLabel || 'Join Now'}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#090909]" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
}

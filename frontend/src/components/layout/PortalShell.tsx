'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  LogOut,
  ExternalLink,
  Bell,
  ChevronRight,
  Shield,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Role } from '@/types';
import { Button, StatusBadge } from '@/components/ui';

export interface PortalNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: Role[];
  permission?: string;
  section?: string;
}

export function PortalShell({
  portalTitle,
  allowedRoles,
  navItems,
  children,
}: {
  portalTitle: string;
  allowedRoles: Role[];
  navItems: PortalNavItem[];
  children: React.ReactNode;
}) {
  const { user, isLoading, logout, getDefaultPortalRoute } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname || '/')}`);
      } else if (!allowedRoles.includes(user.role)) {
        router.replace(getDefaultPortalRoute(user.role));
      }
    }
  }, [user, isLoading, allowedRoles, pathname, router, getDefaultPortalRoute]);

  if (isLoading || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-[#090909] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-black border border-[#303030] flex items-center justify-center animate-pulse">
            <Image
              src="/logo.jpg"
              alt="Icon Fitness Gym"
              width={56}
              height={56}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#A1A1AA]">
            Verifying Session & Role Authorization...
          </p>
        </div>
      </div>
    );
  }

  const canAccessNavItem = (item: PortalNavItem): boolean => {
    if (user.role === 'SUPER_ADMIN') return true;
    if (item.permission && Array.isArray(user.permissions)) {
      return user.permissions.includes(item.permission);
    }
    return !item.roles || item.roles.includes(user.role);
  };

  const visibleNavItems = navItems.filter(canAccessNavItem);

  const matchHref = (item: PortalNavItem) => {
    const cleanHref = item.href.split('?')[0];
    return (
      pathname === cleanHref ||
      (cleanHref !== '/admin/access-control' && pathname?.startsWith(`${cleanHref}/`))
    );
  };

  const matchedRouteItem = [...navItems]
    .sort((a, b) => b.href.split('?')[0].length - a.href.split('?')[0].length)
    .find(matchHref);

  const isRouteRestricted = matchedRouteItem ? !canAccessNavItem(matchedRouteItem) : false;

  const activeNav = visibleNavItems.find(matchHref);

  const userInitials = (user.fullName || 'U')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const quickMobileItems = visibleNavItems.slice(0, 4);

  const renderNavItems = (isMobileDrawer = false) =>
    visibleNavItems.map((item, idx) => {
      const prevSection = idx > 0 ? visibleNavItems[idx - 1].section : undefined;
      const showSectionHeader = item.section && item.section !== prevSection;
      const isEditSection = item.section?.includes('WEBSITE EDIT');
      const isActive = matchHref(item);
      return (
        <React.Fragment key={item.href}>
          {showSectionHeader && (
            <div
              className={`px-3.5 flex items-center justify-between gap-2 ${
                idx > 0 ? 'mt-4 pt-3.5 border-t border-[#262626]' : 'pt-1'
              } pb-1.5`}
            >
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-[#C7F464]">
                {item.section}
              </span>
              {isEditSection && (
                <span className="px-1.5 py-0.5 rounded bg-[#1B2210] border border-[#C7F464]/40 text-[9px] font-mono font-bold uppercase text-[#C7F464]">
                  CMS
                </span>
              )}
            </div>
          )}
          <Link
            href={item.href}
            onClick={isMobileDrawer ? () => setSidebarOpen(false) : undefined}
            className={`flex items-center gap-3 px-3.5 py-2.5 ${
              isMobileDrawer ? 'rounded-lg' : 'rounded-xl transition-all'
            } text-sm font-medium ${
              isActive
                ? 'bg-[#C7F464] text-[#090909] font-semibold shadow-sm'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#171717]'
            }`}
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </Link>
        </React.Fragment>
      );
    });

  return (
    <div className="min-h-screen bg-[#090909] text-white flex overflow-x-hidden">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-[#141414] border-r border-[#2C2C2C] z-30">
        <div className="h-20 px-5 flex items-center justify-between border-b border-[#2C2C2C]">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-black border border-[#2C2C2C] flex items-center justify-center shrink-0">
              <Image
                src="/logo.jpg"
                alt="Icon Fitness Gym Official Logo"
                width={44}
                height={44}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="whitespace-nowrap">
              <span className="block font-display text-lg tracking-wider uppercase text-white leading-none">
                ICON FITNESS <span className="text-[#C7F464]">GYM</span>
              </span>
              <span className="block text-[10px] font-mono uppercase tracking-widest text-[#C7F464] mt-0.5">
                {portalTitle}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {renderNavItems(false)}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-[#2C2C2C] bg-[#141414] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user.fullName}
              </p>
              <p className="text-xs text-[#A1A1AA] truncate">{user.email}</p>
            </div>
            <StatusBadge status={user.role} />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="flex-1">
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs"
                leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Website
              </Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              onClick={logout}
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
            >
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#171717] border-r border-[#303030] flex flex-col z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-[#303030]">
              <span className="font-display text-lg uppercase tracking-wider text-[#C7F464]">
                {portalTitle}
              </span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 text-[#A1A1AA] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {renderNavItems(true)}
            </nav>
            <div className="p-4 border-t border-[#303030]">
              <Button
                variant="danger"
                size="sm"
                className="w-full"
                onClick={logout}
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Sign Out
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-14 sm:h-16 bg-[#141414]/98 md:backdrop-blur-md border-b border-[#2C2C2C] px-3.5 sm:px-6 lg:px-8 flex items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[#171717] border border-[#2C2C2C] text-white shrink-0"
              aria-label="Open Portal Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[#A1A1AA] min-w-0">
              <span className="font-mono uppercase text-[#C7F464] truncate max-w-[110px] sm:max-w-none">
                {portalTitle}
              </span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#A1A1AA] shrink-0" />
              <span className="font-semibold text-white truncate">
                {activeNav?.label || 'Overview'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="h-9 px-3 rounded-xl bg-[#171717] border border-[#2C2C2C] hover:border-[#C7F464] flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-white transition-colors"
              title="Toggle Dark / Light Mode"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>
            {user.memberCode && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171717] border border-[#2C2C2C] text-xs font-mono text-[#C7F464]">
                <span className="select-none opacity-75">ID:</span>
                <span className="select-all">{user.memberCode}</span>
              </span>
            )}
            {user.role === 'MEMBER' && (
              <Link
                href="/member/notifications"
                className="p-2 rounded-xl bg-[#171717] border border-[#2C2C2C] text-[#A1A1AA] hover:text-[#C7F464] transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
              </Link>
            )}
            <div className="hidden md:flex items-center gap-2.5 pl-2 border-l border-[#2C2C2C]">
              <div className="w-8 h-8 rounded-full bg-[#C7F464] text-[#090909] font-bold text-xs flex items-center justify-center shrink-0">
                {userInitials}
              </div>
              <div className="leading-tight">
                <p className="text-xs font-semibold text-white truncate max-w-[140px]">
                  {user.fullName}
                </p>
                <p className="text-[10px] font-mono text-[#A1A1AA] flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#C7F464]" />
                  {user.role.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-[1440px] w-full mx-auto min-w-0">
          {isRouteRestricted ? (
            <div className="max-w-lg mx-auto mt-12 rounded-2xl bg-[#141414] border border-red-500/30 p-8 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <Shield className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="font-display text-2xl uppercase tracking-wide text-white">
                  Module Access Restricted
                </h2>
                <p className="text-sm text-[#A1A1AA]">
                  Your employee account does not currently have permission to access{' '}
                  <span className="text-white font-semibold">
                    {matchedRouteItem?.label || 'this section'}
                  </span>
                  . Contact your Gym Admin or Owner if you need access enabled.
                </p>
              </div>
              {visibleNavItems.length > 0 && (
                <div className="pt-2">
                  <Link href={visibleNavItems[0].href}>
                    <Button size="sm">Return to {visibleNavItems[0].label}</Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            children
          )}
        </main>

        {/* Mobile Portal Bottom Quick-Dock */}
        <nav
          aria-label="Mobile Portal Navigation"
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#141414]/98 border-t border-[#2C2C2C] px-2 pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))] shadow-[0_-6px_24px_rgba(0,0,0,0.45)]"
        >
          <div
            className="grid gap-1 max-w-md mx-auto"
            style={{
              gridTemplateColumns: `repeat(${quickMobileItems.length + 1}, minmax(0, 1fr))`,
            }}
          >
            {quickMobileItems.map((item) => {
              const isActive = matchHref(item);
              const shortLabel = item.label.split(' ')[0];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl min-h-[46px] transition-colors ${
                    isActive
                      ? 'bg-[#C7F464] !text-[#090909] font-bold shadow-sm'
                      : 'text-[#A1A1AA] active:bg-[#202020]'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="text-[10px] font-mono uppercase tracking-tight mt-0.5 leading-none truncate max-w-full">
                    {shortLabel}
                  </span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl min-h-[46px] text-[#A1A1AA] active:bg-[#202020]"
            >
              <Menu className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-mono uppercase tracking-tight mt-0.5 leading-none">
                More
              </span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}


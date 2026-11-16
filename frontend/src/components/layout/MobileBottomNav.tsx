'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  CreditCard,
  Dumbbell,
  Calendar,
  LayoutDashboard,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, getDefaultPortalRoute } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const accountHref = user ? getDefaultPortalRoute(user.role) : '/register';
  const accountLabel = user ? 'Portal' : 'Join';

  const items = [
    { href: '/', label: 'Home', icon: Home, exact: true },
    { href: '/membership', label: 'Plans', icon: CreditCard, exact: false },
    { href: '/facilities', label: 'Zones', icon: Dumbbell, exact: false },
    { href: '/schedule', label: 'Schedule', icon: Calendar, exact: false },
    {
      href: accountHref,
      label: accountLabel,
      icon: user ? LayoutDashboard : UserPlus,
      exact: false,
      isAccent: !user,
    },
  ];

  return (
    <nav
      aria-label="Mobile Quick Navigation"
      className={`lg:hidden fixed bottom-0 inset-x-0 z-40 border-t px-2 pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))] transition-colors ${
        isLight
          ? 'bg-white/98 border-slate-200 shadow-[0_-6px_24px_rgba(15,23,42,0.08)]'
          : 'bg-[#0D0D0D]/98 border-[#262626] shadow-[0_-6px_24px_rgba(0,0,0,0.65)]'
      }`}
    >
      <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl min-h-[48px] transition-colors ${
                isActive || item.isAccent
                  ? 'bg-[#C7F464] !text-[#090909] font-bold shadow-xs'
                  : isLight
                    ? 'text-slate-600 active:bg-slate-100'
                    : 'text-[#A1A1AA] active:bg-[#1C1C1C]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-mono uppercase tracking-wide mt-0.5 leading-none truncate">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


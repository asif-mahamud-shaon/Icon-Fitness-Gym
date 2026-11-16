'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  CalendarCheck,
  Dumbbell,
  UserCheck,
  User,
  Bell,
  ScanFace,
  ShoppingBag,
} from 'lucide-react';
import { PortalShell, PortalNavItem } from '@/components/layout/PortalShell';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

const MEMBER_NAV_ITEMS: PortalNavItem[] = [
  {
    href: '/member/dashboard',
    label: 'Dashboard Overview',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    href: '/member/access',
    label: 'Smart Access & Biometrics',
    icon: <ScanFace className="w-4 h-4" />,
  },
  {
    href: '/member/membership',
    label: 'My Membership & Payments',
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    href: '/member/store',
    label: 'Gear & Supplements',
    icon: <ShoppingBag className="w-4 h-4" />,
  },
  {
    href: '/member/bookings',
    label: 'Class Bookings',
    icon: <CalendarCheck className="w-4 h-4" />,
  },
  {
    href: '/member/workouts',
    label: 'Assigned Workouts',
    icon: <Dumbbell className="w-4 h-4" />,
  },
  {
    href: '/member/trainer',
    label: 'My Trainer',
    icon: <UserCheck className="w-4 h-4" />,
  },
  {
    href: '/member/profile',
    label: 'Profile & Security',
    icon: <User className="w-4 h-4" />,
  },
  {
    href: '/member/notifications',
    label: 'Notifications',
    icon: <Bell className="w-4 h-4" />,
  },
];

export default function MemberPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [checkingApproval, setCheckingApproval] = useState(true);
  const [hasActiveMembership, setHasActiveMembership] = useState(false);

  const verifyMembershipAccess = useCallback(async () => {
    if (isLoading) return;
    if (!user) {
      setCheckingApproval(false);
      return;
    }
    if (user.role !== 'MEMBER') {
      setCheckingApproval(false);
      return;
    }

    setCheckingApproval(true);
    try {
      const mRes = await apiFetch<{ activeMembership: any | null }>(
        '/memberships/my',
      );
      if (mRes?.activeMembership) {
        setHasActiveMembership(true);
      } else {
        setHasActiveMembership(false);
        router.replace('/register/payment');
      }
    } catch {
      setHasActiveMembership(false);
      router.replace('/register/payment');
    } finally {
      setCheckingApproval(false);
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    verifyMembershipAccess();
  }, [verifyMembershipAccess]);

  if (
    !isLoading &&
    user?.role === 'MEMBER' &&
    (checkingApproval || !hasActiveMembership)
  ) {
    return (
      <div className="min-h-screen bg-[#090909] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-black border border-[#303030] flex items-center justify-center animate-pulse">
            <img
              src="/logo.jpg"
              alt="Icon Fitness Gym"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#A1A1AA]">
            {checkingApproval
              ? 'Verifying Payment & Admin Membership Approval...'
              : 'Membership Approval Required — Redirecting to Payment Gate...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PortalShell
      portalTitle="MEMBER PORTAL"
      allowedRoles={['MEMBER']}
      navItems={MEMBER_NAV_ITEMS}
    >
      {children}
    </PortalShell>
  );
}


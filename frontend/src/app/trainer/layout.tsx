'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Dumbbell,
} from 'lucide-react';
import { PortalShell, PortalNavItem } from '@/components/layout/PortalShell';

const TRAINER_NAV_ITEMS: PortalNavItem[] = [
  {
    href: '/trainer/dashboard',
    label: 'Trainer Dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    href: '/trainer/members',
    label: 'Assigned Members',
    icon: <Users className="w-4 h-4" />,
  },
  {
    href: '/trainer/schedule',
    label: 'Schedule & Attendance',
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    href: '/trainer/workouts',
    label: 'Workout Builder',
    icon: <Dumbbell className="w-4 h-4" />,
  },
];

export default function TrainerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalShell
      portalTitle="TRAINER PORTAL"
      allowedRoles={['TRAINER', 'ADMIN', 'SUPER_ADMIN']}
      navItems={TRAINER_NAV_ITEMS}
    >
      {children}
    </PortalShell>
  );
}


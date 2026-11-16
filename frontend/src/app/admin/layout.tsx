'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Layers,
  ShieldCheck,
  CreditCard,
  Dumbbell,
  ClipboardList,
  Calendar,
  Clock,
  CalendarCheck,
  CheckSquare,
  Image,
  MessageSquareQuote,
  MailQuestion,
  BarChart3,
  UserCog,
  Settings,
  FileSearch,
  ScanFace,
  Cpu,
  Fingerprint,
  History,
  ShieldAlert,
  CalendarClock,
  UserRoundCheck,
  ClipboardCheck,
  Sliders,
  ShoppingBag,
  Wallet,
  Target,
  Globe,
} from 'lucide-react';
import { PortalShell, PortalNavItem } from '@/components/layout/PortalShell';

const ADMIN_NAV_ITEMS: PortalNavItem[] = [
  // ====================================================================
  // 1. NORMAL OPERATIONS (DAILY GYM & MEMBER MANAGEMENT)
  // ====================================================================
  {
    href: '/admin/dashboard',
    label: 'Executive Overview',
    icon: <LayoutDashboard className="w-4 h-4" />,
    permission: 'overview',
    section: 'NORMAL OPERATIONS',
  },
  {
    href: '/admin/members',
    label: 'Member Management',
    icon: <Users className="w-4 h-4" />,
    permission: 'members',
    section: 'NORMAL OPERATIONS',
  },
  {
    href: '/admin/membership-plans',
    label: 'Membership Plans',
    icon: <Layers className="w-4 h-4" />,
    permission: 'memberships',
    section: 'NORMAL OPERATIONS',
  },
  {
    href: '/admin/memberships',
    label: 'Memberships & Renewals',
    icon: <ShieldCheck className="w-4 h-4" />,
    permission: 'memberships',
    section: 'NORMAL OPERATIONS',
  },
  {
    href: '/admin/payments',
    label: 'Payments & Receipts',
    icon: <CreditCard className="w-4 h-4" />,
    permission: 'payments',
    section: 'NORMAL OPERATIONS',
  },
  {
    href: '/admin/store',
    label: 'Gear & Store',
    icon: <ShoppingBag className="w-4 h-4" />,
    permission: 'store',
    section: 'NORMAL OPERATIONS',
  },
  {
    href: '/admin/schedules',
    label: 'Class Schedules',
    icon: <Clock className="w-4 h-4" />,
    permission: 'classes',
    section: 'NORMAL OPERATIONS',
  },
  {
    href: '/admin/bookings',
    label: 'Booking Management',
    icon: <CalendarCheck className="w-4 h-4" />,
    permission: 'classes',
    section: 'NORMAL OPERATIONS',
  },
  {
    href: '/admin/attendance',
    label: 'Attendance Tracking',
    icon: <CheckSquare className="w-4 h-4" />,
    permission: 'attendance',
    section: 'NORMAL OPERATIONS',
  },
  {
    href: '/admin/hrm',
    label: 'HRM, Payroll & Bills',
    icon: <Wallet className="w-4 h-4" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    permission: 'hrm',
    section: 'NORMAL OPERATIONS',
  },
  {
    href: '/admin/crm',
    label: 'CRM & Follow-Ups',
    icon: <Target className="w-4 h-4" />,
    permission: 'crm',
    section: 'NORMAL OPERATIONS',
  },

  // ====================================================================
  // 2. WEBSITE EDIT SECTION (PICTURES, CONTENT & PUBLIC CMS)
  // ====================================================================
  {
    href: '/admin/website-cms',
    label: 'Website & Picture CMS',
    icon: <Globe className="w-4 h-4" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    permission: 'website_cms',
    section: 'WEBSITE EDIT SECTION',
  },
  {
    href: '/admin/classes',
    label: 'Floor Zones & Classes',
    icon: <Calendar className="w-4 h-4" />,
    permission: 'classes',
    section: 'WEBSITE EDIT SECTION',
  },
  {
    href: '/admin/workouts',
    label: 'Workout Programs & Covers',
    icon: <ClipboardList className="w-4 h-4" />,
    permission: 'workouts',
    section: 'WEBSITE EDIT SECTION',
  },
  {
    href: '/admin/trainers',
    label: 'Certified Trainers & Photos',
    icon: <UserCheck className="w-4 h-4" />,
    permission: 'trainers',
    section: 'WEBSITE EDIT SECTION',
  },
  {
    href: '/admin/exercises',
    label: 'Exercise Catalog',
    icon: <Dumbbell className="w-4 h-4" />,
    permission: 'workouts',
    section: 'WEBSITE EDIT SECTION',
  },
  {
    href: '/admin/gallery',
    label: 'Gallery Photos & Videos',
    icon: <Image className="w-4 h-4" />,
    permission: 'content',
    section: 'WEBSITE EDIT SECTION',
  },
  {
    href: '/admin/testimonials',
    label: 'Member Testimonials',
    icon: <MessageSquareQuote className="w-4 h-4" />,
    permission: 'content',
    section: 'WEBSITE EDIT SECTION',
  },
  {
    href: '/admin/settings',
    label: 'Gym Brand & Contact Info',
    icon: <Settings className="w-4 h-4" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    permission: 'website_cms',
    section: 'WEBSITE EDIT SECTION',
  },

  // ====================================================================
  // 3. SMART ACCESS CONTROL
  // ====================================================================
  {
    href: '/admin/access-control',
    label: 'Access Control Overview',
    icon: <ScanFace className="w-4 h-4" />,
    permission: 'access_control',
    section: 'SMART ACCESS CONTROL',
  },
  {
    href: '/admin/access-control/devices',
    label: 'Face Recognition Devices',
    icon: <Cpu className="w-4 h-4" />,
    permission: 'access_control',
    section: 'SMART ACCESS CONTROL',
  },
  {
    href: '/admin/access-control/biometrics',
    label: 'Biometric Enrollment Status',
    icon: <Fingerprint className="w-4 h-4" />,
    permission: 'access_control',
    section: 'SMART ACCESS CONTROL',
  },
  {
    href: '/admin/access-control/history',
    label: 'Access History',
    icon: <History className="w-4 h-4" />,
    permission: 'access_control',
    section: 'SMART ACCESS CONTROL',
  },
  {
    href: '/admin/access-control/denied',
    label: 'Denied Access Attempts',
    icon: <ShieldAlert className="w-4 h-4" />,
    permission: 'access_control',
    section: 'SMART ACCESS CONTROL',
  },
  {
    href: '/admin/access-control/sessions',
    label: 'Gym Session Management',
    icon: <CalendarClock className="w-4 h-4" />,
    permission: 'access_control',
    section: 'SMART ACCESS CONTROL',
  },
  {
    href: '/admin/access-control/trainer-assignments',
    label: 'Female Trainer Assignment',
    icon: <UserRoundCheck className="w-4 h-4" />,
    permission: 'access_control',
    section: 'SMART ACCESS CONTROL',
  },
  {
    href: '/admin/access-control/trainer-attendance',
    label: 'Trainer Attendance',
    icon: <ClipboardCheck className="w-4 h-4" />,
    permission: 'access_control',
    section: 'SMART ACCESS CONTROL',
  },
  {
    href: '/admin/access-control/settings',
    label: 'Access Control Settings',
    icon: <Sliders className="w-4 h-4" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    permission: 'access_settings',
    section: 'SMART ACCESS CONTROL',
  },

  // ====================================================================
  // 4. SYSTEM & GOVERNANCE
  // ====================================================================
  {
    href: '/admin/inquiries',
    label: 'Website Inquiries',
    icon: <MailQuestion className="w-4 h-4" />,
    permission: 'content',
    section: 'SYSTEM & GOVERNANCE',
  },
  {
    href: '/admin/reports',
    label: 'Reports & CSV Export',
    icon: <BarChart3 className="w-4 h-4" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    permission: 'reports',
    section: 'SYSTEM & GOVERNANCE',
  },
  {
    href: '/admin/users',
    label: 'Users & Access Matrix',
    icon: <UserCog className="w-4 h-4" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    permission: 'users_access',
    section: 'SYSTEM & GOVERNANCE',
  },
  {
    href: '/admin/audit-logs',
    label: 'Security Audit Logs',
    icon: <FileSearch className="w-4 h-4" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    permission: 'audit_logs',
    section: 'SYSTEM & GOVERNANCE',
  },
];

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalShell
      portalTitle="ADMIN COMMAND"
      allowedRoles={['SUPER_ADMIN', 'ADMIN', 'STAFF']}
      navItems={ADMIN_NAV_ITEMS}
    >
      {children}
    </PortalShell>
  );
}


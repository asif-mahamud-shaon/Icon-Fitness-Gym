import { Role } from '@prisma/client';

export type PermissionKey =
  | 'overview'
  | 'members'
  | 'memberships'
  | 'payments'
  | 'store'
  | 'hrm'
  | 'crm'
  | 'trainers'
  | 'workouts'
  | 'classes'
  | 'attendance'
  | 'access_control'
  | 'access_settings'
  | 'content'
  | 'reports'
  | 'website_cms'
  | 'users_access'
  | 'audit_logs';

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  category: 'Operations' | 'Biometrics & Access' | 'Content & Website' | 'Administration';
  description: string;
  defaultRoles: Role[];
  routes: string[];
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    key: 'overview',
    label: 'Admin Dashboard Overview',
    category: 'Operations',
    description: 'View main admin dashboard KPIs, revenue snapshot, and daily summary.',
    defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF],
    routes: ['/admin'],
  },
  {
    key: 'members',
    label: 'Members Directory',
    category: 'Operations',
    description: 'View, create, edit, and manage member profiles and freeze/status controls.',
    defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF],
    routes: ['/admin/members'],
  },
  {
    key: 'memberships',
    label: 'Membership Plans & Subscriptions',
    category: 'Operations',
    description: 'View membership packages, subscriptions, renewals, and assign plans.',
    defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF],
    routes: ['/admin/memberships', '/admin/plans'],
  },
  {
    key: 'payments',
    label: 'Payments & Promo Codes',
    category: 'Operations',
    description: 'Verify payments, issue official receipts, record manual fees, and manage store discount codes.',
    defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF],
    routes: ['/admin/payments'],
  },
  {
    key: 'store',
    label: 'Icon Store & Orders',
    category: 'Operations',
    description: 'Manage supplement/gear catalog, stock quantities, and store customer orders.',
    defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF],
    routes: ['/admin/store'],
  },
  {
    key: 'hrm',
    label: 'Staff HR, Attendance & Payroll',
    category: 'Operations',
    description: 'Manage employee profiles, shifts, staff attendance, leave requests, and payroll.',
    defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN],
    routes: ['/admin/hrm'],
  },
  {
    key: 'crm',
    label: 'CRM Leads & Follow-ups',
    category: 'Operations',
    description: 'Track walk-in leads, trial bookings, and sales conversion pipeline.',
    defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF],
    routes: ['/admin/crm'],
  },
  {
    key: 'trainers',
    label: 'Trainers & Roster',
    category: 'Operations',
    description: 'View and manage trainer profiles, specialties, and client assignments.',
    defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF],
    routes: ['/admin/trainers'],
  },
  {
    key: 'workouts',
    label: 'Exercise & Workout Library',
    category: 'Operations',
    description: 'Manage exercises, curated workout templates, and member training plans.',
    defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF, Role.TRAINER],
    routes: ['/admin/workouts'],
  },
  {
    key: 'classes',
    label: 'Classes, Schedules & Bookings',
    category: 'Operations',
    description: 'Manage group classes, weekly timetables, and member class bookings.',
    defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF],
    routes: ['/admin/classes', '/admin/bookings'],
  },
  {
    key: 'attendance',
    label: 'Desk Attendance & Check-In',
    category: 'Operations',
    description: 'Record and monitor member desk check-ins and live floor occupancy.',
    defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF],
    routes: ['/admin/attendance'],
  },
  {
    key: 'access_control',
    label: 'Smart Gate & Face ID Terminal',
    category: 'Biometrics & Access',
    description: 'Monitor live turnstile access, enroll Face IDs, view doors, devices, and schedules.',
    defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF],
    routes: [
      '/admin/access-control/live',
      '/admin/access-control/logs',
      '/admin/access-control/terminal',
      '/admin/access-control/enrollments',
      '/admin/access-control/doors',
      '/admin/access-control/devices',
      '/admin/access-control/schedules',
    ],
  },
  {
    key: 'access_settings',
    label: 'Biometric & Ladies-Only Rules',
    category: 'Biometrics & Access',
    description: 'Configure anti-passback, biometric threshold policies, and Ladies-Only schedule locks.',
    defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN],
    routes: ['/admin/access-control/settings'],
  },
  {
    key: 'content',
    label: 'Gallery, Reviews & Inquiries',
    category: 'Content & Website',
    description: 'Moderate member testimonials, update gym facility gallery, and respond to inquiries.',
    defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF],
    routes: ['/admin/gallery', '/admin/testimonials', '/admin/inquiries'],
  },
  {
    key: 'website_cms',
    label: 'Website & Header Pin Editor',
    category: 'Content & Website',
    description: 'Edit public website navigation pins, Explore menu, announcement bar, hero, sections, footer & gym settings.',
    defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN],
    routes: ['/admin/settings'],
  },
  {
    key: 'reports',
    label: 'Analytics & Financial Reports',
    category: 'Administration',
    description: 'View revenue trends, attendance analytics, retention metrics, and exports.',
    defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN],
    routes: ['/admin/reports'],
  },
  {
    key: 'users_access',
    label: 'Users & Employee Access Control',
    category: 'Administration',
    description: 'Create staff/admin accounts, modify roles/status, and grant or restrict employee module permissions.',
    defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN],
    routes: ['/admin/users'],
  },
  {
    key: 'audit_logs',
    label: 'System Audit Logs',
    category: 'Administration',
    description: 'Inspect security, billing, CMS, and permission modification trails.',
    defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN],
    routes: ['/admin/audit-logs'],
  },
];

export const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSION_DEFINITIONS.map((d) => d.key);

const VALID_PERMISSION_SET = new Set<string>(ALL_PERMISSION_KEYS);

export const DEFAULT_ROLE_PERMISSIONS: Record<Role, PermissionKey[]> = {
  [Role.SUPER_ADMIN]: [...ALL_PERMISSION_KEYS],
  [Role.ADMIN]: [...ALL_PERMISSION_KEYS],
  [Role.STAFF]: PERMISSION_DEFINITIONS.filter((d) => d.defaultRoles.includes(Role.STAFF)).map(
    (d) => d.key,
  ),
  [Role.TRAINER]: ['members', 'workouts', 'attendance', 'classes'],
  [Role.MEMBER]: [],
};

export interface PermissionOverrideConfig {
  granted: PermissionKey[];
  revoked: PermissionKey[];
}

export function normalizePermissionOverride(raw: unknown): PermissionOverrideConfig {
  if (!raw || typeof raw !== 'object') {
    return { granted: [], revoked: [] };
  }
  const obj = raw as Record<string, unknown>;
  const rawGranted = Array.isArray(obj.granted) ? obj.granted : [];
  const rawRevoked = Array.isArray(obj.revoked) ? obj.revoked : [];

  const revokedSet = new Set<PermissionKey>();
  for (const k of rawRevoked) {
    if (typeof k === 'string' && VALID_PERMISSION_SET.has(k)) {
      revokedSet.add(k as PermissionKey);
    }
  }

  const grantedSet = new Set<PermissionKey>();
  for (const k of rawGranted) {
    if (typeof k === 'string' && VALID_PERMISSION_SET.has(k) && !revokedSet.has(k as PermissionKey)) {
      grantedSet.add(k as PermissionKey);
    }
  }

  return {
    granted: Array.from(grantedSet),
    revoked: Array.from(revokedSet),
  };
}

export function resolveEffectivePermissions(role: Role, rawOverride?: unknown): PermissionKey[] {
  if (role === Role.SUPER_ADMIN) {
    return [...ALL_PERMISSION_KEYS];
  }
  if (role === Role.MEMBER) {
    return [];
  }

  const defaults = DEFAULT_ROLE_PERMISSIONS[role] ?? [];
  const { granted, revoked } = normalizePermissionOverride(rawOverride);
  const revokedSet = new Set<PermissionKey>(revoked);
  const effective = new Set<PermissionKey>(defaults);

  for (const g of granted) {
    effective.add(g);
  }
  for (const r of revokedSet) {
    effective.delete(r);
  }

  // Keep canonical declaration order
  return ALL_PERMISSION_KEYS.filter((key) => effective.has(key));
}

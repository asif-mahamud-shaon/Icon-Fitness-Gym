'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  UserCog,
  Plus,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Check,
  Ban,
} from 'lucide-react';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Role,
  UserStatus,
  PaginatedResult,
  PermissionDefinition,
} from '@/types';
import {
  Card,
  Button,
  Input,
  Select,
  StatusBadge,
  Modal,
  Skeleton,
  EmptyState,
  SearchInput,
} from '@/components/ui';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [permDefs, setPermDefs] = useState<PermissionDefinition[]>([]);
  const [roleDefaults, setRoleDefaults] = useState<Record<string, string[]>>({});

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'STAFF' as Role,
  });

  // Employee Access Control Modal
  const [accessTarget, setAccessTarget] = useState<User | null>(null);
  const [draftEnabled, setDraftEnabled] = useState<Set<string>>(new Set());
  const [savingAccess, setSavingAccess] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await apiFetch<PaginatedResult<User>>(
        `/users?${params.toString()}`,
      );
      setUsers(res?.items || []);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, showToast]);

  const loadPermissionCatalog = useCallback(async () => {
    try {
      const catalog = await apiFetch<{
        definitions: PermissionDefinition[];
        defaults: Record<string, string[]>;
      }>('/users/permissions/catalog');
      setPermDefs(catalog?.definitions || []);
      setRoleDefaults(catalog?.defaults || {});
    } catch {
      // ignore if user lacks catalog access
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadPermissionCatalog();
  }, [loadUsers, loadPermissionCatalog]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      showToast('success', 'User account created and audit-logged.');
      setCreateOpen(false);
      loadUsers();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (id: string, role: Role) => {
    try {
      await apiFetch(`/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      showToast('success', `Role updated to ${role}.`);
      loadUsers();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  const handleStatusChange = async (id: string, status: UserStatus) => {
    try {
      await apiFetch(`/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showToast('success', `Account status updated to ${status}.`);
      loadUsers();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  const openAccessEditor = (u: User) => {
    setAccessTarget(u);
    const currentEffective =
      Array.isArray(u.permissions) && u.permissions.length > 0
        ? u.permissions
        : roleDefaults[u.role] || [];
    setDraftEnabled(new Set(currentEffective));
  };

  const toggleModuleAccess = (permKey: string, allow: boolean) => {
    setDraftEnabled((prev) => {
      const next = new Set(prev);
      if (allow) next.add(permKey);
      else next.delete(permKey);
      return next;
    });
  };

  const handleSavePermissions = async (resetToDefault = false) => {
    if (!accessTarget) return;
    setSavingAccess(true);
    try {
      const defaultsForRole = new Set(roleDefaults[accessTarget.role] || []);
      const granted = resetToDefault
        ? []
        : Array.from(draftEnabled).filter((k) => !defaultsForRole.has(k));
      const revoked = resetToDefault
        ? []
        : Array.from(defaultsForRole).filter((k) => !draftEnabled.has(k));

      await apiFetch(`/users/${accessTarget.id}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify(
          resetToDefault ? { reset: true } : { granted, revoked },
        ),
      });

      showToast(
        'success',
        resetToDefault
          ? `Reset ${accessTarget.fullName}'s access back to ${accessTarget.role} defaults.`
          : `Updated module access for ${accessTarget.fullName} (+${granted.length} expanded, -${revoked.length} restricted).`,
      );
      setAccessTarget(null);
      loadUsers();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setSavingAccess(false);
    }
  };

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const canManageEmployeeAccess = (target: User): boolean => {
    if (!currentUser || target.id === currentUser.id) return false;
    if (target.role === 'SUPER_ADMIN' || target.role === 'MEMBER') return false;
    if (target.role === 'ADMIN') return isSuperAdmin;
    return true;
  };

  const categories: PermissionDefinition['category'][] = [
    'Operations',
    'Biometrics & Access',
    'Content & Website',
    'Administration',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Users &amp; Employee Access
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">
              RBAC Governance, Employee Module Expansion &amp; Restriction
            </span>
          </p>
        </div>
        {isSuperAdmin && (
          <Button
            onClick={() => {
              setForm({
                fullName: '',
                email: '',
                phone: '',
                password: '',
                role: 'STAFF',
              });
              setCreateOpen(true);
            }}
          >
            <Plus className="w-4 h-4" /> Provision Staff / Admin User
          </Button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Loaded Accounts</p>
            <p className="text-2xl font-bold text-white font-mono mt-0.5">{users.length}</p>
          </div>
          <UserCog className="w-5 h-5 text-[#C7F464]" />
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Custom Access Overrides</p>
            <p className="text-2xl font-bold text-[#C7F464] font-mono mt-0.5">
              {
                users.filter(
                  (u) =>
                    (u.permissionsConfig?.granted?.length || 0) > 0 ||
                    (u.permissionsConfig?.revoked?.length || 0) > 0,
                ).length
              }
            </p>
          </div>
          <Sliders className="w-5 h-5 text-[#C7F464]" />
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Pending Approval</p>
            <p className="text-2xl font-bold text-amber-400 font-mono mt-0.5">
              {users.filter((u) => u.status === 'PENDING_APPROVAL').length}
            </p>
          </div>
          <span className="text-xs font-mono text-amber-400">REVIEW</span>
        </div>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, email, or phone..."
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            options={[
              { value: '', label: 'All Roles' },
              { value: 'SUPER_ADMIN', label: 'SUPER_ADMIN' },
              { value: 'ADMIN', label: 'ADMIN' },
              { value: 'STAFF', label: 'STAFF' },
              { value: 'TRAINER', label: 'TRAINER' },
              { value: 'MEMBER', label: 'MEMBER' },
            ]}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          />
        </div>
      </Card>

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : users.length === 0 ? (
        <EmptyState
          icon={<UserCog className="w-6 h-6" />}
          title="No Users Found"
          description="No user accounts match the current filter."
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#303030] bg-[#171717] text-[11px] font-mono uppercase text-[#A1A1AA]">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role &amp; Module Access</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Last Login</th>
                  <th className="py-3.5 px-4 text-right">
                    Permissions &amp; Lifecycle
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#303030] text-sm">
                {users.map((u) => {
                  const grantedCount = u.permissionsConfig?.granted?.length || 0;
                  const revokedCount = u.permissionsConfig?.revoked?.length || 0;
                  const activeCount = u.permissions?.length ?? 0;
                  const totalModules = permDefs.length || 18;
                  const editable = canManageEmployeeAccess(u);

                  return (
                    <tr key={u.id} className="hover:bg-[#171717]/60">
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-white">
                          {u.fullName ||
                            `${u.firstName || ''} ${u.lastName || ''}`.trim()}
                        </p>
                        <p className="text-xs text-[#A1A1AA]">{u.email}</p>
                      </td>
                      <td className="py-3.5 px-4 space-y-1.5">
                        <div>
                          <StatusBadge status={u.role} />
                        </div>
                        {u.role === 'SUPER_ADMIN' ? (
                          <p className="text-[11px] font-mono text-[#C7F464]">
                            Unrestricted Owner Access
                          </p>
                        ) : u.role === 'MEMBER' ? (
                          <p className="text-[11px] font-mono text-[#A1A1AA]">
                            Member Self-Service Portal
                          </p>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                            <span className="px-2 py-0.5 rounded bg-[#171717] border border-[#2C2C2C] text-white">
                              {activeCount}/{totalModules} Modules
                            </span>
                            {grantedCount > 0 && (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                                +{grantedCount} Extra
                              </span>
                            )}
                            {revokedCount > 0 && (
                              <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-400">
                                -{revokedCount} Restricted
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#A1A1AA]">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleString()
                          : 'Never'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {editable && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAccessEditor(u)}
                              leftIcon={<Sliders className="w-3.5 h-3.5" />}
                            >
                              Manage Access
                            </Button>
                          )}
                          {isSuperAdmin && u.id !== currentUser?.id && (
                            <select
                              aria-label="Change user role"
                              className="bg-[#171717] border border-[#303030] rounded px-2 py-1 text-xs text-white font-mono"
                              value={u.role}
                              onChange={(e) =>
                                handleRoleChange(u.id, e.target.value as Role)
                              }
                            >
                              <option value="MEMBER">MEMBER</option>
                              <option value="TRAINER">TRAINER</option>
                              <option value="STAFF">STAFF</option>
                              <option value="ADMIN">ADMIN</option>
                              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            </select>
                          )}
                          {u.id !== currentUser?.id && (
                            <Button
                              size="sm"
                              variant={
                                u.status === 'ACTIVE' ? 'danger' : 'outline'
                              }
                              onClick={() =>
                                handleStatusChange(
                                  u.id,
                                  u.status === 'ACTIVE'
                                    ? 'DEACTIVATED'
                                    : 'ACTIVE',
                                )
                              }
                            >
                              {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Employee Access Matrix Modal */}
      <Modal
        isOpen={Boolean(accessTarget)}
        onClose={() => setAccessTarget(null)}
        title={
          accessTarget
            ? `Employee Access Matrix — ${accessTarget.fullName || accessTarget.email}`
            : 'Employee Access Matrix'
        }
        size="xl"
      >
        {accessTarget && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-[#171717] border border-[#2C2C2C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={accessTarget.role} />
                  <span className="text-xs font-mono text-[#A1A1AA]">
                    {draftEnabled.size} / {permDefs.length} Modules Enabled
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA]">
                  Expand permissions beyond the {accessTarget.role} role default or restrict default access anytime. Changes enforce across both API routes &amp; Admin sidebar.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setDraftEnabled(new Set(permDefs.map((d) => d.key)))
                  }
                >
                  Grant All
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setDraftEnabled(new Set(['overview']))}
                >
                  Minimal Only
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSavePermissions(true)}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Reset Defaults
                </Button>
              </div>
            </div>

            <div className="max-h-[56vh] overflow-y-auto pr-1 space-y-5">
              {categories.map((cat) => {
                const items = permDefs.filter((d) => d.category === cat);
                if (items.length === 0) return null;
                const defaultSet = new Set(roleDefaults[accessTarget.role] || []);

                return (
                  <div key={cat} className="space-y-2.5">
                    <h3 className="text-xs font-mono uppercase tracking-[0.16em] text-[#C7F464]">
                      {cat}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {items.map((def) => {
                        const isEnabled = draftEnabled.has(def.key);
                        const isDefault = defaultSet.has(def.key);
                        const isExpanded = isEnabled && !isDefault;
                        const isRestricted = !isEnabled && isDefault;

                        return (
                          <div
                            key={def.key}
                            className={`p-3.5 rounded-xl border transition-colors flex flex-col justify-between gap-3 ${
                              isExpanded
                                ? 'bg-[#171717] border-emerald-500/40'
                                : isRestricted
                                  ? 'bg-[#171717] border-rose-500/40'
                                  : 'bg-[#141414] border-[#2C2C2C]'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-white">
                                  {def.label}
                                </span>
                                {isExpanded ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    <ShieldCheck className="w-3 h-3" /> Expanded
                                  </span>
                                ) : isRestricted ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                    <ShieldAlert className="w-3 h-3" /> Restricted
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                                    {isDefault ? 'Role Default: On' : 'Role Default: Off'}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                                {def.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => toggleModuleAccess(def.key, true)}
                                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-mono uppercase flex items-center justify-center gap-1.5 border transition-all ${
                                  isEnabled
                                    ? 'bg-[#C7F464] text-[#090909] border-[#C7F464] font-bold'
                                    : 'bg-[#171717] text-[#A1A1AA] border-[#2C2C2C] hover:text-white'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" /> Allow
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleModuleAccess(def.key, false)}
                                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-mono uppercase flex items-center justify-center gap-1.5 border transition-all ${
                                  !isEnabled
                                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-bold'
                                    : 'bg-[#171717] text-[#A1A1AA] border-[#2C2C2C] hover:text-white'
                                }`}
                              >
                                <Ban className="w-3.5 h-3.5" /> Restrict
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2C2C2C]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAccessTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                isLoading={savingAccess}
                onClick={() => handleSavePermissions(false)}
              >
                Save Employee Permissions
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Provision Platform User (SUPER_ADMIN)"
        description="Create an operational account and assign its role tier. Fine-grained module overrides can be customized after creation."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateUser} className="space-y-5">
          {/* Live User Account Preview */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#C7F464]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#C7F464] text-[#090909] font-display text-lg flex items-center justify-center shrink-0">
                {(form.fullName || 'U')
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#C7F464]">
                  NEW PLATFORM ACCOUNT
                </p>
                <p className="text-sm font-bold text-white truncate">
                  {form.fullName || 'New Employee / Admin'}
                </p>
                <p className="text-xs font-mono text-[#A1A1AA] truncate">
                  {form.email || 'email@iconfitnessgym.com'} •{' '}
                  {form.phone || '+88017...'}
                </p>
              </div>
            </div>
            <StatusBadge status={form.role} />
          </div>

          <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-4">
            <Input
              label="Full Name *"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Mahmudul Hasan"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address *"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="staff@iconfitnessgym.com"
              />
              <Input
                label="Phone Number *"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+88017..."
              />
            </div>
            <Input
              label="Initial Password *"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Minimum 8 characters"
            />
          </div>

          {/* Interactive Role Selector Cards */}
          <div className="space-y-2">
            <span className="block text-xs font-mono font-semibold uppercase tracking-wider text-white">
              Assigned Role Tier *
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(
                [
                  {
                    value: 'STAFF',
                    title: 'STAFF — Front Desk',
                    sub: 'Members, check-ins, store counter & inquiries',
                  },
                  {
                    value: 'ADMIN',
                    title: 'ADMIN — Branch Manager',
                    sub: 'Payments, HRM, CRM, reports, CMS & staff permissions',
                  },
                  {
                    value: 'TRAINER',
                    title: 'TRAINER — Floor Coach',
                    sub: 'Assigned members, workouts & schedule portal',
                  },
                  {
                    value: 'SUPER_ADMIN',
                    title: 'SUPER ADMIN — Owner',
                    sub: 'Unrestricted access to all system & security tools',
                  },
                ] as Array<{ value: Role; title: string; sub: string }>
              ).map((r) => {
                const active = form.role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.value })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      active
                        ? 'bg-[#1B2210] border-[#C7F464]'
                        : 'bg-[#141414] border-[#2C2C2C] hover:border-[#C7F464]/50'
                    }`}
                  >
                    <p className="text-xs font-bold text-white">{r.title}</p>
                    <p className="text-[11px] font-mono text-[#A1A1AA] mt-0.5 leading-snug">
                      {r.sub}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#2C2C2C]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="ifg-btn-primary"
              isLoading={creating}
            >
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  UserPlus,
  Eye,
  Edit3,
  Search,
  Calendar,
  CheckCircle2,
  X,
  ChevronRight,
  Camera,
  ScanFace,
  Phone,
  Mail,
  MapPin,
  Dumbbell,
  CreditCard,
  ShieldCheck,
  HeartPulse,
  Maximize2,
  Clock,
  Users,
} from 'lucide-react';
import { apiFetch, formatBdt, formatDate, computePlanPricing } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Card,
  Button,
  StatusBadge,
  Pagination,
  Modal,
  Input,
  Skeleton,
  EmptyState,
} from '@/components/ui';

const FITNESS_GOALS = [
  { value: 'FITNESS_IMPROVEMENT', label: 'Fitness Improvement' },
  { value: 'MUSCLE_BUILDING', label: 'Muscle Building' },
  { value: 'FAT_LOSS', label: 'Fat Loss & Conditioning' },
  { value: 'ATHLETIC_PERFORMANCE', label: 'Athletic Performance' },
  { value: 'GENERAL_WELLNESS', label: 'General Wellness' },
];

function formatGoalLabel(goal?: string | null): string {
  if (!goal) return 'Fitness Improvement';
  const match = FITNESS_GOALS.find((g) => g.value === goal);
  if (match) return match.label;
  return goal
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function compressMemberPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read selected photo.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.onload = () => {
        const maxDim = 512;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminMembersPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Custom search & Monthly join filter state
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [joinMonth, setJoinMonth] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailMember, setDetailMember] = useState<any | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; caption: string } | null>(null);
  const [editMember, setEditMember] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    assignedTrainerId: '',
    status: 'ACTIVE',
    fitnessGoal: 'FITNESS_IMPROVEMENT',
    gender: 'MALE',
    bloodGroup: '',
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalConditions: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: 'Member@1234',
    avatarUrl: '',
    gender: 'MALE',
    bloodGroup: '',
    fitnessGoal: 'FITNESS_IMPROVEMENT',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    assignedTrainerId: '',
    notes: '',
  });

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: '10',
      });
      if (appliedSearch.trim()) qs.set('search', appliedSearch.trim());
      if (joinMonth) qs.set('joinMonth', joinMonth);
      if (paymentFilter) qs.set('paymentStatus', paymentFilter);

      const [res, trainersRes] = await Promise.all([
        apiFetch<any>(`/members?${qs.toString()}`),
        apiFetch<any[]>('/trainers').catch(() => []),
      ]);
      setItems(res.items || []);
      setTotalPages(res.meta?.totalPages || 1);
      setTotalCount(res.meta?.total || 0);
      setTrainers(trainersRes);
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch, joinMonth, paymentFilter]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput);
  };

  const handleQuickMonth = (offsetMonths: number) => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setPage(1);
    setJoinMonth(ym);
  };

  const resetCreateForm = () => {
    setForm({
      fullName: '',
      email: '',
      phone: '',
      password: 'Member@1234',
      avatarUrl: '',
      gender: 'MALE',
      bloodGroup: '',
      fitnessGoal: 'FITNESS_IMPROVEMENT',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      assignedTrainerId: '',
      notes: '',
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload a PNG, JPG, or WebP member photo.',
        variant: 'error',
      });
      return;
    }
    try {
      const compressed = await compressMemberPhoto(file);
      setForm((prev) => ({ ...prev, avatarUrl: compressed }));
    } catch (err: any) {
      toast({
        title: 'Photo Error',
        description: err.message,
        variant: 'error',
      });
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/members', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          assignedTrainerId: form.assignedTrainerId || undefined,
          avatarUrl: form.avatarUrl || undefined,
          bloodGroup: form.bloodGroup || undefined,
          emergencyContactName: form.emergencyContactName || undefined,
          emergencyContactPhone: form.emergencyContactPhone || undefined,
          notes: form.notes || undefined,
        }),
      });
      toast({
        title: 'Member Registered & Activated',
        variant: 'success',
      });
      setCreateModalOpen(false);
      resetCreateForm();
      await loadMembers();
    } catch (err: any) {
      toast({
        title: 'Error Creating Member',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInspectMember = async (rowMember: any) => {
    setDetailMember(rowMember);
    setInspectLoading(true);
    try {
      const full = await apiFetch(`/members/${rowMember.id}`);
      setDetailMember(full);
    } catch (err: any) {
      toast({
        title: 'Failed to load full member record',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setInspectLoading(false);
    }
  };

  const handleSaveTrainerEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMember) return;
    setSavingEdit(true);
    try {
      await apiFetch(`/members/${editMember.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: editForm.fullName.trim() || undefined,
          assignedTrainerId: editForm.assignedTrainerId || null,
          status: editForm.status,
          fitnessGoal: editForm.fitnessGoal,
          gender: editForm.gender || undefined,
          bloodGroup: editForm.bloodGroup.trim(),
          phone: editForm.phone.trim() || undefined,
          address: editForm.address.trim(),
          emergencyContactName: editForm.emergencyContactName.trim(),
          emergencyContactPhone: editForm.emergencyContactPhone.trim(),
          medicalConditions: editForm.medicalConditions.trim(),
          notes: editForm.notes.trim(),
        }),
      });
      toast({ title: 'Member Record Updated', variant: 'success' });
      setEditMember(null);
      await loadMembers();
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleApproveMember = async (id: string) => {
    try {
      await apiFetch(`/members/${id}/approve`, { method: 'PATCH' });
      toast({ title: 'Registration Approved', variant: 'success' });
      await loadMembers();
    } catch (err: any) {
      toast({
        title: 'Approval Failed',
        description: err.message,
        variant: 'error',
      });
    }
  };

  const startRange = totalCount === 0 ? 0 : (page - 1) * 10 + 1;
  const endRange = Math.min(page * 10, totalCount);

  return (
    <div className="space-y-6">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Member List
          </h1>
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#A1A1AA] mt-1">
            <span>Member</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#C7F464]">Member List</span>
          </div>
        </div>
        <Button
          variant="primary"
          size="md"
          className="ifg-btn-primary rounded-xl"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setCreateModalOpen(true)}
        >
          Add Member
        </Button>
      </div>

      {/* Filter & Custom Search Toolbar */}
      <Card className="p-4 sm:p-5 rounded-3xl border border-[#2C2C2C] space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Custom Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-1 items-center gap-2 max-w-xl"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  if (e.target.value === '') {
                    setPage(1);
                    setAppliedSearch('');
                  }
                }}
                placeholder="Search by name, member ID, email, or phone..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#141414] border border-[#2C2C2C] text-sm text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#C7F464]"
              />
            </div>
            <Button type="submit" variant="secondary" size="md" className="rounded-xl shrink-0">
              Search
            </Button>
          </form>

          {/* Joining Month Filter + Payment Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 h-10 rounded-xl bg-[#141414] border border-[#2C2C2C]">
              <Calendar className="w-4 h-4 text-[#C7F464] shrink-0" />
              <span className="text-xs font-mono text-[#A1A1AA] hidden sm:inline">
                Join Month:
              </span>
              <input
                type="month"
                value={joinMonth}
                onChange={(e) => {
                  setPage(1);
                  setJoinMonth(e.target.value);
                }}
                aria-label="Filter by Joining Month"
                className="bg-transparent text-xs font-mono text-white focus:outline-none"
              />
              {joinMonth && (
                <button
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setJoinMonth('');
                  }}
                  title="Clear month filter"
                  className="p-0.5 rounded text-[#A1A1AA] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={paymentFilter}
              onChange={(e) => {
                setPage(1);
                setPaymentFilter(e.target.value);
              }}
              aria-label="Filter by Payment Status"
              className="h-10 px-3 rounded-xl bg-[#141414] border border-[#2C2C2C] text-xs font-mono text-white focus:outline-none focus:border-[#C7F464]"
            >
              <option value="">All Payment Status</option>
              <option value="PAID">Paid (Verified)</option>
              <option value="PENDING">Pending Approval</option>
              <option value="UNPAID">Unpaid / Due</option>
            </select>
          </div>
        </div>

        {/* Quick Month Selection Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono uppercase text-[11px] text-[#A1A1AA] mr-1">
            Quick Join Filter:
          </span>
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setJoinMonth('');
            }}
            className={`px-3 py-1 rounded-full font-mono text-[11px] border transition-colors ${
              joinMonth === ''
                ? 'bg-[#C7F464] text-[#090909] border-[#C7F464] font-bold'
                : 'bg-[#141414] border-[#2C2C2C] text-[#A1A1AA] hover:text-white'
            }`}
          >
            All Months
          </button>
          <button
            type="button"
            onClick={() => handleQuickMonth(0)}
            className="px-3 py-1 rounded-full font-mono text-[11px] bg-[#141414] border border-[#2C2C2C] text-[#A1A1AA] hover:border-[#C7F464] hover:text-white transition-colors"
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => handleQuickMonth(-1)}
            className="px-3 py-1 rounded-full font-mono text-[11px] bg-[#141414] border border-[#2C2C2C] text-[#A1A1AA] hover:border-[#C7F464] hover:text-white transition-colors"
          >
            Last Month
          </button>
          {joinMonth && (
            <span className="ml-auto font-mono text-[11px] text-[#C7F464]">
              Filtering month: {joinMonth} ({totalCount} joined)
            </span>
          )}
        </div>
      </Card>

      {/* Member Table Card */}
      {loading ? (
        <Skeleton className="h-[460px] rounded-3xl" />
      ) : items.length === 0 ? (
        <EmptyState
          title="No Matching Members Found"
          description={
            joinMonth || appliedSearch
              ? 'No members matched your selected joining month or custom search query.'
              : 'No members registered yet.'
          }
          action={
            (joinMonth || appliedSearch || paymentFilter) && (
              <Button
                variant="secondary"
                onClick={() => {
                  setPage(1);
                  setJoinMonth('');
                  setSearchInput('');
                  setAppliedSearch('');
                  setPaymentFilter('');
                }}
              >
                Reset All Filters
              </Button>
            )
          }
        />
      ) : (
        <Card className="p-0 overflow-hidden rounded-3xl border border-[#2C2C2C]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#262626] bg-[#141414] text-[11px] font-mono uppercase text-[#A1A1AA]">
                  <th className="py-3.5 px-4">Photo</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Member ID</th>
                  <th className="py-3.5 px-4">Package</th>
                  <th className="py-3.5 px-4">Joining Date</th>
                  <th className="py-3.5 px-4">Expire Date</th>
                  <th className="py-3.5 px-4">Paid</th>
                  <th className="py-3.5 px-4">Due</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {items.map((m) => {
                  const latestSub = m.memberships?.[0];
                  const payments = m.payments || [];
                  const paidTotal = payments
                    .filter((p: any) => p.status === 'VERIFIED_PAID')
                    .reduce((acc: number, p: any) => acc + Number(p.netAmountBdt || 0), 0);
                  const pendingTotal = payments
                    .filter((p: any) => p.status === 'PENDING')
                    .reduce((acc: number, p: any) => acc + Number(p.netAmountBdt || 0), 0);
                  const dueAmount =
                    pendingTotal > 0
                      ? pendingTotal
                      : paidTotal === 0 && latestSub?.plan?.priceBdt
                      ? computePlanPricing(latestSub.plan).netFirstTotal
                      : 0;

                  const payBadge =
                    paidTotal > 0 && pendingTotal === 0
                      ? 'Paid'
                      : pendingTotal > 0
                      ? 'Pending'
                      : 'Not Paid';

                  const initials = (m.user?.fullName || 'M')
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-[#171717]/60 transition-colors"
                    >
                      <td className="py-3 px-4">
                        {m.user?.avatarUrl ? (
                          <img
                            src={m.user.avatarUrl}
                            alt={m.user.fullName}
                            className="w-9 h-9 rounded-lg object-cover border border-[#303030]"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-[#C7F464]/15 border border-[#C7F464]/35 flex items-center justify-center font-mono text-xs font-bold text-[#C7F464]">
                            {initials}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-white whitespace-nowrap">
                          {m.user?.fullName}
                        </p>
                        <p className="text-[11px] text-[#A1A1AA] whitespace-nowrap">
                          {m.user?.phone || m.user?.email}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-[#C7F464] whitespace-nowrap">
                        {m.memberCode}
                      </td>
                      <td className="py-3 px-4 text-xs text-white whitespace-nowrap">
                        {latestSub?.plan?.name?.replace(/\s*\(Configurable Tier\)/gi, '') ||
                          'No Plan Yet'}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-[#A1A1AA] whitespace-nowrap">
                        {formatDate(m.joinedAt || m.createdAt)}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-[#A1A1AA] whitespace-nowrap">
                        {latestSub?.endDate ? formatDate(latestSub.endDate) : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-emerald-400 whitespace-nowrap">
                        {formatBdt(paidTotal)}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-amber-400 whitespace-nowrap">
                        {formatBdt(dueAmount)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                            payBadge === 'Paid'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : payBadge === 'Pending'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {payBadge}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleInspectMember(m)}
                            title="View Full Member 360° Record & Photo"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-mono font-semibold transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditMember(m);
                              setEditForm({
                                fullName: m.user?.fullName || '',
                                assignedTrainerId: m.assignedTrainerId || '',
                                status: m.user?.status || 'ACTIVE',
                                fitnessGoal: m.fitnessGoal || 'FITNESS_IMPROVEMENT',
                                gender: m.gender || 'MALE',
                                bloodGroup: m.bloodGroup || '',
                                phone: m.user?.phone || '',
                                address: m.address || '',
                                emergencyContactName: m.emergencyContactName || '',
                                emergencyContactPhone: m.emergencyContactPhone || '',
                                medicalConditions: m.medicalConditions || '',
                                notes: m.notes || '',
                              });
                            }}
                            title="Edit Member Profile, Goal & Coach"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#C7F464] !text-[#090909] hover:bg-[#d5fb76] text-xs font-mono font-bold shadow-xs transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          {m.user?.status === 'PENDING_APPROVAL' && (
                            <button
                              type="button"
                              onClick={() => handleApproveMember(m.id)}
                              title="Approve Registration"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#1B2210] border border-[#C7F464]/45 text-[#C7F464] hover:bg-[#C7F464] hover:text-[#090909] text-xs font-mono font-bold transition-all"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 border-t border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-mono text-[#A1A1AA]">
              Showing {startRange}–{endRange} from {totalCount}
            </span>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </Card>
      )}

      {/* =====================================================================
          CREATE WALK-IN MEMBER MODAL (REDESIGNED EXECUTIVE ENROLLMENT)
          ===================================================================== */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Register New Member"
        description="Front Desk & Admin walk-in onboarding with instant member ID generation"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateMember} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          {/* Top Identity & Photo Upload Card */}
          <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl bg-[#141414] border border-[#2C2C2C] overflow-hidden flex items-center justify-center shrink-0">
                {form.avatarUrl ? (
                  <img
                    src={form.avatarUrl}
                    alt="Member preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#A1A1AA]">
                    <Camera className="w-6 h-6 text-[#C7F464]" />
                    <span className="text-[10px] font-mono mt-1">Photo</span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-white">
                  Member Profile Photo
                </p>
                <p className="text-[11px] text-[#A1A1AA]">
                  Optional passport / front-desk portrait (JPG, PNG, WebP)
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B2210] border border-[#C7F464]/40 text-[11px] font-mono font-semibold text-[#C7F464] hover:border-[#C7F464] cursor-pointer transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                    {form.avatarUrl ? 'Change Photo' : 'Upload Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {form.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, avatarUrl: '' }))}
                      className="px-2.5 py-1.5 rounded-xl bg-[#141414] border border-[#2C2C2C] text-[11px] font-mono text-rose-400 hover:border-rose-400 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Account & Contact */}
          <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#2C2C2C]">
              <Users className="w-4 h-4 text-[#C7F464]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Primary Account &amp; Contact
              </span>
            </div>

            <Input
              label="Full Name *"
              placeholder="e.g. Tanvir Ahmed"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address *"
                type="email"
                placeholder="member@example.com"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                label="Phone Number *"
                placeholder="+88017XXXXXXXX"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Initial Portal Password *"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <Input
                label="Blood Group"
                placeholder="e.g. O+, A+, B+"
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
              />
            </div>
          </div>

          {/* Section 2: Training Preferences & Emergency */}
          <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#2C2C2C]">
              <Dumbbell className="w-4 h-4 text-[#C7F464]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Training Profile, Coach &amp; Emergency Contact
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                  Gender
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl bg-[#141414] border border-[#2C2C2C] text-sm text-white focus:outline-none focus:border-[#C7F464]"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer Not to Say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                  Fitness Goal
                </label>
                <select
                  value={form.fitnessGoal}
                  onChange={(e) => setForm({ ...form, fitnessGoal: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl bg-[#141414] border border-[#2C2C2C] text-sm text-white focus:outline-none focus:border-[#C7F464]"
                >
                  {FITNESS_GOALS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                  Assigned Coach
                </label>
                <select
                  value={form.assignedTrainerId}
                  onChange={(e) => setForm({ ...form, assignedTrainerId: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl bg-[#141414] border border-[#2C2C2C] text-sm text-white focus:outline-none focus:border-[#C7F464]"
                >
                  <option value="">Unassigned</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user?.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Home Address (Ashkona / Dhaka)"
              placeholder="House / Road / Sector, Ashkona, Dakshinkhan, Dhaka"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Emergency Contact Name"
                placeholder="Guardian or family contact"
                value={form.emergencyContactName}
                onChange={(e) =>
                  setForm({ ...form, emergencyContactName: e.target.value })
                }
              />
              <Input
                label="Emergency Contact Phone"
                placeholder="+8801XXXXXXXXX"
                value={form.emergencyContactPhone}
                onChange={(e) =>
                  setForm({ ...form, emergencyContactPhone: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                Front Desk Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any medical precautions, preferred training slot, or walk-in remarks..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-[#2C2C2C] text-sm text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#C7F464]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="ifg-btn-primary"
              leftIcon={<UserPlus className="w-4 h-4" />}
              isLoading={submitting}
            >
              Register &amp; Activate Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* =====================================================================
          EDIT MEMBER & ASSIGNED COACH MODAL (REDESIGNED)
          ===================================================================== */}
      <Modal
        isOpen={Boolean(editMember)}
        onClose={() => setEditMember(null)}
        title="Edit Member Profile"
        description={`Update identity, account status, training coach & safety info • ${editMember?.memberCode || ''}`}
        maxWidth="max-w-2xl"
      >
        {editMember && (
          <form onSubmit={handleSaveTrainerEdit} className="space-y-5">
            {/* Hero Identity Preview Card */}
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#C7F464]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                {editMember.user?.avatarUrl ? (
                  <img
                    src={editMember.user.avatarUrl}
                    alt={editForm.fullName || editMember.user.fullName}
                    className="w-12 h-12 rounded-xl object-cover border border-[#C7F464]/50 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#C7F464] text-[#090909] font-display text-lg flex items-center justify-center shrink-0">
                    {(editForm.fullName || editMember.user?.fullName || 'M')
                      .split(' ')
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#C7F464]">
                    {editMember.memberCode} • {editForm.gender}
                  </p>
                  <p className="text-base font-bold text-white truncate">
                    {editForm.fullName || editMember.user?.fullName}
                  </p>
                  <p className="text-xs font-mono text-[#A1A1AA] truncate">
                    {editMember.user?.email}
                  </p>
                </div>
              </div>
              <StatusBadge status={editForm.status || 'ACTIVE'} />
            </div>

            {/* Account Status Interactive Selector */}
            <div className="space-y-2">
              <span className="block text-xs font-mono font-semibold uppercase tracking-wider text-white">
                Account Status *
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: 'ACTIVE', label: 'Active', tone: 'emerald' },
                  { value: 'PENDING_APPROVAL', label: 'Pending', tone: 'amber' },
                  { value: 'SUSPENDED', label: 'Suspended', tone: 'rose' },
                  { value: 'DEACTIVATED', label: 'Deactivated', tone: 'slate' },
                ].map((opt) => {
                  const selected = editForm.status === opt.value;
                  const activeCls =
                    opt.tone === 'emerald'
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-400'
                      : opt.tone === 'amber'
                      ? 'bg-amber-500/15 border-amber-500/60 text-amber-400'
                      : opt.tone === 'rose'
                      ? 'bg-rose-500/15 border-rose-500/60 text-rose-400'
                      : 'bg-[#1B2210] border-[#C7F464] text-[#C7F464]';
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setEditForm({ ...editForm, status: opt.value })
                      }
                      className={`px-3 py-2.5 rounded-xl border text-xs font-mono font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all ${
                        selected
                          ? activeCls
                          : 'bg-[#141414] border-[#2C2C2C] text-[#A1A1AA] hover:border-[#C7F464]/50'
                      }`}
                    >
                      {selected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 1: Identity & Contact */}
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-white">
                <Users className="w-3.5 h-3.5 text-[#C7F464]" />
                Identity &amp; Contact Information
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  required
                  value={editForm.fullName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, fullName: e.target.value })
                  }
                  placeholder="Member full name"
                />
                <Input
                  label="Phone Number *"
                  required
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  placeholder="017..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                    Gender
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['MALE', 'FEMALE', 'OTHER'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, gender: g })}
                        className={`h-11 rounded-xl border text-xs font-mono font-bold uppercase transition-colors ${
                          editForm.gender === g
                            ? 'bg-[#C7F464] border-[#C7F464] !text-[#090909]'
                            : 'bg-[#171717] border-[#2C2C2C] text-[#A1A1AA] hover:border-[#C7F464]/50'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                    Blood Group
                  </label>
                  <select
                    value={editForm.bloodGroup}
                    onChange={(e) =>
                      setEditForm({ ...editForm, bloodGroup: e.target.value })
                    }
                    className="w-full h-11 px-3 rounded-xl bg-[#171717] border border-[#2C2C2C] text-sm text-white focus:outline-none focus:border-[#C7F464]"
                  >
                    <option value="">Not Specified</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(
                      (bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono uppercase text-[#A1A1AA]">
                    Address
                  </label>
                  {editForm.address && (
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, address: '' })}
                      className="text-[11px] font-mono text-rose-400 hover:underline"
                    >
                      Clear Address
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                  placeholder="House, Road, Ashkona, Dakshinkhan, Dhaka-1230"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#171717] border border-[#2C2C2C] text-sm text-white break-words focus:outline-none focus:border-[#C7F464]"
                />
              </div>
            </div>

            {/* Section 2: Coaching & Fitness Goal */}
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-white">
                <Dumbbell className="w-3.5 h-3.5 text-[#C7F464]" />
                Coaching &amp; Training Goal
              </span>

              <div>
                <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                  Assigned Coach / Trainer
                </label>
                <select
                  value={editForm.assignedTrainerId}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      assignedTrainerId: e.target.value,
                    })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-[#171717] border border-[#2C2C2C] text-sm text-white focus:outline-none focus:border-[#C7F464]"
                >
                  <option value="">Unassigned (General Floor Guidance)</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user?.fullName}
                      {t.specialization ? ` — ${t.specialization}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase text-[#A1A1AA]">
                  Fitness Goal
                </label>
                <div className="flex flex-wrap gap-2">
                  {FITNESS_GOALS.map((g) => {
                    const active = editForm.fitnessGoal === g.value;
                    return (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() =>
                          setEditForm({ ...editForm, fitnessGoal: g.value })
                        }
                        className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all ${
                          active
                            ? 'bg-[#C7F464] border-[#C7F464] !text-[#090909] font-bold'
                            : 'bg-[#171717] border-[#2C2C2C] text-[#A1A1AA] hover:border-[#C7F464]/50'
                        }`}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 3: Emergency Contact & Staff Notes */}
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-white">
                <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                Emergency Contact &amp; Staff Notes
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Emergency Contact Name"
                  value={editForm.emergencyContactName}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      emergencyContactName: e.target.value,
                    })
                  }
                  placeholder="Guardian / Spouse name"
                />
                <Input
                  label="Emergency Contact Phone"
                  value={editForm.emergencyContactPhone}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      emergencyContactPhone: e.target.value,
                    })
                  }
                  placeholder="017..."
                />
              </div>

              <Input
                label="Medical Conditions (Optional)"
                value={editForm.medicalConditions}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    medicalConditions: e.target.value,
                  })
                }
                placeholder="Any injury, blood pressure, asthma, or knee notes..."
              />

              <div>
                <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                  Staff Notes
                </label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                  placeholder="Front desk remarks, preferred workout window, or locker note..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#171717] border border-[#2C2C2C] text-sm text-white focus:outline-none focus:border-[#C7F464]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#2C2C2C]">
              <span className="text-xs font-mono text-[#A1A1AA]">
                Status: <strong className="text-white">{editForm.status}</strong> •{' '}
                {formatGoalLabel(editForm.fitnessGoal)}
              </span>
              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditMember(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="ifg-btn-primary"
                  isLoading={savingEdit}
                >
                  Save Member Changes
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* =====================================================================
          MEMBER 360° RECORD MODAL (EYE BUTTON — FULL DETAILS + IMAGES)
          ===================================================================== */}
      <Modal
        isOpen={Boolean(detailMember)}
        onClose={() => setDetailMember(null)}
        title={`Member 360° Record — ${detailMember?.user?.fullName || ''}`}
        description={`Member Code: ${detailMember?.memberCode || ''}`}
        maxWidth="max-w-4xl"
      >
        {detailMember && (() => {
          const profilePhoto = detailMember.user?.avatarUrl || '';
          const biometricPhoto = detailMember.biometricEnrollment?.recentPhotoDataUrl || '';
          const primaryImage = profilePhoto || biometricPhoto;
          const initials = (detailMember.user?.fullName || 'M')
            .split(' ')
            .map((n: string) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

          const paymentsList: any[] = detailMember.payments || [];
          const paidSum = paymentsList
            .filter((p) => p.status === 'VERIFIED_PAID')
            .reduce((sum, p) => sum + Number(p.netAmountBdt || 0), 0);
          const pendingSum = paymentsList
            .filter((p) => p.status === 'PENDING')
            .reduce((sum, p) => sum + Number(p.netAmountBdt || 0), 0);
          const membershipsList: any[] = detailMember.memberships || [];
          const bookingsList: any[] = detailMember.bookings || [];
          const accessList: any[] = detailMember.accessEvents || [];

          return (
            <div className="space-y-5 text-sm max-h-[75vh] overflow-y-auto pr-1">
              {/* Hero Photo + Identity Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#171717] border border-[#2C2C2C] flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
                  {/* Main Member Portrait */}
                  <div className="relative group w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#141414] border-2 border-[#C7F464]/40 overflow-hidden flex items-center justify-center shrink-0">
                    {primaryImage ? (
                      <>
                        <img
                          src={primaryImage}
                          alt={detailMember.user?.fullName || 'Member Photo'}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setLightboxImage({
                              src: primaryImage,
                              caption: `${detailMember.user?.fullName || 'Member'} — Profile Portrait (${detailMember.memberCode})`,
                            })
                          }
                          title="View Full-Size Image"
                          className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                        >
                          <Maximize2 className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <span className="font-display text-3xl text-[#C7F464]">
                        {initials}
                      </span>
                    )}
                  </div>

                  {/* Member Identity Metadata */}
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                        {detailMember.user?.fullName}
                      </h3>
                      <StatusBadge status={detailMember.user?.status || 'ACTIVE'} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#1B2210] border border-[#C7F464]/30 font-mono font-bold text-[#C7F464]">
                        {detailMember.memberCode}
                      </span>
                      {detailMember.gender && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#141414] border border-[#2C2C2C] font-mono text-[#A1A1AA]">
                          {detailMember.gender}
                        </span>
                      )}
                      {detailMember.bloodGroup && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#141414] border border-[#2C2C2C] font-mono text-rose-400">
                          Blood: {detailMember.bloodGroup}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#A1A1AA]">
                      <span className="inline-flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-[#C7F464]" />
                        {detailMember.user?.phone || '—'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-[#C7F464]" />
                        {detailMember.user?.email || '—'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-[#C7F464]" />
                        Joined {formatDate(detailMember.joinedAt || detailMember.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Biometric Face ID Photo Card (if enrolled or side badge) */}
                <div className="p-3 rounded-xl bg-[#141414] border border-[#2C2C2C] flex items-center gap-3 shrink-0">
                  {biometricPhoto ? (
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxImage({
                          src: biometricPhoto,
                          caption: `${detailMember.user?.fullName || 'Member'} — Verified Face ID Biometric Snapshot`,
                        })
                      }
                      className="relative group w-16 h-16 rounded-xl overflow-hidden border border-[#C7F464]/40 shrink-0"
                      title="Enlarge Face ID Image"
                    >
                      <img
                        src={biometricPhoto}
                        alt="Face ID Enrollment"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-4 h-4" />
                      </span>
                    </button>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#1B2210] border border-[#C7F464]/30 flex items-center justify-center text-[#C7F464] shrink-0">
                      <ScanFace className="w-5 h-5" />
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA]">
                      Biometric Face ID
                    </p>
                    <p className="text-xs font-bold text-white">
                      {detailMember.biometricEnrollment?.status === 'ENROLLED'
                        ? 'Enrolled & Active'
                        : detailMember.biometricEnrollment?.status || 'Not Enrolled'}
                    </p>
                    {detailMember.biometricEnrollment?.qualityScore != null && (
                      <p className="text-[10px] font-mono text-emerald-400">
                        Quality: {Math.round(Number(detailMember.biometricEnrollment.qualityScore))}%
                        {detailMember.biometricEnrollment?.livenessVerified ? ' • Liveness OK' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {inspectLoading && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Skeleton className="h-16 rounded-xl" />
                  <Skeleton className="h-16 rounded-xl" />
                  <Skeleton className="h-16 rounded-xl" />
                  <Skeleton className="h-16 rounded-xl" />
                </div>
              )}

              {/* Financial & Activity KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#171717] border border-[#2C2C2C]">
                  <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                    Total Verified Paid
                  </p>
                  <p className="font-display text-xl text-emerald-400 mt-1">
                    {formatBdt(paidSum)}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#171717] border border-[#2C2C2C]">
                  <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                    Pending Payment
                  </p>
                  <p className="font-display text-xl text-amber-400 mt-1">
                    {formatBdt(pendingSum)}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#171717] border border-[#2C2C2C]">
                  <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                    Memberships
                  </p>
                  <p className="font-display text-xl text-[#C7F464] mt-1">
                    {membershipsList.length}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#171717] border border-[#2C2C2C]">
                  <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                    Bookings / Gate Scans
                  </p>
                  <p className="font-display text-xl text-white mt-1">
                    {bookingsList.length} / {accessList.length}
                  </p>
                </div>
              </div>

              {/* Complete Personal, Coaching & KYC Details Grid (Zero Overlapping) */}
              <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-3">
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#C7F464]">
                  Full Profile &amp; Emergency Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#141414] border border-[#2C2C2C]">
                    <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                      Fitness Goal
                    </span>
                    <span className="font-semibold text-white mt-0.5 block truncate">
                      {formatGoalLabel(detailMember.fitnessGoal)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#141414] border border-[#2C2C2C]">
                    <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                      Assigned Coach
                    </span>
                    <span className="font-semibold text-white mt-0.5 block truncate">
                      {detailMember.assignedTrainer?.user?.fullName || 'Unassigned'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#141414] border border-[#2C2C2C]">
                    <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                      Physical / DOB
                    </span>
                    <span className="font-semibold text-white mt-0.5 block truncate">
                      {detailMember.heightCm ? `${detailMember.heightCm} cm` : '—'} •{' '}
                      {detailMember.weightKg ? `${detailMember.weightKg} kg` : '—'}
                      {detailMember.dateOfBirth
                        ? ` • ${formatDate(detailMember.dateOfBirth)}`
                        : ''}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#141414] border border-[#2C2C2C] sm:col-span-2">
                    <span className="text-[10px] font-mono uppercase text-[#A1A1AA] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#C7F464]" />
                      Residential Address
                    </span>
                    <span className="font-medium text-white mt-0.5 block">
                      {detailMember.address || 'Ashkona / Dhaka (Not specified)'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#141414] border border-[#2C2C2C]">
                    <span className="text-[10px] font-mono uppercase text-[#A1A1AA] flex items-center gap-1">
                      <HeartPulse className="w-3 h-3 text-rose-400" />
                      Emergency Contact
                    </span>
                    <span className="font-medium text-white mt-0.5 block truncate">
                      {detailMember.emergencyContactName || 'Not provided'}
                      {detailMember.emergencyContactPhone
                        ? ` (${detailMember.emergencyContactPhone})`
                        : ''}
                    </span>
                  </div>
                </div>

                {(detailMember.nidNumber ||
                  detailMember.rfidCardNumber ||
                  detailMember.medicalConditions ||
                  detailMember.notes) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                    {(detailMember.nidNumber || detailMember.rfidCardNumber) && (
                      <div className="p-3 rounded-xl bg-[#141414] border border-[#2C2C2C]">
                        <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                          Identity &amp; Access Card
                        </span>
                        <span className="font-mono text-white mt-0.5 block">
                          {detailMember.nidNumber ? `NID: ${detailMember.nidNumber}` : ''}
                          {detailMember.nidNumber && detailMember.rfidCardNumber ? ' • ' : ''}
                          {detailMember.rfidCardNumber
                            ? `RFID: ${detailMember.rfidCardNumber}`
                            : ''}
                        </span>
                      </div>
                    )}
                    {(detailMember.medicalConditions || detailMember.notes) && (
                      <div className="p-3 rounded-xl bg-[#141414] border border-[#2C2C2C]">
                        <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
                          Medical / Front Desk Notes
                        </span>
                        <span className="text-white mt-0.5 block">
                          {detailMember.medicalConditions || detailMember.notes}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Membership & Payment History Two-Column */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold uppercase text-[#C7F464] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Membership History
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#141414] border border-[#2C2C2C] text-[#A1A1AA]">
                      {membershipsList.length}
                    </span>
                  </div>
                  {membershipsList.length === 0 ? (
                    <p className="text-xs text-[#A1A1AA] py-3">
                      No memberships subscribed yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {membershipsList.map((m: any) => (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">
                              {m.plan?.name}
                            </p>
                            <p className="text-[11px] font-mono text-[#A1A1AA]">
                              {formatDate(m.startDate)} → {formatDate(m.endDate)}
                            </p>
                          </div>
                          <StatusBadge status={m.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold uppercase text-[#C7F464] flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" />
                      Payment History
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#141414] border border-[#2C2C2C] text-[#A1A1AA]">
                      {paymentsList.length}
                    </span>
                  </div>
                  {paymentsList.length === 0 ? (
                    <p className="text-xs text-[#A1A1AA] py-3">
                      No payment records found.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {paymentsList.map((p: any) => (
                        <div
                          key={p.id}
                          className="p-3 rounded-xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="font-mono font-bold text-white">
                              {formatBdt(p.netAmountBdt)} ({p.paymentMethod})
                            </p>
                            <p className="text-[11px] text-[#A1A1AA] truncate">
                              Ref: {p.transactionReference || '—'} • Receipt:{' '}
                              {p.receipt?.receiptNumber || 'Pending'}
                            </p>
                          </div>
                          <StatusBadge status={p.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Class Bookings & Recent Gate Check-Ins */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold uppercase text-[#C7F464] flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      Class Booking History
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#141414] border border-[#2C2C2C] text-[#A1A1AA]">
                      {bookingsList.length}
                    </span>
                  </div>
                  {bookingsList.length === 0 ? (
                    <p className="text-xs text-[#A1A1AA] py-3">
                      No group class bookings yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {bookingsList.slice(0, 6).map((b: any) => (
                        <div
                          key={b.id}
                          className="p-3 rounded-xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-white font-semibold truncate">
                              {b.classSchedule?.gymClass?.title || 'Group Class'}
                            </p>
                            <p className="text-[11px] font-mono text-[#A1A1AA]">
                              Session: {formatDate(b.sessionDate)}
                            </p>
                          </div>
                          <StatusBadge status={b.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-[#171717] border border-[#2C2C2C] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold uppercase text-[#C7F464] flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Recent Turnstile Check-Ins
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#141414] border border-[#2C2C2C] text-[#A1A1AA]">
                      {accessList.length}
                    </span>
                  </div>
                  {accessList.length === 0 ? (
                    <p className="text-xs text-[#A1A1AA] py-3">
                      No turnstile entry logs recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {accessList.map((ev: any) => (
                        <div
                          key={ev.id}
                          className="p-3 rounded-xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">
                              {ev.verificationMethod?.replace(/_/g, ' ') || 'FACE RECOGNITION'}
                            </p>
                            <p className="text-[11px] font-mono text-[#A1A1AA]">
                              {formatDate(ev.eventTimestamp)}
                              {ev.denialReason ? ` • ${ev.denialReason}` : ''}
                            </p>
                          </div>
                          <StatusBadge
                            status={ev.accessDecision === 'GRANTED' ? 'ACTIVE' : 'REJECTED'}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Full-Size Member / Biometric Photo Lightbox */}
      <Modal
        isOpen={Boolean(lightboxImage)}
        onClose={() => setLightboxImage(null)}
        title="Member Photo Preview"
        description={lightboxImage?.caption || ''}
        maxWidth="max-w-lg"
      >
        {lightboxImage && (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden bg-[#141414] border border-[#2C2C2C] flex items-center justify-center max-h-[65vh]">
              <img
                src={lightboxImage.src}
                alt={lightboxImage.caption}
                className="w-full h-auto max-h-[62vh] object-contain"
              />
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setLightboxImage(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  MailQuestion,
  Edit3,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  MessageSquareText,
  Search,
} from 'lucide-react';
import { apiRequest, getErrorMessage, formatDateTime } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Inquiry, InquiryStatus } from '@/types';
import {
  Card,
  Button,
  Textarea,
  StatusBadge,
  Modal,
  Skeleton,
  EmptyState,
} from '@/components/ui';

export default function AdminInquiriesPage() {
  const { showToast } = useToast();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [status, setStatus] = useState<InquiryStatus>('IN_PROGRESS');
  const [internalNotes, setInternalNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const qs = statusFilter ? `?status=${statusFilter}` : '';
      const res = await apiRequest<Inquiry[]>(`/inquiries${qs}`);
      setInquiries(res || []);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showToast]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const handleSaveInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await apiRequest(`/inquiries/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          internalNotes,
        }),
      });
      showToast('success', 'Inquiry follow-up updated.');
      setSelected(null);
      loadInquiries();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const filteredInquiries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return inquiries;
    return inquiries.filter(
      (i) =>
        String(i.fullName || '').toLowerCase().includes(q) ||
        String(i.subject || '').toLowerCase().includes(q) ||
        String(i.email || '').toLowerCase().includes(q) ||
        String(i.phone || '').toLowerCase().includes(q) ||
        String(i.message || '').toLowerCase().includes(q),
    );
  }, [inquiries, search]);

  const statusTabs = [
    { value: '', label: 'All' },
    { value: 'NEW', label: 'New' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'CONTACTED', label: 'Contacted' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CLOSED', label: 'Closed' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Website Inquiries
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Lead Follow-Up &amp; Prospect Inbox</span>
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, subject..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#141414] border border-[#2C2C2C] text-sm text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#C7F464]"
          />
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Total Inquiries</p>
            <p className="text-2xl font-bold text-white font-mono mt-0.5">
              {inquiries.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#171717] border border-[#2C2C2C] flex items-center justify-center text-[#C7F464]">
            <MailQuestion className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Open / Awaiting Action</p>
            <p className="text-2xl font-bold text-amber-400 font-mono mt-0.5">
              {
                inquiries.filter(
                  (i) => i.status === 'NEW' || i.status === 'IN_PROGRESS',
                ).length
              }
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-400">
            OPEN
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Resolved / Converted</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">
              {inquiries.filter((i) => i.status === 'RESOLVED').length}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-400">
            CLOSED
          </span>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {statusTabs.map((t) => {
          const active = statusFilter === t.value;
          return (
            <button
              key={t.value || 'ALL'}
              type="button"
              onClick={() => setStatusFilter(t.value)}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all ${
                active
                  ? 'bg-[#C7F464] border-[#C7F464] !text-[#090909] font-bold shadow-xs'
                  : 'bg-[#141414] border-[#2C2C2C] text-[#A1A1AA] hover:border-[#C7F464]/50 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <Skeleton className="h-80 w-full rounded-3xl" />
      ) : filteredInquiries.length === 0 ? (
        <EmptyState
          icon={<MailQuestion className="w-6 h-6" />}
          title="No Website Inquiries"
          description="Submissions from the public Contact page will appear here for staff follow-up."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredInquiries.map((inq) => {
            const msgText = String(inq.message || '');
            const isLong = msgText.length > 180;
            const isExpanded = Boolean(expandedIds[inq.id]);
            const initials = (inq.fullName || 'P')
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <Card
                key={inq.id}
                className="p-5 rounded-3xl border border-[#2C2C2C] flex flex-col justify-between gap-4"
              >
                <div className="space-y-3.5">
                  {/* Top Row: Avatar + Name + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#1B2210] border border-[#C7F464]/40 flex items-center justify-center font-mono text-xs font-bold text-[#C7F464] shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm truncate">
                          {inq.fullName}
                        </h3>
                        <p className="text-[11px] font-mono text-[#A1A1AA] inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          {formatDateTime(inq.createdAt)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={inq.status} />
                  </div>

                  {/* Subject */}
                  <div className="px-3 py-2 rounded-xl bg-[#171717] border border-[#2C2C2C]">
                    <p className="text-[10px] font-mono uppercase text-[#A1A1AA]">
                      Topic / Subject
                    </p>
                    <p className="text-xs font-semibold text-white truncate mt-0.5">
                      {inq.subject || 'General Gym Inquiry'}
                    </p>
                  </div>

                  {/* Contact Info Chips */}
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    {inq.phone && (
                      <a
                        href={`tel:${inq.phone}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#171717] border border-[#2C2C2C] text-white hover:border-[#C7F464]/60"
                      >
                        <Phone className="w-3 h-3 text-[#C7F464]" />
                        {inq.phone}
                      </a>
                    )}
                    {inq.email && (
                      <a
                        href={`mailto:${inq.email}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#171717] border border-[#2C2C2C] text-[#A1A1AA] hover:text-white truncate max-w-full"
                      >
                        <Mail className="w-3 h-3 text-[#C7F464] shrink-0" />
                        <span className="truncate">{inq.email}</span>
                      </a>
                    )}
                  </div>

                  {/* Message Body with Safe Clamping */}
                  <div className="p-3.5 rounded-xl bg-[#171717] border border-[#2C2C2C] space-y-1.5">
                    <p
                      className={`text-xs text-zinc-200 leading-relaxed break-all sm:break-words ${
                        !isExpanded ? 'line-clamp-3' : ''
                      }`}
                    >
                      {msgText}
                    </p>
                    {isLong && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedIds((prev) => ({
                            ...prev,
                            [inq.id]: !prev[inq.id],
                          }))
                        }
                        className="text-[11px] font-mono font-bold text-[#C7F464] hover:underline"
                      >
                        {isExpanded ? 'Show Less ↑' : 'Read Full Message ↓'}
                      </button>
                    )}
                  </div>

                  {inq.internalNotes && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-400">
                      <MessageSquareText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span className="font-mono break-words">
                        Note: {inq.internalNotes}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#2C2C2C] flex items-center justify-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelected(inq);
                      setStatus(inq.status);
                      setInternalNotes(inq.internalNotes || '');
                    }}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Update Follow-Up
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Redesigned Follow-Up Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Update Inquiry Follow-Up"
        description={`Prospect: ${selected?.fullName || ''}`}
        maxWidth="max-w-xl"
      >
        {selected && (
          <form onSubmit={handleSaveInquiry} className="space-y-5">
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#C7F464]/45 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-white">
                  {selected.fullName}
                </p>
                <StatusBadge status={status} />
              </div>
              <p className="text-xs font-mono text-[#A1A1AA]">
                {selected.phone || 'No phone'} • {selected.email || 'No email'}
              </p>
              <p className="text-xs text-zinc-200 bg-[#171717] p-2.5 rounded-xl border border-[#2C2C2C] line-clamp-3 break-words">
                {selected.message}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-white">
                Follow-Up Status *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(
                  [
                    { value: 'NEW', label: 'New' },
                    { value: 'IN_PROGRESS', label: 'In Progress' },
                    { value: 'CONTACTED', label: 'Contacted' },
                    { value: 'RESOLVED', label: 'Resolved' },
                    { value: 'CLOSED', label: 'Closed' },
                  ] as Array<{ value: InquiryStatus; label: string }>
                ).map((opt) => {
                  const active = status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatus(opt.value)}
                      className={`px-3 py-2 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                        active
                          ? 'bg-[#C7F464] border-[#C7F464] !text-[#090909]'
                          : 'bg-[#141414] border-[#2C2C2C] text-[#A1A1AA] hover:border-[#C7F464]/50'
                      }`}
                    >
                      {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Textarea
              label="Internal Staff Notes"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Called prospect on WhatsApp, invited for free Ashkona facility tour..."
            />

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[#2C2C2C]">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelected(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="ifg-btn-primary"
                isLoading={saving}
              >
                Save Follow-Up
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}


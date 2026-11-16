'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Target,
  PhoneCall,
  MessageCircle,
  UserPlus,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  Edit3,
  Trash2,
  Users,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { apiFetch, formatDate, formatDateTime } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Card,
  Button,
  StatusBadge,
  Modal,
  Input,
  Skeleton,
  EmptyState,
} from '@/components/ui';

const LEAD_SOURCES = [
  { value: 'WALK_IN', label: 'Walk-In Visitor' },
  { value: 'WHATSAPP', label: 'WhatsApp Message' },
  { value: 'FACEBOOK', label: 'Facebook / IG DM' },
  { value: 'PHONE_CALL', label: 'Phone Inquiry' },
  { value: 'WEBSITE_INQUIRY', label: 'Website Form' },
  { value: 'REFERRAL', label: 'Member Referral' },
];

const LEAD_STAGES = [
  { value: 'NEW', label: 'New Lead' },
  { value: 'TRIAL_BOOKED', label: 'Gym Tour / Trial' },
  { value: 'FOLLOW_UP', label: 'Follow-Up' },
  { value: 'NEGOTIATION', label: 'Negotiation / Price' },
  { value: 'CONVERTED', label: 'Converted Member' },
  { value: 'LOST', label: 'Lost / Not Joined' },
];

const CHANNELS = [
  { value: 'PHONE_CALL', label: 'Phone Call' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'IN_PERSON', label: 'In-Person at Desk' },
  { value: 'SMS', label: 'SMS' },
];

const OUTCOMES = [
  { value: 'ANSWERED', label: 'Answered / Discussed' },
  { value: 'NO_ANSWER', label: 'No Answer / Busy' },
  { value: 'CALLBACK_REQUESTED', label: 'Requested Callback' },
  { value: 'PROMISED_TO_PAY', label: 'Promised Payment / Visit' },
  { value: 'BOOKED_TRIAL', label: 'Booked Gym Tour / Trial' },
  { value: 'CONVERTED_OR_RENEWED', label: 'Joined / Renewed' },
  { value: 'NOT_INTERESTED', label: 'Not Interested' },
];

function buildWhatsappHref(phone: string, text: string): string {
  const digits = String(phone || '').replace(/[^\d]/g, '');
  const normalized = digits.startsWith('01') ? `88${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export default function AdminCrmPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isOwnerAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [tab, setTab] = useState<'leads' | 'retention' | 'timeline' | 'scorecard'>('leads');
  const [loading, setLoading] = useState(true);

  const [overview, setOverview] = useState<any>({});
  const [staffOptions, setStaffOptions] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [retention, setRetention] = useState<{
    expiringSoon: any[];
    expiredRecent: any[];
    absentMembers: any[];
  }>({ expiringSoon: [], expiredRecent: [], absentMembers: [] });
  const [activities, setActivities] = useState<any[]>([]);
  const [scorecard, setScorecard] = useState<any[]>([]);

  // Filters
  const [stageFilter, setStageFilter] = useState('ALL');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [retentionBucket, setRetentionBucket] = useState<'expiring' | 'expired' | 'absent'>('expiring');

  // Create / Edit Lead Modal
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [savingLead, setSavingLead] = useState(false);
  const [leadForm, setLeadForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    source: 'WALK_IN',
    stage: 'NEW',
    fitnessGoal: '',
    interestedPlan: '',
    assignedToUserId: '',
    referralMemberCode: '',
    nextFollowUpAt: '',
    lostReason: '',
    notes: '',
  });

  // Log Activity Modal (supports Lead or Member Retention)
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityTarget, setActivityTarget] = useState<{
    type: 'lead' | 'member';
    id: string;
    name: string;
    subtitle: string;
  } | null>(null);
  const [savingActivity, setSavingActivity] = useState(false);
  const [activityForm, setActivityForm] = useState({
    channel: 'PHONE_CALL',
    outcome: 'ANSWERED',
    summary: '',
    nextFollowUpAt: '',
  });

  const [syncingInquiries, setSyncingInquiries] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, staff, leadList, ret, actList, score] = await Promise.all([
        apiFetch<any>('/crm/overview').catch(() => ({})),
        apiFetch<any[]>('/crm/staff-options').catch(() => []),
        apiFetch<any[]>('/crm/leads').catch(() => []),
        apiFetch<any>('/crm/retention').catch(() => ({
          expiringSoon: [],
          expiredRecent: [],
          absentMembers: [],
        })),
        apiFetch<any[]>('/crm/activities').catch(() => []),
        apiFetch<any[]>('/crm/scorecard').catch(() => []),
      ]);
      setOverview(ov || {});
      setStaffOptions(Array.isArray(staff) ? staff : []);
      setLeads(Array.isArray(leadList) ? leadList : []);
      setRetention({
        expiringSoon: ret?.expiringSoon || [],
        expiredRecent: ret?.expiredRecent || [],
        absentMembers: ret?.absentMembers || [],
      });
      setActivities(Array.isArray(actList) ? actList : []);
      setScorecard(Array.isArray(score) ? score : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (stageFilter !== 'ALL' && l.stage !== stageFilter) return false;
      if (overdueOnly && !l.isOverdue) return false;
      if (!q) return true;
      return (
        String(l.fullName || '').toLowerCase().includes(q) ||
        String(l.phone || '').toLowerCase().includes(q) ||
        String(l.leadCode || '').toLowerCase().includes(q) ||
        String(l.assignedStaffName || '').toLowerCase().includes(q)
      );
    });
  }, [leads, stageFilter, overdueOnly, search]);

  const openCreateLead = () => {
    setEditingLead(null);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16);
    setLeadForm({
      fullName: '',
      phone: '',
      email: '',
      source: 'WALK_IN',
      stage: 'NEW',
      fitnessGoal: '',
      interestedPlan: '',
      assignedToUserId: user?.id || '',
      referralMemberCode: '',
      nextFollowUpAt: tomorrow,
      lostReason: '',
      notes: '',
    });
    setLeadModalOpen(true);
  };

  const openEditLead = (lead: any) => {
    setEditingLead(lead);
    setLeadForm({
      fullName: lead.fullName || '',
      phone: lead.phone || '',
      email: lead.email || '',
      source: lead.source || 'WALK_IN',
      stage: lead.stage || 'NEW',
      fitnessGoal: lead.fitnessGoal || '',
      interestedPlan: lead.interestedPlan || '',
      assignedToUserId: lead.assignedToUserId || '',
      referralMemberCode: lead.referralMemberCode || '',
      nextFollowUpAt: lead.nextFollowUpAt
        ? new Date(lead.nextFollowUpAt).toISOString().slice(0, 16)
        : '',
      lostReason: lead.lostReason || '',
      notes: lead.notes || '',
    });
    setLeadModalOpen(true);
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLead(true);
    try {
      const payload = {
        fullName: leadForm.fullName,
        phone: leadForm.phone,
        email: leadForm.email || undefined,
        source: leadForm.source,
        stage: leadForm.stage,
        fitnessGoal: leadForm.fitnessGoal || undefined,
        interestedPlan: leadForm.interestedPlan || undefined,
        assignedToUserId: leadForm.assignedToUserId || undefined,
        referralMemberCode: leadForm.referralMemberCode || undefined,
        nextFollowUpAt: leadForm.nextFollowUpAt
          ? new Date(leadForm.nextFollowUpAt).toISOString()
          : undefined,
        lostReason: leadForm.lostReason || undefined,
        notes: leadForm.notes || undefined,
      };
      if (editingLead) {
        await apiFetch(`/crm/leads/${editingLead.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast({ title: 'CRM Lead Updated', variant: 'success' });
      } else {
        await apiFetch('/crm/leads', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast({ title: 'Lead Added to Pipeline', variant: 'success' });
      }
      setLeadModalOpen(false);
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Save Failed', description: err.message, variant: 'error' });
    } finally {
      setSavingLead(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      await apiFetch(`/crm/leads/${id}`, { method: 'DELETE' });
      toast({ title: 'Lead Deleted', variant: 'success' });
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Delete Failed', description: err.message, variant: 'error' });
    }
  };

  const handleSyncInquiries = async () => {
    setSyncingInquiries(true);
    try {
      const res = await apiFetch<{ importedCount: number }>('/crm/leads/import-inquiries', {
        method: 'POST',
      });
      toast({
        title: 'Website Inquiries Synced',
        description: `${res.importedCount} new inquiry lead(s) imported to CRM.`,
        variant: 'success',
      });
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Sync Failed', description: err.message, variant: 'error' });
    } finally {
      setSyncingInquiries(false);
    }
  };

  const openLogActivityModal = (
    target: { type: 'lead' | 'member'; id: string; name: string; subtitle: string },
  ) => {
    setActivityTarget(target);
    const tomorrow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16);
    setActivityForm({
      channel: 'PHONE_CALL',
      outcome: 'ANSWERED',
      summary: '',
      nextFollowUpAt: target.type === 'lead' ? tomorrow : '',
    });
    setActivityModalOpen(true);
  };

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTarget) return;
    setSavingActivity(true);
    try {
      await apiFetch('/crm/activities', {
        method: 'POST',
        body: JSON.stringify({
          ...(activityTarget.type === 'lead'
            ? { leadId: activityTarget.id }
            : { memberProfileId: activityTarget.id }),
          channel: activityForm.channel,
          outcome: activityForm.outcome,
          summary: activityForm.summary,
          nextFollowUpAt: activityForm.nextFollowUpAt
            ? new Date(activityForm.nextFollowUpAt).toISOString()
            : undefined,
        }),
      });
      toast({ title: 'Follow-Up Logged to Accountability Trail', variant: 'success' });
      setActivityModalOpen(false);
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Log Failed', description: err.message, variant: 'error' });
    } finally {
      setSavingActivity(false);
    }
  };

  const retentionList =
    retentionBucket === 'expiring'
      ? retention.expiringSoon
      : retentionBucket === 'expired'
        ? retention.expiredRecent
        : retention.absentMembers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Gym CRM &amp; Staff Accountability
          </h1>
          <p className="text-sm text-[#A1A1AA]">
            Track walk-in &amp; social leads, renewal calls, 10-day absent members, and front-desk follow-up accountability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            isLoading={syncingInquiries}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={handleSyncInquiries}
          >
            Sync Website Inquiries
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="ifg-btn-primary"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={openCreateLead}
          >
            New Lead / Walk-In
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 rounded-2xl border border-[#2C2C2C] space-y-1">
          <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">Active Pipeline</p>
          <p className="font-display text-2xl text-[#C7F464]">
            {overview.activeLeadsCount ?? 0} Leads
          </p>
          <p className="text-[11px] font-mono text-[#A1A1AA]">
            Conversion: {overview.conversionRatePct ?? 0}% ({overview.convertedCount ?? 0} joined)
          </p>
        </Card>

        <Card
          className={`p-4 rounded-2xl border space-y-1 ${
            Number(overview.overdueFollowUpsCount || 0) > 0
              ? 'border-rose-500/45 bg-rose-500/10'
              : 'border-[#2C2C2C]'
          }`}
        >
          <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">Overdue Follow-Ups</p>
          <p
            className={`font-display text-2xl ${
              Number(overview.overdueFollowUpsCount || 0) > 0
                ? 'text-rose-400'
                : 'text-emerald-400'
            }`}
          >
            {overview.overdueFollowUpsCount ?? 0} Missed
          </p>
          <p className="text-[11px] font-mono text-[#A1A1AA]">
            Due by today: {overview.dueTodayCount ?? 0}
          </p>
        </Card>

        <Card className="p-4 rounded-2xl border border-[#2C2C2C] space-y-1">
          <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">Renewal Queue</p>
          <p className="font-display text-2xl text-amber-400">
            {(overview.expiringSoonCount ?? 0) + (overview.expiredRecentCount ?? 0)} Members
          </p>
          <p className="text-[11px] font-mono text-[#A1A1AA]">
            {overview.expiringSoonCount ?? 0} expiring • {overview.expiredRecentCount ?? 0} expired
          </p>
        </Card>

        <Card className="p-4 rounded-2xl border border-[#2C2C2C] space-y-1">
          <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">Absent (10+ Days)</p>
          <p className="font-display text-2xl text-sky-400">
            {overview.absentMembersCount ?? 0} At Risk
          </p>
          <p className="text-[11px] font-mono text-[#A1A1AA]">
            Active plan, zero recent visits
          </p>
        </Card>

        <Card className="p-4 rounded-2xl border border-[#2C2C2C] space-y-1">
          <p className="text-[11px] font-mono uppercase text-[#A1A1AA]">Staff Calls (30d)</p>
          <p className="font-display text-2xl text-white">
            {overview.activities30d ?? 0} Logged
          </p>
          <p className="text-[11px] font-mono text-[#A1A1AA]">
            Timestamped accountability
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex flex-wrap rounded-xl bg-[#141414] border border-[#2C2C2C] p-1 gap-1">
          <button
            type="button"
            onClick={() => setTab('leads')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-colors ${
              tab === 'leads'
                ? 'bg-[#C7F464] text-[#090909]'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Leads Pipeline ({leads.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('retention')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-colors ${
              tab === 'retention'
                ? 'bg-[#C7F464] text-[#090909]'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Renewal &amp; Absent Radar (
            {retention.expiringSoon.length +
              retention.expiredRecent.length +
              retention.absentMembers.length}
            )
          </button>
          <button
            type="button"
            onClick={() => setTab('timeline')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-colors ${
              tab === 'timeline'
                ? 'bg-[#C7F464] text-[#090909]'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Call &amp; Follow-Up Log ({activities.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('scorecard')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-colors ${
              tab === 'scorecard'
                ? 'bg-[#C7F464] text-[#090909]'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Staff Accountability ({scorecard.length})
          </button>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : tab === 'leads' ? (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setOverdueOnly(!overdueOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border transition-colors ${
                  overdueOnly
                    ? 'bg-rose-500/20 border-rose-500/60 text-rose-400'
                    : 'bg-[#141414] border-[#2C2C2C] text-[#A1A1AA] hover:text-white'
                }`}
              >
                Overdue Only ({overview.overdueFollowUpsCount ?? 0})
              </button>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="h-9 px-3 rounded-xl bg-[#141414] border border-[#2C2C2C] text-xs font-mono text-white"
              >
                <option value="ALL">All Stages</option>
                {LEAD_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, staff..."
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#141414] border border-[#2C2C2C] text-xs text-white placeholder-[#A1A1AA]"
              />
            </div>
          </div>

          {filteredLeads.length === 0 ? (
            <EmptyState
              title="No Leads in Selected Filter"
              description="Add a walk-in visitor, phone/WhatsApp prospect, or sync website inquiries into your CRM pipeline."
              action={
                <Button variant="primary" onClick={openCreateLead}>
                  Add First Lead
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredLeads.map((lead) => {
                const lastAct = lead.activities?.[0];
                return (
                  <Card
                    key={lead.id}
                    className={`p-5 rounded-3xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      lead.isOverdue
                        ? 'border-rose-500/50 bg-rose-500/5'
                        : 'border-[#2C2C2C]'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#C7F464]">
                          {lead.leadCode}
                        </span>
                        <StatusBadge status={lead.stage} />
                        <span className="px-2 py-0.5 rounded bg-[#171717] border border-[#2C2C2C] text-[10px] font-mono text-[#A1A1AA]">
                          {lead.source.replace(/_/g, ' ')}
                        </span>
                        {lead.isOverdue && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-[10px] font-mono font-bold text-rose-400">
                            <AlertTriangle className="w-3 h-3" /> OVERDUE CALLBACK
                          </span>
                        )}
                      </div>

                      <p className="text-base font-bold text-white">
                        {lead.fullName} •{' '}
                        <span className="font-mono text-sm text-[#C7F464]">
                          {lead.phone}
                        </span>
                      </p>

                      <p className="text-xs font-mono text-[#A1A1AA]">
                        Owner: <strong className="text-white">{lead.assignedStaffName || 'Unassigned'}</strong>
                        {lead.interestedPlan ? ` • Plan: ${lead.interestedPlan}` : ''}
                        {lead.nextFollowUpAt
                          ? ` • Next Call: ${formatDateTime(lead.nextFollowUpAt)}`
                          : ''}
                        {lead.lostReason ? ` • Lost Reason: ${lead.lostReason}` : ''}
                      </p>

                      {lastAct && (
                        <p className="text-xs text-[#A1A1AA] bg-[#171717] border border-[#2C2C2C] rounded-xl px-3 py-2">
                          <strong className="text-white">{lastAct.actorName}:</strong>{' '}
                          {lastAct.summary}{' '}
                          <span className="text-[10px] font-mono opacity-75">
                            ({formatDateTime(lastAct.createdAt)})
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <a
                        href={buildWhatsappHref(
                          lead.phone,
                          `Assalamu Alaikum ${lead.fullName}, Icon Fitness Gym Ashkona reception theke bolchi. Apnar membership / trial visit niye kotha bolte chacchilam.`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs font-mono font-semibold text-emerald-400 hover:bg-emerald-500/25 no-underline"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<PhoneCall className="w-3.5 h-3.5" />}
                        onClick={() =>
                          openLogActivityModal({
                            type: 'lead',
                            id: lead.id,
                            name: lead.fullName,
                            subtitle: `${lead.leadCode} • ${lead.phone}`,
                          })
                        }
                      >
                        Log Call
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openEditLead(lead)}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      {isOwnerAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-400"
                          onClick={() => handleDeleteLead(lead.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : tab === 'retention' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRetentionBucket('expiring')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold border ${
                retentionBucket === 'expiring'
                  ? 'bg-[#C7F464] border-[#C7F464] text-[#090909]'
                  : 'bg-[#141414] border-[#2C2C2C] text-[#A1A1AA]'
              }`}
            >
              Expiring ≤ 7 Days ({retention.expiringSoon.length})
            </button>
            <button
              type="button"
              onClick={() => setRetentionBucket('expired')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold border ${
                retentionBucket === 'expired'
                  ? 'bg-[#C7F464] border-[#C7F464] text-[#090909]'
                  : 'bg-[#141414] border-[#2C2C2C] text-[#A1A1AA]'
              }`}
            >
              Recently Expired ({retention.expiredRecent.length})
            </button>
            <button
              type="button"
              onClick={() => setRetentionBucket('absent')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold border ${
                retentionBucket === 'absent'
                  ? 'bg-[#C7F464] border-[#C7F464] text-[#090909]'
                  : 'bg-[#141414] border-[#2C2C2C] text-[#A1A1AA]'
              }`}
            >
              Absent 10+ Days ({retention.absentMembers.length})
            </button>
          </div>

          {retentionList.length === 0 ? (
            <EmptyState
              title="All Clear in This Retention Queue"
              description="No members currently match this renewal or absence alert condition."
            />
          ) : (
            <div className="space-y-3">
              {retentionList.map((m) => (
                <Card
                  key={m.memberProfileId}
                  className="p-5 rounded-3xl border border-[#2C2C2C] flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#C7F464]">
                        {m.memberCode}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#1B2210] border border-[#C7F464]/35 text-[10px] font-mono font-bold text-[#C7F464]">
                        {retentionBucket === 'expiring'
                          ? `${m.daysLeft}d left`
                          : retentionBucket === 'expired'
                            ? `Expired ${m.daysExpired}d ago`
                            : `Absent ${m.daysAbsent}d`}
                      </span>
                      <span className="text-xs font-mono text-[#A1A1AA]">
                        {m.planName}
                      </span>
                    </div>

                    <p className="text-base font-bold text-white">
                      {m.fullName} •{' '}
                      <span className="font-mono text-sm text-[#C7F464]">{m.phone}</span>
                    </p>

                    <p className="text-xs font-mono text-[#A1A1AA]">
                      Plan End: {m.endDate ? formatDate(m.endDate) : '—'} • Last Check-In:{' '}
                      {m.lastVisitAt ? formatDate(m.lastVisitAt) : 'No visits yet'}
                    </p>

                    {m.lastCall && (
                      <p className="text-xs text-[#A1A1AA] bg-[#171717] border border-[#2C2C2C] rounded-xl px-3 py-2">
                        Last Call by <strong className="text-white">{m.lastCall.actorName}</strong>:{' '}
                        {m.lastCall.summary} ({formatDateTime(m.lastCall.createdAt)})
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <a
                      href={buildWhatsappHref(
                        m.phone,
                        retentionBucket === 'absent'
                          ? `Assalamu Alaikum ${m.fullName} (${m.memberCode}), Icon Fitness Gym Ashkona theke bolchi. Kichu din dhore apnake gym-e dekha jachhe na — sob thik ache to? Ajke ashben naki?`
                          : `Assalamu Alaikum ${m.fullName} (${m.memberCode}), apnar ${m.planName} package renewal-er shomoy hoye asche. Desk-e ese ba bKash-e renew kore nite parben.`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs font-mono font-semibold text-emerald-400 hover:bg-emerald-500/25 no-underline"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<PhoneCall className="w-3.5 h-3.5" />}
                      onClick={() =>
                        openLogActivityModal({
                          type: 'member',
                          id: m.memberProfileId,
                          name: m.fullName,
                          subtitle: `${m.memberCode} • ${m.planName}`,
                        })
                      }
                    >
                      Log Retention Call
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : tab === 'timeline' ? (
        activities.length === 0 ? (
          <EmptyState
            title="No Follow-Up Logs Yet"
            description="Every phone call, WhatsApp reminder, and walk-in desk discussion logged by staff appears here chronologically."
          />
        ) : (
          <div className="space-y-2.5">
            {activities.map((act) => (
              <Card
                key={act.id}
                className="p-4 rounded-2xl border border-[#2C2C2C] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#C7F464]">
                      {act.actorName}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#171717] border border-[#2C2C2C] text-[10px] font-mono text-[#A1A1AA]">
                      {act.channel.replace(/_/g, ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#1B2210] border border-[#C7F464]/35 text-[10px] font-mono text-[#C7F464]">
                      {act.outcome.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      →{' '}
                      {act.lead
                        ? `${act.lead.fullName} (${act.lead.leadCode})`
                        : act.memberProfile
                          ? `${act.memberProfile.user?.fullName} (${act.memberProfile.memberCode})`
                          : 'Record'}
                    </span>
                  </div>
                  <p className="text-xs text-[#A1A1AA]">{act.summary}</p>
                </div>
                <span className="text-[11px] font-mono text-[#A1A1AA] inline-flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" /> {formatDateTime(act.createdAt)}
                </span>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card className="p-5 rounded-3xl border border-[#2C2C2C] overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C7F464]" />
                30-Day Staff CRM Accountability Scorecard
              </h2>
              <p className="text-xs text-[#A1A1AA]">
                Monitor how many leads each staff member handles, follow-ups logged, missed callbacks, and closed admissions.
              </p>
            </div>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#2C2C2C] font-mono uppercase text-[10px] text-[#A1A1AA]">
                <th className="py-3 pr-4">Staff / Trainer</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3 text-right">Assigned Leads</th>
                <th className="py-3 px-3 text-right">Active Pipeline</th>
                <th className="py-3 px-3 text-right">Follow-Ups (30d)</th>
                <th className="py-3 px-3 text-right">Retention Calls</th>
                <th className="py-3 px-3 text-right">Overdue Missed</th>
                <th className="py-3 pl-3 text-right">Converted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C2C2C]">
              {scorecard.map((row) => (
                <tr key={row.userId} className="hover:bg-[#171717]/60">
                  <td className="py-3.5 pr-4 font-bold text-white">{row.fullName}</td>
                  <td className="py-3.5 px-3 font-mono text-[#A1A1AA]">{row.role}</td>
                  <td className="py-3.5 px-3 text-right font-mono text-white">
                    {row.assignedLeadsCount}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-[#A1A1AA]">
                    {row.activePipelineCount}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-[#C7F464]">
                    {row.activitiesLogged30d}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-sky-400">
                    {row.retentionCallsLogged}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono">
                    {row.overdueFollowUpsCount > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                        {row.overdueFollowUpsCount} Missed
                      </span>
                    ) : (
                      <span className="text-emerald-400 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 0
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 pl-3 text-right font-mono font-bold text-emerald-400">
                    {row.convertedCount} ({row.conversionRatePct}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create / Edit Lead Modal */}
      <Modal
        isOpen={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        title={
          editingLead
            ? `Edit Lead — ${editingLead.leadCode}`
            : 'Add New CRM Lead / Walk-In'
        }
        description="Log a prospect into your sales pipeline, set stage & follow-up reminder, and assign an owner."
        maxWidth="max-w-2xl"
      >
        <form
          onSubmit={handleSaveLead}
          className="space-y-5 max-h-[75vh] overflow-y-auto pr-1"
        >
          {/* Live Prospect Card Preview */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#C7F464]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#C7F464] text-[#090909] flex items-center justify-center shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#C7F464]">
                  {editingLead?.leadCode || 'NEW PROSPECT'} • {leadForm.source}
                </p>
                <p className="text-sm font-bold text-white truncate">
                  {leadForm.fullName || 'Walk-In / Prospective Member'}
                </p>
                <p className="text-xs font-mono text-[#A1A1AA] truncate">
                  {leadForm.phone || '+88017XXXXXXXX'} •{' '}
                  {leadForm.interestedPlan || 'Plan TBD'}
                </p>
              </div>
            </div>
            <StatusBadge status={leadForm.stage} />
          </div>

          <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                required
                placeholder="e.g. Tariqul Islam"
                value={leadForm.fullName}
                onChange={(e) =>
                  setLeadForm({ ...leadForm, fullName: e.target.value })
                }
              />
              <Input
                label="Phone Number *"
                required
                placeholder="+88017XXXXXXXX"
                value={leadForm.phone}
                onChange={(e) =>
                  setLeadForm({ ...leadForm, phone: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-mono uppercase text-[#A1A1AA]">
                Lead Source *
              </span>
              <div className="flex flex-wrap gap-1.5">
                {LEAD_SOURCES.map((s) => {
                  const active = leadForm.source === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() =>
                        setLeadForm({ ...leadForm, source: s.value })
                      }
                      className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all ${
                        active
                          ? 'bg-[#C7F464] border-[#C7F464] !text-[#090909] font-bold'
                          : 'bg-[#171717] border-[#2C2C2C] text-[#A1A1AA] hover:border-[#C7F464]/50'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-mono uppercase text-[#A1A1AA]">
                Pipeline Stage
              </span>
              <div className="flex flex-wrap gap-1.5">
                {LEAD_STAGES.map((st) => {
                  const active = leadForm.stage === st.value;
                  return (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() =>
                        setLeadForm({ ...leadForm, stage: st.value })
                      }
                      className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all ${
                        active
                          ? 'bg-[#1B2210] border-[#C7F464] text-[#C7F464] font-bold'
                          : 'bg-[#171717] border-[#2C2C2C] text-[#A1A1AA] hover:border-[#C7F464]/50'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                  Assigned Staff Owner
                </label>
                <select
                  value={leadForm.assignedToUserId}
                  onChange={(e) =>
                    setLeadForm({
                      ...leadForm,
                      assignedToUserId: e.target.value,
                    })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-[#171717] border border-[#2C2C2C] text-sm text-white"
                >
                  <option value="">Auto-Assign to Me</option>
                  {staffOptions.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                  Next Follow-Up Date
                </label>
                <input
                  type="datetime-local"
                  value={leadForm.nextFollowUpAt}
                  onChange={(e) =>
                    setLeadForm({
                      ...leadForm,
                      nextFollowUpAt: e.target.value,
                    })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-[#171717] border border-[#2C2C2C] text-sm text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Interested Plan"
                placeholder="e.g. Quarterly Performance"
                value={leadForm.interestedPlan}
                onChange={(e) =>
                  setLeadForm({ ...leadForm, interestedPlan: e.target.value })
                }
              />
              <Input
                label="Referral Member Code"
                placeholder="IFG-2026-0001"
                value={leadForm.referralMemberCode}
                onChange={(e) =>
                  setLeadForm({
                    ...leadForm,
                    referralMemberCode: e.target.value,
                  })
                }
              />
            </div>

            {leadForm.stage === 'LOST' && (
              <Input
                label="Lost Reason (Required for Insights)"
                placeholder="e.g. Price concern, Timing mismatch, Joined nearby gym"
                value={leadForm.lostReason}
                onChange={(e) =>
                  setLeadForm({ ...leadForm, lostReason: e.target.value })
                }
              />
            )}

            <div>
              <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                Desk / Prospect Notes
              </label>
              <textarea
                rows={3}
                value={leadForm.notes}
                onChange={(e) =>
                  setLeadForm({ ...leadForm, notes: e.target.value })
                }
                placeholder="Training goals, preferred time slot, or walk-in tour notes..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#171717] border border-[#2C2C2C] text-sm text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2C2C2C]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setLeadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="ifg-btn-primary"
              isLoading={savingLead}
            >
              {editingLead ? 'Save Lead' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Log Call / Follow-Up Activity Modal */}
      <Modal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        title={`Log Follow-Up — ${activityTarget?.name || ''}`}
        description={activityTarget?.subtitle}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleLogActivity} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                Channel *
              </label>
              <select
                value={activityForm.channel}
                onChange={(e) =>
                  setActivityForm({ ...activityForm, channel: e.target.value })
                }
                className="w-full h-11 px-3 rounded-xl bg-[#141414] border border-[#2C2C2C] text-sm text-white"
              >
                {CHANNELS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                Call / Visit Outcome *
              </label>
              <select
                value={activityForm.outcome}
                onChange={(e) =>
                  setActivityForm({ ...activityForm, outcome: e.target.value })
                }
                className="w-full h-11 px-3 rounded-xl bg-[#141414] border border-[#2C2C2C] text-sm text-white"
              >
                {OUTCOMES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
              Conversation Summary &amp; Commitment *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Spoke on call, promised to visit Ashkona desk Friday 6 PM with admission fee."
              value={activityForm.summary}
              onChange={(e) =>
                setActivityForm({ ...activityForm, summary: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-[#2C2C2C] text-sm text-white"
            />
          </div>

          {activityTarget?.type === 'lead' && (
            <div>
              <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                Schedule Next Follow-Up (Optional)
              </label>
              <input
                type="datetime-local"
                value={activityForm.nextFollowUpAt}
                onChange={(e) =>
                  setActivityForm({ ...activityForm, nextFollowUpAt: e.target.value })
                }
                className="w-full h-11 px-3 rounded-xl bg-[#141414] border border-[#2C2C2C] text-sm text-white"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setActivityModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={savingActivity}>
              Save Follow-Up Log
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

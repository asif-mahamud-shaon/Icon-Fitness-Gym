'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Download, History } from 'lucide-react';
import { apiFetch, API_BASE_URL, formatDateTime, getAccessToken } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Card,
  Button,
  StatusBadge,
  Select,
  Input,
  SearchInput,
  Pagination,
  Skeleton,
  EmptyState,
} from '@/components/ui';

export default function AdminAccessHistoryPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const [memberSearch, setMemberSearch] = useState('');
  const [decision, setDecision] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (memberSearch) params.set('memberSearch', memberSearch);
      if (decision) params.set('decision', decision);
      if (sessionType) params.set('sessionType', sessionType);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await apiFetch<any>(
        `/access-control/events?${params.toString()}`,
      );
      setEvents(res.items || []);
      setMeta(res.meta || { page: 1, totalPages: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, memberSearch, decision, sessionType, startDate, endDate]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleExportCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (decision) params.set('decision', decision);
      if (sessionType) params.set('sessionType', sessionType);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const token = getAccessToken();
      const res = await fetch(
        `${API_BASE_URL}/access-control/events/export/csv?${params.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      if (!res.ok) throw new Error('Failed to export CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `icon-fitness-access-history-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ title: 'Access History CSV Exported', variant: 'success' });
    } catch (err: any) {
      toast({
        title: 'CSV Export Failed',
        description: err.message,
        variant: 'error',
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            UNIFIED ACCESS LOGS ({meta.total})
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span> Access Control{' '}
            <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Access History</span>
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={handleExportCsv}
        >
          Export Filtered CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <SearchInput
          value={memberSearch}
          onChange={(v) => {
            setMemberSearch(v);
            setPage(1);
          }}
          placeholder="Member name or code..."
          className="sm:w-full"
        />
        <Select
          value={decision}
          onChange={(e) => {
            setDecision(e.target.value);
            setPage(1);
          }}
          options={[
            { value: '', label: 'All Decisions' },
            { value: 'GRANTED', label: 'GRANTED Only' },
            { value: 'DENIED', label: 'DENIED Only' },
          ]}
        />
        <Select
          value={sessionType}
          onChange={(e) => {
            setSessionType(e.target.value);
            setPage(1);
          }}
          options={[
            { value: '', label: 'All Gym Sessions' },
            { value: 'MALE_SESSION', label: 'Male / General Sessions' },
            { value: 'FEMALE_SESSION', label: 'Female Sessions Only' },
          ]}
        />
        <Input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setPage(1);
          }}
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setPage(1);
          }}
        />
      </Card>

      {loading ? (
        <Skeleton className="h-80" />
      ) : events.length === 0 ? (
        <EmptyState
          title="No Matching Access Events"
          description="Adjust your search or date range filters to view historical access logs."
        />
      ) : (
        <Card className="space-y-4 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#171717] border-b border-[#2C2C2C] text-xs font-mono uppercase text-[#A1A1AA]">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Member</th>
                  <th className="py-3.5 px-4">Device &amp; Direction</th>
                  <th className="py-3.5 px-4">Session</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Decision</th>
                  <th className="py-3.5 px-4">Door / Denial Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C2C2C]">
                {events.map((ev) => (
                  <tr
                    key={ev.id}
                    className="hover:bg-[#171717]/60 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-xs text-[#A1A1AA]">
                      {formatDateTime(ev.eventTimestamp)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">
                        {ev.memberProfile?.user?.fullName ||
                          'Unidentified Person'}
                      </p>
                      <p className="text-xs font-mono text-[#C7F464]">
                        {ev.memberProfile?.memberCode || '—'}{' '}
                        {ev.memberProfile?.gender
                          ? `• ${ev.memberProfile.gender}`
                          : ''}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#A1A1AA]">
                      <p className="text-white font-medium">
                        {ev.device?.name || ev.device?.deviceCode}
                      </p>
                      <p className="font-mono">{ev.direction}</p>
                    </td>
                    <td className="py-3 px-4">
                      {ev.sessionTypeSnapshot ? (
                        <StatusBadge status={ev.sessionTypeSnapshot} />
                      ) : (
                        <span className="text-xs text-[#A1A1AA]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={ev.verificationMethod} />
                        {ev.isSimulated && (
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                            SIM
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={ev.accessDecision} />
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {ev.accessDecision === 'GRANTED' ? (
                        <span className="font-mono text-emerald-400">
                          {ev.doorCommandStatus}
                        </span>
                      ) : (
                        <div>
                          <span className="font-mono font-bold text-red-400">
                            {ev.denialCode}
                          </span>
                          <p className="text-[#A1A1AA] mt-0.5">
                            {ev.denialReason}
                          </p>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
          />
        </Card>
      )}
    </div>
  );
}

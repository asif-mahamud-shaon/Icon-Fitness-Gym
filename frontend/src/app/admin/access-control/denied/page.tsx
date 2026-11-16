'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, Download } from 'lucide-react';
import { apiFetch, API_BASE_URL, formatDateTime, getAccessToken } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Card,
  Button,
  StatusBadge,
  Select,
  SearchInput,
  Pagination,
  Skeleton,
  EmptyState,
} from '@/components/ui';

const DENIAL_CODES = [
  'FACE_NOT_RECOGNIZED',
  'MEMBER_NOT_FOUND',
  'ACCOUNT_INACTIVE',
  'MEMBERSHIP_EXPIRED',
  'MEMBERSHIP_NOT_ACTIVE',
  'PAYMENT_PENDING',
  'MEMBERSHIP_SUSPENDED',
  'MEMBERSHIP_CANCELLED',
  'FEMALE_SESSION_RESTRICTED',
  'FEMALE_TRAINER_UNAVAILABLE',
  'BIOMETRIC_NOT_ENROLLED',
  'SPOOF_DETECTED',
  'DEVICE_UNAVAILABLE',
  'OUTSIDE_OPERATING_SESSION',
];

export default function AdminDeniedAccessPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const [denialCode, setDenialCode] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [page, setPage] = useState(1);

  const loadDenied = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('decision', 'DENIED');
      params.set('page', String(page));
      params.set('limit', '20');
      if (denialCode) params.set('denialCode', denialCode);
      if (memberSearch) params.set('memberSearch', memberSearch);

      const res = await apiFetch<any>(
        `/access-control/events?${params.toString()}`,
      );
      setEvents(res.items || []);
      setMeta(res.meta || { page: 1, totalPages: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, denialCode, memberSearch]);

  useEffect(() => {
    loadDenied();
  }, [loadDenied]);

  const handleExportDeniedCsv = async () => {
    try {
      const params = new URLSearchParams();
      params.set('decision', 'DENIED');
      if (denialCode) params.set('denialCode', denialCode);
      const token = getAccessToken();
      const res = await fetch(
        `${API_BASE_URL}/access-control/events/export/csv?${params.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `icon-fitness-denied-attempts-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ title: 'Denied Attempts CSV Downloaded', variant: 'success' });
    } catch (err: any) {
      toast({
        title: 'Export Failed',
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
            DENIED ACCESS ATTEMPTS ({meta.total})
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span> Access Control{' '}
            <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Security Blocks</span>
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={handleExportDeniedCsv}
        >
          Export Denied Log (CSV)
        </Button>
      </div>

      <Card className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SearchInput
          value={memberSearch}
          onChange={(v) => {
            setMemberSearch(v);
            setPage(1);
          }}
          placeholder="Filter by member name or code..."
          className="sm:w-full"
        />
        <Select
          value={denialCode}
          onChange={(e) => {
            setDenialCode(e.target.value);
            setPage(1);
          }}
          options={[
            { value: '', label: 'All Denial Reason Codes' },
            ...DENIAL_CODES.map((c) => ({
              value: c,
              label: c.replace(/_/g, ' '),
            })),
          ]}
        />
      </Card>

      {loading ? (
        <Skeleton className="h-80" />
      ) : events.length === 0 ? (
        <EmptyState
          title="No Denied Access Attempts Found"
          description="No blocked entry attempts match the current filter."
        />
      ) : (
        <Card className="space-y-4 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#171717] border-b border-[#2C2C2C] text-xs font-mono uppercase text-[#A1A1AA]">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Member</th>
                  <th className="py-3.5 px-4">Denial Code</th>
                  <th className="py-3.5 px-4">Exact Denial Reason</th>
                  <th className="py-3.5 px-4">Session</th>
                  <th className="py-3.5 px-4">Door Controller</th>
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
                          'Unidentified Face'}
                      </p>
                      <p className="text-xs font-mono text-[#C7F464]">
                        {ev.memberProfile?.memberCode || '—'}{' '}
                        {ev.memberProfile?.gender
                          ? `(${ev.memberProfile.gender})`
                          : ''}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                        {ev.denialCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#A1A1AA] max-w-md">
                      {ev.denialReason}
                    </td>
                    <td className="py-3 px-4">
                      {ev.sessionTypeSnapshot ? (
                        <StatusBadge status={ev.sessionTypeSnapshot} />
                      ) : (
                        <span className="text-xs text-[#A1A1AA]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-red-300">
                      {ev.doorCommandStatus}
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

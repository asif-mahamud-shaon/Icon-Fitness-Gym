'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { FileSearch } from 'lucide-react';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { AuditLog, PaginatedResult } from '@/types';
import {
  Card,
  StatusBadge,
  Skeleton,
  EmptyState,
  SearchInput,
  Pagination,
} from '@/components/ui';

export default function AdminAuditLogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
      });
      if (actionFilter) params.set('search', actionFilter);
      const res = await apiFetch<PaginatedResult<AuditLog>>(
        `/audit-logs?${params.toString()}`,
      );
      setLogs(res?.items || []);
      setTotalPages(res?.meta?.totalPages || 1);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, showToast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Security &amp; Audit Logs
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Immutable Administrative Telemetry</span>
          </p>
        </div>
        <div className="w-full sm:w-80">
          <SearchInput
            value={actionFilter}
            onChange={(val) => {
              setActionFilter(val);
              setPage(1);
            }}
            placeholder="Search action or summary (e.g. PAYMENT)..."
          />
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<FileSearch className="w-6 h-6" />}
          title="No Audit Logs Match"
          description="Administrative actions, role updates, and payment verifications are automatically recorded here."
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#303030] bg-[#171717] text-[11px] font-mono uppercase text-[#A1A1AA]">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#303030] text-sm">
                {logs.map((log: any) => {
                  const actor = log.actorUser || log.actor;
                  return (
                    <tr key={log.id} className="hover:bg-[#171717]/60">
                      <td className="py-3.5 px-4 font-mono text-xs text-zinc-300">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {actor ? (
                          <div>
                            <p className="text-white font-medium text-xs">
                              {actor.fullName ||
                                `${actor.firstName || ''} ${actor.lastName || ''}`.trim()}
                            </p>
                            <p className="text-[11px] text-[#A1A1AA]">
                              {actor.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-[#A1A1AA]">
                            SYSTEM
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={log.action} />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#C7F464]">
                        {log.entityType}
                        {log.entityId ? ` (${log.entityId.slice(0, 8)}...)` : ''}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-300 max-w-md">
                        {log.summary ||
                          (log.metadata ? JSON.stringify(log.metadata) : '—')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </Card>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Download,
  FileSpreadsheet,
  Users,
  CreditCard,
  ShieldAlert,
  CalendarCheck,
  UserPlus,
} from 'lucide-react';
import { apiFetch, downloadCsvReport, getErrorMessage, formatBdt } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Card, Button, StatCard, Skeleton } from '@/components/ui';

const REPORT_TYPES = [
  {
    key: 'memberships' as const,
    title: 'Membership Subscriptions Report',
    description:
      'Complete export of all member subscriptions, assigned plans, start/end dates, and current lifecycle status.',
    icon: <Users className="w-5 h-5 text-[#C7F464]" />,
  },
  {
    key: 'revenue' as const,
    title: 'Verified Financial & Revenue Ledger',
    description:
      'Detailed ledger of all recorded payments, receipt numbers, payment methods (Cash, bKash, Nagad, Bank), verification timestamps, and refunds.',
    icon: <CreditCard className="w-5 h-5 text-[#C7F464]" />,
  },
  {
    key: 'registrations' as const,
    title: 'Member Registration & Onboarding Report',
    description:
      'Export of all registered member profiles, member codes, contact details, fitness goals, and account approval statuses.',
    icon: <UserPlus className="w-5 h-5 text-[#C7F464]" />,
  },
  {
    key: 'expiries' as const,
    title: 'Expiring & Expired Memberships Report',
    description:
      'Targeted retention report listing memberships approaching expiration or already expired for front-desk renewal calls.',
    icon: <ShieldAlert className="w-5 h-5 text-[#C7F464]" />,
  },
  {
    key: 'bookings' as const,
    title: 'Class Bookings & Attendance Report',
    description:
      'Comprehensive log of all scheduled class seat reservations, cancellations, and verified member check-ins.',
    icon: <CalendarCheck className="w-5 h-5 text-[#C7F464]" />,
  },
];

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/reports/overview');
      setMetrics(res);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleExport = async (
    type: 'memberships' | 'revenue' | 'registrations' | 'expiries' | 'bookings',
  ) => {
    setDownloadingKey(type);
    try {
      await downloadCsvReport(type);
      showToast('success', `${type.toUpperCase()} CSV report downloaded.`);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
          Reports &amp; CSV Export Center
        </h1>
        <p className="text-xs font-mono text-[#A1A1AA] mt-1">
          Admin Portal <span className="mx-1">&gt;</span>{' '}
          <span className="text-white">Business Intelligence &amp; Data Exports</span>
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        metrics?.kpis && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Registered Members"
              value={metrics.kpis.totalMembers}
              sublabel={`${metrics.kpis.activeMembers} Active`}
            />
            <StatCard
              label="Monthly Verified Revenue"
              value={formatBdt(
                metrics.kpis.monthlyRevenueBdt ??
                  metrics.kpis.monthlyRevenue ??
                  0,
              )}
              sublabel="Current calendar month"
            />
            <StatCard
              label="Outstanding Pending Payments"
              value={formatBdt(
                metrics.kpis.outstandingPaymentsBdt ??
                  metrics.kpis.outstandingPaymentsAmount ??
                  0,
              )}
              sublabel="Pending verification"
            />
            <StatCard
              label="Expired Memberships"
              value={metrics.kpis.expiredMemberships}
              sublabel="Renewal candidates"
            />
          </div>
        )
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REPORT_TYPES.map((rep) => (
          <Card key={rep.key} className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#171717] border border-[#303030] flex items-center justify-center">
                  {rep.icon}
                </div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#A1A1AA] flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#C7F464]" />{' '}
                  RFC-4180 CSV
                </span>
              </div>
              <h2 className="font-display text-2xl text-white uppercase tracking-wide">
                {rep.title}
              </h2>
              <p className="text-xs text-[#A1A1AA] mt-2 leading-relaxed">
                {rep.description}
              </p>
            </div>

            <div className="pt-5 mt-5 border-t border-[#303030] flex justify-end">
              <Button
                onClick={() => handleExport(rep.key)}
                isLoading={downloadingKey === rep.key}
              >
                <Download className="w-4 h-4" /> Export CSV Report
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ScanFace,
  ShieldCheck,
  Fingerprint,
  Trash2,
  RefreshCw,
  Camera,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { apiFetch, formatDate, formatDateTime } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import dynamic from 'next/dynamic';
import {
  Card,
  StatusBadge,
  Button,
  Skeleton,
  EmptyState,
} from '@/components/ui';

const FaceVerificationFormModal = dynamic(
  () =>
    import('@/components/shared/FaceVerificationFormModal').then(
      (m) => m.FaceVerificationFormModal,
    ),
  { ssr: false },
);

export default function MemberSmartAccessPage() {
  const { toast } = useToast();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [faceModalOpen, setFaceModalOpen] = useState(false);

  const loadAccessSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/access-control/my');
      setData(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccessSummary();
  }, [loadAccessSummary]);

  const handleRevokeBiometrics = async () => {
    if (!data?.member?.id) return;
    try {
      await apiFetch(`/access-control/biometrics/${data.member.id}`, {
        method: 'DELETE',
        body: JSON.stringify({
          reason: 'Member revoked biometric consent via Member Portal.',
        }),
      });
      toast({
        title: 'Biometric Data Deleted',
        description:
          'Your encrypted biometric template has been permanently purged.',
        variant: 'info',
      });
      await loadAccessSummary();
    } catch (err: any) {
      toast({
        title: 'Action Failed',
        description: err.message,
        variant: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const bio = data?.biometricEnrollment;
  const mem = data?.membershipValidity;
  const eligibility = data?.accessEligibility;
  const permittedSessions = data?.permittedSessions || [];
  const accessHistory = data?.accessHistory || [];
  const deniedAttempts = data?.recentDeniedAttempts || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Smart Gym Access
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Member Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Turnstile &amp; Biometrics</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Camera className="w-4 h-4" />}
            onClick={() => setFaceModalOpen(true)}
          >
            {bio?.status === 'ENROLLED'
              ? 'Update Recent Face Photo'
              : 'Open Face Verification Registration'}
          </Button>
          {bio?.status === 'ENROLLED' && (
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={handleRevokeBiometrics}
            >
              Revoke &amp; Delete Biometric Data
            </Button>
          )}
          <Link href="/member/membership">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Renew / Manage Plan
            </Button>
          </Link>
        </div>
      </div>

      {/* 3 KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="space-y-2 border-[#C7F464]/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A1A1AA]">Turnstile Eligibility</span>
            <ScanFace className="w-5 h-5 text-[#C7F464]" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {eligibility?.statusLabel || 'BLOCKED'}
          </p>
          <p className="text-xs text-[#A1A1AA]">{eligibility?.reason}</p>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A1A1AA]">Biometric Profile</span>
            <Fingerprint className="w-5 h-5 text-[#C7F464]" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {bio?.status || 'NOT_ENROLLED'}
          </p>
          <p className="text-xs text-[#A1A1AA]">
            {bio?.consentGranted
              ? `Consent Granted (${bio.consentVersion})`
              : 'Explicit consent required before enrollment'}
          </p>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A1A1AA]">
              Validity (Asia/Dhaka)
            </span>
            <ShieldCheck className="w-5 h-5 text-[#C7F464]" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {mem ? `${mem.daysRemaining} Days Left` : 'No Active Plan'}
          </p>
          <p className="text-xs text-[#A1A1AA]">
            {mem
              ? `${mem.planName} • Until ${formatDate(mem.endDate)} 23:59 BST`
              : 'Enroll in a membership plan to unlock entry'}
          </p>
        </Card>
      </div>

      {/* In-House Online Face Verification Registration Card */}
      <Card className="border-[#C7F464]/40 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            {bio?.recentPhotoDataUrl || data?.member?.avatarUrl ? (
              <img
                src={bio?.recentPhotoDataUrl || data?.member?.avatarUrl}
                alt="Member Face Verification Portrait"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#C7F464] shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-[#171717] border-2 border-dashed border-[#3F3F46] flex flex-col items-center justify-center shrink-0">
                <Camera className="w-6 h-6 text-[#A1A1AA]" />
                <span className="text-[10px] font-mono text-[#A1A1AA] mt-1">
                  No Photo
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#C7F464]">
                  In-House Face Verification Portal
                </span>
                {bio?.recentPhotoDataUrl ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    Recent Photo Uploaded
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold">
                    Recent Photo Required
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white">
                {data?.member?.fullName || 'Member'} &bull;{' '}
                <span className="font-mono text-sm text-[#C7F464]">
                  {data?.member?.memberCode}
                </span>
              </h2>
              <p className="text-xs text-[#A1A1AA] max-w-2xl">
                Complete or update your in-house face verification registration
                using auto-filled portal details and a recent front-facing photo.
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            leftIcon={<UserCheck className="w-4 h-4" />}
            onClick={() => setFaceModalOpen(true)}
          >
            {bio?.status === 'ENROLLED'
              ? 'Open Face Verification / Update Photo'
              : 'Complete Face Verification Now'}
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-4 border-t border-[#2C2C2C] text-xs">
          <div className="p-2.5 rounded-lg bg-[#141414] border border-[#262626]">
            <span className="block text-[10px] font-mono uppercase text-[#A1A1AA]">
              Mobile
            </span>
            <span className="font-mono text-white font-semibold">
              {data?.member?.phone || '—'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#141414] border border-[#262626]">
            <span className="block text-[10px] font-mono uppercase text-[#A1A1AA]">
              App Username
            </span>
            <span className="font-mono text-white font-semibold truncate block">
              {data?.member?.appUsername || data?.member?.memberCode || '—'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#141414] border border-[#262626]">
            <span className="block text-[10px] font-mono uppercase text-[#A1A1AA]">
              Blood Group
            </span>
            <span className="font-mono text-[#C7F464] font-semibold">
              {data?.member?.bloodGroup || 'Not Set'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#141414] border border-[#262626]">
            <span className="block text-[10px] font-mono uppercase text-[#A1A1AA]">
              Height / Weight
            </span>
            <span className="font-mono text-white font-semibold">
              {data?.member?.heightCm ? `${data.member.heightCm}cm` : '—'} /{' '}
              {data?.member?.weightKg ? `${data.member.weightKg}kg` : '—'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#141414] border border-[#262626]">
            <span className="block text-[10px] font-mono uppercase text-[#A1A1AA]">
              NID Number
            </span>
            <span className="font-mono text-white font-semibold truncate block">
              {data?.member?.nidNumber || 'Optional'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#141414] border border-[#262626]">
            <span className="block text-[10px] font-mono uppercase text-[#A1A1AA]">
              Last Photo Upload
            </span>
            <span className="font-mono text-white font-semibold">
              {bio?.facePhotoUploadedAt
                ? formatDate(bio.facePhotoUploadedAt)
                : 'Not Uploaded'}
            </span>
          </div>
        </div>
      </Card>

      {/* Permitted Gym Sessions */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">
              Permitted Floor Windows (Asia/Dhaka)
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Access windows matched to your registered profile ({data?.member?.gender || 'MALE'}).
            </p>
          </div>
          <StatusBadge status={data?.member?.gender || 'MALE'} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {permittedSessions.slice(0, 9).map((s: any) => (
            <div
              key={s.id}
              className="p-4 rounded-xl bg-[#171717] border border-[#2C2C2C] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <StatusBadge status={s.sessionType} />
                <span className="text-xs font-mono text-[#C7F464] font-bold">
                  {s.dayOfWeek}
                </span>
              </div>
              <p className="text-sm font-bold text-white">{s.name}</p>
              <p className="text-xs font-mono text-[#A1A1AA]">
                {s.startTime} – {s.endTime} (Asia/Dhaka)
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Denied Attempts */}
      {deniedAttempts.length > 0 && (
        <Card className="border-red-500/40 space-y-3">
          <h2 className="text-base font-bold text-red-400">
            Recent Denied Entry Attempts
          </h2>
          <div className="space-y-2.5">
            {deniedAttempts.slice(0, 5).map((ev: any) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-xl bg-[#171717] border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-red-400">
                    {ev.denialCode}
                  </span>
                  <p className="text-white mt-0.5">{ev.denialReason}</p>
                </div>
                <span className="font-mono text-[#A1A1AA]">
                  {formatDateTime(ev.eventTimestamp)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Personal Access History */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2C2C2C]">
          <h2 className="text-base font-bold text-white">
            Turnstile Entry &amp; Attendance History
          </h2>
        </div>
        {accessHistory.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No Entry Events Recorded Yet"
              description="Your verified gym entries and exits will appear here automatically."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#171717] border-b border-[#2C2C2C] text-xs font-semibold text-[#A1A1AA]">
                  <th className="py-3.5 px-5">Date &amp; Time</th>
                  <th className="py-3.5 px-5">Terminal</th>
                  <th className="py-3.5 px-5">Session</th>
                  <th className="py-3.5 px-5">Method</th>
                  <th className="py-3.5 px-5">Decision</th>
                  <th className="py-3.5 px-5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C2C2C]">
                {accessHistory.map((ev: any) => (
                  <tr key={ev.id} className="hover:bg-[#171717]/60 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs text-[#A1A1AA]">
                      {formatDateTime(ev.eventTimestamp)}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-white font-medium">
                      {ev.device?.name || 'Entrance Terminal'}
                    </td>
                    <td className="py-3.5 px-5">
                      {ev.sessionTypeSnapshot ? (
                        <StatusBadge status={ev.sessionTypeSnapshot} />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={ev.verificationMethod} />
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={ev.accessDecision} />
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#A1A1AA]">
                      {ev.accessDecision === 'GRANTED'
                        ? 'Authorized Entry'
                        : ev.denialReason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <FaceVerificationFormModal
        isOpen={faceModalOpen}
        onClose={() => setFaceModalOpen(false)}
        member={data?.member || null}
        biometricEnrollment={bio}
        onSuccess={loadAccessSummary}
      />
    </div>
  );
}

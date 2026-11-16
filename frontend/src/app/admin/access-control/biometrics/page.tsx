'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Fingerprint, ShieldCheck, Trash2, CheckCircle2, Camera } from 'lucide-react';
import { apiFetch, formatDate } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import dynamic from 'next/dynamic';
import {
  Card,
  Button,
  StatusBadge,
  SearchInput,
  Skeleton,
} from '@/components/ui';

const FaceVerificationFormModal = dynamic(
  () =>
    import('@/components/shared/FaceVerificationFormModal').then(
      (m) => m.FaceVerificationFormModal,
    ),
  { ssr: false },
);

export default function AdminBiometricEnrollmentsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [enrollMember, setEnrollMember] = useState<any | null>(null);

  const loadBiometrics = useCallback(async () => {
    setLoading(true);
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await apiFetch<any[]>(`/access-control/biometrics${q}`);
      setItems(res);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadBiometrics();
  }, [loadBiometrics]);

  const handleDeleteBiometrics = async (member: any) => {
    try {
      await apiFetch(
        `/access-control/biometrics/${member.memberProfileId}`,
        {
          method: 'DELETE',
          body: JSON.stringify({
            reason:
              'Biometric template purged by administrator per privacy policy.',
          }),
        },
      );
      toast({
        title: 'Biometric Template Purged',
        description: `Encrypted template deleted for ${member.user?.fullName}.`,
        variant: 'info',
      });
      await loadBiometrics();
    } catch (err: any) {
      toast({
        title: 'Deletion Failed',
        description: err.message,
        variant: 'error',
      });
    }
  };

  const enrolledCount = items.filter(
    (i) => i.biometricEnrollment?.status === 'ENROLLED',
  ).length;
  const consentedCount = items.filter(
    (i) => i.biometricEnrollment?.consentGranted,
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            BIOMETRIC ENROLLMENT
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span> Access Control{' '}
            <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Biometrics &amp; Privacy</span>
          </p>
        </div>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search member name or code..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-[#A1A1AA]">
              Total Profiles
            </p>
            <p className="font-display text-2xl text-white mt-0.5">
              {items.length}
            </p>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-[#171717] text-[#A1A1AA] border border-[#2C2C2C]">
            Directory
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-[#A1A1AA]">
              Enrolled Templates
            </p>
            <p className="font-display text-2xl text-[#C7F464] mt-0.5">
              {enrolledCount}
            </p>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-[#1B2210] text-[#C7F464]">
            AES-256-GCM
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-[#A1A1AA]">
              Consent Verified
            </p>
            <p className="font-display text-2xl text-emerald-400 mt-0.5">
              {consentedCount}
            </p>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
            Compliant
          </span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center gap-3 text-xs text-[#A1A1AA]">
        <ShieldCheck className="w-5 h-5 text-[#C7F464] shrink-0" />
        <span>
          <strong className="text-white">Biometric Privacy Guarantee:</strong>{' '}
          Templates are encrypted at rest with AES-256-GCM and matched via
          salted SHA-256 digests. Raw facial images are never stored in the
          database, and ciphertexts are stripped from all API responses.
        </span>
      </div>

      {loading ? (
        <Skeleton className="h-80" />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#171717] border-b border-[#2C2C2C] text-xs font-mono uppercase text-[#A1A1AA]">
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Gender</th>
                <th className="py-3.5 px-4">Biometric Status</th>
                <th className="py-3.5 px-4">Explicit Consent</th>
                <th className="py-3.5 px-4">Membership Validity</th>
                <th className="py-3.5 px-4">Retention Expiry</th>
                <th className="py-3.5 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C2C2C]">
              {items.map((item) => {
                const bio = item.biometricEnrollment;
                const mem = item.latestMembership;
                return (
                  <tr
                    key={item.memberProfileId}
                    className="hover:bg-[#171717]/60 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {bio?.recentPhotoDataUrl || item.user?.avatarUrl ? (
                          <img
                            src={bio?.recentPhotoDataUrl || item.user?.avatarUrl}
                            alt={item.user?.fullName || 'Member'}
                            className="w-10 h-10 rounded-lg object-cover border border-[#303030] shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#171717] border border-[#303030] flex items-center justify-center shrink-0">
                            <Camera className="w-4 h-4 text-[#A1A1AA]" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white">
                            {item.user?.fullName}
                          </p>
                          <p className="text-xs font-mono text-[#C7F464]">
                            {item.memberCode}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.gender || 'MALE'} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={bio?.status || 'NOT_ENROLLED'} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#A1A1AA]">
                      {bio?.consentGranted ? (
                        <div>
                          <span className="text-emerald-400 font-semibold">
                            Granted ({bio.consentVersion})
                          </span>
                          <p className="font-mono text-[11px]">
                            {formatDate(bio.consentGrantedAt)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-amber-400">Not Granted</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {mem ? (
                        <div>
                          <StatusBadge status={mem.status} />
                          <p className="text-xs text-[#A1A1AA] mt-1">
                            {mem.planName} • Exp: {formatDate(mem.endDate)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-[#A1A1AA]">No Plan</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#A1A1AA]">
                      {bio?.retentionExpiresAt
                        ? formatDate(bio.retentionExpiresAt)
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Fingerprint className="w-3.5 h-3.5" />}
                          onClick={() => setEnrollMember(item)}
                        >
                          {bio?.status === 'ENROLLED'
                            ? 'Re-Enroll / Photo'
                            : 'Enroll Face'}
                        </Button>
                        {bio?.status === 'ENROLLED' && (
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                            onClick={() => handleDeleteBiometrics(item)}
                          >
                            Purge Data
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <FaceVerificationFormModal
        isOpen={Boolean(enrollMember)}
        onClose={() => setEnrollMember(null)}
        member={
          enrollMember
            ? {
                id: enrollMember.memberProfileId,
                memberCode: enrollMember.memberCode,
                fullName: enrollMember.user?.fullName,
                email: enrollMember.user?.email,
                phone: enrollMember.user?.phone,
                avatarUrl: enrollMember.user?.avatarUrl,
                appUsername: enrollMember.appUsername,
                address: enrollMember.address,
                gender: enrollMember.gender,
                dateOfBirth: enrollMember.dateOfBirth,
                nidNumber: enrollMember.nidNumber,
                bloodGroup: enrollMember.bloodGroup,
                heightCm: enrollMember.heightCm,
                weightKg: enrollMember.weightKg,
                rfidCardNumber: enrollMember.rfidCardNumber,
                facebookUrl: enrollMember.facebookUrl,
              }
            : null
        }
        biometricEnrollment={enrollMember?.biometricEnrollment}
        onSuccess={loadBiometrics}
      />
    </div>
  );
}


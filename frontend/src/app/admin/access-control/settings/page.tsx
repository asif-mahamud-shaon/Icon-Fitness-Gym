'use client';

import React, { useEffect, useState } from 'react';
import { Save, ShieldCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Card, Button, Input, Select, Textarea, Skeleton } from '@/components/ui';

export default function AdminAccessControlSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    timezone: 'Asia/Dhaka',
    enforceGenderSessions: 'true',
    requireFemaleTrainerPresence: 'true',
    allowFemaleInMaleSession: 'true',
    blockEntryWhenNoActiveSession: 'false',
    minFaceMatchConfidence: '0.85',
    requireLivenessDetection: 'true',
    deviceHeartbeatTimeoutSec: '90',
    callbackReplayWindowSec: '60',
    biometricRetentionDays: '365',
    trainerCheckInAlertLeadMinutes: '15',
    allowStaffManualOverride: 'true',
    emergencyEgressNote: '',
  });

  useEffect(() => {
    apiFetch<any>('/access-control/settings')
      .then((res) => {
        setForm({
          timezone: res.timezone || 'Asia/Dhaka',
          enforceGenderSessions: String(res.enforceGenderSessions ?? true),
          requireFemaleTrainerPresence: String(
            res.requireFemaleTrainerPresence ?? true,
          ),
          allowFemaleInMaleSession: String(
            res.allowFemaleInMaleSession ?? true,
          ),
          blockEntryWhenNoActiveSession: String(
            res.blockEntryWhenNoActiveSession ?? false,
          ),
          minFaceMatchConfidence: String(res.minFaceMatchConfidence ?? 0.85),
          requireLivenessDetection: String(
            res.requireLivenessDetection ?? true,
          ),
          deviceHeartbeatTimeoutSec: String(
            res.deviceHeartbeatTimeoutSec ?? 90,
          ),
          callbackReplayWindowSec: String(res.callbackReplayWindowSec ?? 60),
          biometricRetentionDays: String(res.biometricRetentionDays ?? 365),
          trainerCheckInAlertLeadMinutes: String(
            res.trainerCheckInAlertLeadMinutes ?? 15,
          ),
          allowStaffManualOverride: String(
            res.allowStaffManualOverride ?? true,
          ),
          emergencyEgressNote: res.emergencyEgressNote || '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/access-control/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          timezone: form.timezone,
          enforceGenderSessions: form.enforceGenderSessions === 'true',
          requireFemaleTrainerPresence:
            form.requireFemaleTrainerPresence === 'true',
          allowFemaleInMaleSession: form.allowFemaleInMaleSession === 'true',
          blockEntryWhenNoActiveSession:
            form.blockEntryWhenNoActiveSession === 'true',
          minFaceMatchConfidence: Number(form.minFaceMatchConfidence),
          requireLivenessDetection: form.requireLivenessDetection === 'true',
          deviceHeartbeatTimeoutSec: Number(form.deviceHeartbeatTimeoutSec),
          callbackReplayWindowSec: Number(form.callbackReplayWindowSec),
          biometricRetentionDays: Number(form.biometricRetentionDays),
          trainerCheckInAlertLeadMinutes: Number(
            form.trainerCheckInAlertLeadMinutes,
          ),
          allowStaffManualOverride: form.allowStaffManualOverride === 'true',
          emergencyEgressNote: form.emergencyEgressNote,
        }),
      });
      toast({
        title: 'Access Control Security Settings Updated',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to Update Settings',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
          ACCESS SECURITY SETTINGS
        </h1>
        <p className="text-xs font-mono text-[#A1A1AA] mt-1">
          Admin Portal <span className="mx-1">&gt;</span> Access Control{' '}
          <span className="mx-1">&gt;</span>{' '}
          <span className="text-white">Security &amp; Biometric Rules</span>
        </p>
      </div>

      <Card className="space-y-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Authoritative Gym Timezone"
              value={form.timezone}
              disabled
            />
            <Select
              label="Enforce Gender-Based Gym Sessions"
              value={form.enforceGenderSessions}
              onChange={(e) =>
                setForm({ ...form, enforceGenderSessions: e.target.value })
              }
              options={[
                { value: 'true', label: 'Enabled (Mandatory)' },
                { value: 'false', label: 'Disabled' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Require Checked-In Female Trainer During Female Sessions"
              value={form.requireFemaleTrainerPresence}
              onChange={(e) =>
                setForm({
                  ...form,
                  requireFemaleTrainerPresence: e.target.value,
                })
              }
              options={[
                {
                  value: 'true',
                  label: 'Required (Block Entry if Trainer Not Checked In)',
                },
                { value: 'false', label: 'Not Required' },
              ]}
            />
            <Select
              label="Permit Female Members During Male / General Sessions"
              value={form.allowFemaleInMaleSession}
              onChange={(e) =>
                setForm({ ...form, allowFemaleInMaleSession: e.target.value })
              }
              options={[
                {
                  value: 'true',
                  label: 'Permitted (Valid Membership Required)',
                },
                { value: 'false', label: 'Restricted to Female Sessions Only' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Min Face Match Confidence (0.5 - 0.99)"
              type="number"
              step="0.01"
              min="0.5"
              max="0.99"
              value={form.minFaceMatchConfidence}
              onChange={(e) =>
                setForm({ ...form, minFaceMatchConfidence: e.target.value })
              }
            />
            <Select
              label="Anti-Spoofing Liveness Check"
              value={form.requireLivenessDetection}
              onChange={(e) =>
                setForm({ ...form, requireLivenessDetection: e.target.value })
              }
              options={[
                { value: 'true', label: 'Required (Block Photo/Video Spoofs)' },
                { value: 'false', label: 'Optional' },
              ]}
            />
            <Input
              label="Biometric Retention Period (Days)"
              type="number"
              value={form.biometricRetentionDays}
              onChange={(e) =>
                setForm({ ...form, biometricRetentionDays: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Device Heartbeat Timeout (Seconds)"
              type="number"
              value={form.deviceHeartbeatTimeoutSec}
              onChange={(e) =>
                setForm({ ...form, deviceHeartbeatTimeoutSec: e.target.value })
              }
            />
            <Input
              label="Webhook Replay Window (Seconds)"
              type="number"
              value={form.callbackReplayWindowSec}
              onChange={(e) =>
                setForm({ ...form, callbackReplayWindowSec: e.target.value })
              }
            />
            <Select
              label="Authorized Staff Manual Entry Verification"
              value={form.allowStaffManualOverride}
              onChange={(e) =>
                setForm({ ...form, allowStaffManualOverride: e.target.value })
              }
              options={[
                { value: 'true', label: 'Enabled (With Mandatory Audit Log)' },
                { value: 'false', label: 'Disabled' },
              ]}
            />
          </div>

          <Textarea
            label="Emergency Egress & Life-Safety Policy Statement"
            value={form.emergencyEgressNote}
            onChange={(e) =>
              setForm({ ...form, emergencyEgressNote: e.target.value })
            }
          />

          <Button
            type="submit"
            variant="primary"
            isLoading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Security Settings
          </Button>
        </form>
      </Card>
    </div>
  );
}


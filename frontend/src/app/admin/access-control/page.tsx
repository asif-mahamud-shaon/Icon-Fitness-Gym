'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ScanFace,
  ShieldCheck,
  ShieldAlert,
  Users,
  Cpu,
  AlertTriangle,
  Play,
  UserCheck,
  DoorOpen,
  Clock,
  Lock,
} from 'lucide-react';
import { apiFetch, formatDateTime } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Card,
  StatCard,
  StatusBadge,
  Button,
  Modal,
  Select,
  Input,
  Textarea,
  Skeleton,
} from '@/components/ui';

export default function AdminAccessControlOverviewPage() {
  const { toast } = useToast();
  const [data, setData] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulator modal state
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [simForm, setSimForm] = useState({
    memberProfileId: '',
    deviceId: '',
    gymSessionIdOverride: '',
    direction: 'ENTRY',
    faceRecognized: 'true',
    recognitionScore: '0.97',
    livenessPassed: 'true',
  });
  const [simSubmitting, setSimSubmitting] = useState(false);
  const [lastSimResult, setLastSimResult] = useState<any | null>(null);
  const [checkingInTrainer, setCheckingInTrainer] = useState(false);

  // Manual staff verification modal state
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    memberProfileId: '',
    deviceId: '',
    notes: 'Verified member ID card at Ashkona front desk',
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, membersRes, sessionsRes] = await Promise.all([
        apiFetch<any>('/access-control/overview'),
        apiFetch<any>('/members?limit=100').catch(() => ({ items: [] })),
        apiFetch<any[]>('/access-control/sessions').catch(() => []),
      ]);
      setData(overviewRes);
      const memberList = membersRes.items || membersRes || [];
      setMembers(memberList);
      setSessions(sessionsRes);

      if (memberList.length > 0 && !simForm.memberProfileId) {
        setSimForm((prev) => ({
          ...prev,
          memberProfileId: memberList[0].id,
          deviceId: overviewRes?.devices?.[0]?.id || '',
        }));
        setManualForm((prev) => ({
          ...prev,
          memberProfileId: memberList[0].id,
          deviceId: overviewRes?.devices?.[0]?.id || '',
        }));
      }
    } catch (err: any) {
      toast({
        title: 'Failed to Load Access Control Overview',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [simForm.memberProfileId, toast]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleSimulateAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimSubmitting(true);
    try {
      const res = await apiFetch<any>('/access-control/simulate-entry', {
        method: 'POST',
        body: JSON.stringify({
          memberProfileId: simForm.memberProfileId || undefined,
          deviceId: simForm.deviceId || undefined,
          gymSessionIdOverride: simForm.gymSessionIdOverride || undefined,
          direction: simForm.direction,
          faceRecognized: simForm.faceRecognized === 'true',
          recognitionScore: Number(simForm.recognitionScore),
          livenessPassed: simForm.livenessPassed === 'true',
        }),
      });
      setLastSimResult(res);
      toast({
        title:
          res.accessDecision === 'GRANTED'
            ? 'Simulated Entry GRANTED (Door Unlocked)'
            : `Simulated Entry DENIED (${res.denialCode})`,
        description:
          res.denialReason ||
          'All membership, session, and trainer presence checks passed.',
        variant: res.accessDecision === 'GRANTED' ? 'success' : 'error',
      });
      await loadOverview();
    } catch (err: any) {
      toast({
        title: 'Simulation Error',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setSimSubmitting(false);
    }
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualSubmitting(true);
    try {
      const res = await apiFetch<any>('/access-control/manual-verify', {
        method: 'POST',
        body: JSON.stringify(manualForm),
      });
      toast({
        title:
          res.accessDecision === 'GRANTED'
            ? 'Manual Staff Verification: Entry Granted'
            : `Manual Verification Blocked (${res.denialCode})`,
        description:
          res.denialReason || 'Logged staff manual verification in Audit Log.',
        variant: res.accessDecision === 'GRANTED' ? 'success' : 'error',
      });
      setManualModalOpen(false);
      await loadOverview();
    } catch (err: any) {
      toast({
        title: 'Manual Verification Failed',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleQuickFemaleTrainerCheckIn = async (
    gymSessionId: string,
    trainerProfileId: string,
    trainerName?: string,
  ) => {
    setCheckingInTrainer(true);
    try {
      await apiFetch('/access-control/trainer-attendance', {
        method: 'POST',
        body: JSON.stringify({
          gymSessionId,
          trainerProfileId,
          status: 'PRESENT',
          notes: 'Checked in via Access Control Simulator',
        }),
      });
      setLastSimResult(null);
      toast({
        title: 'Female Trainer Checked In (PRESENT)',
        description: `${trainerName || 'Assigned Female Trainer'} is now checked in. Female Session entry is unlocked—run scan again to verify GRANTED.`,
        variant: 'success',
      });
      await loadOverview();
    } catch (err: any) {
      toast({
        title: 'Trainer Check-In Failed',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setCheckingInTrainer(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const currentSession = data?.currentSession;
  const alerts = data?.alerts || [];
  const denialBreakdown: Array<{ denialCode: string; count: number }> =
    data?.denialBreakdown || [];
  const devices = data?.devices || [];
  const emergencySafety = data?.emergencySafetyStatus || {};
  const todayDayOfWeek = data?.dhakaTime?.dayOfWeek || '';
  const todaySessions = sessions
    .filter((s) => s.isActive && s.dayOfWeek === todayDayOfWeek)
    .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
  const totalDenialsToday = denialBreakdown.reduce(
    (sum, item) => sum + Number(item.count || 0),
    0,
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            SMART FACE RECOGNITION &amp; ACCESS CONTROL
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <p className="text-xs font-mono text-[#A1A1AA]">
              Admin Portal <span className="mx-1">&gt;</span>{' '}
              <span className="text-white">Access Control Hub</span>
            </p>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1B2210] text-[#C7F464] border border-[#C7F464]/30">
              <Clock className="w-3 h-3" />
              {data?.dhakaTime?.dayOfWeek} • {data?.dhakaTime?.dateKey}{' '}
              {data?.dhakaTime?.timeHHmm} ({data?.dhakaTime?.timezone})
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Play className="w-4 h-4" />}
            onClick={() => setSimModalOpen(true)}
          >
            Simulate Face Entry
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<UserCheck className="w-4 h-4" />}
            onClick={() => setManualModalOpen(true)}
          >
            Staff Manual Verification
          </Button>
        </div>
      </div>

      {/* Hardware Simulation & Emergency Safety Notice */}
      <div className="p-5 rounded-2xl bg-[#141414] border border-[#C7F464]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#A1A1AA]">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1B2210] flex items-center justify-center shrink-0">
            <ScanFace className="w-5 h-5 text-[#C7F464]" />
          </div>
          <div>
            <p className="text-white font-semibold">
              Development Simulator Mode Active — Emergency Egress Hardware
              Independent
            </p>
            <p className="mt-1">
              Simulated recognition events and door relay commands are clearly
              badged as{' '}
              <span className="font-mono text-amber-300">SIMULATED</span> until
              physical facial recognition terminals are connected. Physical
              emergency exits and break-glass releases operate 100%
              independently of software, database, or network status.
            </p>
          </div>
        </div>
        <Link href="/admin/access-control/devices">
          <Button variant="outline" size="sm">
            Configure Terminals
          </Button>
        </Link>
      </div>

      {/* Administrative Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert: any, idx: number) => (
            <div
              key={`${alert.code}-${idx}`}
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                alert.severity === 'CRITICAL'
                  ? 'bg-red-500/10 border-red-500/40 text-red-400'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-400'
              }`}
            >
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{alert.title}</p>
                <p className="text-xs mt-0.5">{alert.message}</p>
              </div>
              <Link href="/admin/access-control/trainer-attendance">
                <Button variant="secondary" size="sm">
                  Resolve Now
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Successful Entries Today"
          value={metrics.todayGrantedEntries ?? 0}
          subValue="Authorized door unlocks (Asia/Dhaka)"
          icon={<DoorOpen className="w-5 h-5" />}
          accent
        />
        <StatCard
          label="Denied Attempts Today"
          value={metrics.todayDeniedAttempts ?? 0}
          subValue="Blocked by expiry, payment, or session rule"
          icon={<ShieldAlert className="w-5 h-5" />}
        />
        <StatCard
          label="Current Gym Occupancy"
          value={metrics.currentOccupancy ?? 0}
          subValue={`Entries (${metrics.todayGrantedEntries ?? 0}) minus Exits (${metrics.todayGrantedExits ?? 0})`}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="Connected Terminals"
          value={`${metrics.onlineDevicesCount ?? 0} / ${(metrics.onlineDevicesCount ?? 0) + (metrics.offlineDevicesCount ?? 0)}`}
          subValue={`${metrics.enrolledBiometricsCount ?? 0} members biometrically enrolled`}
          icon={<Cpu className="w-5 h-5" />}
        />
      </div>

      {/* Secondary Status Row: Active Session, Female Trainer Presence & Membership Eligibility */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#303030] pb-3">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#C7F464]">
                ACTIVE GYM SESSION (ASIA/DHAKA)
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">
                {currentSession
                  ? currentSession.name
                  : 'No Scheduled Session Window Currently Active'}
              </h2>
            </div>
            {currentSession && (
              <StatusBadge status={currentSession.sessionType} />
            )}
          </div>

          {currentSession ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="p-3.5 rounded-lg bg-[#171717] border border-[#303030]">
                <p className="text-xs text-[#A1A1AA]">Session Window</p>
                <p className="font-mono font-bold text-white mt-1">
                  {currentSession.dayOfWeek} • {currentSession.startTime} –{' '}
                  {currentSession.endTime}
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-[#171717] border border-[#303030]">
                <p className="text-xs text-[#A1A1AA]">Gender Access Policy</p>
                <p className="font-semibold text-white mt-1">
                  {currentSession.sessionType === 'FEMALE_SESSION'
                    ? 'Female Members Only (Males Strictly Denied)'
                    : 'Male & Female Members (Valid Membership)'}
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-[#171717] border border-[#303030]">
                <p className="text-xs text-[#A1A1AA]">
                  Female Trainer Verification
                </p>
                {currentSession.sessionType === 'FEMALE_SESSION' ? (
                  <div className="mt-1">
                    <StatusBadge
                      status={
                        currentSession.femaleTrainerPresence
                          ?.isFemaleTrainerPresent
                          ? 'PRESENT'
                          : 'ABSENT'
                      }
                    />
                    <p className="text-xs text-[#A1A1AA] mt-1">
                      {currentSession.femaleTrainerPresence
                        ?.presentTrainerName ||
                        currentSession.femaleTrainerPresence
                          ?.assignedTrainerName ||
                        'Unassigned'}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[#A1A1AA] mt-1">
                    Standard Floor Coaching (Male/General Session)
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#A1A1AA]">
              Configure or adjust Male and Female session operating windows in{' '}
              <Link
                href="/admin/access-control/sessions"
                className="text-[#C7F464] underline"
              >
                Gym Session Management
              </Link>
              .
            </p>
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold text-white uppercase font-display tracking-wide">
            Membership Eligibility Summary
          </h2>
          <div className="space-y-3 text-sm">
            <div className="p-3.5 rounded-lg bg-[#171717] border border-[#303030] flex items-center justify-between">
              <span className="text-[#A1A1AA]">Active Eligible Memberships</span>
              <span className="font-mono font-bold text-emerald-400">
                {metrics.activeEligibleMembershipsCount ?? 0}
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-[#171717] border border-[#303030] flex items-center justify-between">
              <span className="text-[#A1A1AA]">Expired Access Blocks</span>
              <span className="font-mono font-bold text-red-400">
                {metrics.expiredMembershipsCount ?? 0}
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-[#171717] border border-[#303030] flex items-center justify-between">
              <span className="text-[#A1A1AA]">Biometric Profiles Enrolled</span>
              <span className="font-mono font-bold text-[#C7F464]">
                {metrics.enrolledBiometricsCount ?? 0}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Command Overview: Today's Floor Schedule, Security Denial Analytics & Hardware Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Today's Asia/Dhaka Floor Schedule */}
        <Card className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#303030] pb-3">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#C7F464]">
                Daily Operating Schedule ({todayDayOfWeek || 'Asia/Dhaka'})
              </span>
              <h2 className="text-lg font-bold text-white uppercase font-display tracking-wide">
                Today&apos;s Gym Sessions &amp; Coaching Coverage
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <Link
                href="/admin/access-control/sessions"
                className="text-[#C7F464] hover:underline"
              >
                Manage Sessions →
              </Link>
              <Link
                href="/admin/access-control/trainer-attendance"
                className="text-[#A1A1AA] hover:text-white underline"
              >
                Trainer Check-In →
              </Link>
            </div>
          </div>

          {todaySessions.length === 0 ? (
            <div className="p-6 rounded-xl bg-[#171717] border border-[#2C2C2C] text-center space-y-2">
              <p className="text-sm font-semibold text-white">
                No Active Sessions Scheduled Today ({todayDayOfWeek})
              </p>
              <p className="text-xs text-[#A1A1AA]">
                Configure daily operating blocks inside Gym Session Management.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySessions.map((ses: any) => {
                const isLiveNow = currentSession?.id === ses.id;
                const assignedCoach =
                  ses.trainerAssignments?.[0]?.replacementTrainer?.user?.fullName ||
                  ses.trainerAssignments?.[0]?.trainerProfile?.user?.fullName ||
                  null;

                return (
                  <div
                    key={ses.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isLiveNow
                        ? 'bg-[#1B2210] border-[#C7F464]/60'
                        : 'bg-[#171717] border-[#2C2C2C]'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#C7F464]">
                          {ses.startTime} – {ses.endTime}
                        </span>
                        <StatusBadge status={ses.sessionType} />
                        {isLiveNow && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C7F464] text-[#090909] text-[10px] font-mono font-bold uppercase">
                            Live Now
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-white truncate">
                        {ses.name}
                      </p>
                      <p className="text-xs text-[#A1A1AA]">
                        {ses.sessionType === 'FEMALE_SESSION'
                          ? `Female Members Only • Assigned Trainer: ${assignedCoach || 'Unassigned'}`
                          : `General / Male & Female Floor • Capacity: ${ses.maxCapacity || 60} members`}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {ses.sessionType === 'FEMALE_SESSION' ? (
                        isLiveNow ? (
                          <StatusBadge
                            status={
                              currentSession?.femaleTrainerPresence
                                ?.isFemaleTrainerPresent
                                ? 'PRESENT'
                                : 'ABSENT'
                            }
                          />
                        ) : (
                          <Link href="/admin/access-control/trainer-assignments">
                            <Button size="sm" variant="secondary">
                              {assignedCoach ? 'Trainer Assigned' : 'Assign Coach'}
                            </Button>
                          </Link>
                        )
                      ) : (
                        <span className="text-xs font-mono text-[#A1A1AA]">
                          {ses.gracePeriodMinutes ?? 10}m grace
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right: Denial Analytics + Connected Terminals & Quick Actions */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#303030] pb-3">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-red-400">
                  Security Diagnostics (Today)
                </span>
                <h2 className="text-lg font-bold text-white uppercase font-display tracking-wide">
                  Denial Reason Breakdown
                </h2>
              </div>
              <Link
                href="/admin/access-control/denied"
                className="text-xs font-mono text-red-400 hover:underline"
              >
                Denied Logs →
              </Link>
            </div>

            {denialBreakdown.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  Zero blocked entry attempts recorded today in Asia/Dhaka.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {denialBreakdown.map((item) => {
                  const pct =
                    totalDenialsToday > 0
                      ? Math.round((item.count / totalDenialsToday) * 100)
                      : 0;
                  return (
                    <div key={item.denialCode} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-semibold text-white truncate">
                          {String(item.denialCode).replace(/_/g, ' ')}
                        </span>
                        <span className="text-red-400 font-bold shrink-0">
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#171717] border border-[#2C2C2C] overflow-hidden">
                        <div
                          className="h-full bg-red-500/75 rounded-full"
                          style={{ width: `${Math.max(8, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#303030] pb-3">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#C7F464]">
                  Hardware &amp; Safety Posture
                </span>
                <h2 className="text-lg font-bold text-white uppercase font-display tracking-wide">
                  Turnstile Terminals ({devices.length})
                </h2>
              </div>
              <Link
                href="/admin/access-control/settings"
                className="text-xs font-mono text-[#C7F464] hover:underline"
              >
                Rules &amp; Settings →
              </Link>
            </div>

            <div className="space-y-2.5">
              {devices.map((dev: any) => (
                <div
                  key={dev.id}
                  className="p-3 rounded-xl bg-[#171717] border border-[#2C2C2C] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white truncate">
                        {dev.name}
                      </p>
                      {dev.isSimulated && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                          SIM
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-[#A1A1AA] truncate">
                      {dev.locationZone || dev.deviceCode} • Unlock{' '}
                      {dev.doorUnlockDurationSec ?? 5}s
                      {dev.lastHeartbeatAt
                        ? ` • Ping ${formatDateTime(dev.lastHeartbeatAt)}`
                        : ''}
                    </p>
                  </div>
                  <StatusBadge
                    status={dev.health?.isReachable ? 'ACTIVE' : 'ABSENT'}
                  />
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between gap-2 text-[11px] font-mono text-[#A1A1AA]">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#C7F464] shrink-0" />
                <span>
                  {emergencySafety?.failSecureDefault
                    ? 'Fail-Secure Lock • Independent Egress Active'
                    : 'Independent Emergency Exit Egress Active'}
                </span>
              </span>
              <Link
                href="/admin/access-control/history"
                className="text-[#C7F464] hover:underline shrink-0"
              >
                All History →
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Development Face Recognition Simulator Modal */}
      <Modal
        isOpen={simModalOpen}
        onClose={() => setSimModalOpen(false)}
        title="Simulated Facial Recognition Terminal & Door Controller"
        description="Tests the authoritative backend access control engine (Membership Validity + Payment Verification + Gender Session + Female Trainer Presence). Clearly marked as SIMULATED."
        size="lg"
      >
        {(() => {
          const selectedSimMember = members.find(
            (m) => m.id === simForm.memberProfileId,
          );
          const effectiveTargetSession = simForm.gymSessionIdOverride
            ? sessions.find((s) => s.id === simForm.gymSessionIdOverride) || null
            : currentSession || null;
          const matchingGeneralSession =
            sessions.find(
              (s) =>
                s.isActive &&
                s.sessionType === 'MALE_SESSION' &&
                s.dayOfWeek === data?.dhakaTime?.dayOfWeek,
            ) ||
            sessions.find((s) => s.isActive && s.sessionType === 'MALE_SESSION') ||
            null;
          const matchingFemaleMember =
            members.find((m) => m.gender === 'FEMALE') || null;
          const isGenderMismatch = Boolean(
            selectedSimMember &&
              effectiveTargetSession?.sessionType === 'FEMALE_SESSION' &&
              selectedSimMember.gender !== 'FEMALE',
          );
          const effectiveSessionWithAssignments =
            sessions.find((s) => s.id === effectiveTargetSession?.id) || null;
          const assignedTrainerAssignment =
            effectiveSessionWithAssignments?.trainerAssignments?.find(
              (a: any) => a?.trainerProfileId,
            ) || null;
          const assignedTrainerName =
            assignedTrainerAssignment?.trainerProfile?.user?.fullName ||
            currentSession?.femaleTrainerPresence?.assignedTrainerName ||
            'Female Trainer';
          const isFemaleTrainerAbsentNow = Boolean(
            effectiveTargetSession?.sessionType === 'FEMALE_SESSION' &&
              currentSession?.id === effectiveTargetSession?.id &&
              currentSession?.femaleTrainerPresence &&
              !currentSession.femaleTrainerPresence.isFemaleTrainerPresent,
          );

          return (
            <form onSubmit={handleSimulateAccess} className="space-y-4">
              {/* Live Session Context & Gender Policy Banner */}
              <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#C7F464]">
                    {simForm.gymSessionIdOverride
                      ? 'Manual Session Override Selected'
                      : `Live Asia/Dhaka Clock (${data?.dhakaTime?.dayOfWeek || ''} ${data?.dhakaTime?.timeHHmm || ''})`}
                  </p>
                  <p className="text-xs font-bold text-white truncate">
                    {effectiveTargetSession
                      ? `${effectiveTargetSession.name} (${effectiveTargetSession.startTime}–${effectiveTargetSession.endTime})`
                      : 'No Active Gym Session Window Right Now'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {effectiveTargetSession && (
                    <StatusBadge status={effectiveTargetSession.sessionType} />
                  )}
                  <Link
                    href="/admin/access-control/sessions"
                    className="text-[11px] font-mono text-[#C7F464] hover:underline whitespace-nowrap"
                  >
                    Edit Hours →
                  </Link>
                </div>
              </div>

              {isGenderMismatch && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs space-y-2.5">
                  <p className="font-semibold text-white">
                    Policy Preview:{' '}
                    <span className="text-amber-400">
                      {selectedSimMember?.user?.fullName} ({selectedSimMember?.gender || 'MALE'})
                    </span>{' '}
                    will be denied under a Female Session (`FEMALE_SESSION_RESTRICTED`).
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {matchingGeneralSession && (
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={() =>
                          setSimForm({
                            ...simForm,
                            gymSessionIdOverride: matchingGeneralSession.id,
                          })
                        }
                      >
                        Test with {matchingGeneralSession.startTime}–{matchingGeneralSession.endTime} General Session
                      </Button>
                    )}
                    {matchingFemaleMember && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setSimForm({
                            ...simForm,
                            memberProfileId: matchingFemaleMember.id,
                          })
                        }
                      >
                        Test Female Member ({matchingFemaleMember.user?.fullName})
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {!isGenderMismatch &&
                isFemaleTrainerAbsentNow &&
                effectiveTargetSession && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs space-y-2.5">
                    <p className="font-semibold text-white">
                      Trainer Presence Required:{' '}
                      <span className="text-amber-400">
                        {assignedTrainerName}
                      </span>{' '}
                      has not checked in for today&apos;s Female Session yet. Check
                      her in first so eligible Female Members can enter.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {assignedTrainerAssignment ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="primary"
                          isLoading={checkingInTrainer}
                          onClick={() =>
                            handleQuickFemaleTrainerCheckIn(
                              effectiveTargetSession.id,
                              assignedTrainerAssignment.trainerProfileId,
                              assignedTrainerName,
                            )
                          }
                        >
                          Check In {assignedTrainerName} Now (PRESENT)
                        </Button>
                      ) : (
                        <Link href="/admin/access-control/trainer-assignments">
                          <Button type="button" size="sm" variant="primary">
                            Assign Female Trainer First →
                          </Button>
                        </Link>
                      )}
                      <Link href="/admin/access-control/trainer-attendance">
                        <Button type="button" size="sm" variant="secondary">
                          Open Trainer Attendance →
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Select Member to Scan *"
                  value={simForm.memberProfileId}
                  onChange={(e) =>
                    setSimForm({ ...simForm, memberProfileId: e.target.value })
                  }
                  options={[
                    { value: '', label: '— Unidentified / Unknown Face —' },
                    ...members.map((m) => ({
                      value: m.id,
                      label: `${m.user?.fullName} (${m.memberCode} • ${m.gender || 'MALE'})`,
                    })),
                  ]}
                />
                <Select
                  label="Terminal Device *"
                  value={simForm.deviceId}
                  onChange={(e) =>
                    setSimForm({ ...simForm, deviceId: e.target.value })
                  }
                  options={devices.map((d: any) => ({
                    value: d.id,
                    label: `${d.name} (${d.status})`,
                  }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Target Gym Session (Optional Override for Testing)"
                  value={simForm.gymSessionIdOverride}
                  onChange={(e) =>
                    setSimForm({
                      ...simForm,
                      gymSessionIdOverride: e.target.value,
                    })
                  }
                  options={[
                    {
                      value: '',
                      label: currentSession
                        ? `Live Clock: ${currentSession.name} (${currentSession.sessionType})`
                        : 'Use Live Asia/Dhaka Clock Session',
                    },
                    ...sessions.map((s) => ({
                      value: s.id,
                      label: `${s.dayOfWeek} • ${s.name} (${s.sessionType} ${s.startTime}-${s.endTime})`,
                    })),
                  ]}
                />
                <Select
                  label="Direction"
                  value={simForm.direction}
                  onChange={(e) =>
                    setSimForm({ ...simForm, direction: e.target.value })
                  }
                  options={[
                    { value: 'ENTRY', label: 'ENTRY (Turnstile In)' },
                    { value: 'EXIT', label: 'EXIT (Turnstile Out)' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Face Recognized?"
                  value={simForm.faceRecognized}
                  onChange={(e) =>
                    setSimForm({ ...simForm, faceRecognized: e.target.value })
                  }
                  options={[
                    { value: 'true', label: 'Yes (Face Matched)' },
                    { value: 'false', label: 'No (Face Not Recognized)' },
                  ]}
                />
                <Input
                  label="Confidence Score (0.0 - 1.0)"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={simForm.recognitionScore}
                  onChange={(e) =>
                    setSimForm({ ...simForm, recognitionScore: e.target.value })
                  }
                />
                <Select
                  label="Anti-Spoofing Liveness"
                  value={simForm.livenessPassed}
                  onChange={(e) =>
                    setSimForm({ ...simForm, livenessPassed: e.target.value })
                  }
                  options={[
                    { value: 'true', label: 'Passed (Live Person)' },
                    { value: 'false', label: 'Failed (Photo/Spoof Attempt)' },
                  ]}
                />
              </div>

              {lastSimResult && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    lastSimResult.accessDecision === 'GRANTED'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : 'bg-red-500/10 border-red-500/40 text-red-400'
                  }`}
                >
                  <p className="font-bold text-sm text-white">
                    Simulator Result: {lastSimResult.accessDecision}{' '}
                    {lastSimResult.denialCode
                      ? `(${lastSimResult.denialCode})`
                      : ''}
                  </p>
                  <p>
                    Door Controller Status:{' '}
                    <span className="font-mono font-bold text-white">
                      {lastSimResult.doorCommandStatus}
                    </span>
                  </p>
                  {lastSimResult.denialReason && (
                    <p className="text-white/90 leading-relaxed">
                      Reason: {lastSimResult.denialReason}
                    </p>
                  )}
                  {lastSimResult.denialCode === 'FEMALE_SESSION_RESTRICTED' &&
                    matchingGeneralSession && (
                      <div className="pt-1 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setSimForm({
                              ...simForm,
                              gymSessionIdOverride: matchingGeneralSession.id,
                            })
                          }
                        >
                          Switch to Male/General Session ({matchingGeneralSession.startTime}–{matchingGeneralSession.endTime})
                        </Button>
                        <Link href="/admin/access-control/sessions">
                          <Button type="button" size="sm" variant="outline">
                            Adjust Ladies Session Hours
                          </Button>
                        </Link>
                      </div>
                    )}
                  {lastSimResult.denialCode === 'FEMALE_TRAINER_UNAVAILABLE' &&
                    effectiveTargetSession && (
                      <div className="pt-1 flex flex-wrap gap-2">
                        {assignedTrainerAssignment && (
                          <Button
                            type="button"
                            size="sm"
                            variant="primary"
                            isLoading={checkingInTrainer}
                            onClick={() =>
                              handleQuickFemaleTrainerCheckIn(
                                effectiveTargetSession.id,
                                assignedTrainerAssignment.trainerProfileId,
                                assignedTrainerName,
                              )
                            }
                          >
                            Check In {assignedTrainerName} Now (Unlock Entry)
                          </Button>
                        )}
                        <Link href="/admin/access-control/trainer-attendance">
                          <Button type="button" size="sm" variant="secondary">
                            Open Trainer Attendance →
                          </Button>
                        </Link>
                      </div>
                    )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2C2C2C]">
                {simForm.gymSessionIdOverride ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSimForm({ ...simForm, gymSessionIdOverride: '' })
                    }
                    className="text-xs font-mono text-[#A1A1AA] hover:text-white underline"
                  >
                    Reset to Live Dhaka Clock
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setSimModalOpen(false)}
                  >
                    Close
                  </Button>
                  <Button type="submit" variant="primary" isLoading={simSubmitting}>
                    Run Simulated Face Scan
                  </Button>
                </div>
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* Staff Manual Verification Modal */}
      <Modal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        title="Authorized Staff Manual Entry Verification"
        description="Used when a biometric terminal is under maintenance or for front-desk verification. Still enforces active membership, payment, and gender session rules."
      >
        <form onSubmit={handleManualVerify} className="space-y-4">
          <Select
            label="Select Member *"
            value={manualForm.memberProfileId}
            onChange={(e) =>
              setManualForm({ ...manualForm, memberProfileId: e.target.value })
            }
            options={members.map((m) => ({
              value: m.id,
              label: `${m.user?.fullName} (${m.memberCode} • ${m.gender || 'MALE'})`,
            }))}
          />
          <Textarea
            label="Staff Verification Reason & Audit Notes *"
            required
            value={manualForm.notes}
            onChange={(e) =>
              setManualForm({ ...manualForm, notes: e.target.value })
            }
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setManualModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={manualSubmitting}
            >
              Verify &amp; Log Entry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


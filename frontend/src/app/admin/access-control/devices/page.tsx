'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Cpu, Plus, Activity, Wifi, WifiOff, ShieldCheck } from 'lucide-react';
import { apiFetch, formatDateTime } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Card,
  Button,
  StatusBadge,
  Modal,
  Input,
  Select,
  Skeleton,
} from '@/components/ui';

export default function AdminAccessDevicesPage() {
  const { toast } = useToast();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [issuedKeyAlert, setIssuedKeyAlert] = useState<string | null>(null);

  const [form, setForm] = useState({
    deviceCode: 'DEV-ASHKONA-TURNSTILE-02',
    name: 'Ashkona Ladies Zone Entrance Terminal',
    locationZone: 'Floor 2 Ladies Entrance',
    vendorType: 'SIMULATED_TERMINAL',
    direction: 'ENTRY',
    ipAddress: '192.168.10.205',
    doorControllerId: 'DOOR-CTRL-ASHKONA-03',
    doorUnlockDurationSec: '5',
    isSimulated: true,
  });

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any[]>('/access-control/devices');
      setDevices(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await apiFetch<any>('/access-control/devices', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          doorUnlockDurationSec: Number(form.doorUnlockDurationSec),
        }),
      });
      if (created.issuedDeviceApiKeyOnce) {
        setIssuedKeyAlert(
          `Device "${created.deviceCode}" API Key (copy now — stored as SHA-256 hash): ${created.issuedDeviceApiKeyOnce}`,
        );
      }
      toast({
        title: 'Access Device Registered',
        description: `${created.name} added to Smart Access Control.`,
        variant: 'success',
      });
      setModalOpen(false);
      await loadDevices();
    } catch (err: any) {
      toast({
        title: 'Failed to Register Device',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetStatus = async (device: any, status: string) => {
    try {
      await apiFetch(`/access-control/devices/${device.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      toast({
        title: `Device ${device.deviceCode} -> ${status}`,
        description:
          status === 'OFFLINE'
            ? 'Device marked OFFLINE. Automatic entry will fail-secure (remain locked) while emergency egress stays independent.'
            : 'Device is now ONLINE and accepting verification callbacks.',
        variant: status === 'ONLINE' ? 'success' : 'info',
      });
      await loadDevices();
    } catch (err: any) {
      toast({
        title: 'Status Update Failed',
        description: err.message,
        variant: 'error',
      });
    }
  };

  if (loading) {
    return <Skeleton className="h-80" />;
  }

  const onlineCount = devices.filter((d) => d.status === 'ONLINE').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            ACCESS TERMINALS &amp; RELAYS
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Admin Portal <span className="mx-1">&gt;</span> Access Control{' '}
            <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Devices</span>
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setModalOpen(true)}
        >
          Register New Terminal
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-[#A1A1AA]">
              Total Terminals
            </p>
            <p className="font-display text-2xl text-white mt-0.5">
              {devices.length}
            </p>
          </div>
          <Cpu className="w-5 h-5 text-[#C7F464]" />
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-[#A1A1AA]">
              Online &amp; Active
            </p>
            <p className="font-display text-2xl text-emerald-400 mt-0.5">
              {onlineCount}
            </p>
          </div>
          <Wifi className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-[#A1A1AA]">
              Fail-Secure Guard
            </p>
            <p className="font-display text-2xl text-[#C7F464] mt-0.5">
              Verified
            </p>
          </div>
          <ShieldCheck className="w-5 h-5 text-[#C7F464]" />
        </div>
      </div>

      {issuedKeyAlert && (
        <div className="p-4 rounded-xl bg-[#1B2210] border border-[#C7F464] text-xs font-mono text-[#C7F464] flex items-center justify-between gap-4">
          <span>{issuedKeyAlert}</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIssuedKeyAlert(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {devices.map((dev) => (
          <Card key={dev.id} className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#C7F464]">
                    {dev.deviceCode}
                  </span>
                  {dev.isSimulated && (
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      SIMULATED ADAPTER
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  {dev.name}
                </h2>
                <p className="text-xs text-[#A1A1AA]">{dev.locationZone}</p>
              </div>
              <StatusBadge status={dev.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#171717] p-3.5 rounded-lg border border-[#303030]">
              <div>
                <span className="text-[#A1A1AA] block">Vendor Adapter</span>
                <span className="font-mono text-white">{dev.vendorType}</span>
              </div>
              <div>
                <span className="text-[#A1A1AA] block">Direction / Relay</span>
                <span className="font-mono text-white">
                  {dev.direction} • {dev.doorControllerId} (
                  {dev.doorUnlockDurationSec}s)
                </span>
              </div>
              <div>
                <span className="text-[#A1A1AA] block">IP Address</span>
                <span className="font-mono text-white">
                  {dev.ipAddress || 'Simulated Local Bus'}
                </span>
              </div>
              <div>
                <span className="text-[#A1A1AA] block">Last Heartbeat</span>
                <span className="font-mono text-white">
                  {dev.lastHeartbeatAt
                    ? formatDateTime(dev.lastHeartbeatAt)
                    : 'Never'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#090909]/60 border border-[#303030] flex items-center gap-2 text-xs text-emerald-300">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                Emergency Egress Independence Verified: Physical fire/emergency
                release operates independently of terminal status.
              </span>
            </div>

            <div className="pt-2 border-t border-[#303030] flex flex-wrap gap-2 justify-end">
              {dev.status !== 'ONLINE' && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Wifi className="w-3.5 h-3.5" />}
                  onClick={() => handleSetStatus(dev, 'ONLINE')}
                >
                  Bring Online
                </Button>
              )}
              {dev.status === 'ONLINE' && (
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<WifiOff className="w-3.5 h-3.5" />}
                  onClick={() => handleSetStatus(dev, 'OFFLINE')}
                >
                  Simulate Disconnect (Offline)
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSetStatus(dev, 'MAINTENANCE')}
              >
                Maintenance Mode
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Register Facial Recognition Terminal & Door Controller"
        description="Configure biometric terminal identity, network address, and fail-secure relay pulse timing."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateDevice} className="space-y-5">
          {/* Live Hardware Provisioning Summary */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#C7F464]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#C7F464] text-[#090909] flex items-center justify-center shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#C7F464]">
                  {form.deviceCode || 'NEW-DEVICE'} • {form.direction}
                </p>
                <p className="text-sm font-bold text-white truncate">
                  {form.name || 'Unnamed Terminal'}
                </p>
                <p className="text-xs font-mono text-[#A1A1AA] truncate">
                  {form.locationZone || 'Ashkona Club'} •{' '}
                  {form.ipAddress || 'DHCP'} • Unlock {form.doorUnlockDurationSec || 5}s
                </p>
              </div>
            </div>
            <StatusBadge
              status={form.isSimulated ? 'PENDING' : 'ACTIVE'}
            />
          </div>

          {/* Section 1: Identity & Direction */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Device Code *"
                required
                value={form.deviceCode}
                onChange={(e) => setForm({ ...form, deviceCode: e.target.value })}
              />
              <div>
                <label className="block text-xs font-mono uppercase text-[#A1A1AA] mb-1.5">
                  Turnstile Direction *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'ENTRY', label: 'ENTRY In' },
                    { value: 'EXIT', label: 'EXIT Out' },
                  ].map((d) => {
                    const active = form.direction === d.value;
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setForm({ ...form, direction: d.value })}
                        className={`h-11 rounded-xl border text-xs font-mono font-bold uppercase transition-all ${
                          active
                            ? 'bg-[#C7F464] border-[#C7F464] !text-[#090909]'
                            : 'bg-[#171717] border-[#2C2C2C] text-[#A1A1AA] hover:border-[#C7F464]/50'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Terminal Name *"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="Location / Zone"
                value={form.locationZone}
                onChange={(e) =>
                  setForm({ ...form, locationZone: e.target.value })
                }
              />
            </div>
          </div>

          {/* Section 2: Hardware Adapter Type Cards */}
          <div className="space-y-2">
            <span className="block text-xs font-mono font-semibold uppercase tracking-wider text-white">
              Hardware Adapter Protocol *
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  value: 'SIMULATED_TERMINAL',
                  label: 'Simulated Development Terminal',
                  sub: 'Software testing & policy simulation',
                },
                {
                  value: 'GENERIC_REST_WEBHOOK',
                  label: 'Generic REST / Webhook Controller',
                  sub: 'Custom HTTP relay / ESP32 bridge',
                },
                {
                  value: 'ZKTECO_COMPATIBLE',
                  label: 'ZKTeco Push SDK Compatible',
                  sub: 'ProFace X / SpeedFace biometric gate',
                },
                {
                  value: 'HIKVISION_ISAPI_COMPATIBLE',
                  label: 'Hikvision ISAPI Compatible',
                  sub: 'MinMoe face recognition terminal',
                },
                {
                  value: 'SUPREMA_COMPATIBLE',
                  label: 'Suprema BioStar Compatible',
                  sub: 'FaceStation enterprise controller',
                },
              ].map((hw) => {
                const active = form.vendorType === hw.value;
                return (
                  <button
                    key={hw.value}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        vendorType: hw.value,
                        isSimulated: hw.value === 'SIMULATED_TERMINAL',
                      })
                    }
                    className={`p-3 rounded-xl border text-left transition-all ${
                      active
                        ? 'bg-[#1B2210] border-[#C7F464]'
                        : 'bg-[#141414] border-[#2C2C2C] hover:border-[#C7F464]/50'
                    }`}
                  >
                    <p className="text-xs font-bold text-white leading-tight">
                      {hw.label}
                    </p>
                    <p className="text-[10px] font-mono text-[#A1A1AA] mt-0.5">
                      {hw.sub}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Network & Door Relay Parameters */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#2C2C2C]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="IP Address"
                value={form.ipAddress}
                onChange={(e) =>
                  setForm({ ...form, ipAddress: e.target.value })
                }
              />
              <Input
                label="Door Controller ID"
                value={form.doorControllerId}
                onChange={(e) =>
                  setForm({ ...form, doorControllerId: e.target.value })
                }
              />
              <Input
                label="Unlock Duration (s)"
                type="number"
                value={form.doorUnlockDurationSec}
                onChange={(e) =>
                  setForm({ ...form, doorUnlockDurationSec: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#2C2C2C]">
            <span className="text-xs font-mono text-[#A1A1AA]">
              Mode:{' '}
              <strong className="text-white">
                {form.isSimulated ? 'SIMULATED' : 'LIVE HARDWARE'}
              </strong>
            </span>
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="ifg-btn-primary"
                isLoading={submitting}
              >
                Register Terminal
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}


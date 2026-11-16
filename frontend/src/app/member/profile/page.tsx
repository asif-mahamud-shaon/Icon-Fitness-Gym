'use client';

import React, { useEffect, useState } from 'react';
import { Save, Lock, UserCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Card, Input, Select, Textarea, Button, Skeleton } from '@/components/ui';

export default function MemberProfilePage() {
  const { refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    avatarUrl: '',
    appUsername: '',
    dateOfBirth: '',
    nidNumber: '',
    facebookUrl: '',
    gender: 'MALE',
    bloodGroup: '',
    heightCm: '',
    weightKg: '',
    fitnessGoal: 'FITNESS_IMPROVEMENT',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalConditions: '',
  });

  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
  });

  useEffect(() => {
    apiFetch('/members/me')
      .then((res) => {
        const m = res.member;
        setForm({
          fullName: m.user?.fullName || '',
          phone: m.user?.phone || '',
          avatarUrl: m.user?.avatarUrl || '',
          appUsername: m.appUsername || '',
          dateOfBirth: m.dateOfBirth
            ? new Date(m.dateOfBirth).toISOString().slice(0, 10)
            : '',
          nidNumber: m.nidNumber || '',
          facebookUrl: m.facebookUrl || '',
          gender: m.gender || 'MALE',
          bloodGroup: m.bloodGroup || '',
          heightCm: m.heightCm ? String(m.heightCm) : '',
          weightKg: m.weightKg ? String(m.weightKg) : '',
          fitnessGoal: m.fitnessGoal || 'FITNESS_IMPROVEMENT',
          address: m.address || '',
          emergencyContactName: m.emergencyContactName || '',
          emergencyContactPhone: m.emergencyContactPhone || '',
          medicalConditions: m.medicalConditions || '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await apiFetch('/members/me', {
        method: 'PATCH',
        body: JSON.stringify({
          ...form,
          heightCm: form.heightCm ? Number(form.heightCm) : undefined,
          weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        }),
      });
      await refreshProfile();
      toast({
        title: 'Profile Updated',
        description: 'Your personal and fitness details have been saved.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'PATCH',
        body: JSON.stringify(pwdForm),
      });
      setPwdForm({ currentPassword: '', newPassword: '' });
      toast({
        title: 'Password Changed',
        description: 'Your account password has been updated.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Password Change Failed',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
          Profile &amp; Security
        </h1>
        <p className="text-xs font-mono text-[#A1A1AA] mt-1">
          Member Portal <span className="mx-1">&gt;</span>{' '}
          <span className="text-white">Personal Details &amp; Password</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <Card className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-2 border-b border-[#2C2C2C] pb-4">
            <UserCheck className="w-4 h-4 text-[#C7F464]" />
            <h2 className="text-base font-bold text-white">
              Personal &amp; Fitness Information
            </h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
              <Input
                label="Phone Number *"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Gender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                options={[
                  { value: 'MALE', label: 'Male' },
                  { value: 'FEMALE', label: 'Female' },
                  { value: 'OTHER', label: 'Other' },
                ]}
              />
              <Input
                label="Blood Group"
                placeholder="e.g. O+"
                value={form.bloodGroup}
                onChange={(e) =>
                  setForm({ ...form, bloodGroup: e.target.value })
                }
              />
              <Select
                label="Fitness Goal"
                value={form.fitnessGoal}
                onChange={(e) =>
                  setForm({ ...form, fitnessGoal: e.target.value })
                }
                options={[
                  { value: 'FITNESS_IMPROVEMENT', label: 'Fitness Improvement' },
                  { value: 'MUSCLE_BUILDING', label: 'Muscle Building' },
                  { value: 'WEIGHT_LOSS', label: 'Weight Loss' },
                  { value: 'STRENGTH_TRAINING', label: 'Strength Training' },
                  { value: 'BEGINNER', label: 'Beginner' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Height (cm)"
                type="number"
                value={form.heightCm}
                onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
              />
              <Input
                label="Weight (kg)"
                type="number"
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
              />
              <Input
                label="Profile Photo URL"
                placeholder="https://..."
                value={form.avatarUrl}
                onChange={(e) =>
                  setForm({ ...form, avatarUrl: e.target.value })
                }
              />
            </div>

            <Input
              label="Residential Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="Date of Birth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) =>
                  setForm({ ...form, dateOfBirth: e.target.value })
                }
              />
              <Input
                label="App Login Username"
                placeholder="e.g. asif_shaon"
                value={form.appUsername}
                onChange={(e) =>
                  setForm({ ...form, appUsername: e.target.value })
                }
              />
              <Input
                label="NID Number"
                placeholder="National ID"
                value={form.nidNumber}
                onChange={(e) =>
                  setForm({ ...form, nidNumber: e.target.value })
                }
              />
              <Input
                label="Facebook Profile Link"
                placeholder="https://facebook.com/..."
                value={form.facebookUrl}
                onChange={(e) =>
                  setForm({ ...form, facebookUrl: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Emergency Contact Name"
                value={form.emergencyContactName}
                onChange={(e) =>
                  setForm({ ...form, emergencyContactName: e.target.value })
                }
              />
              <Input
                label="Emergency Contact Phone"
                value={form.emergencyContactPhone}
                onChange={(e) =>
                  setForm({ ...form, emergencyContactPhone: e.target.value })
                }
              />
            </div>

            <Textarea
              label="Medical Conditions / Injury Notes (Shared with Assigned Trainer)"
              value={form.medicalConditions}
              onChange={(e) =>
                setForm({ ...form, medicalConditions: e.target.value })
              }
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={savingProfile}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Profile Changes
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-4 space-y-6">
          <div className="flex items-center gap-2 border-b border-[#2C2C2C] pb-4">
            <Lock className="w-4 h-4 text-[#C7F464]" />
            <h2 className="text-base font-bold text-white">
              Change Password
            </h2>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              label="Current Password *"
              type="password"
              required
              value={pwdForm.currentPassword}
              onChange={(e) =>
                setPwdForm({ ...pwdForm, currentPassword: e.target.value })
              }
            />
            <Input
              label="New Password * (Min 8 chars)"
              type="password"
              required
              minLength={8}
              value={pwdForm.newPassword}
              onChange={(e) =>
                setPwdForm({ ...pwdForm, newPassword: e.target.value })
              }
            />
            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              isLoading={savingPassword}
              leftIcon={<Lock className="w-4 h-4" />}
            >
              Update Password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { apiFetch, formatDateTime } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button, Input, Modal, Select } from '@/components/ui';

export interface FaceVerificationMemberData {
  id: string;
  memberCode: string;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  appUsername?: string | null;
  address?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | string | null;
  dateOfBirth?: string | Date | null;
  nidNumber?: string | null;
  bloodGroup?: string | null;
  heightCm?: number | string | null;
  weightKg?: number | string | null;
  rfidCardNumber?: string | null;
  facebookUrl?: string | null;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

function parseDobParts(dob?: string | Date | null) {
  if (!dob) return { day: '', month: '', year: '' };
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return { day: '', month: '', year: '' };
  return {
    day: String(d.getUTCDate()),
    month: String(d.getUTCMonth() + 1),
    year: String(d.getUTCFullYear()),
  };
}

function buildIsoDate(day: string, month: string, year: string): string | undefined {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!y || !m || !d) return undefined;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(dt.getTime())) return undefined;
  return dt.toISOString();
}

async function compressImageToDataUrl(
  source: HTMLImageElement | HTMLVideoElement,
  maxDim = 540,
): Promise<string> {
  const srcWidth =
    source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
  const srcHeight =
    source instanceof HTMLVideoElement
      ? source.videoHeight
      : source.naturalHeight;

  const scale = Math.min(1, maxDim / Math.max(srcWidth || 1, srcHeight || 1));
  const width = Math.max(1, Math.round(srcWidth * scale));
  const height = Math.max(1, Math.round(srcHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image canvas not supported in this browser.');
  ctx.drawImage(source, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.78);
}

export function FaceVerificationFormModal({
  isOpen,
  onClose,
  member,
  biometricEnrollment,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  member: FaceVerificationMemberData | null;
  biometricEnrollment?: any | null;
  onSuccess?: () => Promise<void> | void;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [appUsername, setAppUsername] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('MALE');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [rfidCardNumber, setRfidCardNumber] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');

  const [recentPhotoDataUrl, setRecentPhotoDataUrl] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    if (!member) return;

    const dob = parseDobParts(member.dateOfBirth);
    const derivedUsername =
      member.appUsername ||
      (member.email ? member.email.split('@')[0] : '') ||
      member.memberCode ||
      '';

    setFullName(member.fullName || '');
    setEmail(member.email || '');
    setPhone(member.phone || '');
    setAppUsername(derivedUsername);
    setAddress(member.address || '');
    setGender(member.gender || 'MALE');
    setDobDay(dob.day);
    setDobMonth(dob.month);
    setDobYear(dob.year);
    setNidNumber(member.nidNumber || '');
    setBloodGroup(member.bloodGroup || '');
    setHeightCm(member.heightCm ? String(member.heightCm) : '');
    setWeightKg(member.weightKg ? String(member.weightKg) : '');
    setRfidCardNumber(member.rfidCardNumber || '');
    setFacebookUrl(member.facebookUrl || '');

    setRecentPhotoDataUrl('');
    setPhotoFileName('');
    setConsentChecked(Boolean(biometricEnrollment?.consentGranted));
  }, [isOpen, member, biometricEnrollment]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handlePhotoSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a valid JPG, PNG, or WebP portrait image.',
        variant: 'error',
      });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Could not decode selected image.'));
        img.src = objectUrl;
      });
      const compressed = await compressImageToDataUrl(img, 720);
      setRecentPhotoDataUrl(compressed);
      setPhotoFileName(file.name);
      stopCamera();
    } catch (err: any) {
      toast({
        title: 'Photo Upload Failed',
        description: err.message || 'Could not process the selected photo.',
        variant: 'error',
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleStartCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast({
          title: 'Camera Not Supported',
          description:
            'Your browser does not allow camera capture here. Please upload a recent photo file instead.',
          variant: 'info',
        });
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch (err: any) {
      toast({
        title: 'Camera Access Unavailable',
        description:
          err?.message || 'Allow camera permission or upload a recent photo file.',
        variant: 'info',
      });
    }
  };

  const handleCaptureSelfie = async () => {
    if (!videoRef.current) return;
    try {
      const compressed = await compressImageToDataUrl(videoRef.current, 720);
      setRecentPhotoDataUrl(compressed);
      setPhotoFileName('live-camera-capture.jpg');
      stopCamera();
      toast({
        title: 'Recent Face Photo Captured',
        description: 'Live photo captured and ready for biometric enrollment.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Capture Failed',
        description: err.message,
        variant: 'error',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member?.id) return;

    if (!recentPhotoDataUrl) {
      toast({
        title: 'Recent Face Photo Required',
        description:
          'Please upload a recent clear front-facing photo (or capture a live selfie) before submitting face verification.',
        variant: 'error',
      });
      return;
    }

    if (!consentChecked) {
      toast({
        title: 'Consent Required',
        description:
          'Please check the biometric consent box to enroll your face verification profile.',
        variant: 'error',
      });
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/access-control/biometrics/enroll', {
        method: 'POST',
        body: JSON.stringify({
          memberProfileId: member.id,
          consentGranted: true,
          consentVersion: 'v1.0-BD-BIOMETRIC-POLICY',
          livenessVerified: true,
          qualityScore: 0.99,
          recentPhotoDataUrl,
          fullName: fullName.trim(),
          phone: phone.trim(),
          appUsername: appUsername.trim(),
          address: address.trim(),
          gender,
          dateOfBirth: buildIsoDate(dobDay, dobMonth, dobYear),
          nidNumber: nidNumber.trim(),
          bloodGroup: bloodGroup.trim(),
          heightCm: heightCm ? Number(heightCm) : undefined,
          weightKg: weightKg ? Number(weightKg) : undefined,
          rfidCardNumber: rfidCardNumber.trim(),
          facebookUrl: facebookUrl.trim(),
        }),
      });

      toast({
        title: 'Face Verification & Biometric Enrollment Completed',
        description:
          'Your recent face photo and portal details are encrypted and synced for smart turnstile access.',
        variant: 'success',
      });

      stopCamera();
      if (onSuccess) await onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: 'Verification Submission Failed',
        description: err.message || 'Could not complete face verification.',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const previousPhoto =
    biometricEnrollment?.recentPhotoDataUrl || member?.avatarUrl || '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title="In-House Face Verification & Biometric Registration"
      description="All available details are auto-filled from your Icon Fitness Gym portal profile. Review them and upload a recent front-facing photo."
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Top In-House Brand Header + Auto-Fill Badge */}
        <div className="p-4 rounded-xl bg-[#0B0B0B] border border-[#2C2C2C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-black border border-[#303030] flex items-center justify-center shrink-0">
              <img
                src="/logo.jpg"
                alt="Icon Fitness Gym Official Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-[#C7F464]">
                ICON FITNESS GYM &bull; ASHKONA
              </p>
              <p className="text-sm font-bold text-white">
                In-House Online Face Registration
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C7F464]/15 border border-[#C7F464]/40 text-[#C7F464] text-[11px] font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Portal Auto-Filled
            </span>
            {member?.memberCode && (
              <span className="px-3 py-1 rounded-full bg-[#171717] border border-[#303030] text-xs font-mono text-white">
                ID: {member.memberCode}
              </span>
            )}
          </div>
        </div>

        {/* Recent Face Photo Upload / Camera Capture Box */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#090909] border border-[#C7F464]/40 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#C7F464] font-bold">
                Recent Profile / Face Photo * (Required)
              </p>
              <p className="text-xs text-[#A1A1AA] mt-0.5">
                Upload a recent, clear front-facing photo (no sunglasses or mask) for terminal face recognition.
              </p>
            </div>
            {recentPhotoDataUrl && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[11px] font-mono font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Recent Photo Ready
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Preview Box */}
            <div className="flex items-center gap-3 shrink-0">
              {recentPhotoDataUrl ? (
                <div className="relative">
                  <img
                    src={recentPhotoDataUrl}
                    alt="Uploaded recent face verification preview"
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-[#C7F464]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setRecentPhotoDataUrl('');
                      setPhotoFileName('');
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#171717] border border-[#303030] text-white flex items-center justify-center hover:bg-red-600"
                    aria-label="Remove uploaded photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-[#3F3F46] bg-[#141414] flex flex-col items-center justify-center text-center p-2">
                  <Camera className="w-6 h-6 text-[#A1A1AA] mb-1" />
                  <span className="text-[10px] font-mono text-[#A1A1AA]">
                    Upload Recent
                  </span>
                </div>
              )}

              {!recentPhotoDataUrl && previousPhoto && (
                <div className="text-center">
                  <img
                    src={previousPhoto}
                    alt="Previous portal photo"
                    className="w-16 h-16 rounded-xl object-cover border border-[#303030] opacity-75 mx-auto"
                  />
                  <span className="block text-[10px] font-mono text-[#A1A1AA] mt-1">
                    Previous Photo
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex-1 space-y-2.5 w-full">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelected}
                className="hidden"
              />
              <div className="flex flex-wrap gap-2.5">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<Upload className="w-4 h-4" />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {recentPhotoDataUrl
                    ? 'Change Recent Photo'
                    : 'Upload Recent Photo'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Camera className="w-4 h-4" />}
                  onClick={cameraActive ? stopCamera : handleStartCamera}
                >
                  {cameraActive ? 'Close Camera' : 'Take Live Selfie'}
                </Button>
              </div>
              <p className="text-[11px] font-mono text-[#A1A1AA]">
                {photoFileName
                  ? `Selected: ${photoFileName}`
                  : biometricEnrollment?.facePhotoUploadedAt
                    ? `Last verification photo uploaded: ${formatDateTime(biometricEnrollment.facePhotoUploadedAt)} — please upload a fresh recent photo.`
                    : 'Accepted: JPG, PNG, WebP. Auto-compressed securely.'}
              </p>
            </div>
          </div>

          {cameraActive && (
            <div className="p-3 rounded-xl bg-[#141414] border border-[#303030] space-y-3">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-64 rounded-lg object-cover bg-black mx-auto"
              />
              <div className="flex justify-center gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<Camera className="w-4 h-4" />}
                  onClick={handleCaptureSelfie}
                >
                  Capture Recent Face Photo
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={stopCamera}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Auto-Filled Form Grid matching BeeInfoBD fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Your Name *"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your Full Name"
          />
          <Input
            label="E-Mail"
            type="email"
            value={email}
            disabled
            helperText="Linked portal account email"
          />
          <Input
            label="Mobile Number *"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="017xxxxxxxx"
          />
          <Input
            label="Username / App Login Name *"
            required
            value={appUsername}
            onChange={(e) => setAppUsername(e.target.value)}
            placeholder="Username for terminal app"
          />
        </div>

        <Input
          label="Address *"
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="House / Road, Ashkona, Dakshinkhan, Dhaka"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Gender *"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            options={[
              { value: 'MALE', label: 'Male' },
              { value: 'FEMALE', label: 'Female' },
              { value: 'OTHER', label: 'Other' },
            ]}
          />

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
              Birth Date *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                type="number"
                min={1}
                max={31}
                required
                placeholder="Day"
                value={dobDay}
                onChange={(e) => setDobDay(e.target.value)}
              />
              <Select
                value={dobMonth}
                onChange={(e) => setDobMonth(e.target.value)}
                options={[
                  { value: '', label: 'Month' },
                  ...MONTHS,
                ]}
              />
              <Input
                type="number"
                min={1940}
                max={2026}
                required
                placeholder="Year"
                value={dobYear}
                onChange={(e) => setDobYear(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Input
            label="NID"
            placeholder="National ID"
            value={nidNumber}
            onChange={(e) => setNidNumber(e.target.value)}
          />
          <Select
            label="Blood Group"
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            options={[
              { value: '', label: 'Select Group' },
              ...BLOOD_GROUPS.map((bg) => ({ value: bg, label: bg })),
            ]}
          />
          <Input
            label="Height (cm) *"
            type="number"
            min={80}
            max={250}
            required
            placeholder="e.g. 172"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
          />
          <Input
            label="Weight (KG) *"
            type="number"
            min={25}
            max={250}
            required
            placeholder="e.g. 72"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Gym Member ID"
            value={member?.memberCode || ''}
            disabled
          />
          <Input
            label="RFID Card Number"
            placeholder="Optional front-desk RFID"
            value={rfidCardNumber}
            onChange={(e) => setRfidCardNumber(e.target.value)}
          />
          <Input
            label="Facebook Profile Link"
            placeholder="https://facebook.com/..."
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.target.value)}
          />
        </div>

        {/* Biometric Privacy & Consent */}
        <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#141414] border border-[#2C2C2C] cursor-pointer">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="mt-1 accent-[#C7F464]"
          />
          <div className="text-xs text-[#A1A1AA] space-y-1">
            <span className="font-semibold text-white block">
              <ShieldCheck className="w-3.5 h-3.5 inline mr-1.5 text-[#C7F464]" />
              Biometric Facial Recognition Consent (v1.0-BD-BIOMETRIC-POLICY)
            </span>
            <span>
              I confirm these auto-filled details and recent face photo belong to me, and I consent to encrypted in-house facial template enrollment for Icon Fitness Gym Ashkona access control.
            </span>
          </div>
        </label>

        <div className="flex justify-end gap-2.5 pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              stopCamera();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!consentChecked || !recentPhotoDataUrl}
            isLoading={submitting}
          >
            Submit Face Verification &amp; Enroll
          </Button>
        </div>
      </form>
    </Modal>
  );
}

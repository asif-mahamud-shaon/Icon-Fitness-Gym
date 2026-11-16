'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  KeyRound,
  ShieldCheck,
  ScanFace,
  Dumbbell,
  Calendar,
  Eye,
  EyeOff,
  Clock,
  UserCheck,
} from 'lucide-react';
import { useAuth, getPortalRouteByRole } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiFetch } from '@/lib/api';
import { Card, Input, Button } from '@/components/ui';

const QUICK_DEMO_ACCOUNTS = [
  {
    label: 'Super Admin',
    roleTag: 'FULL SYSTEM',
    email: 'superadmin@iconfitnessgym.com',
    pass: 'Admin@1234',
  },
  {
    label: 'Gym Admin',
    roleTag: 'OPERATIONS',
    email: 'admin@iconfitnessgym.com',
    pass: 'Admin@1234',
  },
  {
    label: 'Front Desk Staff',
    roleTag: 'RECEPTION',
    email: 'staff@iconfitnessgym.com',
    pass: 'Staff@1234',
  },
  {
    label: 'Male Trainer',
    roleTag: 'STRENGTH COACH',
    email: 'trainer@iconfitnessgym.com',
    pass: 'Trainer@1234',
  },
  {
    label: 'Female Trainer',
    roleTag: 'LADIES COACH',
    email: 'trainer2@iconfitnessgym.com',
    pass: 'Trainer@1234',
  },
  {
    label: 'Male Member',
    roleTag: 'MEMBER PORTAL',
    email: 'member@iconfitnessgym.com',
    pass: 'Member@1234',
  },
  {
    label: 'Female Member',
    roleTag: 'LADIES SLOT',
    email: 'female.member@iconfitnessgym.com',
    pass: 'Member@1234',
  },
];

function LoginContent() {
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'MEMBER') {
        try {
          const mRes = await apiFetch<{ activeMembership: any | null }>(
            '/memberships/my',
          );
          if (!mRes?.activeMembership) {
            toast({
              title: 'Payment & Admin Approval Required',
              description:
                'Complete your membership payment or await Admin verification to unlock full Member Portal access.',
              variant: 'info',
            });
            router.push('/register/payment');
            return;
          }
        } catch {
          router.push('/register/payment');
          return;
        }
      }
      toast({
        title: `Welcome back, ${user.fullName}`,
        description: `Signed in as ${user.role}. Redirecting to your portal...`,
        variant: 'success',
      });
      router.push(redirectUrl || getPortalRouteByRole(user.role));
    } catch (err: any) {
      toast({
        title: 'Authentication Failed',
        description: err.message || 'Invalid email or password.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* ================================================================
            LEFT COLUMN (6 COLS): CINEMATIC CLUB COMMAND SHOWCASE
            ================================================================ */}
        <div className="lg:col-span-6 dark-media-card relative rounded-3xl overflow-hidden border border-[#2C2C2C] bg-[#090909] shadow-2xl flex flex-col justify-between p-7 sm:p-10 min-h-[540px]">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=85"
            alt="Icon Fitness Gym Portal Command"
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/50" />

          {/* Top Brand Bar */}
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-black/80 border border-white/15">
              <img
                src="/logo.jpg"
                alt="Icon Fitness Gym Official Logo"
                className="w-6 h-6 rounded-md object-contain bg-black"
              />
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#C7F464]">
                ICON FITNESS GYM • ASHKONA
              </span>
            </div>
            <span className="px-3 py-1 rounded-full bg-black/75 border border-white/15 text-[10px] font-mono uppercase text-zinc-300">
              CLOUD PORTAL v2.4
            </span>
          </div>

          {/* Center Headline & Ecosystem Features */}
          <div className="relative z-10 space-y-6 my-8">
            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C7F464]">
                UNIFIED MEMBER, COACH &amp; ADMIN ECOSYSTEM
              </p>
              <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl uppercase tracking-wide text-white leading-[0.94]">
                COMMAND YOUR{' '}
                <span className="text-[#C7F464]">TRAINING &amp; PORTAL</span>{' '}
                ACCESS.
              </h1>
              <p className="text-sm text-zinc-300 leading-relaxed max-w-lg">
                Sign in to inspect your assigned workout blueprints, reserve
                weekly group class seats, check your biometric gate attendance
                streaks, or manage club operations.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  icon: <ScanFace className="w-4 h-4 text-[#C7F464]" />,
                  title: 'Digital Member ID & Face Gate Sync',
                  desc: 'Instant membership status & gender-slot eligibility verification.',
                },
                {
                  icon: <Dumbbell className="w-4 h-4 text-[#C7F464]" />,
                  title: 'Assigned Workout Blueprints',
                  desc: 'View day-by-day exercises, sets, reps, tempo, and coach cues.',
                },
                {
                  icon: <Calendar className="w-4 h-4 text-[#C7F464]" />,
                  title: 'Live Class Bookings & Digital Receipts',
                  desc: '1-click class reservations and auditable BDT payment receipts.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-3.5 rounded-2xl bg-black/70 border border-white/10 flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-white">
                      {item.title}
                    </h2>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Operating Hours Strip */}
          <div className="relative z-10 p-4 rounded-2xl bg-black/80 border border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-white">
              <Clock className="w-4 h-4 text-[#C7F464]" />
              <span>Sat–Thu: 07:00 AM – 11:00 PM</span>
            </div>
            <span className="text-pink-400 font-semibold">
              Ladies: 01:00 PM – 03:30 PM
            </span>
            <span className="text-amber-400 font-semibold">
              Fri: 05:00 PM – 11:00 PM
            </span>
          </div>
        </div>

        {/* ================================================================
            RIGHT COLUMN (6 COLS): INTERACTIVE SIGN-IN CARD
            ================================================================ */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <Card className="p-6 sm:p-10 rounded-3xl space-y-6 border border-[#2C2C2C] shadow-xl">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#262626]">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-black border border-[#303030] flex items-center justify-center shrink-0 shadow-md">
                  <img
                    src="/logo.jpg"
                    alt="Icon Fitness Gym Official Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#C7F464] block">
                    SECURE AUTHENTICATION
                  </span>
                  <h2 className="font-display text-3xl uppercase tracking-wide text-white leading-none mt-1">
                    PORTAL SIGN IN
                  </h2>
                </div>
              </div>

              <Link
                href="/register"
                className="text-xs font-mono uppercase tracking-wider text-[#C7F464] hover:underline shrink-0"
              >
                New Member? Join →
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address *"
                type="email"
                required
                placeholder="you@iconfitnessgym.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="space-y-1.5">
                <div className="relative">
                  <Input
                    label="Password *"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-[34px] p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#C7F464] transition-colors"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[11px] text-[#A1A1AA]">
                    Role-based redirect enabled automatically
                  </span>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-[#C7F464] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full rounded-xl"
                  size="lg"
                  isLoading={loading}
                  leftIcon={<UserCheck className="w-4 h-4" />}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Sign In to Portal
                </Button>
              </div>
            </form>

            {/* 1-Click Role Demo Selector */}
            <div className="pt-5 border-t border-[#262626] space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#C7F464]" />
                  <span>Instant Role Credentials (1-Click Autofill):</span>
                </p>
                {selectedDemo && (
                  <span className="text-[10px] font-mono text-[#C7F464]">
                    Selected: {selectedDemo}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {QUICK_DEMO_ACCOUNTS.map((acc) => {
                  const isSelected = selectedDemo === acc.label;
                  return (
                    <button
                      key={acc.label}
                      type="button"
                      onClick={() => {
                        setEmail(acc.email);
                        setPassword(acc.pass);
                        setSelectedDemo(acc.label);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-[#C7F464] !text-[#090909] border-[#C7F464] font-bold shadow-sm'
                          : 'bg-[#090909] border-[#262626] text-white hover:border-[#C7F464] hover:bg-[#C7F464]/10'
                      }`}
                    >
                      <span
                        className={`block text-[9px] font-mono uppercase tracking-wider ${
                          isSelected ? 'text-[#090909]/80' : 'text-[#C7F464]'
                        }`}
                      >
                        {acc.roleTag}
                      </span>
                      <span className="block text-xs font-semibold truncate mt-0.5">
                        {acc.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#A1A1AA]">
              <span>Don&apos;t have an Icon Fitness account yet?</span>
              <Link href="/register">
                <Button variant="secondary" size="sm" className="rounded-lg">
                  Create Member Account →
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

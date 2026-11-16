'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Card, Input, Button } from '@/components/ui';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'REQUEST' | 'RESET' | 'DONE'>('REQUEST');
  const [loading, setLoading] = useState(false);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch<any>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      if (res.developmentResetToken) {
        setResetToken(res.developmentResetToken);
      }
      setStep('RESET');
      toast({
        title: 'Reset Instructions Generated',
        description: res.message,
        variant: 'info',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Unable to process request.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: resetToken, newPassword }),
      });
      setStep('DONE');
      toast({
        title: 'Password Reset Complete',
        description: 'You can now sign in with your new password.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Reset Failed',
        description: err.message || 'Invalid or expired reset token.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card className="space-y-6">
        <div className="space-y-2">
          <div className="w-10 h-10 rounded-lg bg-[#171717] border border-[#303030] flex items-center justify-center text-[#C7F464]">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="font-display text-3xl uppercase tracking-wide text-white">
            PASSWORD RECOVERY
          </h1>
          <p className="text-xs text-[#A1A1AA]">
            Reset your Icon Fitness Gym account password securely.
          </p>
        </div>

        {step === 'REQUEST' && (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <Input
              label="Account Email Address *"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={loading}
            >
              Generate Reset Token
            </Button>
          </form>
        )}

        {step === 'RESET' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              label="Password Reset Token *"
              required
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              helperText="In local/development mode without external SMTP, your generated token is pre-filled above."
            />
            <Input
              label="New Password * (Min 8 chars)"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={loading}
            >
              Set New Password
            </Button>
          </form>
        )}

        {step === 'DONE' && (
          <div className="space-y-4 text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="text-sm text-white font-semibold">
              Your password has been updated and active sessions revoked.
            </p>
            <Link href="/login" className="block">
              <Button variant="primary" className="w-full">
                Proceed to Login
              </Button>
            </Link>
          </div>
        )}

        <div className="pt-4 border-t border-[#303030]">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-[#A1A1AA] hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}


'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { AuthCard } from '@/modules/auth/components/AuthCard';
import { AuthInput } from '@/modules/auth/components/AuthInput';
import { AuthButton } from '@/modules/auth/components/AuthButton';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent]   = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO Phase 4: wire to sendPasswordReset mutation
    await new Promise((r) => setTimeout(r, 800)); // simulated
    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <AuthCard title="Check your email">
        <div className="text-center py-4">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-sm text-white/60">
            If an account exists for <strong className="text-white">{email}</strong>, we sent a reset link.
          </p>
          <Link
            href="/login"
            className="mt-6 block text-sm font-medium text-white hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we'll send a reset link"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <AuthButton loading={loading} type="submit">
          Send reset link
        </AuthButton>
      </form>

      <p className="mt-6 text-center text-sm text-white/50">
        <Link href="/login" className="font-medium text-white hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}

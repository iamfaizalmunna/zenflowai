'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthCard } from '@/modules/auth/components/AuthCard';
import { AuthInput } from '@/modules/auth/components/AuthInput';
import { AuthButton } from '@/modules/auth/components/AuthButton';
import { useLogin } from '@/modules/auth/hooks/useAuth';
import { useUiSound } from '@/hooks/useUiSound';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useLogin();
  const { play } = useUiSound();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your ZenFlowAI account">
      {error && (
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          {error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoFocus={false}
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white/70">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-[#C4B5FD] hover:text-white transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <AuthInput
            label=""
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <AuthButton
          loading={loading}
          type="submit"
          onClick={() => void play('tap')}
        >
          Sign in
        </AuthButton>
      </form>

      <p className="mt-6 text-center text-sm text-white/50">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-white hover:underline">
          Sign up
        </Link>
      </p>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="mb-2 text-xs font-medium text-white/40">Demo accounts</p>
          <div className="space-y-0.5 font-mono text-xs text-white/55">
            {[
              ['superadmin@zenflowai.com', 'Super Admin'],
              ['admin@zenflowai.com',      'Admin'],
              ['supervisor@zenflowai.com', 'Supervisor'],
              ['agent@zenflowai.com',      'Agent'],
              ['customer@zenflowai.com',   'Customer'],
            ].map(([demoEmail, role]) => (
              <button
                key={demoEmail}
                type="button"
                onClick={() => { setEmail(demoEmail); setPassword('password123'); }}
                className="flex w-full justify-between rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/10"
              >
                <span>{demoEmail}</span>
                <span className="text-white/35">{role}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthCard>
  );
}

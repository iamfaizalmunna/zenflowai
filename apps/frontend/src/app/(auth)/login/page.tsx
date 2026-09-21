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
          autoFocus
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
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

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-slate-900 dark:text-white hover:underline">
          Sign up
        </Link>
      </p>

      {/* Dev-only demo credentials hint */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-400 mb-2 font-medium">Demo accounts</p>
          <div className="space-y-0.5 text-xs text-slate-400 font-mono">
            {[
              ['superadmin@zenflowai.com', 'Super Admin'],
              ['admin@zenflowai.com',      'Admin'],
              ['supervisor@zenflowai.com', 'Supervisor'],
              ['agent@zenflowai.com',      'Agent'],
              ['customer@zenflowai.com',   'Customer'],
            ].map(([email, role]) => (
              <button
                key={email}
                type="button"
                onClick={() => { setEmail(email); setPassword('password123'); }}
                className="w-full text-left px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex justify-between"
              >
                <span>{email}</span>
                <span className="text-slate-300">{role}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthCard>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthCard } from '@/modules/auth/components/AuthCard';
import { AuthInput } from '@/modules/auth/components/AuthInput';
import { AuthButton } from '@/modules/auth/components/AuthButton';
import { useRegister } from '@/modules/auth/hooks/useAuth';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, loading, error } = useRegister();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim())        errs.name = 'Name is required';
    if (!form.email.includes('@')) errs.email = 'Valid email required';
    if (form.password.length < 8)  errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    register(form.email, form.name, form.password);
  };

  return (
    <AuthCard title="Create an account" subtitle="Submit and track your support tickets">
      {error && (
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          {error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          label="Full name"
          type="text"
          placeholder="Alex Johnson"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
          required
          autoFocus
        />
        <AuthInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          required
        />
        <AuthInput
          label="Password"
          type="password"
          placeholder="Min. 8 characters"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          required
        />
        <AuthInput
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
          required
        />

        <AuthButton loading={loading} type="submit">
          Create account
        </AuthButton>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-slate-900 dark:text-white hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}

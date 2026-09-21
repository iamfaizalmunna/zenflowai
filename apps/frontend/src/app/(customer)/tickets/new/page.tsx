'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { CATEGORIES, CREATE_TICKET } from '@/modules/tickets/queries/ticket.queries';

export default function NewTicketPage() {
  const router = useRouter();
  const { data: catData } = useQuery(CATEGORIES);
  const [createTicket, { loading, error }] = useMutation(CREATE_TICKET, {
    onCompleted: (res) => router.push(`/tickets/${res.createTicket.id}`),
  });
  const [form, setForm] = useState({ title: '', description: '', categoryId: '', priority: 'MEDIUM' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createTicket({
      variables: {
        input: {
          title: form.title,
          description: form.description,
          priority: form.priority,
          categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        },
      },
    });
  };

  return (
    <RoleGuard minRole="CUSTOMER">
      <AppShell>
        <div className="max-w-xl space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">Create ticket</h1>
          {error && <p className="text-sm text-red-600">{error.message}</p>}
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-medium">
              Title
              <input
                required
                minLength={4}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-slate-900"
              />
            </label>
            <label className="block text-sm font-medium">
              Description
              <textarea
                required
                minLength={10}
                rows={6}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-slate-900"
              />
            </label>
            <label className="block text-sm font-medium">
              Category
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-slate-900"
              >
                <option value="">Select…</option>
                {catData?.categories?.map((c: { id: number; name: string }) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Priority
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-slate-900"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Submitting…' : 'Submit ticket'}
            </button>
          </form>
        </div>
      </AppShell>
    </RoleGuard>
  );
}

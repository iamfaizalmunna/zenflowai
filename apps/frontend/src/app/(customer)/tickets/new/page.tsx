'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { CATEGORIES, CREATE_TICKET, KNOWLEDGE_ARTICLES } from '@/modules/tickets/queries/ticket.queries';

export default function NewTicketPage() {
  const router = useRouter();
  const { data: catData } = useQuery(CATEGORIES);
  const [createTicket, { loading, error }] = useMutation(CREATE_TICKET, {
    onCompleted: (res) => router.push(`/tickets/${res.createTicket.id}`),
  });
  const [form, setForm] = useState({ title: '', description: '', categoryId: '', priority: 'MEDIUM' });
  const [search, setSearch] = useState('');
  const { data: kbData } = useQuery(KNOWLEDGE_ARTICLES, {
    variables: { search, internal: false },
    skip: search.length < 4,
  });

  useEffect(() => {
    const t = setTimeout(() => setSearch(form.title.trim()), 400);
    return () => clearTimeout(t);
  }, [form.title]);

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
            {kbData?.knowledgeArticles?.length > 0 && (
              <div className="rounded-xl border p-3 text-sm space-y-1">
                <p className="text-xs font-medium text-slate-500">Related help articles</p>
                {kbData.knowledgeArticles.slice(0, 4).map((a: { id: number; title: string }) => (
                  <Link key={a.id} href={`/knowledge/${a.id}`} className="block text-indigo-600 hover:underline">
                    {a.title}
                  </Link>
                ))}
              </div>
            )}
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

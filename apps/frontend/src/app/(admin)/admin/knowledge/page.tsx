'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { ADMIN_ARTICLES, PUBLISH_ARTICLE, SAVE_ARTICLE } from '@/modules/admin/queries/admin.queries';

export default function AdminKnowledgePage() {
  const { data, refetch } = useQuery(ADMIN_ARTICLES);
  const [save] = useMutation(SAVE_ARTICLE, { onCompleted: () => refetch() });
  const [publish] = useMutation(PUBLISH_ARTICLE, { onCompleted: () => refetch() });
  const [form, setForm] = useState({ title: '', body: '' });

  return (
    <RoleGuard minRole="ADMIN">
      <AppShell>
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-2xl font-bold tracking-tight">Knowledge</h1>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              save({ variables: { input: { title: form.title, body: form.body, isPublished: false } } });
              setForm({ title: '', body: '' });
            }}
          >
            <input required minLength={3} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full border rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900" />
            <textarea required minLength={10} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} placeholder="Markdown body" className="w-full border rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900" />
            <button type="submit" className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm dark:bg-white dark:text-slate-900">Save draft</button>
          </form>
          <ul className="space-y-2">
            {data?.adminArticles?.map((a: { id: number; title: string; isPublished: boolean; visibility: string }) => (
              <li key={a.id} className="rounded-xl border p-3 text-sm flex justify-between gap-3">
                <span>{a.title} · {a.visibility} · {a.isPublished ? 'published' : 'draft'}</span>
                <button
                  type="button"
                  className="text-xs underline"
                  onClick={() => publish({ variables: { id: a.id, isPublished: !a.isPublished } })}
                >
                  {a.isPublished ? 'Unpublish' : 'Publish'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </AppShell>
    </RoleGuard>
  );
}

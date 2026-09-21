'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { ADMIN_ARTICLES, PUBLISH_ARTICLE, SAVE_ARTICLE } from '@/modules/admin/queries/admin.queries';
import { Button, Input, PageTitle, Textarea } from '@/components/ui/Field';

export default function AdminKnowledgePage() {
  const { data, refetch } = useQuery(ADMIN_ARTICLES);
  const [save] = useMutation(SAVE_ARTICLE, { onCompleted: () => refetch() });
  const [publish] = useMutation(PUBLISH_ARTICLE, { onCompleted: () => refetch() });
  const [form, setForm] = useState({ title: '', body: '' });

  return (
    <RoleGuard minRole="ADMIN">
      <AppShell>
        <div className="space-y-5 max-w-3xl">
          <PageTitle title="Knowledge" hint="Draft and publish owned articles." />
          <form
            className="space-y-3 rounded-3xl border border-border/70 bg-card/70 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              save({ variables: { input: { title: form.title, body: form.body, isPublished: false } } });
              setForm({ title: '', body: '' });
            }}
          >
            <Input required minLength={3} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" />
            <Textarea required minLength={10} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} placeholder="Markdown body" />
            <Button type="submit">Save draft</Button>
          </form>
          <ul className="space-y-2">
            {data?.adminArticles?.map((a: { id: number; title: string; isPublished: boolean; visibility: string }) => (
              <li key={a.id} className="rounded-2xl border border-border/70 bg-card/70 p-4 text-sm flex justify-between gap-3 items-center">
                <span>{a.title} · {a.visibility} · {a.isPublished ? 'published' : 'draft'}</span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => publish({ variables: { id: a.id, isPublished: !a.isPublished } })}
                >
                  {a.isPublished ? 'Unpublish' : 'Publish'}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </AppShell>
    </RoleGuard>
  );
}

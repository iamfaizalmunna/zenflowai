'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { ADMIN_ARTICLES, PUBLISH_ARTICLE, SAVE_ARTICLE } from '@/modules/admin/queries/admin.queries';
import { Button, Input, PageTitle, Textarea } from '@/components/ui/Field';
import { ListSearch } from '@/components/ui/ListSearch';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { filterByQuery } from '@/lib/listSearch';

type ArticleRow = { id: number; title: string; isPublished: boolean; visibility: string };

export default function AdminKnowledgePage() {
  const { data, loading, refetch } = useQuery(ADMIN_ARTICLES);
  const [save] = useMutation(SAVE_ARTICLE, { onCompleted: () => refetch() });
  const [publish] = useMutation(PUBLISH_ARTICLE, { onCompleted: () => refetch() });
  const [form, setForm] = useState({ title: '', body: '' });
  const [query, setQuery] = useState('');
  const articles = filterByQuery(
    (data?.adminArticles ?? []) as ArticleRow[],
    query,
    (article) => `${article.title} ${article.visibility}`,
  );

  return (
    <RoleGuard minRole="ADMIN">
        <div className="space-y-5 max-w-3xl">
          <PageTitle title="Knowledge" hint="Drafts stay Internal and unpublished. Publish only after you review. Ticket saves never go public by themselves." />
          <form
            className="space-y-3 rounded-xl border border-border bg-card p-4"
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
          <ListSearch value={query} onChange={setQuery} placeholder="Search this pack…" />
          {loading && !data ? <PageSkeleton /> : (
          <ul className="space-y-2">
            {articles.map((a) => (
              <li key={a.id} className="rounded-xl border border-border bg-card p-4 text-sm flex justify-between gap-3 items-center">
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
          )}
        </div>
    </RoleGuard>
  );
}

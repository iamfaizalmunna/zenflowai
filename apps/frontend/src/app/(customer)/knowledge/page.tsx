'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { KNOWLEDGE_ARTICLES } from '@/modules/tickets/queries/ticket.queries';

export default function HelpCenterPage() {
  const [search, setSearch] = useState('');
  const { data, loading } = useQuery(KNOWLEDGE_ARTICLES, {
    variables: { search: search || undefined, internal: false },
  });

  return (
    <RoleGuard minRole="CUSTOMER">
      <AppShell>
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight">Help Center</h1>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles…"
            className="w-full border rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-sm"
          />
          {loading && <p className="text-sm text-slate-400">Searching…</p>}
          <div className="space-y-2">
            {data?.knowledgeArticles?.map((article: { id: number; title: string; body: string; category?: { name: string } }) => (
              <Link key={article.id} href={`/knowledge/${article.id}`} className="block rounded-xl border p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800">
                <h2 className="font-medium text-sm">{article.title}</h2>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{article.body}</p>
                {article.category && <p className="text-xs text-slate-400 mt-2">{article.category.name}</p>}
              </Link>
            ))}
          </div>
        </div>
      </AppShell>
    </RoleGuard>
  );
}

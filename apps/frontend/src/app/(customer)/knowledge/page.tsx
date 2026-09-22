'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { Input, PageTitle } from '@/components/ui/Field';
import { HelpAskBox } from '@/modules/tickets/components/HelpAskBox';
import { KNOWLEDGE_ARTICLES } from '@/modules/tickets/queries/ticket.queries';

export default function HelpCenterPage() {
  const [search, setSearch] = useState('');
  const { data, loading } = useQuery(KNOWLEDGE_ARTICLES, {
    variables: { search: search || undefined, internal: false },
  });

  return (
    <RoleGuard minRole="CUSTOMER">
      <AppShell>
        <div className="space-y-5 max-w-2xl">
          <PageTitle title="Help Center" hint="Search owned articles or ask a question." />
          <HelpAskBox />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles…"
          />
          {loading && <p className="text-sm text-muted-foreground">Searching…</p>}
          <div className="space-y-2">
            {data?.knowledgeArticles?.map((article: { id: number; title: string; body: string; category?: { name: string } }) => (
              <Link key={article.id} href={`/knowledge/${article.id}`} className="block surface rounded-3xl border border-border/70 p-4 hover:border-iris/40">
                <h2 className="font-medium text-sm">{article.title}</h2>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.body}</p>
                {article.category && <p className="text-xs text-muted-foreground mt-2">{article.category.name}</p>}
              </Link>
            ))}
          </div>
        </div>
      </AppShell>
    </RoleGuard>
  );
}

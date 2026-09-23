'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { PageTitle } from '@/components/ui/Field';
import { ListSearch } from '@/components/ui/ListSearch';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { HelpAskBox } from '@/modules/tickets/components/HelpAskBox';
import { KNOWLEDGE_ARTICLES } from '@/modules/tickets/queries/ticket.queries';
import { filterByQuery } from '@/lib/listSearch';

type GuideArticle = { id: number; title: string; body: string };

export default function InternalGuidesPage() {
  const [search, setSearch] = useState('');
  const { data, loading } = useQuery(KNOWLEDGE_ARTICLES, {
    variables: { internal: true },
  });
  const articles = filterByQuery(
    (data?.knowledgeArticles ?? []) as GuideArticle[],
    search,
    (article) => `${article.title} ${article.body}`,
  );

  return (
    <RoleGuard minRole="AGENT">
        <div className="space-y-5 max-w-2xl">
          <PageTitle title="Internal guides" hint="Playbooks for agents. Not visible to customers." />
          <HelpAskBox />
          <ListSearch value={search} onChange={setSearch} placeholder="Search this pack…" />
          {loading && !data ? <PageSkeleton /> : articles.map((article) => (
            <Link key={article.id} href={`/knowledge/${article.id}`} className="block surface rounded-3xl border border-border/70 p-4">
              <h2 className="font-medium text-sm">{article.title}</h2>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.body}</p>
            </Link>
          ))}
        </div>
    </RoleGuard>
  );
}

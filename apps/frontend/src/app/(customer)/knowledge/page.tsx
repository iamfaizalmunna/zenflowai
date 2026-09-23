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

type HelpArticle = { id: number; title: string; body: string; category?: { name: string } };

export default function HelpCenterPage() {
  const [search, setSearch] = useState('');
  const { data, loading } = useQuery(KNOWLEDGE_ARTICLES, {
    variables: { internal: false },
  });
  const articles = filterByQuery(
    (data?.knowledgeArticles ?? []) as HelpArticle[],
    search,
    (article) => `${article.title} ${article.body} ${article.category?.name ?? ''}`,
  );

  return (
    <RoleGuard minRole="CUSTOMER">
        <div className="page-stack">
          <PageTitle title="Help Center" hint="Search owned articles or ask a question." />
          <HelpAskBox />
          <ListSearch
            value={search}
            onChange={setSearch}
            placeholder="Search this pack…"
          />
          {loading && !data ? <PageSkeleton /> : (
          <div className="space-y-2">
            {articles.map((article) => (
              <Link key={article.id} href={`/knowledge/${article.id}`} className="block min-w-0 surface-card p-4 transition-colors hover:border-iris/35">
                <h2 className="break-words text-[15px] font-semibold leading-snug tracking-tight">{article.title}</h2>
                <p className="type-meta mt-1.5 line-clamp-2 break-words">{article.body}</p>
                {article.category && <p className="type-meta mt-2">{article.category.name}</p>}
              </Link>
            ))}
          </div>
          )}
        </div>
    </RoleGuard>
  );
}

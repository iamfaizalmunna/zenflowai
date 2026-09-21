'use client';

import { useQuery } from '@apollo/client';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { KNOWLEDGE_ARTICLE } from '@/modules/tickets/queries/ticket.queries';

export default function KnowledgeArticlePage() {
  const id = Number(useParams<{ id: string }>().id);
  const { data, loading } = useQuery(KNOWLEDGE_ARTICLE, { variables: { id }, skip: !id });
  const article = data?.knowledgeArticle;

  return (
    <RoleGuard minRole="CUSTOMER">
      <AppShell>
        {loading && <p className="text-sm text-slate-400">Loading…</p>}
        {article && (
          <article className="max-w-2xl space-y-3">
            <p className="text-xs text-slate-400">{article.category?.name}</p>
            <h1 className="text-2xl font-bold tracking-tight">{article.title}</h1>
            <pre className="whitespace-pre-wrap text-sm leading-6 font-sans text-slate-700 dark:text-slate-300">
              {article.body}
            </pre>
          </article>
        )}
      </AppShell>
    </RoleGuard>
  );
}

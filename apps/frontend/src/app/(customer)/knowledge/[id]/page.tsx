'use client';

import { useQuery } from '@apollo/client';
import { useParams } from 'next/navigation';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { KNOWLEDGE_ARTICLE } from '@/modules/tickets/queries/ticket.queries';

export default function KnowledgeArticlePage() {
  const id = Number(useParams<{ id: string }>().id);
  const { data, loading } = useQuery(KNOWLEDGE_ARTICLE, { variables: { id }, skip: !id });
  const article = data?.knowledgeArticle;

  return (
    <RoleGuard minRole="CUSTOMER">
        {loading && !article ? <PageSkeleton /> : null}
        {article && (
          <article className="max-w-2xl space-y-3 surface rounded-3xl border border-border/70 p-6">
            <p className="text-xs text-muted-foreground">{article.category?.name}</p>
            <h1 className="font-display text-2xl tracking-tight">{article.title}</h1>
            <pre className="whitespace-pre-wrap text-sm leading-6 font-sans text-foreground/90">
              {article.body}
            </pre>
          </article>
        )}
    </RoleGuard>
  );
}

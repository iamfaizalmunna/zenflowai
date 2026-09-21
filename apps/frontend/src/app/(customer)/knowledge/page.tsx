'use client';

import { useState } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { KNOWLEDGE_ARTICLES } from '@/modules/tickets/queries/ticket.queries';
import { ASK_KB } from '@/modules/admin/queries/admin.queries';

export default function HelpCenterPage() {
  const [ask, { data: askData, loading: asking }] = useLazyQuery(ASK_KB);
  const [question, setQuestion] = useState('');
  const [search, setSearch] = useState('');
  const { data, loading } = useQuery(KNOWLEDGE_ARTICLES, {
    variables: { search: search || undefined, internal: false },
  });

  return (
    <RoleGuard minRole="CUSTOMER">
      <AppShell>
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight">Help Center</h1>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (question.trim().length < 4) return;
              void ask({ variables: { question } });
            }}
          >
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask the Help Center…"
              className="flex-1 border rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-sm"
            />
            <button type="submit" className="px-3 py-2 rounded-xl border text-sm">{asking ? '…' : 'Ask'}</button>
          </form>
          {askData?.askKnowledgeBase && (
            <div className="rounded-xl border p-3 text-sm space-y-1">
              <p>{askData.askKnowledgeBase.answer}</p>
              <p className="text-xs text-slate-400">confidence {Math.round(askData.askKnowledgeBase.confidence * 100)}%</p>
              {askData.askKnowledgeBase.citations.map((c: { id: number; title: string }) => (
                <Link key={c.id} href={`/knowledge/${c.id}`} className="block text-xs text-indigo-600">{c.title}</Link>
              ))}
            </div>
          )}
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

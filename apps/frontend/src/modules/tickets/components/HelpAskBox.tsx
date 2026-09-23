'use client';

import { useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import Link from 'next/link';
import { ASK_KB } from '@/modules/admin/queries/admin.queries';
import { Button, Input } from '@/components/ui/Field';

export function HelpAskBox() {
  const [question, setQuestion] = useState('');
  const [ask, { data, loading }] = useLazyQuery(ASK_KB);

  return (
    <div className="surface-card space-y-3 p-4">
      <p className="text-sm font-medium">Ask the Help Center</p>
      <form
        className="flex min-w-0 items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim().length < 4) return;
          void ask({ variables: { question } });
        }}
      >
        <Input className="w-auto min-w-0 flex-1" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask…" />
        <Button type="submit" className="shrink-0">{loading ? '…' : 'Ask'}</Button>
      </form>
      {data?.askKnowledgeBase && (
        <div className="text-sm space-y-1">
          <p>{data.askKnowledgeBase.answer}</p>
          <p className="text-xs text-muted-foreground">
            confidence {Math.round(data.askKnowledgeBase.confidence * 100)}%
          </p>
          {data.askKnowledgeBase.citations.map((c: { id: number; title: string }) => (
            <Link key={c.id} href={`/knowledge/${c.id}`} className="block text-xs text-iris">{c.title}</Link>
          ))}
          {data.askKnowledgeBase.engine ? (
            <p className="text-xs text-muted-foreground">Engine {data.askKnowledgeBase.engine}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

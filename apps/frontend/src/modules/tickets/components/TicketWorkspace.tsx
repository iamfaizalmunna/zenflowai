'use client';

import { useState } from 'react';
import { useLazyQuery, useMutation, useQuery, useSubscription } from '@apollo/client';
import {
  ADD_MESSAGE,
  ARTICLE_SNIPPET,
  HANDOFF_TICKET,
  GET_TICKET,
  MESSAGE_ADDED,
  RELATED_ARTICLES,
  SUGGEST_REPLY,
  TICKET_UPDATED,
  UPDATE_TICKET,
} from '@/modules/tickets/queries/ticket.queries';
import { STATUS_COLOR, STATUS_LABEL, PRIORITY_COLOR, PRIORITY_LABEL } from '@/lib/constants';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useCountdown } from '@/modules/tickets/hooks/useCountdown';
import { useUiSound } from '@/hooks/useUiSound';
import { Button, Textarea } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { HelpAskBox } from '@/modules/tickets/components/HelpAskBox';

const STAFF = new Set(['AGENT', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN']);

interface TicketMessage {
  id: number;
  body: string;
  type: string;
  createdAt: string;
  sender: { id: number; name: string; role?: string; isAiConsultant?: boolean };
}

interface RelatedArticle {
  id: number;
  title: string;
  visibility: string;
  category?: { name: string } | null;
}

export function TicketWorkspace({ id, role }: { id: number; role: string | undefined }) {
  const { play } = useUiSound();
  const isStaff = STAFF.has(role ?? '');
  const [body, setBody] = useState('');
  const [internal, setInternal] = useState(false);

  const { data, loading, refetch } = useQuery(GET_TICKET, { variables: { id }, skip: !id });
  const { data: relatedData } = useQuery(RELATED_ARTICLES, { variables: { ticketId: id }, skip: !id });
  const [addMessage, { loading: sending }] = useMutation(ADD_MESSAGE, {
    onCompleted: () => {
      void play('success');
      setBody('');
      void refetch();
    },
  });
  const [handoffTicket, { loading: handing }] = useMutation(HANDOFF_TICKET, { onCompleted: () => refetch() });
  const [updateTicket] = useMutation(UPDATE_TICKET, { onCompleted: () => refetch() });
  const [fetchSuggest, { loading: suggesting }] = useLazyQuery(SUGGEST_REPLY);
  const [fetchSnippet] = useLazyQuery(ARTICLE_SNIPPET);

  useSubscription(MESSAGE_ADDED, {
    variables: { ticketId: id },
    skip: !id,
    onData: () => { void refetch(); },
  });
  useSubscription(TICKET_UPDATED, {
    variables: { ticketId: id },
    skip: !id,
    onData: () => { void refetch(); },
  });

  const ticket = data?.ticket;
  const response = useCountdown(ticket?.slaResponseDueAt);
  const resolve = useCountdown(ticket?.slaResolutionDueAt);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    addMessage({
      variables: {
        input: { ticketId: id, body, type: internal ? 'INTERNAL_NOTE' : 'REPLY' },
      },
    });
  };

  const applySuggest = async () => {
    const res = await fetchSuggest({ variables: { ticketId: id } });
    if (res.data?.suggestReply) setBody(res.data.suggestReply);
  };

  const insertArticle = async (articleId: number) => {
    const res = await fetchSnippet({ variables: { articleId } });
    const snippet = res.data?.articleSnippet as string | undefined;
    if (snippet) setBody((prev) => (prev ? `${prev}\n\n${snippet}` : snippet));
  };

  if (loading) return <p className="text-sm text-slate-400">Loading ticket…</p>;
  if (!ticket) return <p className="text-sm text-slate-400">Ticket not found.</p>;

  const thread = (
    <>
      <div className="space-y-3 flex-1 overflow-y-auto min-h-[240px]">
        {ticket.messages?.map((msg: TicketMessage) => (
          <div
            key={msg.id}
            className={cn(
              'rounded-xl border p-3 text-sm',
              msg.type === 'INTERNAL_NOTE'
                ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/30'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
            )}
          >
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>
                {msg.sender.name}
                {msg.sender.isAiConsultant ? ' · AI' : ''}
                {msg.type === 'INTERNAL_NOTE' ? ' · internal' : ''}
                {msg.type === 'SYSTEM_EVENT' ? ' · system' : ''}
              </span>
              <span>{formatRelativeTime(msg.createdAt)}</span>
            </div>
            <p className="whitespace-pre-wrap">{msg.body}</p>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="space-y-2 pt-3">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Write a reply…"
        />
        {isStaff && (
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
            Internal note
          </label>
        )}
        <Button
          type="submit"
          disabled={sending || !body.trim()}
          className="w-full"
        >
          {sending ? 'Sending…' : 'Send'}
        </Button>
      </form>
    </>
  );

  const slaBlock = (
    <div className="space-y-1 text-xs">
      {ticket.slaResponseDueAt && (
        <p className={response.overdue ? 'text-red-600' : 'text-slate-500'}>
          First response: {response.label}
        </p>
      )}
      {ticket.slaResolutionDueAt && (
        <p className={resolve.overdue ? 'text-red-600' : 'text-slate-500'}>
          Resolve by: {resolve.label}
        </p>
      )}
    </div>
  );

  if (!isStaff) {
    return (
      <div className="space-y-5 max-w-3xl">
        <header>
          <p className="text-xs font-mono text-slate-400">{ticket.ticketNumber}</p>
          <h1 className="text-2xl font-bold tracking-tight mt-1">{ticket.title}</h1>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLOR[ticket.status])}>
              {STATUS_LABEL[ticket.status]}
            </span>
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', PRIORITY_COLOR[ticket.priority])}>
              {PRIORITY_LABEL[ticket.priority]}
            </span>
          </div>
          <div className="mt-2">{slaBlock}</div>
          {ticket.assignedTo?.isAiConsultant && (
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              disabled={handing}
              onClick={() => void handoffTicket({ variables: { ticketId: id } })}
            >
              {handing ? 'Connecting…' : 'Still need a person'}
            </Button>
          )}
          {ticket.lastConsult && (
            <p className="text-xs text-muted-foreground mt-2">
              Nova engine: {ticket.lastConsult.engine === 'OLLAMA' ? 'local model + KB' : 'knowledge base'}
            </p>
          )}
        </header>
        {thread}
      </div>
    );
  }

  return (
    <div className="grid gap-4 app:grid-cols-[240px_minmax(0,1fr)_260px] items-start">
      <aside className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
        <p className="text-xs font-mono text-slate-400">{ticket.ticketNumber}</p>
        <h1 className="text-lg font-semibold leading-snug">{ticket.title}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{ticket.description}</p>
        <p className="text-xs text-slate-500">Customer: {ticket.customer?.name}</p>
        {ticket.assignedTo && (
          <p className="text-xs text-slate-500">
            Agent: {ticket.assignedTo.name}
            {ticket.assignedTo.isAiConsultant ? ' · AI' : ''}
          </p>
        )}
        {ticket.team && <p className="text-xs text-slate-500">Team: {ticket.team.name}</p>}
        {slaBlock}
      </aside>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 p-4 flex flex-col min-h-[70vh]">
        {thread}
      </section>

      <aside className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Actions</p>
          <Select
            aria-label="Ticket status"
            value={ticket.status}
            onValueChange={(status) => updateTicket({ variables: { id, input: { status } } })}
            options={['NEW', 'OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'].map((s) => ({
              value: s,
              label: STATUS_LABEL[s],
            }))}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => void applySuggest()}
          disabled={suggesting}
        >
          {suggesting ? 'Loading…' : 'Suggest reply'}
        </Button>
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Related articles</p>
          <ul className="space-y-2">
            {(relatedData?.relatedArticles as RelatedArticle[] | undefined)?.map((article) => (
              <li key={article.id}>
                <button
                  type="button"
                  onClick={() => void insertArticle(article.id)}
                  className="text-left text-sm text-indigo-600 hover:underline"
                >
                  {article.title}
                </button>
              </li>
            ))}
            {!relatedData?.relatedArticles?.length && (
              <li className="text-xs text-muted-foreground">No related articles</li>
            )}
          </ul>
        </div>
        <HelpAskBox />
      </aside>
    </div>
  );
}

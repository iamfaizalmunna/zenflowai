'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { CATEGORIES, CREATE_TICKET, KNOWLEDGE_ARTICLES } from '@/modules/tickets/queries/ticket.queries';
import { Button, Field, Input, PageTitle, Textarea } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';

export default function NewTicketPage() {
  const router = useRouter();
  const { data: catData } = useQuery(CATEGORIES);
  const [createTicket, { loading, error }] = useMutation(CREATE_TICKET, {
    onCompleted: (res) => router.push(`/tickets/${res.createTicket.id}`),
  });
  const [form, setForm] = useState({ title: '', description: '', categoryId: '', priority: 'MEDIUM' });
  const [search, setSearch] = useState('');
  const { data: kbData } = useQuery(KNOWLEDGE_ARTICLES, {
    variables: { search, internal: false },
    skip: search.length < 4,
  });

  useEffect(() => {
    const t = setTimeout(() => setSearch(form.title.trim()), 400);
    return () => clearTimeout(t);
  }, [form.title]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createTicket({
      variables: {
        input: {
          title: form.title,
          description: form.description,
          priority: form.priority,
          categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        },
      },
    });
  };

  return (
    <RoleGuard minRole="CUSTOMER">
      <AppShell>
        <div className="max-w-xl space-y-5">
          <PageTitle title="Create ticket" hint="We’ll route this to the right team." />
          {error && <p className="text-sm text-destructive">{error.message}</p>}
          <form onSubmit={submit} className="space-y-4 rounded-3xl border border-border/70 bg-card/70 p-5 app:p-6">
            <Field label="Title">
              <Input
                required
                minLength={4}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="What’s going on?"
              />
            </Field>
            {kbData?.knowledgeArticles?.length > 0 && (
              <div className="rounded-2xl border border-iris/20 bg-iris/5 p-3 text-sm space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Related help articles</p>
                {kbData.knowledgeArticles.slice(0, 4).map((a: { id: number; title: string }) => (
                  <Link key={a.id} href={`/knowledge/${a.id}`} className="block text-iris hover:underline">
                    {a.title}
                  </Link>
                ))}
              </div>
            )}
            <Field label="Description">
              <Textarea
                required
                minLength={10}
                rows={6}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Share steps, errors, and what you expected."
              />
            </Field>
            <Field label="Category">
              <Select
                value={form.categoryId}
                onValueChange={(categoryId) => setForm({ ...form, categoryId })}
                placeholder="Select category"
                options={(catData?.categories ?? []).map((c: { id: number; name: string }) => ({
                  value: String(c.id),
                  label: c.name,
                }))}
              />
            </Field>
            <Field label="Priority">
              <Select
                value={form.priority}
                onValueChange={(priority) => setForm({ ...form, priority })}
                options={[
                  { value: 'LOW', label: 'Low' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HIGH', label: 'High' },
                  { value: 'URGENT', label: 'Urgent' },
                ]}
              />
            </Field>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Submitting…' : 'Submit ticket'}
            </Button>
          </form>
        </div>
      </AppShell>
    </RoleGuard>
  );
}

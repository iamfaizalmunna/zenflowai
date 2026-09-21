'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { PENDING_CSATS, SUBMIT_CSAT } from '@/modules/admin/queries/admin.queries';
import { useUiSound } from '@/hooks/useUiSound';
import { Button } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';

export function CsatBanner() {
  const { data, refetch } = useQuery(PENDING_CSATS);
  const { play } = useUiSound();
  const [submit] = useMutation(SUBMIT_CSAT, {
    onCompleted: () => {
      void play('success');
      void refetch();
    },
  });
  const [rating, setRating] = useState(5);
  const survey = data?.pendingCsats?.[0];
  if (!survey) return null;

  return (
    <div className="rounded-2xl border border-iris/25 bg-iris/10 p-4 text-sm space-y-2">
      <p className="font-medium">How was {survey.ticket.ticketNumber}?</p>
      <p className="text-slate-500 text-xs">{survey.ticket.title}</p>
      <form
        className="flex flex-wrap gap-2 items-center"
        onSubmit={(e) => {
          e.preventDefault();
          submit({ variables: { id: survey.id, rating } });
        }}
      >
        <Select
          aria-label="CSAT rating"
          value={String(rating)}
          onValueChange={(value) => setRating(Number(value))}
          className="w-28"
          options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}` }))}
        />
        <Button type="submit">Submit rating</Button>
      </form>
    </div>
  );
}

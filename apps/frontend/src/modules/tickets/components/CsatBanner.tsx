'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { PENDING_CSATS, SUBMIT_CSAT } from '@/modules/admin/queries/admin.queries';
import { useUiSound } from '@/hooks/useUiSound';

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
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="border rounded-lg px-2 py-1 bg-white dark:bg-slate-900">
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <button type="submit" className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs dark:bg-white dark:text-slate-900">Submit rating</button>
      </form>
    </div>
  );
}

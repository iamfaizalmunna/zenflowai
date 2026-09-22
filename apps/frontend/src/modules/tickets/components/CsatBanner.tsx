'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { PENDING_CSATS, SUBMIT_CSAT } from '@/modules/admin/queries/admin.queries';
import { useUiSound } from '@/hooks/useUiSound';
import { Button, Textarea } from '@/components/ui/Field';
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
  const [comment, setComment] = useState('');
  const survey = data?.pendingCsats?.[0];
  if (!survey) return null;

  return (
    <div className="rounded-2xl border border-iris/25 bg-iris/10 p-4 text-sm space-y-3">
      <p className="font-medium">How was {survey.ticket.ticketNumber}?</p>
      <p className="text-muted-foreground text-xs">{survey.ticket.title}</p>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit({ variables: { id: survey.id, rating, comment: comment.trim() || undefined } });
          setComment('');
        }}
      >
        <div className="flex flex-wrap gap-2 items-center">
          <Select
            aria-label="CSAT rating"
            value={String(rating)}
            onValueChange={(value) => setRating(Number(value))}
            className="w-36"
            options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} star` }))}
          />
          <Button type="submit">Submit rating</Button>
        </div>
        <Textarea
          aria-label="Feedback comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What went well, or what should we fix?"
          className="min-h-20"
        />
      </form>
    </div>
  );
}

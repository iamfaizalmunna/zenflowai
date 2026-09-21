import { articleSnippet } from './suggestReply';

export const KB_ANSWER_MIN_SCORE = 2;

export interface KbHit {
  id: number;
  title: string;
  body: string;
  score: number;
}

export function buildKbAnswer(hits: KbHit[]): {
  answer: string;
  confidence: number;
  citations: Array<{ id: number; title: string }>;
} {
  const usable = hits.filter((h) => h.score >= KB_ANSWER_MIN_SCORE);
  if (usable.length === 0) {
    return {
      answer: 'I do not know from the Help Center. Please open a ticket if you still need help.',
      confidence: 0,
      citations: [],
    };
  }
  const top = usable[0];
  const confidence = Math.min(1, top.score / 8);
  return {
    answer: articleSnippet(top.title, top.body, 320),
    confidence,
    citations: usable.slice(0, 3).map((h) => ({ id: h.id, title: h.title })),
  };
}

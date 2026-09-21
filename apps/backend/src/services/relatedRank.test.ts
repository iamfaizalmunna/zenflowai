import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { articleRelevanceScore, rankRelatedArticles } from './relatedRank';

describe('Phase 3 related articles', () => {
  it('scores category and keyword overlap', () => {
    const score = articleRelevanceScore(
      'billing invoice failed payment',
      { title: 'How billing invoices work', body: 'payment failed retry', categoryId: 2 },
      2
    );
    assert.ok(score > 0);
  });

  it('returns highest ranking articles first', () => {
    const ranked = rankRelatedArticles(
      'printer jam hardware',
      [
        { title: 'Vacation policy', body: 'time off', categoryId: 1 },
        { title: 'Printer troubleshooting', body: 'paper jam hardware', categoryId: 3 },
      ],
      3,
      5
    );
    assert.equal(ranked[0]?.title, 'Printer troubleshooting');
  });
});

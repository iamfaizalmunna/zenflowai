import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { articleRelevanceScore, rankRelatedArticles, rankRelatedWithScores } from './relatedRank';

describe('Phase 3 related articles', () => {
  it('scores category and keyword overlap', () => {
    const score = articleRelevanceScore(
      'billing invoice failed payment',
      { title: 'How billing invoices work', body: 'payment failed retry', categoryId: 2 },
      2
    );
    assert.ok(score > 0);
    assert.equal(articleRelevanceScore('the and', { title: 'Hi', body: 'No', categoryId: 2 }, 2), 1);
    assert.equal(articleRelevanceScore('the and', { title: 'Hi', body: 'No', categoryId: 9 }, 2), 0);
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
    const scored = rankRelatedWithScores('printer jam', [{ title: 'Printer jam', body: 'clear the jam hardware' }], null, 1);
    assert.equal(scored.length, 1);
    assert.equal(rankRelatedArticles('zzz', [{ title: 'Hi', body: 'No' }]).length, 0);
  });
});

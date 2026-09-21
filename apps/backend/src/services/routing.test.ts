import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { matchRoutingRule } from './routingMatch';

const rules = [
  { id: 1, type: 'KEYWORD', keyword: 'billing', categoryId: null, priority: null },
  { id: 2, type: 'CATEGORY', keyword: null, categoryId: 9, priority: null },
  { id: 3, type: 'PRIORITY', keyword: null, categoryId: null, priority: 'URGENT' },
  { id: 4, type: 'FALLBACK', keyword: null, categoryId: null, priority: null },
];

describe('Phase 2 routing engine', () => {
  it('matches keyword first', () => {
    const hit = matchRoutingRule(rules, {
      title: 'Need billing help',
      description: 'invoice missing',
      priority: 'LOW',
    });
    assert.equal(hit?.id, 1);
  });

  it('matches category when no keyword hits', () => {
    const hit = matchRoutingRule(rules, {
      title: 'Printer jam',
      description: 'hardware',
      categoryId: 9,
      priority: 'LOW',
    });
    assert.equal(hit?.id, 2);
  });

  it('falls back when nothing else matches', () => {
    const hit = matchRoutingRule(rules, {
      title: 'Hello',
      description: 'general question',
      priority: 'LOW',
    });
    assert.equal(hit?.id, 4);
  });
});

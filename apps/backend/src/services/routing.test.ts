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

  it('matches priority then falls back', () => {
    const urgent = matchRoutingRule(rules, {
      title: 'Outage',
      description: 'site down',
      priority: 'URGENT',
    });
    assert.equal(urgent?.id, 3);
    const none = matchRoutingRule(
      [{ id: 9, type: 'KEYWORD', keyword: null, categoryId: null, priority: null }],
      { title: 'Hello', description: 'general', priority: 'LOW' },
    );
    assert.equal(none, null);
    const fallback = matchRoutingRule(
      [{ id: 4, type: 'FALLBACK', keyword: null, categoryId: null, priority: null }],
      { title: 'Hello', description: 'general', priority: 'LOW' },
    );
    assert.equal(fallback?.id, 4);
  });
});

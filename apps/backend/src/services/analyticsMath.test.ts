import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  average,
  buildKpis,
  clampRangeDays,
  countBy,
  csatBars,
  fillDayBuckets,
  parseChartType,
} from './analyticsMath';
import { diceCoefficient, isNearDuplicate } from './similarity';
import { consultantStats, isConsultantRole } from './consultantStats';

describe('Phase 6 analytics math', () => {
  it('parses chart types and range days', () => {
    assert.equal(parseChartType('PIE'), 'PIE');
    assert.equal(parseChartType('nope'), 'LINE');
    assert.equal(clampRangeDays(2), 7);
    assert.equal(clampRangeDays(400), 90);
  });

  it('fills day buckets and counts groups', () => {
    const end = new Date('2026-09-22T12:00:00Z');
    const buckets = fillDayBuckets(end, 3, [
      new Date('2026-09-22T01:00:00Z'),
      new Date('2026-09-22T08:00:00Z'),
      new Date('2026-09-21T08:00:00Z'),
    ]);
    assert.equal(buckets.length, 3);
    assert.equal(buckets[2].value, 2);
    assert.deepEqual(countBy(['OPEN', 'OPEN', 'CLOSED']), [
      { key: 'OPEN', value: 2 },
      { key: 'CLOSED', value: 1 },
    ]);
  });

  it('builds kpis and csat bars', () => {
    const kpis = buildKpis({ open: 4, resolved: 10, slaBreached: 1, csatAverage: 4.55, unanswered: 2 });
    assert.equal(kpis.find((k) => k.id === 'csat')?.value, 4.6);
    assert.equal(csatBars([5, 5, 1])[4].value, 2);
    assert.equal(average([]), 0);
  });
});

describe('Phase 6 similarity (Natural-style dice)', () => {
  it('flags near-duplicate ticket text', () => {
    assert.ok(diceCoefficient('cannot login on safari', 'cannot login on safari') > 0.99);
    assert.equal(isNearDuplicate('hello world ticket', 'hello world ticket'), true);
    assert.equal(isNearDuplicate('billing refund please', 'outage on production cluster'), false);
  });
});

describe('Phase 6 consultant stats', () => {
  it('keeps profiles to agent and supervisor roles', () => {
    assert.equal(isConsultantRole('AGENT'), true);
    assert.equal(isConsultantRole('ADMIN'), false);
  });

  it('counts progress and CSAT for one assignee', () => {
    const now = new Date('2026-09-22T00:00:00Z');
    const stats = consultantStats(
      [
        {
          assignedToId: 4,
          status: 'OPEN',
          createdAt: now,
          firstRespondedAt: null,
          resolvedAt: null,
          csatRating: null,
        },
        {
          assignedToId: 4,
          status: 'RESOLVED',
          createdAt: new Date('2026-09-20T00:00:00Z'),
          firstRespondedAt: new Date('2026-09-20T02:00:00Z'),
          resolvedAt: new Date('2026-09-21T00:00:00Z'),
          csatRating: 5,
        },
        {
          assignedToId: 9,
          status: 'RESOLVED',
          createdAt: now,
          firstRespondedAt: now,
          resolvedAt: now,
          csatRating: 1,
        },
      ],
      4,
    );
    assert.equal(stats.openCount, 1);
    assert.equal(stats.resolvedCount, 1);
    assert.equal(stats.csatAverage, 5);
    assert.equal(stats.avgFirstResponseHours, 2);
    assert.equal(stats.avgResolveHours, 24);
  });
});

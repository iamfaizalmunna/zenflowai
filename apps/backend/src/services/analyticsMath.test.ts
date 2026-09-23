import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  average,
  buildKpis,
  clampRangeDays,
  countBy,
  csatBars,
  fillDayBuckets,
  fillWeekBuckets,
  hoursBetween,
  parseChartType,
} from './analyticsMath';
import { diceCoefficient, isNearDuplicate } from './similarity';
import { consultantAssessment, consultantStats, isConsultantRole, rankLeaderboard } from './consultantStats';

describe('Phase 6 analytics math', () => {
  it('parses chart types and range days', () => {
    assert.equal(parseChartType('PIE'), 'PIE');
    assert.equal(parseChartType('nope'), 'LINE');
    assert.equal(parseChartType(null), 'LINE');
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
    const weeks = fillWeekBuckets(end, 3, [
      new Date('2026-09-22T01:00:00Z'),
      new Date('2026-09-15T08:00:00Z'),
      new Date('2026-09-16T08:00:00Z'),
      new Date('2020-01-01T00:00:00Z'),
    ]);
    assert.equal(weeks.length, 3);
    assert.equal(weeks[1].value, 2);
    assert.equal(weeks[2].value, 1);
  });

  it('builds kpis and csat bars', () => {
    const kpis = buildKpis({ open: 4, resolved: 10, slaBreached: 1, csatAverage: 4.55, unanswered: 2 });
    assert.equal(kpis.find((k) => k.id === 'csat')?.value, 4.6);
    assert.equal(csatBars([5, 5, 1])[4].value, 2);
    assert.equal(average([]), 0);
    assert.equal(hoursBetween(new Date('2026-09-22T00:00:00Z'), new Date('2026-09-22T02:30:00Z')), 2.5);
    assert.equal(hoursBetween(new Date('2026-09-22T03:00:00Z'), new Date('2026-09-22T01:00:00Z')), 0);
    assert.equal(clampRangeDays(Number.NaN), 30);
    assert.equal(csatBars([5, 0, 9, 1])[0].value, 1);
    const end = new Date('2026-09-22T12:00:00Z');
    const days = fillDayBuckets(end, 2, [new Date('2020-01-01T00:00:00Z')]);
    assert.equal(days.every((b) => b.value === 0), true);
  });
});

describe('Phase 6 similarity (Natural-style dice)', () => {
  it('flags near-duplicate ticket text', () => {
    assert.ok(diceCoefficient('cannot login on safari', 'cannot login on safari') > 0.99);
    assert.equal(isNearDuplicate('hello world ticket', 'hello world ticket'), true);
    assert.equal(isNearDuplicate('billing refund please', 'outage on production cluster'), false);
    assert.equal(isNearDuplicate('abc', 'xyz', 0), true);
    assert.equal(diceCoefficient('a', 'a'), 1);
    assert.equal(diceCoefficient('a', 'b'), 0);
  });
});

describe('Phase 6 consultant stats', () => {
  it('keeps profiles to agent and supervisor roles', () => {
    assert.equal(isConsultantRole('AGENT'), true);
    assert.equal(isConsultantRole('SUPERVISOR'), true);
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
          assignedToId: 4,
          status: 'CLOSED',
          createdAt: new Date('2026-09-18T00:00:00Z'),
          firstRespondedAt: new Date('2026-09-18T01:00:00Z'),
          resolvedAt: new Date('2026-09-18T04:00:00Z'),
          csatRating: 4,
          slaResponseBreached: true,
        },
      ],
      4,
    );
    assert.equal(stats.openCount, 1);
    assert.equal(stats.resolvedCount, 2);
    assert.equal(stats.closedCount, 1);
    assert.equal(stats.csatAverage, 4.5);
    assert.equal(stats.avgFirstResponseHours, 1.5);
    assert.equal(stats.avgResolveHours, 14);
  });

  it('builds a spider assessment index and lists gaps', () => {
    const now = new Date('2026-09-22T00:00:00Z');
    const score = consultantAssessment(
      [
        {
          assignedToId: 4,
          status: 'OPEN',
          createdAt: now,
          firstRespondedAt: null,
          resolvedAt: null,
          csatRating: null,
          slaResolutionBreached: true,
        },
        {
          assignedToId: 4,
          status: 'RESOLVED',
          createdAt: new Date('2026-09-20T00:00:00Z'),
          firstRespondedAt: new Date('2026-09-20T02:00:00Z'),
          resolvedAt: new Date('2026-09-21T00:00:00Z'),
          csatRating: 5,
          slaResolutionBreached: false,
        },
      ],
      4,
    );
    assert.equal(score.axes.length, 6);
    assert.ok(score.index >= 0 && score.index <= 100);
    assert.ok(score.gaps.length >= 1);
  });

  it('ranks solvers by resolved work then CSAT', () => {
    const ranked = rankLeaderboard([
      { id: 1, name: 'B', resolvedCount: 4, csatAverage: 5, assessmentIndex: 80, detractors: 0 },
      { id: 2, name: 'A', resolvedCount: 8, csatAverage: 3, assessmentIndex: 70, detractors: 2 },
      { id: 3, name: 'C', resolvedCount: 8, csatAverage: 4, assessmentIndex: 70, detractors: 2 },
      { id: 4, name: 'D', resolvedCount: 8, csatAverage: 4, assessmentIndex: 90, detractors: 2 },
      { id: 5, name: 'E', resolvedCount: 8, csatAverage: 4, assessmentIndex: 90, detractors: 1 },
      { id: 6, name: 'F', resolvedCount: 8, csatAverage: 4, assessmentIndex: 90, detractors: 1 },
    ]);
    assert.equal(ranked[0]?.id, 5);
    assert.equal(ranked.map((r) => r.id).includes(6), true);
  });

  it('uses the empty-pack defaults on the spider', () => {
    const empty = consultantAssessment([], 4);
    assert.equal(empty.axes.length, 6);
    assert.ok(empty.index >= 0);
  });
});

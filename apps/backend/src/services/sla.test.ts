import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDueAt } from './slaDates';

describe('Phase 2 SLA due dates', () => {
  it('adds response and resolution hours to the start time', () => {
    const from = new Date('2026-09-21T00:00:00.000Z');
    const due = calculateDueAt(from, 8, 24);
    assert.equal(due.slaResponseDueAt.toISOString(), '2026-09-21T08:00:00.000Z');
    assert.equal(due.slaResolutionDueAt.toISOString(), '2026-09-22T00:00:00.000Z');
  });
});

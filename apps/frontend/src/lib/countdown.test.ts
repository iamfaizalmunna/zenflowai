import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatCountdown, remainingMs } from './countdown';

describe('Phase 3 SLA countdown', () => {
  it('marks past due as overdue', () => {
    assert.equal(formatCountdown(-1000), 'overdue');
  });

  it('formats remaining hours', () => {
    assert.equal(formatCountdown(90 * 60 * 1000), '1h 30m');
  });

  it('computes remaining ms from a due date', () => {
    const now = Date.parse('2026-09-21T00:00:00.000Z');
    const due = '2026-09-21T02:00:00.000Z';
    assert.equal(remainingMs(due, now), 2 * 60 * 60 * 1000);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clampCsatRating, csatExpiresAt, isCsatOpen } from './csatRules';

describe('Phase 4 CSAT rules', () => {
  it('expires seven days after send', () => {
    const from = new Date('2026-09-21T00:00:00.000Z');
    assert.equal(csatExpiresAt(from).toISOString(), '2026-09-28T00:00:00.000Z');
  });

  it('clamps ratings to 1–5', () => {
    assert.equal(clampCsatRating(0), 1);
    assert.equal(clampCsatRating(9), 5);
  });

  it('closes submitted or expired surveys', () => {
    const exp = new Date('2026-09-28T00:00:00.000Z');
    assert.equal(isCsatOpen(exp, false, new Date('2026-09-22T00:00:00.000Z')), true);
    assert.equal(isCsatOpen(exp, true, new Date('2026-09-22T00:00:00.000Z')), false);
    assert.equal(isCsatOpen(exp, false, new Date('2026-09-29T00:00:00.000Z')), false);
  });
});

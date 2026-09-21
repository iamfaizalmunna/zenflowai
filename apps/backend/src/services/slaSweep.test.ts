import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isSlaBreached, isSlaWarning, shouldAutoClose } from './slaSweep';

describe('Phase 4 SLA sweep math', () => {
  const now = new Date('2026-09-21T12:00:00.000Z');

  it('warns when due within two hours', () => {
    assert.equal(isSlaWarning(new Date('2026-09-21T13:00:00.000Z'), now), true);
    assert.equal(isSlaWarning(new Date('2026-09-21T16:00:00.000Z'), now), false);
  });

  it('marks due times in the past as breached', () => {
    assert.equal(isSlaBreached(new Date('2026-09-21T11:00:00.000Z'), now), true);
    assert.equal(isSlaBreached(new Date('2026-09-21T13:00:00.000Z'), now), false);
  });

  it('auto-closes 48 hours after resolve', () => {
    assert.equal(shouldAutoClose(new Date('2026-09-19T12:00:00.000Z'), now), true);
    assert.equal(shouldAutoClose(new Date('2026-09-20T12:00:00.000Z'), now), false);
  });
});

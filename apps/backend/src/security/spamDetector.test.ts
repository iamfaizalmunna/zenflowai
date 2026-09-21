import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { verdictFromScore } from './spamVerdict';

describe('Phase 1 spam verdicts', () => {
  it('maps score bands to verdicts', () => {
    assert.equal(verdictFromScore(0), 'CLEAN');
    assert.equal(verdictFromScore(30), 'SUSPICIOUS');
    assert.equal(verdictFromScore(60), 'HIGH_RISK');
    assert.equal(verdictFromScore(80), 'BLOCK');
  });
});

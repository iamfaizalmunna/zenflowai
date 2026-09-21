import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildKbAnswer } from './qaAnswer';

describe('Phase 4 knowledge Q&A', () => {
  it('says it does not know when scores are low', () => {
    const result = buildKbAnswer([{ id: 1, title: 'Unrelated', body: 'hello', score: 1 }]);
    assert.equal(result.confidence, 0);
    assert.match(result.answer, /do not know/i);
    assert.equal(result.citations.length, 0);
  });

  it('returns a cited snippet for a strong match', () => {
    const result = buildKbAnswer([
      { id: 2, title: 'Reset password', body: 'Use forgot password then check email.', score: 5 },
    ]);
    assert.ok(result.confidence > 0);
    assert.match(result.answer, /Reset password/);
    assert.equal(result.citations[0]?.id, 2);
  });
});

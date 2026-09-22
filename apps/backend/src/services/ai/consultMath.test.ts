import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGroundedPrompt,
  confidenceFromScore,
  hashChunk,
  skipIfUnchanged,
  HANDOFF_THRESHOLD,
  isGrounded,
  formatConsultReply,
  resolveEngine,
  shouldHandoff,
  splitArticleBody,
} from './consultMath';

describe('Phase 7 consult math', () => {
  it('hands off when confidence is below the threshold or there are no hits', () => {
    assert.equal(shouldHandoff(HANDOFF_THRESHOLD - 0.01, 2), true);
    assert.equal(shouldHandoff(0.9, 0), true);
    assert.equal(shouldHandoff(0.8, 3), false);
  });

  it('rejects ungrounded model text', () => {
    assert.equal(isGrounded('The sky is green today.', ['SSO login loop']), false);
    assert.equal(isGrounded('Clear Safari cookies to break the login loop.', ['SSO login loop']), true);
  });

  it('hashes chunks so ingest can skip duplicates', () => {
    const a = hashChunk(' same body ');
    const b = hashChunk('same body');
    assert.equal(a, b);
    assert.notEqual(a, hashChunk('other'));
    assert.equal(skipIfUnchanged(a, 'same body'), true);
    assert.equal(skipIfUnchanged(a, 'other'), false);
  });

  it('splits articles and builds a grounded prompt', () => {
    const parts = splitArticleBody('First paragraph about VPN.\n\nSecond paragraph about timeout.');
    assert.equal(parts.length, 2);
    const prompt = buildGroundedPrompt('VPN drops', [{ title: 'VPN drops hourly', body: parts[0] }]);
    assert.match(prompt, /only from the sources/i);
    assert.match(prompt, /VPN drops hourly/);
  });

  it('uses Ollama only when grounded text is returned', () => {
    assert.equal(resolveEngine(null), 'RETRIEVAL');
    assert.equal(resolveEngine('Clear Safari cookies to break the login loop.'), 'OLLAMA');
    const reply = formatConsultReply({
      answer: 'Reset via Forgot password.',
      citations: [{ title: 'How to reset your password' }],
      engine: 'RETRIEVAL',
    });
    assert.match(reply, /knowledge base/);
    assert.match(reply, /How to reset your password/);
  });

  it('scales confidence from retrieval score', () => {
    assert.equal(confidenceFromScore(0), 0);
    assert.equal(confidenceFromScore(8), 1);
    assert.ok(confidenceFromScore(4) > 0.4);
  });
});

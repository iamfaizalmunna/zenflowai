import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { articleSnippet, pickReplyTemplate } from './suggestReply';

describe('Phase 3 suggest reply', () => {
  it('uses billing template', () => {
    assert.match(pickReplyTemplate('Billing'), /invoice/i);
  });

  it('falls back to a generic template', () => {
    assert.ok(pickReplyTemplate('Unknown').length > 10);
  });

  it('cites the article title in a snippet', () => {
    const text = articleSnippet('Reset password', 'Click forgot password then check email. '.repeat(20));
    assert.match(text, /Reset password/);
    assert.ok(text.includes('…'));
  });
});

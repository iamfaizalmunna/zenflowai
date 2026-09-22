import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hashChunk, skipIfUnchanged } from './consultMath';

describe('Phase 7 KB ingest', () => {
  it('skips unchanged article bodies', () => {
    const body = 'SSO login loop on Safari — clear site data.';
    assert.equal(skipIfUnchanged(hashChunk(body), body), true);
    assert.equal(skipIfUnchanged(hashChunk(body), 'different'), false);
  });
});

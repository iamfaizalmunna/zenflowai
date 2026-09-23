import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTH_CONTEXT_TTL_MS,
  readAuthContextCache,
  writeAuthContextCache,
} from './authContextCache';

describe('auth context cache', () => {
  it('returns a hit inside the TTL and misses after it expires', () => {
    const token = 'pack-token';
    const identity = { userId: 1, role: 'ADMIN', permissionOverrides: [] };
    writeAuthContextCache(token, identity, 1_000);
    assert.deepEqual(readAuthContextCache(token, 1_000), identity);
    writeAuthContextCache('live', { userId: 9, role: 'AGENT' });
    assert.equal(readAuthContextCache('live')?.userId, 9);
    assert.equal(readAuthContextCache(token, 1_000 + AUTH_CONTEXT_TTL_MS), null);
  });

  it('misses unknown tokens and does not leak another session', () => {
    writeAuthContextCache('a', { userId: 1, role: 'ADMIN' }, 10);
    assert.equal(readAuthContextCache('b', 10), null);
    assert.equal(readAuthContextCache('a', 10)?.userId, 1);
  });

  it('stays an 8 second demo window so bans are not cached for the JWT lifetime', () => {
    assert.equal(AUTH_CONTEXT_TTL_MS, 8_000);
  });
});

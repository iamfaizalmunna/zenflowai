import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseExpiresToSeconds } from './jwtExpires';

describe('JWT access expiry', () => {
  it('parses duration strings and defaults unknown values to 15 minutes', () => {
    assert.equal(parseExpiresToSeconds('15m'), 900);
    assert.equal(parseExpiresToSeconds(' 15m '), 900);
    assert.equal(parseExpiresToSeconds('30s'), 30);
    assert.equal(parseExpiresToSeconds('1h'), 3600);
    assert.equal(parseExpiresToSeconds('1d'), 86400);
    assert.equal(parseExpiresToSeconds('nope'), 900);
  });
});

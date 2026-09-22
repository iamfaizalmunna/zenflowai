import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCookieHeader,
  readRefreshCookie,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} from './refreshCookie';

describe('Phase 8 refresh cookie', () => {
  it('parses the refresh cookie from a header', () => {
    const header = `${REFRESH_COOKIE_NAME}=abc%2Fxyz; other=1`;
    assert.equal(parseCookieHeader(header)[REFRESH_COOKIE_NAME], 'abc/xyz');
    assert.equal(readRefreshCookie(header), 'abc/xyz');
    assert.equal(readRefreshCookie(undefined), null);
  });

  it('keeps HttpOnly Lax cookies and Secure only in production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const local = refreshCookieOptions();
    assert.equal(local.httpOnly, true);
    assert.equal(local.sameSite, 'lax');
    assert.equal(local.secure, false);
    process.env.NODE_ENV = 'production';
    assert.equal(refreshCookieOptions().secure, true);
    process.env.NODE_ENV = prev;
  });
});

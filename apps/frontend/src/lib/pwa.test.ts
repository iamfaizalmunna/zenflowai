import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isStandaloneDisplay, PWA_MANIFEST } from './pwa';

describe('PWA manifest contract', () => {
  it('installs as a standalone mobile app from the root', () => {
    assert.equal(PWA_MANIFEST.display, 'standalone');
    assert.equal(PWA_MANIFEST.start_url, '/');
    assert.equal(PWA_MANIFEST.short_name, 'ZenFlow');
    assert.ok(PWA_MANIFEST.icons.length >= 1);
  });

  it('treats standalone-like display modes as installed', () => {
    assert.equal(isStandaloneDisplay('standalone'), true);
    assert.equal(isStandaloneDisplay('browser'), false);
  });
});

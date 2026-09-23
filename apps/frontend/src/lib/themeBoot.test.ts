import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { THEME_BOOT_SCRIPT } from './themeBoot';

describe('public theme boot', () => {
  it('forces light on login and clears a leftover theme key', () => {
    assert.match(THEME_BOOT_SCRIPT, /classList.add\('light'\)/);
    assert.match(THEME_BOOT_SCRIPT, /localStorage.removeItem\('theme'\)/);
    assert.match(THEME_BOOT_SCRIPT, /catch/);
  });
});

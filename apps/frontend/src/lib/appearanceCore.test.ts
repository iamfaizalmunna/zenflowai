import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { htmlThemeClass, isDarkColorMode, toggledColorMode } from './appearanceCore';

describe('Phase 5 appearance tokens', () => {
  it('treats system as dark only when the OS prefers dark', () => {
    assert.equal(isDarkColorMode('DARK', false), true);
    assert.equal(isDarkColorMode('LIGHT', true), false);
    assert.equal(isDarkColorMode('SYSTEM', true), true);
    assert.equal(isDarkColorMode('SYSTEM', false), false);
  });

  it('toggles away from the current resolved scheme', () => {
    assert.equal(toggledColorMode('SYSTEM', false), 'DARK');
    assert.equal(toggledColorMode('DARK', true), 'LIGHT');
  });

  it('maps color mode to a single html theme class', () => {
    assert.equal(htmlThemeClass('DARK', false), 'dark');
    assert.equal(htmlThemeClass('LIGHT', true), 'light');
    assert.equal(htmlThemeClass('SYSTEM', true), 'dark');
  });
});

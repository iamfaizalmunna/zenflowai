import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_APPEARANCE } from './appearanceCore';
import {
  appearanceCacheKey,
  publicHtmlThemeClass,
  PUBLIC_APPEARANCE,
  resolveSessionAppearance,
} from './appearanceSession';

describe('per-user appearance session', () => {
  it('keeps login and other public pages on the product default', () => {
    assert.equal(PUBLIC_APPEARANCE.colorMode, 'LIGHT');
    assert.equal(PUBLIC_APPEARANCE.accentHex, DEFAULT_APPEARANCE.accentHex);
    assert.equal(publicHtmlThemeClass(), 'light');
    const leaked = resolveSessionAppearance({
      isSignedIn: false,
      dbPrefs: { colorMode: 'DARK', accentHex: '#E11D6A' },
      localPatch: { colorMode: 'DARK' },
    });
    assert.equal(leaked.colorMode, 'LIGHT');
    assert.equal(leaked.accentHex, DEFAULT_APPEARANCE.accentHex);
  });

  it('loads signed-in style from that user only', () => {
    assert.equal(appearanceCacheKey(8), 'zenflow-appearance-user-8');
    assert.notEqual(appearanceCacheKey(8), appearanceCacheKey(3));
    const mine = resolveSessionAppearance({
      isSignedIn: true,
      dbPrefs: { colorMode: 'DARK', accentHex: '#2B8CEE' },
      localPatch: { density: 'COMPACT' },
    });
    assert.equal(mine.colorMode, 'DARK');
    assert.equal(mine.accentHex, '#2B8CEE');
    assert.equal(mine.density, 'COMPACT');
  });
});

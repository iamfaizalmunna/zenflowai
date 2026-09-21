import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseSoundMuted, shouldPlayUiSound, UI_SOUND_PRESETS } from './uiSound';

describe('UI sound policy', () => {
  it('defines presets for tap, hover, auth, and outcome events', () => {
    for (const event of ['tap', 'hover', 'success', 'error', 'login', 'logout', 'notify'] as const) {
      assert.ok(UI_SOUND_PRESETS[event].freqs.length >= 1);
      assert.ok(UI_SOUND_PRESETS[event].durationMs > 0);
    }
  });

  it('never plays when muted', () => {
    assert.equal(shouldPlayUiSound({ muted: true, event: 'login', pointer: 'fine' }), false);
  });

  it('skips hover on coarse (touch) pointers', () => {
    assert.equal(shouldPlayUiSound({ muted: false, event: 'hover', pointer: 'coarse' }), false);
    assert.equal(shouldPlayUiSound({ muted: false, event: 'hover', pointer: 'fine' }), true);
  });

  it('parses persisted mute flags', () => {
    assert.equal(parseSoundMuted('1'), true);
    assert.equal(parseSoundMuted('true'), true);
    assert.equal(parseSoundMuted('0'), false);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isImportantSoundControl, parseSoundMuted, shouldPlayUiSound } from './uiSound';

describe('UI sound policy', () => {
  it('never plays when muted', () => {
    assert.equal(shouldPlayUiSound({ muted: true, event: 'login' }), false);
  });

  it('does not use hover as a global cue', () => {
    assert.equal(shouldPlayUiSound({ muted: false, event: 'hover' }), false);
    assert.equal(shouldPlayUiSound({ muted: false, event: 'tap' }), true);
  });

  it('limits clicks to buttons, checkboxes, radios, and similar controls', () => {
    assert.equal(isImportantSoundControl('BUTTON', '', ''), true);
    assert.equal(isImportantSoundControl('INPUT', 'checkbox', ''), true);
    assert.equal(isImportantSoundControl('INPUT', 'radio', ''), true);
    assert.equal(isImportantSoundControl('DIV', '', 'switch'), true);
    assert.equal(isImportantSoundControl('INPUT', 'text', ''), false);
    assert.equal(isImportantSoundControl('A', '', ''), false);
    assert.equal(isImportantSoundControl('TEXTAREA', '', ''), false);
  });

  it('parses persisted mute flags', () => {
    assert.equal(parseSoundMuted('1'), true);
    assert.equal(parseSoundMuted('0'), false);
  });
});

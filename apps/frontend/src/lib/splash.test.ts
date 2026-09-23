import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shouldShowAuthSplash, SPLASH_SCENES, nextSceneIndex, pickSplashTransition, pickShadePalette, SHADE_PALETTES, SPLASH_TRANSITIONS } from './splash';

describe('auth splash', () => {
  it('plays until the user has entered, unless motion is reduced', () => {
    assert.equal(shouldShowAuthSplash(null, false), true);
    assert.equal(shouldShowAuthSplash('1', false), false);
    assert.equal(shouldShowAuthSplash(null, true), false);
  });

  it('ships three interactive product UIs', () => {
    assert.deepEqual(
      SPLASH_SCENES.map((s) => s.id),
      ['saas', 'nova', 'paas'],
    );
  });

  it('picks a random other scene and one of three transitions', () => {
    assert.notEqual(nextSceneIndex(0, 0), 0);
    assert.equal(nextSceneIndex(0, 0), 1);
    assert.equal(SPLASH_TRANSITIONS.length, 3);
    assert.equal(pickSplashTransition(1), SPLASH_TRANSITIONS[1]);
  });

  it('picks a random background shade palette', () => {
    assert.equal(pickShadePalette(0), SHADE_PALETTES[0]);
    assert.equal(pickShadePalette(SHADE_PALETTES.length), SHADE_PALETTES[0]);
    assert.notEqual(pickShadePalette(1)[0], pickShadePalette(2)[0]);
  });
});

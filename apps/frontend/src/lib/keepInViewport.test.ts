import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shiftToFitViewport, VIEWPORT_PAD } from './keepInViewport';

describe('shiftToFitViewport', () => {
  it('does not move a panel that already fits', () => {
    const shift = shiftToFitViewport(
      { x: 40, y: 40, width: 200, height: 120 },
      { width: 800, height: 600 },
    );
    assert.deepEqual(shift, { dx: 0, dy: 0 });
  });

  it('pulls a right-overflowing panel back into the viewport', () => {
    const shift = shiftToFitViewport(
      { x: 719, y: 56, width: 320, height: 280 },
      { width: 827, height: 954 },
    );
    assert.equal(shift.dx < 0, true);
    assert.equal(719 + 320 + shift.dx <= 827 - VIEWPORT_PAD, true);
    assert.equal(719 + shift.dx >= VIEWPORT_PAD, true);
  });

  it('pulls a top-overflowing panel down into the viewport', () => {
    const shift = shiftToFitViewport(
      { x: 24, y: -80, width: 280, height: 200 },
      { width: 400, height: 700 },
    );
    assert.equal(shift.dy, VIEWPORT_PAD + 80);
  });
});

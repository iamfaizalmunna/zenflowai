import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyViewportClamp, shiftToFitViewport, VIEWPORT_PAD } from './keepInViewport';

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

  it('pulls a bottom-overflowing panel up into the viewport', () => {
    const shift = shiftToFitViewport(
      { x: 20, y: 500, width: 200, height: 180 },
      { width: 400, height: 600 },
    );
    assert.equal(shift.dy, 600 - VIEWPORT_PAD - 180 - 500);
  });

  it('clamps a panel larger than the padded viewport to the origin pad', () => {
    const shift = shiftToFitViewport(
      { x: -40, y: -20, width: 900, height: 900 },
      { width: 20, height: 20 },
      8,
    );
    assert.equal(shift.dx, 48);
    assert.equal(shift.dy, 28);
  });
});

describe('applyViewportClamp', () => {
  it('writes margin offsets so an overflowing node stays on screen', () => {
    const previous = (globalThis as { window?: unknown }).window;
    const style = { marginLeft: '', marginTop: '' };
    const el = {
      style,
      getBoundingClientRect: () => ({ x: 700, y: 10, width: 200, height: 80, top: 10, left: 700, right: 900, bottom: 90, toJSON: () => ({}) }),
    } as unknown as HTMLElement;
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { innerWidth: 400, innerHeight: 300 },
    });
    try {
      applyViewportClamp(el);
      assert.equal(style.marginLeft, `${400 - VIEWPORT_PAD - 200 - 700}px`);
      assert.equal(style.marginTop, `${VIEWPORT_PAD - 10}px`);
    } finally {
      if (previous === undefined) {
        Reflect.deleteProperty(globalThis, 'window');
      } else {
        Object.defineProperty(globalThis, 'window', { configurable: true, value: previous });
      }
    }
  });
});

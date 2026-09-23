import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyAppearanceToDocument } from './appearance';
import { DEFAULT_APPEARANCE } from './appearanceCore';

describe('apply appearance to document', () => {
  it('writes finish, density, and theme onto a root node', () => {
    const classes = new Set<string>(['light']);
    const props = new Map<string, string>();
    const root = {
      style: {
        fontFamily: '',
        colorScheme: '',
        setProperty(key: string, value: string) {
          props.set(key, value);
        },
      },
      dataset: {} as Record<string, string>,
      classList: {
        remove(...names: string[]) {
          names.forEach((name) => classes.delete(name));
        },
        add(name: string) {
          classes.add(name);
        },
      },
    };
    applyAppearanceToDocument({ ...DEFAULT_APPEARANCE, colorMode: 'DARK', finish: 'GLASS', density: 'COMPACT' }, root as unknown as HTMLElement);
    assert.equal(root.dataset.finish, 'glass');
    assert.equal(root.dataset.density, 'compact');
    assert.equal(classes.has('dark'), true);
    assert.equal(root.style.colorScheme, 'dark');
    assert.ok(props.get('--iris'));
  });

  it('follows OS dark preference and writes a light-on-dark foreground', () => {
    const classes = new Set<string>();
    const props = new Map<string, string>();
    const removed: string[] = [];
    const root = {
      style: {
        fontFamily: '',
        colorScheme: '',
        setProperty(key: string, value: string) {
          props.set(key, value);
        },
      },
      dataset: {} as Record<string, string>,
      classList: {
        remove(...names: string[]) {
          names.forEach((name) => classes.delete(name));
        },
        add(name: string) {
          classes.add(name);
        },
      },
    };
    const previous = (globalThis as { window?: unknown }).window;
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        matchMedia: () => ({ matches: true }),
        localStorage: { removeItem: (key: string) => removed.push(key) },
      },
    });
    try {
      applyAppearanceToDocument(
        { ...DEFAULT_APPEARANCE, colorMode: 'SYSTEM', accentHex: '#F5F5F5' },
        root as unknown as HTMLElement,
      );
      assert.equal(classes.has('dark'), true);
      assert.equal(props.get('--primary-foreground'), '258 32% 10%');
      assert.equal(removed.includes('theme'), true);
    } finally {
      if (previous === undefined) {
        Reflect.deleteProperty(globalThis, 'window');
      } else {
        Object.defineProperty(globalThis, 'window', { configurable: true, value: previous });
      }
    }
  });
});

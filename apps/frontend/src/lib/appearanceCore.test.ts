import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  accentForeground,
  clampShade,
  contrastRatio,
  DEFAULT_APPEARANCE,
  FONT_SIZE_PX,
  FONT_STACK,
  hexToHsl,
  hexToRgb,
  hslChannels,
  hslToHex,
  htmlThemeClass,
  isAllowedLogo,
  isDarkColorMode,
  isReadableAccent,
  mergeAppearance,
  normalizeHex,
  relativeLuminance,
  shadeHex,
  sortTickets,
  toggledColorMode,
} from './appearanceCore';

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
    assert.equal(toggledColorMode('LIGHT', false), 'DARK');
  });

  it('maps color mode to a single html theme class', () => {
    assert.equal(htmlThemeClass('DARK', false), 'dark');
    assert.equal(htmlThemeClass('LIGHT', true), 'light');
    assert.equal(htmlThemeClass('SYSTEM', true), 'dark');
    assert.match(FONT_STACK.OUTFIT, /outfit/i);
    assert.match(FONT_STACK.FRAUNCES, /fraunces/i);
    assert.match(FONT_STACK.SYSTEM, /system-ui/);
    assert.match(FONT_STACK.SERIF, /Georgia/);
    assert.match(FONT_STACK.MONO, /monospace/);
    assert.ok(hslChannels('#7C5CFC', 0));
    assert.equal(hslChannels('bad', 0), null);
    assert.equal(mergeAppearance({ colorMode: 'DARK' }).colorMode, 'DARK');
  });

  it('covers hex math, shade, contrast, and logo caps', () => {
    assert.equal(normalizeHex('#7c5cfc'), '#7C5CFC');
    assert.equal(normalizeHex('blue'), null);
    assert.equal(hexToRgb('nope'), null);
    assert.equal(hexToHsl('nope'), null);
    assert.equal(hexToHsl('#808080')?.s, 0);
    assert.ok((hexToHsl('#FF0000')?.h ?? -1) >= 0);
    assert.ok((hexToHsl('#00FF00')?.h ?? -1) > 90);
    assert.ok((hexToHsl('#0000FF')?.h ?? -1) > 200);
    assert.ok((hexToHsl('#FF00AA')?.h ?? -1) > 300);
    assert.match(hslToHex(30, 80, 40), /^#[0-9A-F]{6}$/);
    assert.match(hslToHex(90, 80, 40), /^#[0-9A-F]{6}$/);
    assert.match(hslToHex(150, 80, 40), /^#[0-9A-F]{6}$/);
    assert.match(hslToHex(210, 80, 40), /^#[0-9A-F]{6}$/);
    assert.match(hslToHex(270, 80, 40), /^#[0-9A-F]{6}$/);
    assert.match(hslToHex(330, 80, 40), /^#[0-9A-F]{6}$/);
    assert.equal(shadeHex('bad', 4), null);
    assert.ok(shadeHex('#7C5CFC', 8)?.startsWith('#'));
    assert.equal(clampShade(Number.NaN), 0);
    assert.equal(clampShade(100), 24);
    assert.equal(relativeLuminance('bad'), null);
    assert.equal(contrastRatio('bad', '#FFFFFF'), null);
    assert.equal(FONT_SIZE_PX.S, '15px');
    assert.equal(FONT_SIZE_PX.L, '18px');
    assert.equal(isReadableAccent('#7C5CFC'), true);
    assert.equal(isReadableAccent('#ZZZZZZ'), false);
    assert.equal(isAllowedLogo(null), true);
    assert.equal(isAllowedLogo(`data:image/png;base64,${'a'.repeat(180_001)}`), false);
    assert.equal(accentForeground('#111111'), '#FFFFFF');
    assert.equal(accentForeground('#F5F5F5'), '#111111');
    assert.equal(mergeAppearance(null).colorMode, 'SYSTEM');
    assert.equal(mergeAppearance({ colorMode: 'NOPE' }).colorMode, 'SYSTEM');
    assert.equal(mergeAppearance({ soundsMuted: true }).soundsMuted, true);
    assert.equal(mergeAppearance({ logoDataUrl: 'http://evil' }).logoDataUrl, null);
    assert.equal(mergeAppearance({ logoDataUrl: 'data:image/png;base64,abc' }).logoDataUrl, 'data:image/png;base64,abc');
    assert.ok((relativeLuminance('#010101') ?? 1) < 0.01);
  });

  it('sorts tickets by SLA, priority, created, and updated', () => {
    const tickets = [
      { createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-03T00:00:00Z', slaResolutionDueAt: '2026-02-01T00:00:00Z', priority: 'LOW' },
      { createdAt: '2026-01-04T00:00:00Z', updatedAt: '2026-01-04T00:00:00Z', slaResolutionDueAt: '2026-01-10T00:00:00Z', priority: 'URGENT' },
      { createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z', slaResolutionDueAt: null, priority: 'HIGH' },
    ];
    assert.equal(sortTickets(tickets, 'SLA')[0].priority, 'URGENT');
    assert.equal(sortTickets(tickets, 'PRIORITY')[0].priority, 'URGENT');
    assert.equal(sortTickets(tickets, 'CREATED')[0].priority, 'URGENT');
    assert.equal(sortTickets(tickets, 'UPDATED')[0].priority, 'URGENT');
    assert.equal(sortTickets([{ createdAt: '2026-01-01T00:00:00Z', updatedAt: null, priority: 'LOW' }], 'UPDATED')[0].priority, 'LOW');
    assert.equal(
      sortTickets([...tickets, { createdAt: '2026-01-01T00:00:00Z', priority: 'UNKNOWN' }], 'PRIORITY').at(-1)?.priority,
      'UNKNOWN',
    );
  });
});


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
  isAllowedLogo,
  isReadableAccent,
  mergeAppearance,
  normalizeHex,
  relativeLuminance,
  shadeHex,
  sortTickets,
  TICKET_VIEWS,
} from './appearanceTokens';

describe('Phase 5 appearance tokens', () => {
  it('normalizes hex and rejects junk', () => {
    assert.equal(normalizeHex('#7c5cfc'), '#7C5CFC');
    assert.equal(normalizeHex('blue'), null);
  });

  it('requires a valid hex so contrast can be measured', () => {
    assert.equal(isReadableAccent('#7C5CFC'), true);
    assert.equal(isReadableAccent('#ZZZZZZ'), false);
    assert.equal(accentForeground('#7C5CFC'), '#FFFFFF');
    assert.equal(accentForeground('#2B8CEE'), '#FFFFFF');
    assert.equal(accentForeground('#E8A317'), '#111111');
  });

  it('falls back to defaults for invalid combos', () => {
    const merged = mergeAppearance({ accentHex: 'blue', ticketView: 'CARD', shade: 90 });
    assert.equal(merged.accentHex, DEFAULT_APPEARANCE.accentHex);
    assert.equal(merged.ticketView, 'CARD');
    assert.equal(merged.shade, 24);
    assert.equal(mergeAppearance(null).colorMode, 'SYSTEM');
    const withLogo = mergeAppearance({ logoDataUrl: 'data:image/png;base64,abc' });
    assert.equal(withLogo.logoDataUrl, 'data:image/png;base64,abc');
    assert.equal(mergeAppearance({ logoDataUrl: 'http://evil' }).logoDataUrl, null);
  });

  it('keeps the four ticket view modes', () => {
    assert.deepEqual([...TICKET_VIEWS], ['LIST', 'COMPACT', 'CARD', 'ICON']);
  });

  it('covers hex math, shade, contrast, and logo caps', () => {
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
    assert.equal(hslChannels('bad', 0), null);
    assert.ok(hslChannels('#7C5CFC', 0)?.includes('%'));
    assert.ok(hslChannels('#FFFFFF', 24)?.includes('%'));
    assert.ok(hslChannels('#000000', -24)?.includes('%'));
    assert.equal(FONT_SIZE_PX.M, '16px');
    assert.match(FONT_STACK.MONO, /monospace/);
    assert.match(FONT_STACK.SERIF, /Georgia/);
    assert.match(FONT_STACK.FRAUNCES, /fraunces/i);
    assert.match(FONT_STACK.SYSTEM, /system-ui/);
    assert.equal(isAllowedLogo(null), true);
    assert.equal(isAllowedLogo(`data:image/png;base64,${'a'.repeat(180_001)}`), false);
    assert.equal(accentForeground('#111111'), '#FFFFFF');
    assert.equal(accentForeground('#F5F5F5'), '#111111');
    assert.equal(mergeAppearance({ soundsMuted: true }).soundsMuted, true);
    assert.equal(mergeAppearance({ colorMode: 'NOPE' }).colorMode, 'SYSTEM');
    assert.ok((relativeLuminance('#010101') ?? 1) < 0.01);
    assert.ok((hexToHsl('#800000')?.h ?? -1) >= 0);
  });
});

describe('Phase 5 ticket sort', () => {
  const tickets = [
    { createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-03T00:00:00Z', slaResolutionDueAt: '2026-02-01T00:00:00Z', priority: 'LOW' },
    { createdAt: '2026-01-04T00:00:00Z', updatedAt: '2026-01-04T00:00:00Z', slaResolutionDueAt: '2026-01-10T00:00:00Z', priority: 'URGENT' },
    { createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z', slaResolutionDueAt: null, priority: 'HIGH' },
  ];

  it('orders by SLA soonest first and nulls last', () => {
    const sorted = sortTickets(tickets, 'SLA');
    assert.equal(sorted[0].priority, 'URGENT');
    assert.equal(sorted[2].slaResolutionDueAt, null);
  });

  it('orders urgent before low', () => {
    assert.equal(sortTickets(tickets, 'PRIORITY')[0].priority, 'URGENT');
    assert.equal(sortTickets(tickets, 'CREATED')[0].priority, 'URGENT');
    assert.equal(sortTickets(tickets, 'UPDATED')[0].priority, 'URGENT');
    assert.equal(sortTickets(tickets, 'PRIORITY').find((t) => t.priority === 'LOW')?.priority, 'LOW');
    assert.equal(
      sortTickets([...tickets, { createdAt: '2026-01-01T00:00:00Z', priority: 'UNKNOWN', slaResolutionDueAt: null }], 'PRIORITY').at(-1)?.priority,
      'UNKNOWN',
    );
    assert.equal(
      sortTickets([{ createdAt: '2026-01-01T00:00:00Z', updatedAt: null, priority: 'LOW' }], 'UPDATED')[0].priority,
      'LOW',
    );
  });
});

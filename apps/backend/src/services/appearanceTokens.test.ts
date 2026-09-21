import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  accentForeground,
  DEFAULT_APPEARANCE,
  isReadableAccent,
  mergeAppearance,
  normalizeHex,
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
  });

  it('falls back to defaults for invalid combos', () => {
    const merged = mergeAppearance({ accentHex: 'blue', ticketView: 'CARD', shade: 90 });
    assert.equal(merged.accentHex, DEFAULT_APPEARANCE.accentHex);
    assert.equal(merged.ticketView, 'CARD');
    assert.equal(merged.shade, 24);
  });

  it('keeps the four ticket view modes', () => {
    assert.deepEqual([...TICKET_VIEWS], ['LIST', 'COMPACT', 'CARD', 'ICON']);
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
  });
});

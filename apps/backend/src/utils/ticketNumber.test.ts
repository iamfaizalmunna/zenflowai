import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatTicketNumber } from './ticketNumberFormat';

describe('Phase 2 ticket numbers', () => {
  it('pads to at least four digits', () => {
    assert.equal(formatTicketNumber(1), '#ZEN-0001');
    assert.equal(formatTicketNumber(1042), '#ZEN-1042');
  });
});

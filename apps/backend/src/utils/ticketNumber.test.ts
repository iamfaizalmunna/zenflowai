import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatTicketNumber } from './ticketNumberFormat';
import { generateTicketNumber } from './ticketNumber';

describe('Phase 2 ticket numbers', () => {
  it('pads to at least four digits', () => {
    assert.equal(formatTicketNumber(1), '#ZEN-0001');
    assert.equal(formatTicketNumber(1042), '#ZEN-1042');
  });

  it('generates the next number from the last ticket id', async () => {
    const db = {
      ticket: {
        findFirst: async () => ({ id: 41 }),
      },
    };
    assert.equal(await generateTicketNumber(db), '#ZEN-0042');
  });

  it('starts at 0001 when the table is empty', async () => {
    const db = {
      ticket: {
        findFirst: async () => null,
      },
    };
    assert.equal(await generateTicketNumber(db), '#ZEN-0001');
  });
});

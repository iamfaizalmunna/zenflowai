import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONSULTANT_LIST_PACK_DAYS,
  CONSULTANT_PROFILE_PACK_DAYS,
  ticketPackSince,
} from './consultantPack';

describe('consultant ticket packs', () => {
  it('keeps list stats on a 90-day window and profiles on 16 weeks', () => {
    assert.equal(CONSULTANT_LIST_PACK_DAYS, 90);
    assert.equal(CONSULTANT_PROFILE_PACK_DAYS, 112);
  });

  it('subtracts whole UTC days from the supplied clock', () => {
    const now = new Date('2026-09-23T12:00:00.000Z');
    assert.equal(ticketPackSince(90, now).toISOString(), '2026-06-25T12:00:00.000Z');
    assert.ok(ticketPackSince(1) instanceof Date);
  });
});

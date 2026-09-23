import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hasPermission } from '../security/rbac';
import { formatTicketNumber } from '../utils/ticketNumber';
import { AUTH_CONTEXT_TTL_MS } from '../security/authContextCache';
import { CONSULTANT_LIST_PACK_DAYS, CONSULTANT_PROFILE_PACK_DAYS } from '../services/consultantPack';

describe('regression locks (v1)', () => {
  it('never changes the role ladder permissions at the edges', () => {
    assert.equal(hasPermission('CUSTOMER', 'ticket:create'), true);
    assert.equal(hasPermission('CUSTOMER', 'user:ban'), false);
    assert.equal(hasPermission('SUPER_ADMIN', 'user:ban'), true);
    assert.equal(hasPermission('AGENT', 'ticket:read:assigned'), true);
  });

  it('keeps ticket numbers padded to four digits', () => {
    assert.equal(formatTicketNumber(1), '#ZEN-0001');
    assert.equal(formatTicketNumber(1042), '#ZEN-1042');
  });

  it('keeps consultant packs and auth TTL in the demo window', () => {
    assert.equal(CONSULTANT_LIST_PACK_DAYS, 90);
    assert.equal(CONSULTANT_PROFILE_PACK_DAYS, 112);
    assert.equal(AUTH_CONTEXT_TTL_MS, 8_000);
    assert.equal(hasPermission('CUSTOMER', 'consultant:read'), false);
    assert.equal(hasPermission('ADMIN', 'consultant:read'), true);
    assert.equal(hasPermission('CUSTOMER', 'sla:read'), false);
    assert.equal(hasPermission('ADMIN', 'sla:read'), true);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hasPermission } from '../security/rbac';

describe('Phase 9 e2e permission chain', () => {
  it('lets a customer create a ticket and read own notices', () => {
    assert.equal(hasPermission('CUSTOMER', 'ticket:create'), true);
    assert.equal(hasPermission('CUSTOMER', 'notification:read:own'), true);
    assert.equal(hasPermission('CUSTOMER', 'ticket:read:all'), false);
  });

  it('lets an agent work the queue without admin user tools', () => {
    assert.equal(hasPermission('AGENT', 'ticket:read:assigned'), true);
    assert.equal(hasPermission('AGENT', 'message:create'), true);
    assert.equal(hasPermission('AGENT', 'user:ban'), false);
  });
});

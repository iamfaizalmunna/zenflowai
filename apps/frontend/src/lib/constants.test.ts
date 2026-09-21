import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ROLE_HOME, ROLE_HIERARCHY } from './constants';

describe('Phase 1 role home routes', () => {
  it('sends each role to its home path', () => {
    assert.equal(ROLE_HOME.CUSTOMER, '/dashboard');
    assert.equal(ROLE_HOME.AGENT, '/queue');
    assert.equal(ROLE_HOME.SUPERVISOR, '/supervisor');
    assert.equal(ROLE_HOME.ADMIN, '/admin/users');
    assert.equal(ROLE_HOME.SUPER_ADMIN, '/admin/users');
  });

  it('keeps the locked role ladder', () => {
    assert.ok(ROLE_HIERARCHY.CUSTOMER < ROLE_HIERARCHY.AGENT);
    assert.ok(ROLE_HIERARCHY.AGENT < ROLE_HIERARCHY.SUPERVISOR);
    assert.ok(ROLE_HIERARCHY.SUPERVISOR < ROLE_HIERARCHY.ADMIN);
    assert.ok(ROLE_HIERARCHY.ADMIN < ROLE_HIERARCHY.SUPER_ADMIN);
  });
});

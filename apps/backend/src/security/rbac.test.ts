import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GraphQLError } from 'graphql';
import {
  hasHigherOrEqualRole,
  hasPermission,
  requirePermission,
  getRandomCooldownMs,
} from './rbac';

describe('Phase 1 RBAC', () => {
  it('orders roles by hierarchy', () => {
    assert.equal(hasHigherOrEqualRole('ADMIN', 'CUSTOMER'), true);
    assert.equal(hasHigherOrEqualRole('CUSTOMER', 'AGENT'), false);
  });

  it('grants SUPER_ADMIN every permission', () => {
    assert.equal(hasPermission('SUPER_ADMIN', 'ticket:delete:any'), true);
  });

  it('keeps customers off agent-only actions', () => {
    assert.equal(hasPermission('CUSTOMER', 'ticket:handoff'), true);
    assert.equal(hasPermission('CUSTOMER', 'appearance:update:own'), true);
    assert.equal(hasPermission('AGENT', 'consultant:read'), false);
    assert.equal(hasPermission('SUPERVISOR', 'consultant:read'), false);
    assert.equal(hasPermission('SUPERVISOR', 'analytics:read:team'), true);
    assert.equal(hasPermission('SUPERVISOR', 'routing:create'), true);
    assert.equal(hasPermission('AGENT', 'routing:create'), false);
    assert.equal(hasPermission('ADMIN', 'consultant:read'), true);
    assert.equal(hasPermission('CUSTOMER', 'ticket:read:all'), false);
  });

  it('applies explicit overrides before role perms', () => {
    assert.equal(
      hasPermission('CUSTOMER', 'ticket:read:all', [{ permission: 'ticket:read:all', granted: true }]),
      true
    );
    assert.equal(
      hasPermission('AGENT', 'ticket:resolve', [{ permission: 'ticket:resolve', granted: false }]),
      false
    );
  });

  it('throws FORBIDDEN when permission is missing', () => {
    assert.throws(() => requirePermission('CUSTOMER', 'user:ban'), GraphQLError);
    assert.throws(() => requirePermission(null, 'ticket:create'), GraphQLError);
  });

  it('returns zero cooldown for SUPER_ADMIN', () => {
    assert.equal(getRandomCooldownMs('SUPER_ADMIN', 'ticket'), 0);
  });
});

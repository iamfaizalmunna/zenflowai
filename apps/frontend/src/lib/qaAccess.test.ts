import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ROLE_HOME } from './constants';
import {
  canRoleOpenPath,
  customerBlockedAdminPaths,
  E2E_GRAPHQL_STEPS,
  screensForRole,
} from './qaAccess';

describe('Phase 9 QA access map', () => {
  it('sends each role home to a screen they can open', () => {
    for (const [role, home] of Object.entries(ROLE_HOME)) {
      assert.equal(canRoleOpenPath(role, home), true, role);
      assert.ok(screensForRole(role).includes('/settings'));
    }
  });

  it('keeps customers off admin consoles', () => {
    for (const href of customerBlockedAdminPaths()) {
      assert.equal(canRoleOpenPath('CUSTOMER', href), false);
      assert.equal(canRoleOpenPath('AGENT', href), false);
    }
    assert.equal(canRoleOpenPath('ADMIN', '/admin/users'), true);
  });

  it('covers the GraphQL happy path used in live e2e', () => {
    assert.deepEqual([...E2E_GRAPHQL_STEPS], ['login', 'me', 'tickets', 'myNotifications']);
  });
});

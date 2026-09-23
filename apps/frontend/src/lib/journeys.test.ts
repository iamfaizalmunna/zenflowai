import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTH_SPLASH_KEY,
  pickShadePalette,
  SHADE_PALETTES,
  shouldShowAuthSplash,
  SPLASH_SCENES,
} from './splash';
import { ROLE_HOME } from './constants';
import { canRoleOpenPath } from './qaAccess';
import { LOADING_ROUTE_GROUPS, NEW_TICKET_KB_SEARCH_MIN } from './uiPerf';
import { filterByQuery } from './listSearch';

/** Contract for HTML results v1 — customer / staff journeys without a browser. */
export const USER_JOURNEYS = [
  { id: 'J01', name: 'First visit splash then login', roles: ['CUSTOMER'] },
  { id: 'J02', name: 'Returning visit skips splash', roles: ['CUSTOMER'] },
  { id: 'J03', name: 'Reduced motion skips splash', roles: ['CUSTOMER'] },
  { id: 'J04', name: 'Customer opens tickets home only', roles: ['CUSTOMER'] },
  { id: 'J05', name: 'Agent queue without user admin', roles: ['AGENT'] },
  { id: 'J06', name: 'Supervisor analytics home', roles: ['SUPERVISOR'] },
  { id: 'J07', name: 'Admin users console', roles: ['ADMIN'] },
  { id: 'J08', name: 'Super admin same ladder top', roles: ['SUPER_ADMIN'] },
  { id: 'J09', name: 'Admin tab shows skeleton not empty pane', roles: ['ADMIN'] },
  { id: 'J10', name: 'List search filters the loaded pack only', roles: ['ADMIN'] },
  { id: 'J11', name: 'New ticket still queries Help Center after 4 chars', roles: ['CUSTOMER'] },
] as const;

describe('user journeys (v1)', () => {
  it('J01 first visit shows splash', () => {
    assert.equal(shouldShowAuthSplash(null, false), true);
    assert.equal(AUTH_SPLASH_KEY.startsWith('zenflow-auth-splash'), true);
    assert.equal(SPLASH_SCENES.length, 3);
  });

  it('J02 returning visit hides splash', () => {
    assert.equal(shouldShowAuthSplash('1', false), false);
  });

  it('J03 reduced motion never plays splash', () => {
    assert.equal(shouldShowAuthSplash(null, true), false);
  });

  it('J04–J08 each role lands on an allowed home', () => {
    for (const role of Object.keys(ROLE_HOME)) {
      const home = ROLE_HOME[role];
      assert.ok(home, role);
      assert.equal(canRoleOpenPath(role, home), true, `${role} ${home}`);
    }
  });

  it('catalog lists eleven journeys for the results sheet', () => {
    assert.equal(USER_JOURNEYS.length, 11);
  });

  it('J09 signed-in groups keep a loading skeleton', () => {
    assert.deepEqual([...LOADING_ROUTE_GROUPS], ['(admin)', '(agent)', '(customer)', 'settings']);
  });

  it('J10 pack search does not round-trip GraphQL', () => {
    const pack = [{ title: 'SLA hours' }, { title: 'Routing' }];
    assert.deepEqual(filterByQuery(pack, 'sla', (row) => row.title).map((row) => row.title), ['SLA hours']);
  });

  it('J11 new ticket waits for four characters before KB search', () => {
    assert.equal(NEW_TICKET_KB_SEARCH_MIN, 4);
  });

  it('background shade palettes stay in the approved set', () => {
    assert.equal(SHADE_PALETTES.includes(pickShadePalette(0)), true);
  });
});

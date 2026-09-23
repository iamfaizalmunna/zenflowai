import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DESKTOP_MIN_PX, isNavActive, MOBILE_MAX_PX, navForRole, splitMobileNav } from './nav';

describe('mobile-first navigation', () => {
  it('treats 1024px and below as the mobile app chrome', () => {
    assert.equal(MOBILE_MAX_PX, 1024);
    assert.equal(DESKTOP_MIN_PX, 1025);
  });

  it('keeps four or fewer items on the tab bar', () => {
    const { primary, overflow } = splitMobileNav(navForRole('CUSTOMER'));
    assert.equal(primary.length, 4);
    assert.equal(overflow.length, 0);
  });

  it('reserves a More slot when a role has more than four destinations', () => {
    const { primary, overflow } = splitMobileNav(navForRole('ADMIN'));
    assert.equal(primary.length, 3);
    assert.ok(overflow.length > 0);
    assert.equal(primary[0]?.href, '/analytics');
  });

  it('does not mark New Ticket as the Tickets list', () => {
    assert.equal(isNavActive('/tickets/new', '/tickets'), false);
    assert.equal(isNavActive('/tickets/12', '/tickets'), true);
    assert.equal(isNavActive('/knowledge/12', '/knowledge'), true);
    assert.equal(isNavActive('/knowledge/internal', '/knowledge'), false);
    assert.equal(isNavActive('/admin/routing', '/admin/users'), false);
    assert.equal(isNavActive('/admin/users', '/admin/users'), true);
    assert.equal(isNavActive('/admin/users/9', '/admin/users'), true);
  });

  it('gives supervisors analytics and keeps agents off consultant admin', () => {
    assert.ok(navForRole('SUPERVISOR').some((item) => item.href === '/analytics'));
    assert.ok(navForRole('SUPERVISOR').some((item) => item.href === '/admin/routing'));
    assert.equal(navForRole('AGENT').some((item) => item.href === '/admin/consultants'), false);
    assert.ok(navForRole('ADMIN').some((item) => item.href === '/admin/consultants'));
    assert.equal(navForRole(undefined)[0]?.href, '/dashboard');
    assert.equal(navForRole('GHOST')[0]?.href, '/dashboard');
  });
});

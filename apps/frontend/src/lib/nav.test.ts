import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isNavActive, MOBILE_MAX_PX, navForRole, splitMobileNav } from './nav';

describe('mobile-first navigation', () => {
  it('treats 1024px and below as the mobile app chrome', () => {
    assert.equal(MOBILE_MAX_PX, 1024);
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
    assert.equal(isNavActive('/admin/sla', '/admin/sla'), true);
    assert.equal(isNavActive('/admin/routing', '/admin/users'), false);
  });

  it('gives supervisors analytics and keeps agents off consultant admin', () => {
    assert.ok(navForRole('SUPERVISOR').some((item) => item.href === '/analytics'));
    assert.ok(navForRole('SUPERVISOR').some((item) => item.href === '/admin/routing'));
    assert.equal(navForRole('AGENT').some((item) => item.href === '/admin/consultants'), false);
    assert.ok(navForRole('ADMIN').some((item) => item.href === '/admin/consultants'));
  });
});

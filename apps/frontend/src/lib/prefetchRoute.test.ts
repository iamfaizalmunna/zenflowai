import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PREFETCH_HREFS } from './prefetchHrefs';

describe('admin tab prefetch map', () => {
  it('covers the super-admin sidebar destinations that hit GraphQL', () => {
    assert.ok(PREFETCH_HREFS.includes('/admin/sla'));
    assert.ok(PREFETCH_HREFS.includes('/analytics'));
    assert.ok(PREFETCH_HREFS.includes('/admin/security'));
    assert.equal(PREFETCH_HREFS.length, 8);
  });
});

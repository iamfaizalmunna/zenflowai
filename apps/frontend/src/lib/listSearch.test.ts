import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { filterByQuery } from './listSearch';

describe('modular list search', () => {
  it('returns the full pack when the query is empty', () => {
    const rows = [{ name: 'Ada' }, { name: 'Lin' }];
    assert.equal(filterByQuery(rows, '  ', (r) => r.name).length, 2);
  });

  it('keeps only matching rows', () => {
    const rows = [
      { name: 'Ada Lovelace', email: 'ada@zenflowai.com' },
      { name: 'Lin', email: 'lin@zenflowai.com' },
    ];
    const hit = filterByQuery(rows, 'ADA', (r) => `${r.name} ${r.email}`);
    assert.deepEqual(hit.map((r) => r.name), ['Ada Lovelace']);
  });

  it('is substring search, so SUPER_ADMIN matches admin', () => {
    const rows = [
      { role: 'SUPER_ADMIN' },
      { role: 'AGENT' },
    ];
    assert.deepEqual(
      filterByQuery(rows, 'admin', (r) => r.role).map((r) => r.role),
      ['SUPER_ADMIN'],
    );
  });
});

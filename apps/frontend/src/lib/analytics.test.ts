import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseChartType, usesPolarChart } from './analytics';

describe('Phase 6 chart types', () => {
  it('defaults unknown types to line', () => {
    assert.equal(parseChartType('PIE'), 'PIE');
    assert.equal(parseChartType('x'), 'LINE');
  });

  it('treats pie donut and radial as polar', () => {
    assert.equal(usesPolarChart('LINE'), false);
    assert.equal(usesPolarChart('DONUT'), true);
  });
});

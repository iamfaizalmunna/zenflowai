import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chartTotal, optionsForKind, parseChartType, polarSeries, prettyChartKey, usesPolarChart } from './analytics';

describe('Phase 6 chart types', () => {
  it('defaults unknown types to line', () => {
    assert.equal(parseChartType('PIE'), 'PIE');
    assert.equal(parseChartType('RADAR'), 'RADAR');
    assert.equal(parseChartType('x'), 'LINE');
  });

  it('treats pie donut and radial as polar', () => {
    assert.equal(usesPolarChart('LINE'), false);
    assert.equal(usesPolarChart('RADAR'), false);
  });

  it('limits time series to cartesian types', () => {
    assert.deepEqual(
      optionsForKind('time').map((o) => o.value),
      ['LINE', 'AREA', 'BAR'],
    );
  });

  it('formats keys and drops empty polar slices', () => {
    assert.match(prettyChartKey('2026-09-21'), /21\s+Sep/);
    assert.equal(prettyChartKey('IN_PROGRESS'), 'In progress');
    assert.equal(prettyChartKey('5'), '5 star');
    assert.equal(chartTotal([{ value: 2 }, { value: 3 }]), 5);
    assert.deepEqual(
      polarSeries([
        { key: 'OPEN', value: 0 },
        { key: 'CLOSED', value: 4 },
      ]),
      [{ key: 'CLOSED', value: 4 }],
    );
  });
});

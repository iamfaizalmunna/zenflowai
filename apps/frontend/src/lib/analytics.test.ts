import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chartTotal, optionsForKind, parseChartType, polarSeries, prettyChartKey, usesPolarChart } from './analytics';

describe('Phase 6 chart types', () => {
  it('defaults unknown types to line', () => {
    assert.equal(parseChartType('PIE'), 'PIE');
    assert.equal(parseChartType('RADAR'), 'RADAR');
    assert.equal(parseChartType('x'), 'LINE');
    assert.equal(parseChartType(null), 'LINE');
    assert.equal(parseChartType(undefined), 'LINE');
  });

  it('treats pie donut and radial as polar', () => {
    assert.equal(usesPolarChart('LINE'), false);
    assert.equal(usesPolarChart('RADAR'), false);
    assert.equal(usesPolarChart('PIE'), true);
    assert.equal(usesPolarChart('DONUT'), true);
    assert.equal(usesPolarChart('RADIAL'), true);
  });

  it('limits time series to cartesian types', () => {
    assert.deepEqual(
      optionsForKind('time').map((o) => o.value),
      ['LINE', 'AREA', 'BAR'],
    );
    assert.deepEqual(
      optionsForKind('score').map((o) => o.value),
      ['BAR', 'RADAR'],
    );
    assert.equal(optionsForKind('mix').some((o) => o.value === 'RADAR'), false);
  });

  it('formats keys and drops empty polar slices', () => {
    assert.match(prettyChartKey('2026-09-21'), /21\s+Sep/);
    assert.equal(prettyChartKey('Close rate'), 'Close');
    assert.equal(prettyChartKey('First reply'), 'Reply');
    assert.equal(prettyChartKey('Resolve time'), 'Resolve');
    assert.equal(prettyChartKey('IN_PROGRESS'), 'In progress');
    assert.equal(prettyChartKey('ON_HOLD'), 'On hold');
    assert.equal(prettyChartKey('NEW_TICKET'), 'New Ticket');
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

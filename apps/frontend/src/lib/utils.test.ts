import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cn, formatDate, formatRelativeTime, priorityColors, statusColors } from './utils';

describe('shared formatters', () => {
  it('merges class names and formats dates', () => {
    assert.match(cn('px-2', 'px-4'), /px-4/);
    assert.match(formatDate('2026-09-23T00:00:00.000Z'), /2026/);
    assert.match(formatDate(new Date('2026-09-23T00:00:00.000Z')), /2026/);
  });

  it('prints relative time buckets', () => {
    const now = Date.now();
    assert.equal(formatRelativeTime(new Date(now - 10_000)), 'just now');
    assert.equal(formatRelativeTime(new Date(now - 5 * 60_000)), '5m ago');
    assert.equal(formatRelativeTime(new Date(now - 3 * 60 * 60_000)), '3h ago');
    assert.equal(formatRelativeTime(new Date(now - 2 * 24 * 60 * 60_000)), '2d ago');
    assert.match(formatRelativeTime(new Date(now - 10 * 24 * 60 * 60_000)), /2026|2025|Sep|Oct|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Nov|Dec/);
    assert.ok(priorityColors.URGENT);
    assert.ok(statusColors.OPEN);
    assert.ok(statusColors.CLOSED);
    assert.ok(statusColors.RESOLVED);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOADING_ROUTE_GROUPS, NEW_TICKET_KB_SEARCH_MIN, ROUTE_FADE_CLASS } from './uiPerf';

const libDir = dirname(fileURLToPath(import.meta.url));
const appDir = join(libDir, '../app');

describe('UI perf contracts', () => {
  it('keeps a skeleton loading.tsx on every signed-in route group', () => {
    for (const group of LOADING_ROUTE_GROUPS) {
      assert.equal(existsSync(join(appDir, group, 'loading.tsx')), true, group);
    }
  });

  it('fades the page slot, not the persistent shell', () => {
    assert.equal(ROUTE_FADE_CLASS, 'animate-route-in');
    const fade = readFileSync(join(libDir, '../components/layout/RouteFade.tsx'), 'utf8');
    assert.match(fade, /ROUTE_FADE_CLASS/);
    assert.doesNotMatch(fade, /AppShell/);
  });

  it('runs Next dev on Turbopack and keeps new-ticket KB search on GraphQL', () => {
    const pkg = JSON.parse(readFileSync(join(libDir, '../../package.json'), 'utf8')) as { scripts: { dev: string } };
    assert.match(pkg.scripts.dev, /--turbopack/);
    assert.equal(NEW_TICKET_KB_SEARCH_MIN, 4);
    const nextCfg = readFileSync(join(libDir, '../../next.config.ts'), 'utf8');
    assert.match(nextCfg, /\/qa\/v1/);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const libDir = dirname(fileURLToPath(import.meta.url));
const appDir = join(libDir, '../app');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return [full];
  });
}

describe('UI surfaces', () => {
  it('keeps a page.tsx for every shipped screen', () => {
    const pages = walk(appDir).filter((file) => file.endsWith(`${join('page.tsx')}`) || file.endsWith('/page.tsx') || file.endsWith('page.tsx'));
    const names = pages.map((file) => file.slice(appDir.length));
    assert.ok(names.length >= 23, String(names.length));
    for (const needed of ['/settings/page.tsx', '/(auth)/login/page.tsx', '/(admin)/admin/sla/page.tsx', '/(customer)/tickets/new/page.tsx']) {
      assert.equal(existsSync(join(appDir, needed.replace(/^\//, ''))), true, needed);
    }
  });
});

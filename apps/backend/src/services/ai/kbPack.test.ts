import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadOwnedKb, parseOwnedArticle, parseShardLine } from './kbPack';

describe('Phase 7 owned KB pack', () => {
  it('parses front matter and loads committed articles', () => {
    const parsed = parseOwnedArticle(
      '---\ntitle: VPN drops every hour\nvisibility: PUBLIC\npublished: true\ncategory: Technical\n---\nKeepalive and DNS.\n'
    );
    assert.equal(parsed.title, 'VPN drops every hour');
    assert.equal(parsed.visibility, 'PUBLIC');
    const dir = join(dirname(fileURLToPath(import.meta.url)), '../../../kb');
    const pack = loadOwnedKb(dir);
    assert.ok(pack.length >= 10);
    assert.ok(pack.some((row) => /SSO login loop/i.test(row.title)));
    const shard = parseShardLine(
      '{"title":"Resolve VPN issue ZF-10001 on Safari","visibility":"PUBLIC","published":true,"category":"Technical","body":"Keepalive."}\n'
    );
    assert.equal(shard?.title.includes('ZF-10001'), true);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadKbShards, loadOwnedKb, parseOwnedArticle, parseShardLine } from './kbPack';

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

  it('rejects files without front matter and skips empty shard lines', () => {
    assert.throws(() => parseOwnedArticle('no yaml here'));
    assert.equal(parseShardLine(''), null);
    assert.equal(parseShardLine('{"title":"x"}'), null);
    const internal = parseOwnedArticle(
      '---\ntitle: Staff only\nvisibility: INTERNAL\npublished: false\n---\nSecret.\n'
    );
    assert.equal(internal.visibility, 'INTERNAL');
    assert.equal(internal.isPublished, false);
    const untitled = parseOwnedArticle('---\nnot-a-field\n---\nBody here.\n');
    assert.equal(untitled.title, 'Untitled');
    assert.equal(untitled.category, 'General');
    assert.equal(untitled.visibility, 'PUBLIC');
    assert.equal(untitled.isPublished, true);
  });

  it('loads jsonl shards up to a limit', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kb-shards-'));
    writeFileSync(
      join(dir, 'a.jsonl'),
      '{"title":"One","body":"a"}\n\n{"title":"Two","body":"b"}\n{"title":"Three","body":"c"}\n',
    );
    const two = await loadKbShards(dir, 2);
    assert.equal(two.length, 2);
    assert.equal(two[0].title, 'One');
    const all = await loadKbShards(dir);
    assert.equal(all.length, 3);
    const empty = mkdtempSync(join(tmpdir(), 'kb-empty-'));
    assert.equal((await loadKbShards(empty)).length, 0);
    const internalShard = parseShardLine(
      '{"title":"Staff","visibility":"INTERNAL","published":false,"body":"Secret."}',
    );
    assert.equal(internalShard?.visibility, 'INTERNAL');
    assert.equal(internalShard?.isPublished, false);
    assert.equal(internalShard?.category, 'General');
  });
});

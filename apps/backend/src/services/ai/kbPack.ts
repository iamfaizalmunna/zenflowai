import { createReadStream, readdirSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { join } from 'node:path';

export interface OwnedArticle {
  title: string;
  visibility: 'PUBLIC' | 'INTERNAL';
  isPublished: boolean;
  category: string;
  body: string;
}

export function parseOwnedArticle(raw: string): OwnedArticle {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error('Owned KB file must start with YAML front matter');
  }
  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx < 1) continue;
    meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  const visibility = meta.visibility === 'INTERNAL' ? 'INTERNAL' : 'PUBLIC';
  return {
    title: meta.title ?? 'Untitled',
    visibility,
    isPublished: meta.published !== 'false',
    category: meta.category ?? 'General',
    body: match[2].trim(),
  };
}

export function loadOwnedKb(dir: string): OwnedArticle[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md') && name !== 'README.md')
    .sort()
    .map((name) => parseOwnedArticle(readFileSync(join(dir, name), 'utf8')));
}

export function parseShardLine(line: string): OwnedArticle | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const row = JSON.parse(trimmed) as {
    title?: string;
    visibility?: string;
    published?: boolean;
    category?: string;
    body?: string;
  };
  if (!row.title || !row.body) return null;
  return {
    title: row.title,
    visibility: row.visibility === 'INTERNAL' ? 'INTERNAL' : 'PUBLIC',
    isPublished: row.published !== false,
    category: row.category ?? 'General',
    body: row.body,
  };
}

export async function loadKbShards(dir: string, limit?: number): Promise<OwnedArticle[]> {
  const files = readdirSync(dir)
    .filter((name) => name.endsWith('.jsonl'))
    .sort();
  const out: OwnedArticle[] = [];
  for (const name of files) {
    const rl = createInterface({ input: createReadStream(join(dir, name)), crlfDelay: Infinity });
    for await (const line of rl) {
      const row = parseShardLine(line);
      if (!row) continue;
      out.push(row);
      if (limit !== undefined && out.length >= limit) {
        rl.close();
        return out;
      }
    }
  }
  return out;
}

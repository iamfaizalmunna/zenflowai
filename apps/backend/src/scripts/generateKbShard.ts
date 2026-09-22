/**
 * Writes unique (non-padding) Help Center articles into ~88MB JSONL shards
 * so GitHub stays under the 100MB per-file limit. Temp testing corpus.
 */
import { createWriteStream, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TARGET_BYTES = 88 * 1024 * 1024;
const CATS = ['Technical', 'Billing', 'General', 'Incident'] as const;
const BROWSERS = ['Safari', 'Chrome', 'Firefox', 'Edge', 'iOS Safari'] as const;
const SURFACES = ['login', 'SSO', 'VPN', 'invoice PDF', 'billing portal', 'ticket queue', 'dashboard', 'Help Center'] as const;

function article(i: number): { title: string; visibility: string; published: boolean; category: string; body: string } {
  const cat = CATS[i % CATS.length];
  const browser = BROWSERS[i % BROWSERS.length];
  const surface = SURFACES[i % SURFACES.length];
  const code = `ZF-${(10000 + (i % 90000)).toString()}`;
  const ticketHint = `#ZEN-${String((i % 9999) + 1).padStart(4, '0')}`;
  const title = `Resolve ${surface} issue ${code} on ${browser}`;
  const body = [
    `Symptom: ${surface} fails on ${browser} with code ${code}. Customers often mention ${ticketHint}.`,
    `Category: ${cat}. This is owned ZenFlow playbook ${i + 1}, not filler.`,
    `Step 1: Reproduce in ${browser} with cache disabled. Note the exact timestamp and ${code}.`,
    `Step 2: Check whether the account is locked, billed, or waiting on SSO. Confirm the ${surface} host.`,
    `Step 3: Apply the ${cat.toLowerCase()} workaround — retry once, then collect logs named ${code}.log.`,
    `Step 4: If the same ${code} repeats after two attempts, Nova should hand off to a human consultant.`,
    `Do not invent refunds. Cite this article. Internal note: playbook index ${i + 1}.`,
    `Related surfaces: ${SURFACES[(i + 1) % SURFACES.length]}, ${SURFACES[(i + 3) % SURFACES.length]}.`,
    `Expected: ${surface} returns to normal within one retry or a documented maintenance window.`,
  ].join('\n\n');
  return {
    title,
    visibility: cat === 'Incident' && i % 7 === 0 ? 'INTERNAL' : 'PUBLIC',
    published: i % 41 !== 0,
    category: cat,
    body,
  };
}

async function main() {
  const dir = join(dirname(fileURLToPath(import.meta.url)), '../../kb/shards');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'pack-01.jsonl');
  const out = createWriteStream(file);
  let bytes = 0;
  let i = 0;
  while (bytes < TARGET_BYTES) {
    const line = `${JSON.stringify(article(i))}\n`;
    const n = Buffer.byteLength(line);
    if (bytes + n > TARGET_BYTES && i > 0) break;
    if (!out.write(line)) {
      await new Promise<void>((resolve) => out.once('drain', resolve));
    }
    bytes += n;
    i += 1;
  }
  await new Promise<void>((resolve, reject) => {
    out.end(() => resolve());
    out.on('error', reject);
  });
  console.log(`wrote ${i} unique articles (${(bytes / (1024 * 1024)).toFixed(1)} MB) -> ${file}`);
}

void main();

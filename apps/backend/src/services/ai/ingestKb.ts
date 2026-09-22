import { createHash } from 'node:crypto';
import { prisma } from '../../utils/prisma';
import { hashChunk, splitArticleBody } from './consultMath';

const ALLOWLIST: Array<{ url: string; licenseNote: string }> = [
  {
    url: 'https://www.rfc-editor.org/rfc/rfc9110.txt',
    licenseNote: 'IETF RFC 9110 — public RFC text, truncated ingest for MVP',
  },
];

function stripToText(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12_000);
}

export async function upsertChunksForArticle(
  articleId: number,
  body: string,
  sourceUrl?: string,
  licenseNote?: string
): Promise<number> {
  const parts = splitArticleBody(body);
  let created = 0;
  for (const part of parts) {
    const contentHash = hashChunk(part);
    const existing = await prisma.knowledgeChunk.findUnique({
      where: { articleId_contentHash: { articleId, contentHash } },
    });
    if (existing) continue;
    await prisma.knowledgeChunk.create({
      data: { articleId, body: part, contentHash, sourceUrl, licenseNote },
    });
    created += 1;
  }
  return created;
}

export function skipIfUnchanged(previousHash: string, body: string): boolean {
  return previousHash === hashChunk(body);
}

export async function ingestAllowlist(fetchImpl?: typeof fetch): Promise<{ ingested: number; skipped: number }> {
  const doFetch = fetchImpl ?? fetch;
  let ingested = 0;
  let skipped = 0;
  const author = await prisma.user.findFirst({ where: { role: { in: ['ADMIN', 'AGENT'] } } });
  if (!author) return { ingested: 0, skipped: 0 };

  for (const source of ALLOWLIST) {
    try {
      const res = await doFetch(source.url, { signal: AbortSignal.timeout(8_000) });
      if (!res.ok) {
        skipped += 1;
        continue;
      }
      const text = stripToText(await res.text());
      if (text.length < 80) {
        skipped += 1;
        continue;
      }
      const title = `Ingested: ${new URL(source.url).hostname}`;
      const hash = createHash('sha256').update(text).digest('hex');
      let article = await prisma.knowledgeArticle.findFirst({
        where: { title, authorId: author.id },
      });
      if (article && skipIfUnchanged(hashChunk(article.body), text)) {
        skipped += 1;
        continue;
      }
      if (!article) {
        article = await prisma.knowledgeArticle.create({
          data: {
            title,
            body: text.slice(0, 4000),
            visibility: 'INTERNAL',
            isPublished: true,
            authorId: author.id,
          },
        });
      } else {
        article = await prisma.knowledgeArticle.update({
          where: { id: article.id },
          data: { body: text.slice(0, 4000) },
        });
      }
      ingested += await upsertChunksForArticle(article.id, article.body, source.url, source.licenseNote);
    } catch {
      skipped += 1;
    }
  }
  return { ingested, skipped };
}

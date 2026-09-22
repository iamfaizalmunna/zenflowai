import { createHash } from 'node:crypto';

export const HANDOFF_THRESHOLD = 0.45;

export function confidenceFromScore(score: number): number {
  return Math.min(1, Math.max(0, score / 8));
}

export function shouldHandoff(confidence: number, hitCount: number): boolean {
  return hitCount === 0 || confidence < HANDOFF_THRESHOLD;
}

export function isGrounded(answer: string, titles: string[]): boolean {
  const hay = answer.toLowerCase();
  if (!hay.trim() || titles.length === 0) return false;
  return titles.some((title) => {
    const words = title
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3);
    return words.some((word) => hay.includes(word));
  });
}

export function hashChunk(body: string): string {
  return createHash('sha256').update(body.trim()).digest('hex');
}

export function skipIfUnchanged(previousHash: string, body: string): boolean {
  return previousHash === hashChunk(body);
}

export function splitArticleBody(body: string): string[] {
  const parts = body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter((part) => part.length > 20);
  if (parts.length > 0) return parts;
  const trimmed = body.trim();
  return trimmed ? [trimmed] : [];
}

export function resolveEngine(ollamaText: string | null): 'OLLAMA' | 'RETRIEVAL' {
  return ollamaText && ollamaText.trim() ? 'OLLAMA' : 'RETRIEVAL';
}

export function formatConsultReply(input: {
  answer: string;
  citations: Array<{ title: string }>;
  engine: 'OLLAMA' | 'RETRIEVAL';
}): string {
  const cites = input.citations.map((c) => `• ${c.title}`).join('\n');
  const engine = input.engine === 'OLLAMA' ? 'Nova (local model + KB)' : 'Nova (knowledge base)';
  const extra = cites ? `\n\nSources:\n${cites}` : '';
  return `${input.answer}${extra}\n\n— ${engine}`;
}

export function buildGroundedPrompt(question: string, chunks: Array<{ title: string; body: string }>): string {
  const sources = chunks
    .map((chunk, i) => `Source ${i + 1} (${chunk.title}):\n${chunk.body.slice(0, 600)}`)
    .join('\n\n');
  return `Answer only from the sources. If they do not contain the answer, say you do not know.\n\nQuestion: ${question}\n\n${sources}`;
}

import { ArticleVisibility, ConsultEngine } from '@prisma/client';
import { prisma } from '../../utils/prisma';
import { rankRelatedWithScores } from '../relatedRank';
import { buildKbAnswer } from '../qaAnswer';
import { audit } from '../../security/audit';
import { shouldHandoff, formatConsultReply, resolveEngine } from './consultMath';
import { generateWithOllama } from './ollamaAdapter';
import { isOllamaWarm, probeOllama } from './ollamaProbe';

const STAFF = new Set(['AGENT', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN']);

export interface ConsultHit {
  id: number;
  title: string;
  body: string;
  score: number;
}

export interface ConsultResult {
  answer: string;
  confidence: number;
  citations: Array<{ id: number; title: string }>;
  engine: ConsultEngine;
  shouldHandoff: boolean;
}

export type GenerateFn = (question: string, chunks: Array<{ title: string; body: string }>) => Promise<string | null>;

export async function retrieveKbHits(question: string, role: string): Promise<ConsultHit[]> {
  const visibility = STAFF.has(role)
    ? { in: [ArticleVisibility.PUBLIC, ArticleVisibility.INTERNAL] as ArticleVisibility[] }
    : ArticleVisibility.PUBLIC;

  const articles = await prisma.knowledgeArticle.findMany({
    where: { isPublished: true, visibility },
    select: { id: true, title: true, body: true, categoryId: true },
    take: 40,
  });

  return rankRelatedWithScores(question, articles, null, 5).map((row) => ({
    id: row.article.id,
    title: row.article.title,
    body: row.article.body,
    score: row.score,
  }));
}

export async function consult(input: {
  question: string;
  role: string;
  ticketId?: number;
  actorId?: number | null;
  preferRetrieval?: boolean;
  generate?: GenerateFn;
}): Promise<ConsultResult> {
  const started = Date.now();
  const hits = await retrieveKbHits(input.question, input.role);
  const extractive = buildKbAnswer(hits);
  const handoff = shouldHandoff(extractive.confidence, extractive.citations.length);

  const tryOllama =
    !input.preferRetrieval &&
    !handoff &&
    process.env.AI_PROVIDER !== 'retrieval' &&
    (isOllamaWarm() || (await probeOllama()));

  let engine: ConsultEngine = ConsultEngine.RETRIEVAL;
  let answer = extractive.answer;

  if (tryOllama) {
    const generate = input.generate ?? generateWithOllama;
    const slm = await generate(
      input.question,
      hits.slice(0, 4).map((hit) => ({ title: hit.title, body: hit.body }))
    );
    engine = resolveEngine(slm) === 'OLLAMA' ? ConsultEngine.OLLAMA : ConsultEngine.RETRIEVAL;
    if (slm && engine === ConsultEngine.OLLAMA) {
      answer = slm;
    }
  }

  const result: ConsultResult = {
    answer,
    confidence: extractive.confidence,
    citations: extractive.citations,
    engine,
    shouldHandoff: handoff,
  };

  await prisma.consultAttempt
    .create({
      data: {
        ticketId: input.ticketId ?? null,
        actorId: input.actorId ?? null,
        engine,
        confidence: result.confidence,
        chunkIds: hits.map((hit) => hit.id),
        answer: result.answer,
        latencyMs: Date.now() - started,
      },
    })
    .catch(() => undefined);

  await audit({
    action: 'CONSULT_ATTEMPT',
    category: 'TICKET',
    actorId: input.actorId ?? null,
    targetType: input.ticketId ? 'Ticket' : 'Knowledge',
    targetId: input.ticketId,
    message: `Consult ${engine} confidence=${result.confidence.toFixed(2)}`,
    metadata: { engine, handoff: result.shouldHandoff },
  });

  return result;
}

export function formatKbConsultReply(result: ConsultResult): string {
  return formatConsultReply({
    answer: result.answer,
    citations: result.citations,
    engine: result.engine,
  });
}

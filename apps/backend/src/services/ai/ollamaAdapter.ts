import { Ollama } from 'ollama';
import { buildGroundedPrompt, isGrounded } from './consultMath';
import { DEFAULT_OLLAMA_MODEL, DEFAULT_OLLAMA_URL } from './ollamaProbe';

const GENERATE_MS = 8_000;

export interface GenerateChunks {
  title: string;
  body: string;
}

export async function generateWithOllama(
  question: string,
  chunks: GenerateChunks[],
  options?: { host?: string; model?: string }
): Promise<string | null> {
  const titles = chunks.map((chunk) => chunk.title);
  const client = new Ollama({ host: options?.host ?? DEFAULT_OLLAMA_URL });
  try {
    const work = client.generate({
      model: options?.model ?? DEFAULT_OLLAMA_MODEL,
      prompt: buildGroundedPrompt(question, chunks),
      stream: false,
    });
    const timeout = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), GENERATE_MS);
    });
    const result = await Promise.race([work, timeout]);
    if (!result || typeof result === 'string') return null;
    const text = result.response?.trim() ?? '';
    if (!text || !isGrounded(text, titles)) return null;
    return text;
  } catch {
    return null;
  }
}

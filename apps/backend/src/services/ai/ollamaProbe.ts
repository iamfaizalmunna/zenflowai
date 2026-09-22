export const DEFAULT_OLLAMA_URL = process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434';
export const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'smollm2:360m';

const PROBE_MS = 400;
const CIRCUIT_FAILS = 3;
const SKIP_MS = 60_000;
const WARM_MS = 30_000;

export interface ProbeClock {
  now: () => number;
}

export type ProbeFetch = (url: string, init: { signal: AbortSignal }) => Promise<{ ok: boolean }>;

interface ProbeState {
  failures: number;
  skipUntil: number;
  lastOk: number;
}

const state: ProbeState = { failures: 0, skipUntil: 0, lastOk: 0 };

export function resetOllamaProbe(): void {
  state.failures = 0;
  state.skipUntil = 0;
  state.lastOk = 0;
}

export function isOllamaWarm(clock: ProbeClock = { now: Date.now }): boolean {
  return clock.now() - state.lastOk < WARM_MS;
}

export async function probeOllama(options?: {
  baseUrl?: string;
  clock?: ProbeClock;
  fetchImpl?: ProbeFetch;
}): Promise<boolean> {
  const clock = options?.clock ?? { now: Date.now };
  const now = clock.now();
  if (now < state.skipUntil) return false;

  const fetchImpl = options?.fetchImpl ?? ((url, init) => fetch(url, init));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_MS);
  try {
    const res = await fetchImpl(`${options?.baseUrl ?? DEFAULT_OLLAMA_URL}/api/tags`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error('probe failed');
    state.failures = 0;
    state.lastOk = now;
    return true;
  } catch {
    state.failures += 1;
    if (state.failures >= CIRCUIT_FAILS) {
      state.skipUntil = now + SKIP_MS;
      state.failures = 0;
    }
    return false;
  } finally {
    clearTimeout(timer);
  }
}

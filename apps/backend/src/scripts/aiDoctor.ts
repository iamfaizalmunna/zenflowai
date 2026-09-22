import { DEFAULT_OLLAMA_MODEL, DEFAULT_OLLAMA_URL, probeOllama, resetOllamaProbe } from '../services/ai/ollamaProbe';

async function main() {
  resetOllamaProbe();
  const ok = await probeOllama({ baseUrl: DEFAULT_OLLAMA_URL });
  const engine = ok ? 'ollama' : 'retrieval';
  console.log(`ai:doctor engine=${engine} url=${DEFAULT_OLLAMA_URL} model=${DEFAULT_OLLAMA_MODEL} healthy=${ok}`);
  process.exit(0);
}

void main();

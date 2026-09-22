import { spawnSync } from 'node:child_process';
import { DEFAULT_OLLAMA_MODEL } from '../services/ai/ollamaProbe';
import { ingestAllowlist } from '../services/ai/ingestKb';

function hasOllamaCli(): boolean {
  const which = spawnSync('which', ['ollama'], { encoding: 'utf8' });
  return which.status === 0 && Boolean(which.stdout.trim());
}

async function main() {
  if (!hasOllamaCli()) {
    console.log('ai:setup skipped — Ollama CLI not on PATH. Install from https://ollama.com (no signup) then re-run. App stays on retrieval.');
    process.exit(0);
  }
  const pull = spawnSync('ollama', ['pull', DEFAULT_OLLAMA_MODEL], { stdio: 'inherit' });
  if (pull.status !== 0) {
    console.log('ai:setup model pull failed; retrieval remains the default.');
  }
  const ingest = await ingestAllowlist();
  console.log(`ai:setup ingest created=${ingest.ingested} skipped=${ingest.skipped}`);
  process.exit(0);
}

void main();

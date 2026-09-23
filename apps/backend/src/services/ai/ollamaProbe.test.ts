import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isOllamaWarm, probeOllama, resetOllamaProbe } from './ollamaProbe';

describe('Phase 7 Ollama probe', () => {
  it('opens the circuit after three failures and skips the next call', async () => {
    resetOllamaProbe();
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      throw new Error('down');
    };
    const clock = { now: () => 1_000 };
    assert.equal(await probeOllama({ fetchImpl, clock }), false);
    assert.equal(await probeOllama({ fetchImpl, clock }), false);
    assert.equal(await probeOllama({ fetchImpl, clock }), false);
    assert.equal(await probeOllama({ fetchImpl, clock }), false);
    assert.equal(calls, 3);
  });

  it('returns true when tags respond', async () => {
    resetOllamaProbe();
    assert.equal(isOllamaWarm({ now: () => 100_000 }), false);
    const ok = await probeOllama({
      fetchImpl: async () => ({ ok: true }),
      clock: { now: () => 100_000 },
      baseUrl: 'http://127.0.0.1:11434',
    });
    assert.equal(ok, true);
    assert.equal(isOllamaWarm({ now: () => 100_000 }), true);
    assert.equal(isOllamaWarm({ now: () => 100_000 + 30_001 }), false);
  });

  it('treats a non-ok probe as a failure', async () => {
    resetOllamaProbe();
    assert.equal(await probeOllama({ fetchImpl: async () => ({ ok: false }), clock: { now: () => 3_000 } }), false);
    resetOllamaProbe();
    assert.equal(await probeOllama({ fetchImpl: async () => ({ ok: true }) }), true);
    assert.equal(isOllamaWarm(), true);
  });
});

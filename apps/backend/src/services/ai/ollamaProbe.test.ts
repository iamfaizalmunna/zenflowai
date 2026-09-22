import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { probeOllama, resetOllamaProbe } from './ollamaProbe';

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
    const ok = await probeOllama({
      fetchImpl: async () => ({ ok: true }),
      clock: { now: () => 2_000 },
    });
    assert.equal(ok, true);
  });
});

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  parseSoundMuted,
  shouldPlayUiSound,
  SOUND_MUTE_KEY,
  UI_SOUND_PRESETS,
  type UiSoundEvent,
} from '@/lib/uiSound';

function pointerKind(): 'coarse' | 'fine' {
  if (typeof window === 'undefined') return 'fine';
  return window.matchMedia('(pointer: coarse)').matches ? 'coarse' : 'fine';
}

export function useUiSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMutedState(parseSoundMuted(localStorage.getItem(SOUND_MUTE_KEY)));
  }, []);

  const ensureCtx = useCallback(async (): Promise<AudioContext | null> => {
    if (typeof window === 'undefined') return null;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!ctxRef.current) ctxRef.current = new AC();
    if (ctxRef.current.state === 'suspended') {
      await ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const play = useCallback(async (event: UiSoundEvent) => {
    if (!shouldPlayUiSound({ muted, event, pointer: pointerKind() })) return;
    const ctx = await ensureCtx();
    if (!ctx) return;
    const preset = UI_SOUND_PRESETS[event];
    const now = ctx.currentTime;
    const step = preset.durationMs / 1000 / preset.freqs.length;

    preset.freqs.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = event === 'error' ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now);
      const start = now + index * step;
      gain.gain.exponentialRampToValueAtTime(preset.gain, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + step);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + step + 0.02);
    });
  }, [ensureCtx, muted]);

  const setMuted = useCallback((next: boolean) => {
    setMutedState(next);
    localStorage.setItem(SOUND_MUTE_KEY, next ? '1' : '0');
  }, []);

  return { play, muted, setMuted };
}

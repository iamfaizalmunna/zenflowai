'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  isImportantSoundControl,
  parseSoundMuted,
  shouldPlayUiSound,
  SOUND_MUTE_KEY,
  UI_SOUND_PRESETS,
  type UiSoundEvent,
} from '@/lib/uiSound';

let sharedCtx: AudioContext | null = null;
let listenersBound = false;
const mutedRef = { current: false };

async function getCtx(): Promise<AudioContext | null> {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx) sharedCtx = new AC();
  if (sharedCtx.state === 'suspended') await sharedCtx.resume();
  return sharedCtx;
}

export async function playUiSound(event: UiSoundEvent): Promise<void> {
  if (!shouldPlayUiSound({ muted: mutedRef.current, event })) return;
  const ctx = await getCtx();
  if (!ctx || ctx.state !== 'running') return;
  const preset = UI_SOUND_PRESETS[event];
  const now = ctx.currentTime;
  const step = Math.max(preset.durationMs / 1000 / preset.freqs.length, 0.03);

  preset.freqs.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = event === 'error' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);
    const start = now + index * step * 0.55;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(preset.gain, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + step);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + step + 0.01);
  });
}

function bindGlobalListeners(): void {
  if (listenersBound || typeof document === 'undefined') return;
  listenersBound = true;
  document.addEventListener('pointerdown', (event) => {
    void getCtx();
    const target = event.target;
    if (!(target instanceof Element)) return;
    const hit = target.closest('button, a, input, [role]');
    if (!(hit instanceof HTMLElement)) return;
    if (hit instanceof HTMLButtonElement && hit.type === 'submit') return;
    const role = hit.getAttribute('role') ?? '';
    const type = hit instanceof HTMLInputElement ? hit.type : '';
    if (!isImportantSoundControl(hit.tagName, type, role)) return;
    void playUiSound('tap');
  }, { capture: true });
}

export function SoundBoot() {
  useEffect(() => {
    mutedRef.current = parseSoundMuted(localStorage.getItem(SOUND_MUTE_KEY));
    bindGlobalListeners();
  }, []);
  return null;
}

export function useUiSound() {
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMutedState(parseSoundMuted(localStorage.getItem(SOUND_MUTE_KEY)));
  }, []);

  const play = useCallback((event: UiSoundEvent) => {
    void playUiSound(event);
  }, []);

  const setMuted = useCallback((next: boolean) => {
    mutedRef.current = next;
    setMutedState(next);
    localStorage.setItem(SOUND_MUTE_KEY, next ? '1' : '0');
  }, []);

  return { play, muted, setMuted };
}

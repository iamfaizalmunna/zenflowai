export type UiSoundEvent =
  | 'tap'
  | 'hover'
  | 'success'
  | 'error'
  | 'login'
  | 'logout'
  | 'notify';

export interface UiSoundPreset {
  freqs: number[];
  durationMs: number;
  gain: number;
}

export const UI_SOUND_PRESETS: Record<UiSoundEvent, UiSoundPreset> = {
  hover: { freqs: [880], durationMs: 28, gain: 0.03 },
  tap: { freqs: [520, 780], durationMs: 55, gain: 0.05 },
  success: { freqs: [523, 784], durationMs: 140, gain: 0.07 },
  notify: { freqs: [659, 880], durationMs: 160, gain: 0.06 },
  login: { freqs: [392, 523, 659], durationMs: 180, gain: 0.07 },
  logout: { freqs: [659, 392], durationMs: 160, gain: 0.06 },
  error: { freqs: [220, 185], durationMs: 200, gain: 0.08 },
};

export const SOUND_MUTE_KEY = 'zenflow-sound-muted';

export function shouldPlayUiSound(input: {
  muted: boolean;
  event: UiSoundEvent;
  pointer: 'coarse' | 'fine';
}): boolean {
  if (input.muted) return false;
  if (input.event === 'hover' && input.pointer === 'coarse') return false;
  return true;
}

export function parseSoundMuted(raw: string | null): boolean {
  return raw === '1' || raw === 'true';
}

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
  hover: { freqs: [1480, 1960], durationMs: 70, gain: 0.11 },
  tap: { freqs: [520, 860], durationMs: 80, gain: 0.09 },
  success: { freqs: [523, 784], durationMs: 140, gain: 0.08 },
  notify: { freqs: [659, 880], durationMs: 160, gain: 0.07 },
  login: { freqs: [392, 523, 659], durationMs: 180, gain: 0.08 },
  logout: { freqs: [659, 392], durationMs: 160, gain: 0.07 },
  error: { freqs: [220, 185], durationMs: 200, gain: 0.1 },
};

export const SOUND_MUTE_KEY = 'zenflow-sound-muted';
export const UI_CLICK_SELECTOR =
  'button, [role="button"], [role="checkbox"], [role="radio"], [role="switch"], [role="combobox"], [role="menuitem"], input[type="checkbox"], input[type="radio"], [data-ui-sound="click"]';

export function shouldPlayUiSound(input: {
  muted: boolean;
  event: UiSoundEvent;
}): boolean {
  if (input.muted) return false;
  if (input.event === 'hover') return false;
  return true;
}

export function isImportantSoundControl(tagName: string, inputType: string, role: string): boolean {
  const tag = tagName.toUpperCase();
  const type = inputType.toLowerCase();
  const r = role.toLowerCase();
  if (tag === 'BUTTON' || r === 'button') return true;
  if (tag === 'INPUT' && (type === 'checkbox' || type === 'radio')) return true;
  return ['checkbox', 'radio', 'switch', 'combobox', 'menuitem'].includes(r);
}

export function parseSoundMuted(raw: string | null): boolean {
  return raw === '1' || raw === 'true';
}

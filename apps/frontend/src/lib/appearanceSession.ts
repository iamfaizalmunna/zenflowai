import { DEFAULT_APPEARANCE, mergeAppearance, type AppearancePrefs } from './appearanceCore';

export const LEGACY_APPEARANCE_KEY = 'zenflow-appearance-local';

/** Public pages (login, signup) always use this and never follow another account. */
export const PUBLIC_APPEARANCE: AppearancePrefs = {
  ...DEFAULT_APPEARANCE,
  colorMode: 'LIGHT',
};

export function appearanceCacheKey(userId: number): string {
  return `zenflow-appearance-user-${userId}`;
}

export function resolveSessionAppearance(input: {
  isSignedIn: boolean;
  dbPrefs?: Partial<AppearancePrefs> | null;
  localPatch?: Partial<AppearancePrefs> | null;
}): AppearancePrefs {
  if (!input.isSignedIn) return mergeAppearance(PUBLIC_APPEARANCE);
  return mergeAppearance({
    ...DEFAULT_APPEARANCE,
    ...(input.dbPrefs ?? {}),
    ...(input.localPatch ?? {}),
  });
}

export function publicHtmlThemeClass(): 'light' {
  return 'light';
}

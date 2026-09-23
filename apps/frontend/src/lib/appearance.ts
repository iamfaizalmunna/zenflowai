import {
  FONT_SIZE_PX,
  FONT_STACK,
  hslChannels,
  htmlThemeClass,
  irisTextChannels,
  isDarkColorMode,
  mergeAppearance,
  primaryForegroundChannels,
  type AppearancePrefs,
} from './appearanceCore';

export * from './appearanceCore';

export function applyAppearanceToDocument(prefs: AppearancePrefs, root: HTMLElement): void {
  const merged = mergeAppearance(prefs);
  const channels = hslChannels(merged.accentHex, merged.shade);
  if (channels) {
    root.style.setProperty('--iris', channels);
    root.style.setProperty('--primary', channels);
    root.style.setProperty('--ring', channels);
    root.style.setProperty('--primary-foreground', primaryForegroundChannels(merged.accentHex, merged.shade));
  }
  root.style.setProperty('--app-font-size', FONT_SIZE_PX[merged.fontSize]);
  root.style.fontFamily = FONT_STACK[merged.fontFamily];
  root.dataset.finish = merged.finish.toLowerCase();
  root.dataset.density = merged.density.toLowerCase();
  const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = htmlThemeClass(merged.colorMode, prefersDark);
  root.style.setProperty('--iris-text', irisTextChannels(merged.accentHex, isDarkColorMode(merged.colorMode, prefersDark)));
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.style.colorScheme = theme;
  if (typeof window !== 'undefined') window.localStorage.removeItem('theme');
}

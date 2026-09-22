export const PWA_THEME_LIGHT = '#F8F6F2';
export const PWA_THEME_DARK = '#1C2433';

export const PWA_MANIFEST = {
  name: 'ZenFlowAI',
  short_name: 'ZenFlow',
  description: 'Support tickets and Help Center — installable workspace',
  start_url: '/',
  display: 'standalone',
  orientation: 'portrait-primary',
  background_color: PWA_THEME_DARK,
  theme_color: PWA_THEME_LIGHT,
  lang: 'en',
  icons: [
    {
      src: '/icons/icon.svg',
      sizes: 'any',
      type: 'image/svg+xml',
      purpose: 'any maskable',
    },
  ],
} as const;

export function isStandaloneDisplay(display: string): boolean {
  return display === 'standalone' || display === 'fullscreen' || display === 'minimal-ui';
}

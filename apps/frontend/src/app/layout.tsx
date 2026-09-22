import type { Metadata, Viewport } from 'next';
import { Fraunces, Outfit } from 'next/font/google';
import { ApolloWrapper } from '@/components/layout/ApolloWrapper';
import { PwaRegister } from '@/components/layout/PwaRegister';
import { SoundBoot } from '@/hooks/useUiSound';
import { AppearanceProvider } from '@/hooks/useAppearance';
import { PWA_MANIFEST, PWA_THEME_DARK, PWA_THEME_LIGHT } from '@/lib/pwa';
import { THEME_BOOT_SCRIPT } from '@/lib/themeBoot';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' });

export const metadata: Metadata = {
  title: { default: 'ZenFlowAI', template: '%s · ZenFlowAI' },
  description: PWA_MANIFEST.description,
  applicationName: PWA_MANIFEST.short_name,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: PWA_MANIFEST.short_name,
    statusBarStyle: 'black-translucent',
  },
  icons: { icon: '/icons/icon.svg', apple: '/icons/icon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: PWA_THEME_DARK },
    { color: PWA_THEME_LIGHT },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className={`${outfit.variable} ${fraunces.variable} font-sans text-foreground`}>
        <ApolloWrapper>
          <PwaRegister />
          <SoundBoot />
          <AppearanceProvider>{children}</AppearanceProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}

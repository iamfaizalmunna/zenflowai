import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { ApolloWrapper } from '@/components/layout/ApolloWrapper';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: { default: 'ZenFlowAI', template: '%s · ZenFlowAI' },
  description: 'Enterprise ticketing system — clean, fast, AI-ready',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ApolloWrapper>
            {children}
          </ApolloWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}

'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ZenLogo } from '@/components/brand/ZenLogo';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-sm px-1"
    >
      <div className="text-center mb-8">
        <ZenLogo className="justify-center" size={44} />
      </div>
      <div className="rounded-2xl border border-border/60 bg-card/90 backdrop-blur-xl p-6 app:p-8 shadow-[0_24px_60px_-40px_hsl(var(--foreground)/0.35)]">
        <h1 className="font-sans text-xl font-semibold tracking-tight mb-1">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>}
        {!subtitle && <div className="mb-6" />}
        {children}
      </div>
    </motion.div>
  );
}

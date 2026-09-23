'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ZenLogo } from '@/components/brand/ZenLogo';

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <motion.div
      initial={{ y: 16 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-[24rem]"
    >
      <ZenLogo
        className="mb-6 [&>span]:text-white [&>span>span]:bg-gradient-to-r [&>span>span]:from-[#C4B5FD] [&>span>span]:to-[#FBBF24] [&>span>span]:bg-clip-text [&>span>span]:text-transparent app:mb-8"
        size={32}
      />
      <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.08] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl app:rounded-[1.5rem] app:p-7">
        <h1 className="mb-1 font-display text-2xl tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mb-6 text-sm text-white/55">{subtitle}</p>}
        {!subtitle && <div className="mb-6" />}
        {children}
      </div>
    </motion.div>
  );
}

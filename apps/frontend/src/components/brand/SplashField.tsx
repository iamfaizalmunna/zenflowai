'use client';

import { motion } from 'framer-motion';

export function SplashField({
  pointer,
  colors,
}: {
  pointer: { x: number; y: number };
  colors: readonly [string, string, string];
}) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#07040f]" aria-hidden>
      <motion.div
        className="absolute h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-55 blur-[90px]"
        animate={{ left: `${pointer.x}%`, top: `${pointer.y}%` }}
        transition={{ type: 'spring', stiffness: 50, damping: 22, mass: 0.8 }}
        style={{ background: colors[0] }}
      />
      <motion.div
        className="absolute h-[50vmax] w-[50vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[80px]"
        animate={{ left: `${100 - pointer.x}%`, top: `${100 - pointer.y}%` }}
        transition={{ type: 'spring', stiffness: 35, damping: 24 }}
        style={{ background: colors[1] }}
      />
      <motion.div
        className="absolute left-1/2 top-[85%] h-[45vmax] w-[45vmax] -translate-x-1/2 rounded-full opacity-35 blur-[100px]"
        animate={{ x: (pointer.x - 50) * 1.4, y: (pointer.y - 50) * 0.6 }}
        transition={{ type: 'spring', stiffness: 28, damping: 20 }}
        style={{ background: colors[2] }}
      />
      <div className="auth-grain absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#07040f_78%)]" />
    </div>
  );
}

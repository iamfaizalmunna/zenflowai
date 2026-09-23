'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { pickSplashTransition, SPLASH_SCENES } from '@/lib/splash';

const ease = [0.16, 1, 0.3, 1] as const;

export function AuthHeroStage({
  sceneIndex,
  seed,
  tilt,
  compact = false,
}: {
  sceneIndex: number;
  seed: number;
  tilt: { x: number; y: number };
  compact?: boolean;
}) {
  const scene = SPLASH_SCENES[sceneIndex] ?? SPLASH_SCENES[0];
  const trans = pickSplashTransition(seed);
  const thread = compact ? scene.thread.slice(0, 2) : scene.thread;

  return (
    <motion.div
      className="relative w-full max-w-[40rem]"
      style={{ transformStyle: 'preserve-3d', perspective: 1400 }}
      animate={{ rotateY: tilt.x / 4, rotateX: tilt.y / 5 }}
      transition={{ type: 'spring', stiffness: 80, damping: 18 }}
    >
      <div className="absolute -left-8 top-10 hidden rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-white/80 backdrop-blur-md app:block">
        {scene.ticket}
      </div>
      <div className="absolute -right-4 top-24 hidden rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-white/80 backdrop-blur-md app:block">
        {scene.status}
      </div>
      <div className="absolute -bottom-3 left-16 hidden rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-white/80 backdrop-blur-md app:block">
        {scene.kicker}
      </div>

      <div className={`rounded-[1.75rem] bg-gradient-to-br p-[1px] shadow-[0_40px_120px_rgba(0,0,0,0.55)] ${scene.glow}`}>
        <div className="overflow-hidden rounded-[1.7rem] bg-[#11081c]/95">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F87171]/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FBBF24]/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#34D399]/90" />
            <span className="ml-3 text-[11px] tracking-[0.2em] text-white/45">ZENFLOW · DESK</span>
          </div>
          <div className={compact ? 'min-h-0 p-4' : 'grid min-h-[18rem] grid-cols-1 sm:min-h-[26rem] sm:grid-cols-[9rem_1fr]'}>
            {!compact && (
            <aside className="hidden space-y-2 border-r border-white/10 p-3 sm:block">
              {SPLASH_SCENES.map((item, i) => (
                <div
                  key={item.id}
                  className={`rounded-xl px-2.5 py-2 text-[11px] ${i === sceneIndex ? 'bg-white/12 text-white' : 'text-white/40'}`}
                >
                  <p className="font-medium">{item.ticket}</p>
                  <p className="truncate text-[10px] opacity-70">{item.title}</p>
                </div>
              ))}
            </aside>
            )}
            <div className={compact ? '' : 'p-4 sm:p-5'}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={scene.id}
                  initial={trans.initial}
                  animate={trans.animate}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.45, ease }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">{scene.kicker}</p>
                      <h2 className="mt-1 font-display text-lg text-white sm:text-2xl">{scene.title}</h2>
                    </div>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-white/80">{scene.status}</span>
                  </div>
                  <div className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
                    {thread.map((msg) => (
                      <div
                        key={msg.body}
                        className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                          msg.who === 'You' ? 'ml-auto bg-white/12 text-white' : 'bg-black/25 text-white/85'
                        }`}
                      >
                        <p className="mb-1 text-[10px] uppercase tracking-wider text-white/45">{msg.who}</p>
                        {msg.body}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

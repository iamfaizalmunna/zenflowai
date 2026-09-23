'use client';

import { useEffect, useState, type PointerEvent, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AuthHeroStage } from '@/components/brand/AuthHeroStage';
import { SplashField } from '@/components/brand/SplashField';
import {
  AUTH_SPLASH_KEY,
  nextSceneIndex,
  pickShadePalette,
  SHADE_PALETTES,
  shouldShowAuthSplash,
  SPLASH_SCENES,
} from '@/lib/splash';

const ease = [0.16, 1, 0.3, 1] as const;

export function AuthSplash({ children }: { children: ReactNode }) {
  const [showIntro, setShowIntro] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [pointer, setPointer] = useState({ x: 42, y: 38 });
  const [scene, setScene] = useState(0);
  const [seed, setSeed] = useState(1);
  const [shades, setShades] = useState<(typeof SHADE_PALETTES)[number]>(SHADE_PALETTES[0]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wide = window.matchMedia('(min-width: 1025px)');
    setDesktop(wide.matches);
    setShowIntro(shouldShowAuthSplash(sessionStorage.getItem(AUTH_SPLASH_KEY), reduce));
    setShades(pickShadePalette(Math.floor(Math.random() * 99)));
    const onWide = () => setDesktop(wide.matches);
    wide.addEventListener('change', onWide);
    if (reduce) return () => wide.removeEventListener('change', onWide);
    const scenes = window.setInterval(() => {
      const roll = Math.floor(Math.random() * 99);
      setSeed(roll);
      setScene((current) => nextSceneIndex(current, roll));
    }, 4200);
    const palettes = window.setInterval(() => {
      setShades(pickShadePalette(Math.floor(Math.random() * 99)));
    }, 7000);
    return () => {
      wide.removeEventListener('change', onWide);
      window.clearInterval(scenes);
      window.clearInterval(palettes);
    };
  }, []);

  const enter = () => {
    sessionStorage.setItem(AUTH_SPLASH_KEY, '1');
    setShowIntro(false);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const r = event.currentTarget.getBoundingClientRect();
    const nx = ((event.clientX - r.left) / r.width) * 100;
    const ny = ((event.clientY - r.top) / r.height) * 100;
    setPointer({ x: nx, y: ny });
    if (desktop) {
      setTilt({ x: (nx / 100 - 0.5) * 16, y: (ny / 100 - 0.5) * -12 });
    }
  };

  const heroTilt = desktop ? tilt : { x: 0, y: 0 };

  return (
    <div
      className="relative min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-[#07040f]"
      onPointerMove={onPointerMove}
    >
      <SplashField pointer={pointer} colors={shades} />

      {!showIntro && (
        <div className="relative z-10 mx-auto grid min-h-[100dvh] w-full max-w-[1180px] app:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)]">
          <div className="flex items-start justify-center px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] app:items-center app:p-10">
            {children}
          </div>
          <div className="hidden items-center justify-center p-10 pr-8 app:flex">
            <AuthHeroStage sceneIndex={scene} seed={seed} tilt={heroTilt} compact={false} />
          </div>
        </div>
      )}

      {showIntro ? (
        <motion.div
          className="relative z-30 min-h-[100dvh] text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease }}
        >
          <div className="mx-auto flex min-h-[100dvh] max-w-[1180px] flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] app:grid app:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] app:items-center app:gap-10 app:px-10 app:pt-0">
            <div className="max-w-md">
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/50 sm:text-[11px] sm:tracking-[0.32em]">
                Ticketing · SaaS · PaaS
              </p>
              <h1 className="mt-3 font-display text-[2.55rem] leading-[0.95] tracking-tight sm:mt-4 sm:text-6xl">
                ZenFlow
                <span className="bg-gradient-to-r from-[#C4B5FD] to-[#FBBF24] bg-clip-text text-transparent">AI</span>
              </h1>
              <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-white/65 sm:mt-5 sm:text-[15px]">
                One ticket across the customer desk, Nova, and your GraphQL platform. Same RBAC. Live thread.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 sm:mt-8">
                {SPLASH_SCENES.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSeed(i + 3);
                      setScene(i);
                    }}
                    className={cn(
                      'min-h-10 rounded-full border px-3.5 py-1.5 text-xs transition-colors',
                      i === scene ? 'border-white/30 bg-white/15 text-white' : 'border-white/10 text-white/55',
                    )}
                  >
                    {item.kicker}
                  </button>
                ))}
              </div>
              <motion.button
                type="button"
                onClick={enter}
                className="mt-8 hidden min-h-12 rounded-full bg-gradient-to-r from-[#A78BFA] to-[#F59E0B] px-8 text-sm font-semibold text-[#1a1028] shadow-[0_0_40px_rgba(167,139,250,0.4)] app:inline-flex app:items-center"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                Enter the desk
              </motion.button>
            </div>
            <div className="mt-6 flex flex-1 items-start app:mt-0 app:items-center app:justify-end">
              <AuthHeroStage sceneIndex={scene} seed={seed} tilt={heroTilt} compact={!desktop} />
            </div>
            <div className="sticky bottom-0 -mx-5 mt-6 bg-gradient-to-t from-[#07040f] via-[#07040f]/80 to-transparent px-5 pb-2 pt-8 app:hidden">
              <button
                type="button"
                onClick={enter}
                className="flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#A78BFA] to-[#F59E0B] text-sm font-semibold text-[#1a1028]"
              >
                Enter the desk
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/auth.store';
import { useUiSound } from '@/hooks/useUiSound';
import { MY_APPEARANCE, SAVE_APPEARANCE } from '@/modules/appearance/queries/appearance.queries';
import {
  applyAppearanceToDocument,
  DEFAULT_APPEARANCE,
  mergeAppearance,
  type AppearancePrefs,
} from '@/lib/appearance';

interface AppearanceContextValue {
  prefs: AppearancePrefs;
  update: (patch: Partial<AppearancePrefs>) => void;
}

const AppearanceContext = createContext<AppearanceContextValue>({
  prefs: DEFAULT_APPEARANCE,
  update: () => undefined,
});

function themeFromMode(mode: AppearancePrefs['colorMode']): string {
  if (mode === 'LIGHT') return 'light';
  if (mode === 'DARK') return 'dark';
  return 'system';
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const { setTheme } = useTheme();
  const { setMuted } = useUiSound();
  const { data } = useQuery(MY_APPEARANCE, { skip: !token });
  const [save] = useMutation(SAVE_APPEARANCE);

  const prefs = useMemo(
    () => mergeAppearance(data?.myAppearance ?? DEFAULT_APPEARANCE),
    [data?.myAppearance],
  );

  useEffect(() => {
    applyAppearanceToDocument(prefs, document.documentElement);
    setTheme(themeFromMode(prefs.colorMode));
    setMuted(prefs.soundsMuted);
  }, [prefs, setMuted, setTheme]);

  const update = useCallback(
    (patch: Partial<AppearancePrefs>) => {
      const next = mergeAppearance({ ...prefs, ...patch });
      applyAppearanceToDocument(next, document.documentElement);
      if (patch.colorMode) setTheme(themeFromMode(next.colorMode));
      if (patch.soundsMuted !== undefined) setMuted(next.soundsMuted);
      if (!token) return;
      void save({
        variables: { input: patch },
        optimisticResponse: { saveAppearance: next },
        update: (cache, result) => {
          cache.writeQuery({
            query: MY_APPEARANCE,
            data: { myAppearance: result.data?.saveAppearance ?? next },
          });
        },
      });
    },
    [token, prefs, save, setMuted, setTheme],
  );

  const value = useMemo(() => ({ prefs, update }), [prefs, update]);
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  return useContext(AppearanceContext);
}

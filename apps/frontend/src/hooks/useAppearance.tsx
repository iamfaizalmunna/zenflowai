'use client';

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery } from '@apollo/client';
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

export const APPEARANCE_LOCAL_KEY = 'zenflow-appearance-local';

function readLocalPatch(): Partial<AppearancePrefs> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(APPEARANCE_LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Partial<AppearancePrefs>) : {};
  } catch {
    return {};
  }
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const { setMuted } = useUiSound();
  const { data } = useQuery(MY_APPEARANCE, { skip: !token });
  const [save] = useMutation(SAVE_APPEARANCE);
  const [localPatch, setLocalPatch] = useState<Partial<AppearancePrefs>>({});

  useLayoutEffect(() => {
    setLocalPatch(readLocalPatch());
  }, []);

  const prefs = useMemo(
    () => mergeAppearance({ ...DEFAULT_APPEARANCE, ...data?.myAppearance, ...localPatch }),
    [data?.myAppearance, localPatch],
  );

  useEffect(() => {
    applyAppearanceToDocument(prefs, document.documentElement);
    setMuted(prefs.soundsMuted);
  }, [prefs, setMuted]);

  const update = useCallback(
    (patch: Partial<AppearancePrefs>) => {
      const nextPatch = { ...localPatch, ...patch };
      const next = mergeAppearance({ ...prefs, ...nextPatch });
      setLocalPatch(nextPatch);
      localStorage.setItem(APPEARANCE_LOCAL_KEY, JSON.stringify(nextPatch));
      applyAppearanceToDocument(next, document.documentElement);
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
    [token, prefs, localPatch, save, setMuted],
  );

  const value = useMemo(() => ({ prefs, update }), [prefs, update]);
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  return useContext(AppearanceContext);
}

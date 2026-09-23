'use client';

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useAuthStore } from '@/store/auth.store';
import { useUiSound } from '@/hooks/useUiSound';
import { MY_APPEARANCE, SAVE_APPEARANCE } from '@/modules/appearance/queries/appearance.queries';
import {
  applyAppearanceToDocument,
  mergeAppearance,
  type AppearancePrefs,
} from '@/lib/appearance';
import {
  appearanceCacheKey,
  LEGACY_APPEARANCE_KEY,
  PUBLIC_APPEARANCE,
  resolveSessionAppearance,
} from '@/lib/appearanceSession';

interface AppearanceContextValue {
  prefs: AppearancePrefs;
  update: (patch: Partial<AppearancePrefs>) => void;
}

const AppearanceContext = createContext<AppearanceContextValue>({
  prefs: PUBLIC_APPEARANCE,
  update: () => undefined,
});

function readUserPatch(userId: number): Partial<AppearancePrefs> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(appearanceCacheKey(userId));
    return raw ? (JSON.parse(raw) as Partial<AppearancePrefs>) : {};
  } catch {
    return {};
  }
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const signedIn = Boolean(token && userId);
  const { setMuted } = useUiSound();
  const { data } = useQuery(MY_APPEARANCE, {
    skip: !signedIn,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });
  const [save] = useMutation(SAVE_APPEARANCE);
  const [localPatch, setLocalPatch] = useState<Partial<AppearancePrefs>>({});
  const pendingSave = useRef<Partial<AppearancePrefs>>({});
  const latestPrefs = useRef<AppearancePrefs>(PUBLIC_APPEARANCE);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    if (typeof window !== 'undefined') localStorage.removeItem(LEGACY_APPEARANCE_KEY);
    if (!userId) {
      setLocalPatch({});
      return;
    }
    setLocalPatch(readUserPatch(userId));
  }, [userId]);

  const prefs = useMemo(
    () =>
      resolveSessionAppearance({
        isSignedIn: signedIn,
        dbPrefs: data?.myAppearance ?? null,
        localPatch,
      }),
    [signedIn, data?.myAppearance, localPatch],
  );
  latestPrefs.current = prefs;

  useEffect(() => {
    applyAppearanceToDocument(prefs, document.documentElement);
    setMuted(prefs.soundsMuted);
  }, [prefs, setMuted]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const update = useCallback(
    (patch: Partial<AppearancePrefs>) => {
      if (!signedIn || userId === null) return;
      const nextPatch = { ...localPatch, ...patch };
      const next = mergeAppearance({ ...prefs, ...nextPatch });
      setLocalPatch(nextPatch);
      localStorage.setItem(appearanceCacheKey(userId), JSON.stringify(nextPatch));
      applyAppearanceToDocument(next, document.documentElement);
      latestPrefs.current = next;
      if (patch.soundsMuted !== undefined) setMuted(next.soundsMuted);
      pendingSave.current = { ...pendingSave.current, ...patch };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const input = pendingSave.current;
        pendingSave.current = {};
        const saved = latestPrefs.current;
        void save({
          variables: { input },
          optimisticResponse: { saveAppearance: saved },
          update: (cache, result) => {
            cache.writeQuery({
              query: MY_APPEARANCE,
              data: { myAppearance: result.data?.saveAppearance ?? saved },
            });
          },
        });
      }, 360);
    },
    [signedIn, userId, prefs, localPatch, save, setMuted],
  );

  const value = useMemo(() => ({ prefs, update }), [prefs, update]);
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  return useContext(AppearanceContext);
}

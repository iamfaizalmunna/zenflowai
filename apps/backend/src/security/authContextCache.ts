export const AUTH_CONTEXT_TTL_MS = 8_000;

export type CachedAuthIdentity = {
  userId: number;
  role: string;
  permissionOverrides?: Array<{ permission: string; granted: boolean }>;
};

const cache = new Map<string, { until: number; value: CachedAuthIdentity }>();

export function readAuthContextCache(token: string, now = Date.now()): CachedAuthIdentity | null {
  const hit = cache.get(token);
  if (!hit || hit.until <= now) {
    if (hit) cache.delete(token);
    return null;
  }
  return hit.value;
}

export function writeAuthContextCache(token: string, value: CachedAuthIdentity, now = Date.now()): void {
  cache.set(token, { until: now + AUTH_CONTEXT_TTL_MS, value });
}

import type { CookieOptions, Response } from 'express';

export const REFRESH_COOKIE_NAME = 'zenflow_refresh';
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function parseCookieHeader(header: string | undefined | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

export function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: REFRESH_MAX_AGE_MS,
  };
}

export function setRefreshCookie(res: Response | undefined, token: string): void {
  if (!res) return;
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions());
}

export function clearRefreshCookie(res: Response | undefined): void {
  if (!res) return;
  res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions(), maxAge: 0 });
}

export function readRefreshCookie(cookieHeader: string | undefined | null): string | null {
  return parseCookieHeader(cookieHeader)[REFRESH_COOKIE_NAME] ?? null;
}

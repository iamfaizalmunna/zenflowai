import type { Response } from 'express';

export interface Context {
  userId: number | null;
  role: string | null;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  res?: Response;
  refreshCookie?: string | null;
  permissionOverrides?: Array<{ permission: string; granted: boolean }>;
}

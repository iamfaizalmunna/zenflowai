export interface Context {
  userId: number | null;
  role: string | null;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  // Permission overrides for this user (loaded from DB on demand)
  permissionOverrides?: Array<{ permission: string; granted: boolean }>;
}

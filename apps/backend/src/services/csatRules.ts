export const CSAT_TTL_DAYS = 7;

export function csatExpiresAt(from: Date, days = CSAT_TTL_DAYS): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

export function isCsatOpen(expiresAt: Date, submitted: boolean, now: Date): boolean {
  return !submitted && now.getTime() < expiresAt.getTime();
}

export function clampCsatRating(rating: number): number {
  return Math.min(5, Math.max(1, Math.round(rating)));
}

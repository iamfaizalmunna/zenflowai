export const CONSULTANT_LIST_PACK_DAYS = 90;
export const CONSULTANT_PROFILE_PACK_DAYS = 112;

export function ticketPackSince(days: number, now = new Date()): Date {
  const since = new Date(now.getTime());
  since.setUTCDate(since.getUTCDate() - days);
  return since;
}

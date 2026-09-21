export const SLA_WARNING_HOURS = 2;
export const AUTO_CLOSE_AFTER_RESOLVE_HOURS = 48;

export function isSlaBreached(due: Date, now: Date): boolean {
  return due.getTime() <= now.getTime();
}

export function isSlaWarning(due: Date, now: Date, warningHours = SLA_WARNING_HOURS): boolean {
  const ms = due.getTime() - now.getTime();
  return ms > 0 && ms <= warningHours * 60 * 60 * 1000;
}

export function shouldAutoClose(resolvedAt: Date, now: Date, hours = AUTO_CLOSE_AFTER_RESOLVE_HOURS): boolean {
  return now.getTime() - resolvedAt.getTime() >= hours * 60 * 60 * 1000;
}

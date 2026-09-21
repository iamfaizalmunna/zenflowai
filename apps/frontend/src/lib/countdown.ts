export function remainingMs(due: string | Date, now = Date.now()): number {
  return new Date(due).getTime() - now;
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'overdue';
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

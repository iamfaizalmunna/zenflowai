export function parseExpiresToSeconds(raw: string): number {
  const match = /^(\d+)([smhd])$/.exec(raw.trim());
  if (!match) return 15 * 60;
  const amount = Number(match[1]);
  const unit = match[2];
  if (unit === 's') return amount;
  if (unit === 'm') return amount * 60;
  if (unit === 'h') return amount * 60 * 60;
  return amount * 60 * 60 * 24;
}

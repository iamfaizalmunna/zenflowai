export type SpamVerdict = 'CLEAN' | 'SUSPICIOUS' | 'HIGH_RISK' | 'BLOCK';

export function verdictFromScore(score: number): SpamVerdict {
  if (score >= 80) return 'BLOCK';
  if (score >= 60) return 'HIGH_RISK';
  if (score >= 30) return 'SUSPICIOUS';
  return 'CLEAN';
}

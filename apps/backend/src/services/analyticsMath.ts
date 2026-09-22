export const CHART_TYPES = ['LINE', 'AREA', 'BAR', 'PIE', 'DONUT', 'RADIAL'] as const;
export type ChartType = (typeof CHART_TYPES)[number];

export interface ChartPoint {
  key: string;
  value: number;
}

export interface Kpi {
  id: string;
  label: string;
  value: number;
}

export function parseChartType(raw: string | null | undefined): ChartType {
  if (raw && (CHART_TYPES as readonly string[]).includes(raw)) return raw as ChartType;
  return 'LINE';
}

export function clampRangeDays(days: number): number {
  if (!Number.isFinite(days)) return 30;
  return Math.min(90, Math.max(7, Math.round(days)));
}

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function emptyDayBuckets(end: Date, days: number): ChartPoint[] {
  const points: ChartPoint[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    d.setUTCHours(0, 0, 0, 0);
    points.push({ key: dayKey(d), value: 0 });
  }
  return points;
}

export function fillDayBuckets(end: Date, days: number, timestamps: Date[]): ChartPoint[] {
  const buckets = emptyDayBuckets(end, days);
  const index = new Map(buckets.map((p, i) => [p.key, i]));
  timestamps.forEach((ts) => {
    const key = dayKey(new Date(Date.UTC(ts.getUTCFullYear(), ts.getUTCMonth(), ts.getUTCDate())));
    const i = index.get(key);
    if (i === undefined) return;
    buckets[i] = { key, value: buckets[i].value + 1 };
  });
  return buckets;
}

export function countBy(keys: string[]): ChartPoint[] {
  const map = new Map<string, number>();
  keys.forEach((key) => map.set(key, (map.get(key) ?? 0) + 1));
  return [...map.entries()].map(([key, value]) => ({ key, value }));
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

export function hoursBetween(start: Date, end: Date): number {
  return Math.max(0, (end.getTime() - start.getTime()) / 3_600_000);
}

export function csatBars(ratings: number[]): ChartPoint[] {
  const counts = [1, 2, 3, 4, 5].map((n) => ({ key: String(n), value: 0 }));
  ratings.forEach((r) => {
    if (r >= 1 && r <= 5) counts[r - 1].value += 1;
  });
  return counts;
}

export function buildKpis(input: {
  open: number;
  resolved: number;
  slaBreached: number;
  csatAverage: number;
  unanswered: number;
}): Kpi[] {
  return [
    { id: 'open', label: 'Open', value: input.open },
    { id: 'resolved', label: 'Resolved', value: input.resolved },
    { id: 'sla', label: 'SLA breached', value: input.slaBreached },
    { id: 'csat', label: 'CSAT avg', value: Math.round(input.csatAverage * 10) / 10 },
    { id: 'unanswered', label: 'Unanswered Help', value: input.unanswered },
  ];
}

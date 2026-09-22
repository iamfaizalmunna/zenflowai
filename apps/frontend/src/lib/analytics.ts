export const CHART_TYPES = ['LINE', 'AREA', 'BAR', 'PIE', 'DONUT', 'RADIAL', 'RADAR'] as const;
export type ChartType = (typeof CHART_TYPES)[number];
export type ChartKind = 'time' | 'mix' | 'score';

export const CHART_TYPE_OPTIONS = [
  { value: 'LINE', label: 'Line' },
  { value: 'AREA', label: 'Area' },
  { value: 'BAR', label: 'Bar' },
  { value: 'PIE', label: 'Pie' },
  { value: 'DONUT', label: 'Donut' },
  { value: 'RADIAL', label: 'Radial' },
  { value: 'RADAR', label: 'Radar' },
] as const;

export function parseChartType(raw: string | null | undefined): ChartType {
  if (raw && (CHART_TYPES as readonly string[]).includes(raw)) return raw as ChartType;
  return 'LINE';
}

export function usesPolarChart(type: ChartType): boolean {
  return type === 'PIE' || type === 'DONUT' || type === 'RADIAL';
}

export function optionsForKind(kind: ChartKind): Array<{ value: string; label: string }> {
  if (kind === 'time') {
    return CHART_TYPE_OPTIONS.filter((o) => o.value === 'LINE' || o.value === 'AREA' || o.value === 'BAR');
  }
  if (kind === 'score') {
    return CHART_TYPE_OPTIONS.filter((o) => o.value === 'RADAR' || o.value === 'BAR');
  }
  return CHART_TYPE_OPTIONS.filter((o) => o.value !== 'RADAR');
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

const SHORT_KEYS: Record<string, string> = {
  'Close rate': 'Close',
  'First reply': 'Reply',
  'Resolve time': 'Resolve',
  IN_PROGRESS: 'In progress',
  ON_HOLD: 'On hold',
};

export function prettyChartKey(key: string): string {
  if (SHORT_KEYS[key]) return SHORT_KEYS[key];
  if (ISO_DAY.test(key)) {
    const date = new Date(`${key}T00:00:00Z`);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  }
  if (/^[1-5]$/.test(key)) return `${key} star`;
  return key
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function chartTotal(points: { value: number }[]): number {
  return points.reduce((sum, point) => sum + point.value, 0);
}

export function polarSeries(points: { key: string; value: number }[]): { key: string; value: number }[] {
  return points.filter((point) => point.value > 0);
}

export const CHART_TYPES = ['LINE', 'AREA', 'BAR', 'PIE', 'DONUT', 'RADIAL'] as const;
export type ChartType = (typeof CHART_TYPES)[number];

export const CHART_TYPE_OPTIONS = [
  { value: 'LINE', label: 'Line' },
  { value: 'AREA', label: 'Area' },
  { value: 'BAR', label: 'Bar' },
  { value: 'PIE', label: 'Pie' },
  { value: 'DONUT', label: 'Donut' },
  { value: 'RADIAL', label: 'Radial' },
] as const;

export function parseChartType(raw: string | null | undefined): ChartType {
  if (raw && (CHART_TYPES as readonly string[]).includes(raw)) return raw as ChartType;
  return 'LINE';
}

export function usesPolarChart(type: ChartType): boolean {
  return type === 'PIE' || type === 'DONUT' || type === 'RADIAL';
}

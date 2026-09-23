'use client';

import { useId, type CSSProperties } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartType } from '@/lib/analytics';
import { chartTotal, polarSeries, prettyChartKey, usesPolarChart } from '@/lib/analytics';

export interface PlotPoint {
  key: string;
  value: number;
}

const FILLS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const tooltipStyle: CSSProperties = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 16,
  color: 'hsl(var(--foreground))',
  fontSize: 12,
  padding: '10px 12px',
  boxShadow: '0 18px 40px hsl(var(--foreground) / 0.1)',
};

const tick = { fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontFamily: 'inherit' };

function ChartTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  const heading = prettyChartKey(String(label ?? row.name ?? ''));
  return (
    <div style={tooltipStyle}>
      <p className="text-xs text-muted-foreground">{heading}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums leading-none">{row.value ?? 0}</p>
    </div>
  );
}

function LegendList({ rows }: { rows: Array<{ name: string; value: number }> }) {
  const total = chartTotal(rows);
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
      {rows.map((row, i) => {
        const share = total ? Math.round((row.value / total) * 100) : 0;
        return (
          <li key={row.name} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: FILLS[i % FILLS.length] }} />
            <span>{prettyChartKey(row.name)}</span>
            <span className="tabular-nums font-medium text-foreground">{row.value}</span>
            <span className="tabular-nums text-muted-foreground/80">{share}%</span>
          </li>
        );
      })}
    </ul>
  );
}

export function Infographic({ type, data }: { type: ChartType; data: PlotPoint[] }) {
  const gradientId = useId().replace(/:/g, '');
  const rows = data.map((p) => ({ name: p.key, value: p.value, label: prettyChartKey(p.key) }));
  const slices = polarSeries(data).map((p) => ({ name: p.key, value: p.value }));
  const total = chartTotal(data);
  const tickGap = Math.max(0, Math.ceil(rows.length / 6) - 1);

  if (type === 'RADAR') {
    return (
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={rows} cx="50%" cy="50%" outerRadius="72%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="label" tick={{ ...tick, fontSize: 10 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Index"
              dataKey="value"
              stroke="hsl(var(--iris))"
              fill="hsl(var(--iris))"
              fillOpacity={0.28}
              strokeWidth={2}
            />
            <Tooltip content={<ChartTip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (rows.length === 0 || (usesPolarChart(type) && slices.length === 0) || total === 0) {
    return <p className="text-sm text-muted-foreground py-16 text-center">No data in this range.</p>;
  }

  if (usesPolarChart(type)) {
    return (
      <div className="space-y-4">
        <div className="relative h-44 mx-auto w-full max-w-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'RADIAL' ? (
              <RadialBarChart innerRadius="18%" outerRadius="92%" data={slices} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, Math.max(...slices.map((r) => r.value), 1)]} dataKey="value" tick={false} />
                <RadialBar dataKey="value" background={{ fill: 'hsl(var(--muted))' }} cornerRadius={6}>
                  {slices.map((row, i) => (
                    <Cell key={row.name} fill={FILLS[i % FILLS.length]} />
                  ))}
                </RadialBar>
                <Tooltip content={<ChartTip />} />
              </RadialBarChart>
            ) : (
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={type === 'DONUT' ? 48 : 0}
                  outerRadius={70}
                  paddingAngle={3}
                  stroke="hsl(var(--card))"
                  strokeWidth={3}
                >
                  {slices.map((row, i) => (
                    <Cell key={row.name} fill={FILLS[i % FILLS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTip />} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
        <LegendList rows={slices} />
      </div>
    );
  }

  const cartesian =
    type === 'BAR' ? (
      <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="2 8" />
        <XAxis dataKey="label" interval={tickGap} tick={tick} axisLine={false} tickLine={false} minTickGap={12} />
        <YAxis tick={tick} allowDecimals={false} axisLine={false} tickLine={false} width={28} />
        <Tooltip content={<ChartTip />} cursor={{ fill: 'hsl(var(--muted) / 0.45)' }} />
        <Bar dataKey="value" radius={[8, 8, 4, 4]} maxBarSize={36}>
          {rows.map((row, i) => (
            <Cell
              key={row.name}
              fill={/^\d{4}-\d{2}-\d{2}$/.test(row.name) ? 'hsl(var(--iris))' : FILLS[i % FILLS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    ) : type === 'AREA' ? (
      <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--iris))" stopOpacity={0.38} />
            <stop offset="100%" stopColor="hsl(var(--iris))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="2 8" />
        <XAxis dataKey="label" interval={tickGap} tick={tick} axisLine={false} tickLine={false} minTickGap={12} />
        <YAxis tick={tick} allowDecimals={false} axisLine={false} tickLine={false} width={28} />
        <Tooltip content={<ChartTip />} />
        <Area type="monotone" dataKey="value" stroke="hsl(var(--iris))" strokeWidth={2.4} fill={`url(#${gradientId})`} />
      </AreaChart>
    ) : (
      <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="2 8" />
        <XAxis dataKey="label" interval={tickGap} tick={tick} axisLine={false} tickLine={false} minTickGap={12} />
        <YAxis tick={tick} allowDecimals={false} axisLine={false} tickLine={false} width={28} />
        <Tooltip content={<ChartTip />} />
        <Line type="monotone" dataKey="value" stroke="hsl(var(--iris))" strokeWidth={2.4} dot={rows.length < 18} activeDot={{ r: 5 }} />
      </LineChart>
    );

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        {cartesian}
      </ResponsiveContainer>
    </div>
  );
}

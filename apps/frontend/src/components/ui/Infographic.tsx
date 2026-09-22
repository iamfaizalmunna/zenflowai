'use client';

import type { CSSProperties } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartType } from '@/lib/analytics';
import { usesPolarChart } from '@/lib/analytics';

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
  borderRadius: 14,
  color: 'hsl(var(--foreground))',
  fontSize: 12,
  boxShadow: '0 12px 40px hsl(var(--foreground) / 0.08)',
};

const tick = { fill: 'hsl(var(--muted-foreground))', fontSize: 11 };

export function Infographic({ type, data }: { type: ChartType; data: PlotPoint[] }) {
  const rows = data.map((p) => ({ name: p.key, value: p.value }));
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-10 text-center">No data in this range.</p>;
  }

  if (usesPolarChart(type)) {
    return (
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'RADIAL' ? (
            <RadialBarChart innerRadius="20%" outerRadius="90%" data={rows}>
              <PolarAngleAxis type="number" domain={[0, Math.max(...rows.map((r) => r.value), 1)]} dataKey="value" tick={false} />
              <RadialBar dataKey="value" background>
                {rows.map((_, i) => (
                  <Cell key={rows[i].name} fill={FILLS[i % FILLS.length]} />
                ))}
              </RadialBar>
              <Tooltip contentStyle={tooltipStyle} />
            </RadialBarChart>
          ) : (
            <PieChart>
              <Pie data={rows} dataKey="value" nameKey="name" innerRadius={type === 'DONUT' ? 48 : 0} outerRadius={80} paddingAngle={2}>
                {rows.map((_, i) => (
                  <Cell key={rows[i].name} fill={FILLS[i % FILLS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  }

  const cartesian =
    type === 'BAR' ? (
      <BarChart data={rows}>
        <XAxis dataKey="name" hide={rows.length > 10} tick={tick} axisLine={false} tickLine={false} />
        <YAxis tick={tick} allowDecimals={false} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="value" fill="hsl(var(--iris))" radius={8} isAnimationActive />
      </BarChart>
    ) : type === 'AREA' ? (
      <AreaChart data={rows}>
        <XAxis dataKey="name" hide={rows.length > 10} tick={tick} axisLine={false} tickLine={false} />
        <YAxis tick={tick} allowDecimals={false} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="value" stroke="hsl(var(--iris))" fill="hsl(var(--iris) / 0.22)" isAnimationActive />
      </AreaChart>
    ) : (
      <LineChart data={rows}>
        <XAxis dataKey="name" hide={rows.length > 10} tick={tick} axisLine={false} tickLine={false} />
        <YAxis tick={tick} allowDecimals={false} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="value" stroke="hsl(var(--iris))" strokeWidth={2.25} dot={false} isAnimationActive />
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

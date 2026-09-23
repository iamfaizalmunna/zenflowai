'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import type { PlotPoint } from '@/components/ui/Infographic';
import { Select } from '@/components/ui/Select';
import { chartTotal, optionsForKind, type ChartKind, type ChartType } from '@/lib/analytics';
import { useUiSound } from '@/hooks/useUiSound';

const Infographic = dynamic(
  () => import('@/components/ui/Infographic').then((mod) => mod.Infographic),
  {
    ssr: false,
    loading: () => <div className="h-40 animate-pulse rounded-xl bg-muted/60" aria-hidden />,
  },
);

export function ChartCard({
  title,
  hint,
  data,
  type,
  onType,
  wide,
  kind = 'mix',
  headline,
}: {
  title: string;
  hint?: string;
  data: PlotPoint[];
  type: ChartType;
  onType: (type: ChartType) => void;
  wide?: boolean;
  kind?: ChartKind;
  headline?: string | number;
}) {
  const { play } = useUiSound();
  const total = headline ?? chartTotal(data);
  const options = optionsForKind(kind);
  return (
    <motion.section
      layout
      className={`dash-card p-4 space-y-3 ${wide ? 'app:col-span-2' : ''}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
            <span className="text-sm font-semibold tabular-nums text-muted-foreground">{total}</span>
          </div>
          {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {options.length > 1 && (
          <Select
            aria-label={`${title} chart type`}
            value={type}
            onValueChange={(value) => {
              void play('chart');
              onType(value as ChartType);
            }}
            className="w-[6.75rem] min-h-9 rounded-lg text-xs px-2.5"
            options={options}
          />
        )}
      </div>
      <Infographic type={type} data={data} />
    </motion.section>
  );
}

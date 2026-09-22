'use client';

import { motion } from 'framer-motion';
import { Infographic, type PlotPoint } from '@/components/ui/Infographic';
import { Select } from '@/components/ui/Select';
import { CHART_TYPE_OPTIONS, type ChartType } from '@/lib/analytics';
import { useUiSound } from '@/hooks/useUiSound';

export function ChartCard({
  title,
  data,
  type,
  onType,
}: {
  title: string;
  data: PlotPoint[];
  type: ChartType;
  onType: (type: ChartType) => void;
}) {
  const { play } = useUiSound();
  return (
    <motion.section
      layout
      className="surface rounded-3xl border border-border/70 p-4 space-y-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between gap-3 min-h-10">
        <h2 className="font-display text-[1.05rem] text-foreground">{title}</h2>
        <Select
          aria-label={`${title} chart type`}
          value={type}
          onValueChange={(value) => {
            void play('chart');
            onType(value as ChartType);
          }}
          className="w-32 min-h-10"
          options={[...CHART_TYPE_OPTIONS]}
        />
      </div>
      <Infographic type={type} data={data} />
    </motion.section>
  );
}

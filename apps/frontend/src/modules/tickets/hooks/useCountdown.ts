'use client';

import { useEffect, useState } from 'react';
import { formatCountdown, remainingMs } from '@/lib/countdown';

export function useCountdown(due?: string | Date | null) {
  const [label, setLabel] = useState('');
  const [overdue, setOverdue] = useState(false);

  useEffect(() => {
    if (!due) {
      setLabel('');
      setOverdue(false);
      return;
    }
    const tick = () => {
      const ms = remainingMs(due);
      setOverdue(ms <= 0);
      setLabel(formatCountdown(ms));
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [due]);

  return { label, overdue };
}

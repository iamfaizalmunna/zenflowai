import cron from 'node-cron';
import { runSlaSweep } from '../services/slaCron.service';

export function startSlaCron(): void {
  if (process.env.DISABLE_CRON === '1') return;
  const expr = process.env.SLA_CHECK_INTERVAL_CRON || '*/2 * * * *';
  cron.schedule(expr, () => {
    runSlaSweep().catch((err: unknown) => {
      console.error('[sla-cron]', err);
    });
  });
}

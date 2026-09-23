import { apolloClient } from '@/lib/apollo-client';
import { ROUTE_PREFETCH } from '@/lib/prefetchMap';

export function prefetchAppRoute(href: string): void {
  const jobs = ROUTE_PREFETCH[href];
  if (!jobs) return;
  for (const job of jobs) {
    void apolloClient.query({ query: job.query, variables: job.variables, fetchPolicy: 'cache-first' }).catch(() => undefined);
  }
}

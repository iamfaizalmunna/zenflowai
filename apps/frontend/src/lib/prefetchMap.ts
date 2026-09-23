import type { DocumentNode } from '@apollo/client';
import {
  ADMIN_ARTICLES,
  ADMIN_USERS,
  ROUTING_RULES,
  SLA_POLICIES,
  TEAMS,
} from '@/modules/admin/queries/admin.queries';
import {
  ANALYTICS,
  AUDIT_LOGS,
  BLOCKED_IPS,
  CONSULTANTS,
  CUSTOMER_FEEDBACK,
  LEADERBOARD,
  SPAM_REPORTS,
} from '@/modules/analytics/queries/analytics.queries';

export const ROUTE_PREFETCH: Record<string, Array<{ query: DocumentNode; variables?: Record<string, unknown> }>> = {
  '/analytics': [
    { query: ANALYTICS, variables: { rangeDays: 30 } },
    { query: LEADERBOARD },
    { query: CUSTOMER_FEEDBACK },
  ],
  '/admin/sla': [{ query: SLA_POLICIES }],
  '/admin/routing': [{ query: ROUTING_RULES }],
  '/admin/teams': [{ query: TEAMS }],
  '/admin/consultants': [{ query: CONSULTANTS }, { query: LEADERBOARD }],
  '/admin/users': [{ query: ADMIN_USERS }],
  '/admin/knowledge': [{ query: ADMIN_ARTICLES }],
  '/admin/security': [{ query: AUDIT_LOGS }, { query: BLOCKED_IPS }, { query: SPAM_REPORTS }],
};

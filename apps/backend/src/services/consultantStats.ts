export interface ConsultantTicketInput {
  assignedToId: number | null;
  status: string;
  createdAt: Date;
  firstRespondedAt: Date | null;
  resolvedAt: Date | null;
  csatRating: number | null;
}

export interface ConsultantStats {
  openCount: number;
  resolvedCount: number;
  closedCount: number;
  csatAverage: number;
  csatCount: number;
  avgFirstResponseHours: number;
  avgResolveHours: number;
}

export function consultantStats(tickets: ConsultantTicketInput[], userId: number): ConsultantStats {
  const mine = tickets.filter((t) => t.assignedToId === userId);
  const open = mine.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status));
  const resolved = mine.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');
  const closed = mine.filter((t) => t.status === 'CLOSED');
  const ratings = mine.map((t) => t.csatRating).filter((n): n is number => n !== null);
  const firstHours = mine
    .filter((t) => t.firstRespondedAt)
    .map((t) => (t.firstRespondedAt!.getTime() - t.createdAt.getTime()) / 3_600_000);
  const resolveHours = resolved
    .filter((t) => t.resolvedAt)
    .map((t) => (t.resolvedAt!.getTime() - t.createdAt.getTime()) / 3_600_000);
  const avg = (values: number[]) => (values.length ? values.reduce((s, n) => s + n, 0) / values.length : 0);
  return {
    openCount: open.length,
    resolvedCount: resolved.length,
    closedCount: closed.length,
    csatAverage: Math.round(avg(ratings) * 10) / 10,
    csatCount: ratings.length,
    avgFirstResponseHours: Math.round(avg(firstHours) * 10) / 10,
    avgResolveHours: Math.round(avg(resolveHours) * 10) / 10,
  };
}

export const CONSULTANT_ROLES = ['AGENT', 'SUPERVISOR'] as const;

export function isConsultantRole(role: string): boolean {
  return (CONSULTANT_ROLES as readonly string[]).includes(role);
}

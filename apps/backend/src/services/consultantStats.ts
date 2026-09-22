export interface ConsultantTicketInput {
  assignedToId: number | null;
  status: string;
  createdAt: Date;
  firstRespondedAt: Date | null;
  resolvedAt: Date | null;
  csatRating: number | null;
  slaResponseBreached?: boolean;
  slaResolutionBreached?: boolean;
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

export interface AssessmentAxis {
  key: string;
  value: number;
}

export interface ConsultantAssessment {
  index: number;
  axes: AssessmentAxis[];
  gaps: string[];
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function avg(values: number[]): number {
  return values.length ? values.reduce((s, n) => s + n, 0) / values.length : 0;
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

export function consultantAssessment(tickets: ConsultantTicketInput[], userId: number): ConsultantAssessment {
  const mine = tickets.filter((t) => t.assignedToId === userId);
  const stats = consultantStats(tickets, userId);
  const total = mine.length;
  const breached = mine.filter((t) => t.slaResponseBreached || t.slaResolutionBreached).length;
  const closeRate = total ? (stats.resolvedCount / total) * 100 : 0;
  const csat = stats.csatCount ? (stats.csatAverage / 5) * 100 : 35;
  const reply = stats.avgFirstResponseHours <= 0 && stats.csatCount === 0 && stats.resolvedCount === 0
    ? 40
    : clampScore(100 - (stats.avgFirstResponseHours / 4) * 50);
  const resolve = stats.resolvedCount === 0 ? 40 : clampScore(100 - (stats.avgResolveHours / 24) * 50);
  const sla = total ? ((total - breached) / total) * 100 : 40;
  const load = total ? 100 - (stats.openCount / total) * 100 : 40;
  const axes: AssessmentAxis[] = [
    { key: 'Close rate', value: clampScore(closeRate) },
    { key: 'CSAT', value: clampScore(csat) },
    { key: 'First reply', value: reply },
    { key: 'Resolve time', value: resolve },
    { key: 'SLA', value: clampScore(sla) },
    { key: 'Backlog', value: clampScore(load) },
  ];
  const index = clampScore(avg(axes.map((a) => a.value)));
  const gapCopy: Record<string, string> = {
    'Close rate': 'Too few tickets reach resolved or closed.',
    CSAT: 'Customer scores are below a healthy 4.0.',
    'First reply': 'First response is slower than the 4h target.',
    'Resolve time': 'Time-to-resolve is slower than 24h.',
    SLA: 'SLA breaches are eating the assessment index.',
    Backlog: 'Open load is high versus completed work.',
  };
  const gaps = axes.filter((axis) => axis.value < 65).map((axis) => gapCopy[axis.key] ?? axis.key);
  return { index, axes, gaps };
}

export const CONSULTANT_ROLES = ['AGENT', 'SUPERVISOR'] as const;

export function isConsultantRole(role: string): boolean {
  return (CONSULTANT_ROLES as readonly string[]).includes(role);
}

export interface LeaderboardInput {
  id: number;
  name: string;
  resolvedCount: number;
  csatAverage: number;
  assessmentIndex: number;
  detractors: number;
}

export function rankLeaderboard<T extends LeaderboardInput>(rows: T[]): Array<T & { rank: number }> {
  const sorted = [...rows].sort((a, b) => {
    if (b.resolvedCount !== a.resolvedCount) return b.resolvedCount - a.resolvedCount;
    if (b.csatAverage !== a.csatAverage) return b.csatAverage - a.csatAverage;
    if (b.assessmentIndex !== a.assessmentIndex) return b.assessmentIndex - a.assessmentIndex;
    if (a.detractors !== b.detractors) return a.detractors - b.detractors;
    return a.name.localeCompare(b.name);
  });
  return sorted.map((row, i) => ({ ...row, rank: i + 1 }));
}

import { gql } from 'graphql-tag';

export const analyticsTypeDefs = gql`
  type Kpi {
    id: String!
    label: String!
    value: Float!
  }

  type ChartPoint {
    key: String!
    value: Float!
  }

  type AnalyticsSnapshot {
    kpis: [Kpi!]!
    volume: [ChartPoint!]!
    byStatus: [ChartPoint!]!
    byPriority: [ChartPoint!]!
    byCategory: [ChartPoint!]!
    csatTrend: [ChartPoint!]!
    sla: [ChartPoint!]!
  }

  type ConsultantSummary {
    id: Int!
    name: String!
    email: String!
    role: Role!
    lastLoginAt: DateTime
    teams: [String!]!
    openCount: Int!
    resolvedCount: Int!
    closedCount: Int!
    csatAverage: Float!
    csatCount: Int!
  }

  type ConsultantTicket {
    id: Int!
    ticketNumber: String!
    title: String!
    status: TicketStatus!
    csatRating: Int
    resolvedAt: DateTime
  }

  type ConsultantProfile {
    id: Int!
    name: String!
    email: String!
    role: Role!
    lastLoginAt: DateTime
    teams: [String!]!
    openCount: Int!
    resolvedCount: Int!
    closedCount: Int!
    csatAverage: Float!
    csatCount: Int!
    avgFirstResponseHours: Float!
    avgResolveHours: Float!
    resolvedWeekly: [ChartPoint!]!
    byStatus: [ChartPoint!]!
    csatBars: [ChartPoint!]!
    completed: [ConsultantTicket!]!
  }

  type AuditLogRow {
    id: Int!
    action: String!
    category: String!
    severity: String!
    message: String!
    createdAt: DateTime!
  }

  type AuditLogPage {
    rows: [AuditLogRow!]!
    total: Int!
    page: Int!
    pageSize: Int!
  }

  type BlockedIpRow {
    id: Int!
    ip: String!
    reason: String!
    createdAt: DateTime!
  }

  type SpamReportRow {
    id: Int!
    targetType: String!
    targetId: Int!
    reason: String!
    status: String!
    aiScore: Float!
    createdAt: DateTime!
  }

  extend type Query {
    analytics(rangeDays: Int): AnalyticsSnapshot!
    consultants: [ConsultantSummary!]!
    consultantProfile(id: Int!): ConsultantProfile!
    auditLogs(page: Int, pageSize: Int): AuditLogPage!
    blockedIps: [BlockedIpRow!]!
    spamReports: [SpamReportRow!]!
  }

  extend type Mutation {
    blockIpAddress(ip: String!, reason: String!): BlockedIpRow!
    unblockIpAddress(id: Int!): BlockedIpRow!
    reviewSpam(id: Int!, status: String!, note: String): SpamReportRow!
  }
`;

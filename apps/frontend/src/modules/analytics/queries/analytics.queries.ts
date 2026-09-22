import { gql } from '@apollo/client';

export const ANALYTICS = gql`
  query Analytics($rangeDays: Int) {
    analytics(rangeDays: $rangeDays) {
      kpis { id label value }
      volume { key value }
      byStatus { key value }
      byPriority { key value }
      byCategory { key value }
      csatTrend { key value }
      sla { key value }
    }
  }
`;

export const CONSULTANTS = gql`
  query Consultants {
    consultants {
      id name email role lastLoginAt teams
      openCount resolvedCount closedCount csatAverage csatCount
    }
  }
`;

export const CONSULTANT_PROFILE = gql`
  query ConsultantProfile($id: Int!) {
    consultantProfile(id: $id) {
      id name email role lastLoginAt teams
      openCount resolvedCount closedCount csatAverage csatCount
      avgFirstResponseHours avgResolveHours
      resolvedWeekly { key value }
      byStatus { key value }
      csatBars { key value }
      completed { id ticketNumber title status csatRating resolvedAt }
    }
  }
`;

export const AUDIT_LOGS = gql`
  query AuditLogs {
    auditLogs(page: 1, pageSize: 30) {
      total
      rows { id action category severity message createdAt }
    }
  }
`;

export const BLOCKED_IPS = gql`
  query BlockedIps {
    blockedIps { id ip reason createdAt }
  }
`;

export const SPAM_REPORTS = gql`
  query SpamReports {
    spamReports { id targetType targetId reason status aiScore createdAt }
  }
`;

export const BLOCK_IP = gql`
  mutation BlockIpAddress($ip: String!, $reason: String!) {
    blockIpAddress(ip: $ip, reason: $reason) { id ip }
  }
`;

export const UNBLOCK_IP = gql`
  mutation UnblockIpAddress($id: Int!) {
    unblockIpAddress(id: $id) { id ip }
  }
`;

export const REVIEW_SPAM = gql`
  mutation ReviewSpam($id: Int!, $status: String!, $note: String) {
    reviewSpam(id: $id, status: $status, note: $note) { id status }
  }
`;

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
      openCount resolvedCount closedCount csatAverage csatCount assessmentIndex isAiConsultant
    }
  }
`;

export const CONSULTANT_PROFILE = gql`
  query ConsultantProfile($id: Int!) {
    consultantProfile(id: $id) {
      id name email role lastLoginAt teams isAiConsultant
      openCount resolvedCount closedCount csatAverage csatCount
      avgFirstResponseHours avgResolveHours
      assessmentIndex assessment { key value } gaps
      resolvedWeekly { key value }
      createdWeekly { key value }
      byStatus { key value }
      byCategory { key value }
      csatBars { key value }
      sla { key value }
      completed { id ticketNumber title status csatRating csatComment resolvedAt }
    }
  }
`;

export const LEADERBOARD = gql`
  query ConsultantLeaderboard {
    consultantLeaderboard {
      id rank name teams resolvedCount closedCount csatAverage csatCount detractors promoters assessmentIndex
    }
  }
`;

export const CUSTOMER_FEEDBACK = gql`
  query CustomerFeedback {
    customerFeedback {
      id ticketId ticketNumber title status rating comment consultantName submittedAt
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

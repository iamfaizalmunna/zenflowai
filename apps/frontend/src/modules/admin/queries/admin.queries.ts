import { gql } from '@apollo/client';

export const ADMIN_USERS = gql`
  query AdminUsers {
    users { id email name role isActive isBanned }
  }
`;

export const SET_USER_ACTIVE = gql`
  mutation SetUserActive($id: Int!, $isActive: Boolean!) {
    setUserActive(id: $id, isActive: $isActive) { id isActive }
  }
`;

export const BAN_USER = gql`
  mutation BanUser($id: Int!, $reason: String!) {
    banUser(id: $id, reason: $reason) { id isBanned }
  }
`;

export const UNBAN_USER = gql`
  mutation UnbanUser($id: Int!) {
    unbanUser(id: $id) { id isBanned }
  }
`;

export const CHANGE_ROLE = gql`
  mutation ChangeUserRole($id: Int!, $role: Role!) {
    changeUserRole(id: $id, role: $role) { id role }
  }
`;

export const TEAMS = gql`
  query Teams {
    teams {
      id name description isDefault
      members { userId isLead user { id name role } }
    }
  }
`;

export const SAVE_TEAM = gql`
  mutation SaveTeam($id: Int, $input: TeamInput!) {
    saveTeam(id: $id, input: $input) { id name isDefault }
  }
`;

export const ROUTING_RULES = gql`
  query RoutingRules {
    routingRules {
      id type keyword categoryId priority targetTeamId order isActive
      targetTeam { id name }
      category { id name }
    }
    teams { id name }
    categories { id name }
  }
`;

export const SAVE_ROUTING = gql`
  mutation SaveRoutingRule($id: Int, $input: RoutingRuleInput!) {
    saveRoutingRule(id: $id, input: $input) { id isActive }
  }
`;

export const SLA_POLICIES = gql`
  query SlaPolicies {
    slaPolicies { id priority responseTimeHours resolutionTimeHours isActive }
  }
`;

export const UPDATE_SLA = gql`
  mutation UpdateSlaPolicy($priority: TicketPriority!, $responseTimeHours: Float!, $resolutionTimeHours: Float!) {
    updateSlaPolicy(priority: $priority, responseTimeHours: $responseTimeHours, resolutionTimeHours: $resolutionTimeHours) {
      id priority responseTimeHours resolutionTimeHours
    }
  }
`;

export const ADMIN_ARTICLES = gql`
  query AdminArticles {
    adminArticles { id title visibility isPublished updatedAt category { name } }
  }
`;

export const SAVE_ARTICLE = gql`
  mutation SaveArticle($id: Int, $input: SaveArticleInput!) {
    saveArticle(id: $id, input: $input) { id title isPublished }
  }
`;

export const PUBLISH_ARTICLE = gql`
  mutation SetArticlePublished($id: Int!, $isPublished: Boolean!) {
    setArticlePublished(id: $id, isPublished: $isPublished) { id isPublished }
  }
`;

export const PENDING_CSATS = gql`
  query PendingCsats {
    pendingCsats { id expiresAt ticket { id ticketNumber title } }
  }
`;

export const SUBMIT_CSAT = gql`
  mutation SubmitCsat($id: Int!, $rating: Int!, $comment: String) {
    submitCsat(id: $id, rating: $rating, comment: $comment) { id status rating }
  }
`;

export const CSAT_SUMMARY = gql`
  query CsatSummary {
    csatSummary { pending submitted averageRating }
  }
`;

export const ASK_KB = gql`
  query AskKnowledgeBase($question: String!) {
    askKnowledgeBase(question: $question) {
      answer
      confidence
      engine
      citations { id title }
    }
  }
`;

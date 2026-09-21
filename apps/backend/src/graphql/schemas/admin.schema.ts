import { gql } from 'graphql-tag';

export const adminTypeDefs = gql`
  enum RoutingRuleType {
    CATEGORY
    KEYWORD
    PRIORITY
    FALLBACK
  }

  type TeamMemberUser {
    id: Int!
    name: String!
    role: Role
  }

  type TeamMember {
    userId: Int!
    isLead: Boolean!
    user: TeamMemberUser!
  }

  type Team {
    id: Int!
    name: String!
    description: String
    isDefault: Boolean!
    members: [TeamMember!]
  }

  type RoutingRule {
    id: Int!
    type: RoutingRuleType!
    keyword: String
    categoryId: Int
    priority: TicketPriority
    targetTeamId: Int!
    order: Int!
    isActive: Boolean!
    targetTeam: Team
    category: Category
  }

  type SlaPolicy {
    id: Int!
    priority: TicketPriority!
    responseTimeHours: Float!
    resolutionTimeHours: Float!
    isActive: Boolean!
  }

  input TeamInput {
    name: String!
    description: String
    isDefault: Boolean
  }

  input SaveArticleInput {
    title: String!
    body: String!
    visibility: ArticleVisibility
    categoryId: Int
    isPublished: Boolean
  }

  input RoutingRuleInput {
    type: RoutingRuleType!
    keyword: String
    categoryId: Int
    priority: TicketPriority
    targetTeamId: Int!
    order: Int
    isActive: Boolean
  }

  extend type Query {
    teams: [Team!]!
    routingRules: [RoutingRule!]!
    slaPolicies: [SlaPolicy!]!
    adminArticles: [KnowledgeArticle!]!
  }

  extend type Mutation {
    saveTeam(id: Int, input: TeamInput!): Team!
    saveRoutingRule(id: Int, input: RoutingRuleInput!): RoutingRule!
    updateSlaPolicy(priority: TicketPriority!, responseTimeHours: Float!, resolutionTimeHours: Float!): SlaPolicy!
    setUserActive(id: Int!, isActive: Boolean!): User!
    saveArticle(id: Int, input: SaveArticleInput!): KnowledgeArticle!
    setArticlePublished(id: Int!, isPublished: Boolean!): KnowledgeArticle!
  }
`;

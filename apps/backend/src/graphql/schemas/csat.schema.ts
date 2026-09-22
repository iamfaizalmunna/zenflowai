import { gql } from 'graphql-tag';

export const csatTypeDefs = gql`
  enum CsatStatus {
    PENDING
    SUBMITTED
    EXPIRED
  }

  type CsatTicket {
    id: Int!
    ticketNumber: String!
    title: String!
  }

  type CsatSurvey {
    id: Int!
    rating: Int
    comment: String
    status: CsatStatus!
    expiresAt: DateTime!
    ticket: CsatTicket!
  }

  type CsatSummary {
    pending: Int!
    submitted: Int!
    averageRating: Float!
  }

  type KbAnswer {
    answer: String!
    confidence: Float!
    engine: String
    citations: [KbCitation!]!
  }

  type KbCitation {
    id: Int!
    title: String!
  }

  extend type Query {
    pendingCsats: [CsatSurvey!]!
    csatSummary: CsatSummary!
    askKnowledgeBase(question: String!): KbAnswer!
  }

  extend type Mutation {
    submitCsat(id: Int!, rating: Int!, comment: String): CsatSurvey!
  }
`;

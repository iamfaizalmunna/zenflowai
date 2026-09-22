import { gql } from 'graphql-tag';

export const notificationTypeDefs = gql`
  type AppNotice {
    id: Int!
    type: String!
    title: String!
    body: String!
    ticketId: Int
    isRead: Boolean!
    createdAt: DateTime!
  }

  extend type Query {
    myNotifications: [AppNotice!]!
  }

  extend type Mutation {
    markNotificationRead(id: Int!): Boolean!
  }
`;

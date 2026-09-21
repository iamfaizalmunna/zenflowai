import { gql } from 'graphql-tag';

export const userTypeDefs = gql`
  enum Role {
    CUSTOMER
    AGENT
    SUPERVISOR
    ADMIN
    SUPER_ADMIN
  }

  type User {
    id: Int!
    email: String!
    name: String!
    role: Role!
    isActive: Boolean!
    isBanned: Boolean!
    emailVerified: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  extend type Query {
    users(role: Role): [User!]!
    user(id: Int!): User
  }

  extend type Mutation {
    updateMe(name: String, email: String): User!
    banUser(id: Int!, reason: String!): User!
    unbanUser(id: Int!): User!
    changeUserRole(id: Int!, role: Role!): User!
  }
`;

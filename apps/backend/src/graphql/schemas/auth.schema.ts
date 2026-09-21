import { gql } from 'graphql-tag';

export const authTypeDefs = gql`
  type AuthPayload {
    accessToken: String!
    user: User!
  }

  type RefreshPayload {
    accessToken: String!
    user: User!
  }

  extend type Query {
    me: User
  }

  extend type Mutation {
    login(email: String!, password: String!): AuthPayload!
    register(email: String!, name: String!, password: String!): AuthPayload!
    refreshToken(refreshToken: String!): RefreshPayload!
    logout: Boolean!
  }
`;

import { gql } from 'graphql-tag';

// Base schema — scalars and root types that all other schemas extend
export const baseTypeDefs = gql`
  scalar DateTime
  scalar JSON

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }

  type Subscription {
    _empty: String
  }
`;

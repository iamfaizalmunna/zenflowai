import { DateTimeResolver, JSONResolver } from 'graphql-scalars';
import { authResolvers } from './auth.resolver';
import { userResolvers } from './user.resolver';

export const resolvers = {
  DateTime: DateTimeResolver,
  JSON: JSONResolver,

  Query: {
    ...authResolvers.Query,
    ...userResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
  },
};

import { DateTimeResolver, JSONResolver } from 'graphql-scalars';
import { ticketResolvers } from './ticket.resolver';
import { userResolvers } from './user.resolver';
import { commentResolvers } from './comment.resolver';
import { superPowerResolvers } from './superpower.resolver';

export const resolvers = {
  DateTime: DateTimeResolver,
  JSON: JSONResolver,

  Query: {
    ...userResolvers.Query,
    ...ticketResolvers.Query,
    ...commentResolvers.Query,
    ...superPowerResolvers.Query,
  },

  Mutation: {
    ...userResolvers.Mutation,
    ...ticketResolvers.Mutation,
    ...commentResolvers.Mutation,
    ...superPowerResolvers.Mutation,
  },

  // Type resolvers for nested fields
  Ticket: ticketResolvers.Ticket,
  User: userResolvers.User,
  Comment: commentResolvers.Comment,
};

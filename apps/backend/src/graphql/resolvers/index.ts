import { DateTimeResolver, JSONResolver } from 'graphql-scalars';
import { authResolvers } from './auth.resolver';
import { userResolvers } from './user.resolver';
import { ticketResolvers } from './ticket.resolver';
import { knowledgeResolvers } from './knowledge.resolver';
import { subscriptionResolvers } from './subscription.resolver';
import { adminResolvers } from './admin.resolver';
import { csatResolvers } from './csat.resolver';
import { appearanceResolvers } from './appearance.resolver';
import { analyticsResolvers } from './analytics.resolver';
import { notificationResolvers } from './notification.resolver';

export const resolvers = {
  DateTime: DateTimeResolver,
  JSON: JSONResolver,

  Query: {
    ...authResolvers.Query,
    ...userResolvers.Query,
    ...ticketResolvers.Query,
    ...knowledgeResolvers.Query,
    ...adminResolvers.Query,
    ...csatResolvers.Query,
    ...appearanceResolvers.Query,
    ...analyticsResolvers.Query,
    ...notificationResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
    ...ticketResolvers.Mutation,
    ...adminResolvers.Mutation,
    ...csatResolvers.Mutation,
    ...appearanceResolvers.Mutation,
    ...analyticsResolvers.Mutation,
    ...notificationResolvers.Mutation,
  },

  Subscription: {
    ...subscriptionResolvers.Subscription,
  },

  Ticket: {
    ...ticketResolvers.Ticket,
  },
};

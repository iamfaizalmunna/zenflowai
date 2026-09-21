import { withFilter } from 'graphql-subscriptions';
import { Context } from '../../types/context';
import { getTicket } from '../../services/ticket.service';
import { pubsub, messageAddedTopic, ticketUpdatedTopic, TICKET_CREATED_TOPIC } from '../../utils/pubsub';

const STAFF = new Set(['AGENT', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN']);

export const subscriptionResolvers = {
  Subscription: {
    messageAdded: {
      subscribe: withFilter(
        (_: unknown, { ticketId }: { ticketId: number }) =>
          pubsub.asyncIterableIterator(messageAddedTopic(ticketId)),
        async (payload: { messageAdded: { type: string } } | undefined, args: { ticketId: number }, ctx: Context) => {
          if (!ctx.userId || !payload) return false;
          try {
            await getTicket(ctx, args.ticketId);
          } catch {
            return false;
          }
          if (payload.messageAdded.type === 'INTERNAL_NOTE' && !STAFF.has(ctx.role ?? '')) {
            return false;
          }
          return true;
        }
      ),
    },
    ticketUpdated: {
      subscribe: withFilter(
        (_: unknown, { ticketId }: { ticketId: number }) =>
          pubsub.asyncIterableIterator(ticketUpdatedTopic(ticketId)),
        async (_payload: unknown, args: { ticketId: number }, ctx: Context) => {
          if (!ctx.userId) return false;
          try {
            await getTicket(ctx, args.ticketId);
            return true;
          } catch {
            return false;
          }
        }
      ),
    },
    ticketCreated: {
      subscribe: withFilter(
        () => pubsub.asyncIterableIterator(TICKET_CREATED_TOPIC),
        (_payload: unknown, _args: unknown, ctx: Context) => STAFF.has(ctx.role ?? '')
      ),
    },
  },
};

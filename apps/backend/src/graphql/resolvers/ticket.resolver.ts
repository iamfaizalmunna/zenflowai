import { GraphQLError } from 'graphql';
import { ZodError } from 'zod';
import { Context } from '../../types/context';
import { requirePermission } from '../../security/rbac';
import {
  createTicket,
  getTicket,
  listCategories,
  listTickets,
  ticketCounts,
  updateTicket,
} from '../../services/ticket.service';
import { addMessage } from '../../services/message.service';

function mapZod(err: unknown): never {
  if (err instanceof ZodError) {
    throw new GraphQLError(err.issues[0]?.message ?? 'Invalid input', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
  throw err;
}

export const ticketResolvers = {
  Query: {
    tickets: async (
      _: unknown,
      args: { filter?: { status?: string; priority?: string; search?: string }; page?: number; pageSize?: number },
      ctx: Context
    ) => listTickets(ctx, args.filter as never, args.page ?? 1, args.pageSize ?? 20),

    ticket: async (_: unknown, { id }: { id: number }, ctx: Context) => getTicket(ctx, id),

    ticketCounts: async (_: unknown, __: unknown, ctx: Context) => ticketCounts(ctx),

    categories: async (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return listCategories();
    },
  },

  Mutation: {
    createTicket: async (_: unknown, { input }: { input: unknown }, ctx: Context) => {
      requirePermission(ctx.role, 'ticket:create', ctx.permissionOverrides);
      try {
        return await createTicket(ctx, input);
      } catch (err) {
        return mapZod(err);
      }
    },

    updateTicket: async (
      _: unknown,
      { id, input }: { id: number; input: { status?: string; priority?: string; assignedToId?: number } },
      ctx: Context
    ) => {
      requirePermission(ctx.role, 'ticket:update:assigned', ctx.permissionOverrides);
      return updateTicket(ctx, id, input as never);
    },

    addMessage: async (_: unknown, { input }: { input: unknown }, ctx: Context) => {
      requirePermission(ctx.role, 'message:create', ctx.permissionOverrides);
      try {
        return await addMessage(ctx, input);
      } catch (err) {
        return mapZod(err);
      }
    },
  },
};

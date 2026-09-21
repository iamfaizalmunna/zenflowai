import { ZodError } from 'zod';
import { GraphQLError } from 'graphql';
import { Context } from '../../types/context';
import { requirePermission } from '../../security/rbac';
import { getMyAppearance, saveAppearance } from '../../services/appearance.service';

function mapZod(err: unknown): never {
  if (err instanceof ZodError) {
    throw new GraphQLError(err.issues[0]?.message ?? 'Invalid input', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
  throw err;
}

export const appearanceResolvers = {
  Query: {
    myAppearance: async (_: unknown, __: unknown, ctx: Context) => {
      requirePermission(ctx.role, 'appearance:read:own', ctx.permissionOverrides);
      return getMyAppearance(ctx);
    },
  },
  Mutation: {
    saveAppearance: async (_: unknown, { input }: { input: unknown }, ctx: Context) => {
      requirePermission(ctx.role, 'appearance:update:own', ctx.permissionOverrides);
      try {
        return await saveAppearance(ctx, input);
      } catch (err) {
        return mapZod(err);
      }
    },
  },
};

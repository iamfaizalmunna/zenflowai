import { GraphQLError } from 'graphql';
import { Context } from '../../types/context';
import { loginUser, registerUser, refreshAccessToken, logoutUser, getMe } from '../../services/auth.service';

export const authResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.userId) return null;
      return getMe(ctx.userId);
    },
  },

  Mutation: {
    login: async (
      _: unknown,
      { email, password }: { email: string; password: string },
      ctx: Context
    ) => {
      const { tokens, user } = await loginUser(
        email.toLowerCase().trim(),
        password,
        ctx.ip ?? 'unknown',
        ctx.userAgent
      );
      // Note: refreshToken should be set as HTTP-only cookie in production.
      // For now it's returned in payload for dev convenience.
      // In Phase 3 we'll move refresh token to cookie via Express middleware.
      return { accessToken: tokens.accessToken, user };
    },

    register: async (
      _: unknown,
      { email, name, password }: { email: string; name: string; password: string },
      ctx: Context
    ) => {
      const { tokens, user } = await registerUser(
        email,
        name,
        password,
        ctx.ip ?? 'unknown',
        ctx.userAgent
      );
      return { accessToken: tokens.accessToken, user };
    },

    refreshToken: async (
      _: unknown,
      { refreshToken }: { refreshToken: string },
      ctx: Context
    ) => {
      return refreshAccessToken(refreshToken, ctx.ip ?? 'unknown');
    },

    logout: async (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.userId) return true;
      await logoutUser(ctx.userId);
      return true;
    },
  },
};

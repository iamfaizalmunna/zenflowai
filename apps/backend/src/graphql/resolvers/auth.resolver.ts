import { GraphQLError } from 'graphql';
import { Context } from '../../types/context';
import { loginUser, registerUser, refreshAccessToken, logoutUser, getMe } from '../../services/auth.service';
import { clearRefreshCookie, setRefreshCookie } from '../../utils/refreshCookie';

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
      setRefreshCookie(ctx.res, tokens.refreshToken);
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
      setRefreshCookie(ctx.res, tokens.refreshToken);
      return { accessToken: tokens.accessToken, user };
    },

    refreshToken: async (
      _: unknown,
      { refreshToken }: { refreshToken?: string | null },
      ctx: Context
    ) => {
      const token = refreshToken || ctx.refreshCookie;
      if (!token) {
        throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      }
      return refreshAccessToken(token, ctx.ip ?? 'unknown');
    },

    logout: async (_: unknown, __: unknown, ctx: Context) => {
      if (ctx.userId) await logoutUser(ctx.userId, ctx.refreshCookie ?? undefined);
      clearRefreshCookie(ctx.res);
      return true;
    },
  },
};

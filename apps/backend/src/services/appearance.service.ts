import { z } from 'zod';
import { GraphQLError } from 'graphql';
import { prisma } from '../utils/prisma';
import { audit } from '../security/audit';
import { Context } from '../types/context';
import {
  DEFAULT_APPEARANCE,
  isReadableAccent,
  mergeAppearance,
  normalizeHex,
  type AppearancePrefs,
} from './appearanceTokens';

const inputSchema = z.object({
  colorMode: z.enum(['SYSTEM', 'LIGHT', 'DARK']).optional(),
  accentHex: z.string().optional(),
  shade: z.number().int().min(-24).max(24).optional(),
  finish: z.enum(['MATTE', 'GLOSSY', 'GLASS']).optional(),
  fontFamily: z.enum(['OUTFIT', 'FRAUNCES', 'SYSTEM', 'SERIF', 'MONO']).optional(),
  fontSize: z.enum(['S', 'M', 'L']).optional(),
  density: z.enum(['COMFORTABLE', 'COMPACT']).optional(),
  ticketView: z.enum(['LIST', 'COMPACT', 'CARD', 'ICON']).optional(),
  ticketSort: z.enum(['UPDATED', 'CREATED', 'SLA', 'PRIORITY']).optional(),
  soundsMuted: z.boolean().optional(),
  logoDataUrl: z.string().max(180000).nullable().optional(),
});

function requireUser(ctx: Context): number {
  if (!ctx.userId) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  return ctx.userId;
}

function toPrefs(row: Partial<AppearancePrefs> | null): AppearancePrefs {
  return mergeAppearance(row);
}

export async function getMyAppearance(ctx: Context): Promise<AppearancePrefs> {
  const userId = requireUser(ctx);
  const row = await prisma.uiPreference.findUnique({ where: { userId } });
  return toPrefs(row);
}

export async function saveAppearance(ctx: Context, input: unknown): Promise<AppearancePrefs> {
  const userId = requireUser(ctx);
  const parsed = inputSchema.parse(input);
  if (parsed.accentHex) {
    const hex = normalizeHex(parsed.accentHex);
    if (!hex || !isReadableAccent(hex, parsed.shade ?? 0)) {
      throw new GraphQLError('That color does not keep readable contrast. Pick a richer shade.', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    parsed.accentHex = hex;
  }
  const current = await getMyAppearance(ctx);
  const next = mergeAppearance({ ...current, ...parsed });
  await prisma.uiPreference.upsert({
    where: { userId },
    create: { userId, ...next },
    update: next,
  });
  await audit({
    action: 'APPEARANCE_UPDATED',
    category: 'ACCESS',
    actorId: userId,
    actorIp: ctx.ip,
    targetType: 'UiPreference',
    targetId: userId,
    message: `User #${userId} updated appearance`,
    metadata: { finish: next.finish, ticketView: next.ticketView, colorMode: next.colorMode },
  });
  return next;
}

export { DEFAULT_APPEARANCE };

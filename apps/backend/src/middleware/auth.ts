import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { Context } from '../types/context';
import { getClientIp } from '../security/httpSecurity';
import { prisma } from '../utils/prisma';
import { auditAuth } from '../security/audit';

interface JwtPayload {
  userId: number;
  role: string;
  sessionId?: string;
}

export async function buildContextFromAuthHeader(
  authorization: string | null | undefined,
  extras: { ip: string | null; userAgent: string | null; requestId: string | null }
): Promise<Context> {
  const { ip, userAgent, requestId } = extras;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : authorization || null;

  if (!token) {
    return { userId: null, role: null, ip, userAgent, requestId };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true,
        isActive: true,
        isBanned: true,
        lockedUntil: true,
      },
    });

    if (!user || !user.isActive || user.isBanned) {
      await auditAuth('AUTH_REJECTED_INACTIVE', {
        actorId: decoded.userId,
        actorIp: ip,
        actorAgent: userAgent,
        message: `Rejected token for inactive/banned user #${decoded.userId}`,
        severity: 'WARN',
      });
      return { userId: null, role: null, ip, userAgent, requestId };
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return { userId: null, role: null, ip, userAgent, requestId };
    }

    const overrides = await prisma.permissionOverride.findMany({
      where: {
        userId: decoded.userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { permission: true, granted: true },
    });

    return {
      userId: decoded.userId,
      role: user.role,
      ip,
      userAgent,
      requestId,
      permissionOverrides: overrides,
    };
  } catch {
    return { userId: null, role: null, ip, userAgent, requestId };
  }
}

export async function buildContext({ req }: { req: Request }): Promise<Context> {
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] ?? null;
  const requestId = (req.headers['x-request-id'] as string) ?? null;
  return buildContextFromAuthHeader(req.headers.authorization, { ip, userAgent, requestId });
}

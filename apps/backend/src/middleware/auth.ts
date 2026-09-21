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

export async function buildContext({ req }: { req: Request }): Promise<Context> {
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] ?? null;
  const requestId = (req.headers['x-request-id'] as string) ?? null;

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return { userId: null, role: null, ip, userAgent, requestId };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Validate user is still active & not banned
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

    // Load permission overrides for this user
    const overrides = await prisma.permissionOverride.findMany({
      where: {
        userId: decoded.userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { permission: true, granted: true },
    });

    return {
      userId: decoded.userId,
      role: user.role,  // Always use DB role, not the JWT-embedded one
      ip,
      userAgent,
      requestId,
      permissionOverrides: overrides,
    };
  } catch (err) {
    // Invalid / expired token
    return { userId: null, role: null, ip, userAgent, requestId };
  }
}

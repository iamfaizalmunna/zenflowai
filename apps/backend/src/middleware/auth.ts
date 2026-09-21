import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { Context } from '../types/context';

interface JwtPayload {
  userId: number;
  role: string;
}

export function buildContext({ req }: { req: Request }): Context {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return { userId: null, role: null };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    return { userId: decoded.userId, role: decoded.role };
  } catch {
    return { userId: null, role: null };
  }
}

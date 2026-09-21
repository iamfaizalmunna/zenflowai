/**
 * ZenFlowAI — Audit Logger
 * Every security-relevant event is persisted to the audit_logs table.
 * Never throws — logging failures must not crash the app.
 */

import { prisma } from '../utils/prisma';

export type AuditCategory =
  | 'AUTH'
  | 'ACCESS'
  | 'TICKET'
  | 'MODERATION'
  | 'SECURITY'
  | 'ADMIN'
  | 'FAIR_USAGE';

export type AuditSeverity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

interface AuditPayload {
  action: string;
  category: AuditCategory;
  severity?: AuditSeverity;
  actorId?: number | null;
  actorIp?: string | null;
  actorAgent?: string | null;
  targetType?: string;
  targetId?: number;
  metadata?: Record<string, unknown>;
  message: string;
}

export async function audit(payload: AuditPayload): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: payload.action,
        category: payload.category as any,
        severity: (payload.severity ?? 'INFO') as any,
        actorId: payload.actorId ?? null,
        actorIp: payload.actorIp ?? null,
        actorAgent: payload.actorAgent ?? null,
        targetType: payload.targetType ?? null,
        targetId: payload.targetId ?? null,
        metadata: payload.metadata ?? undefined,
        message: payload.message,
      },
    });
  } catch (err) {
    // Intentionally swallow — audit must never crash the main flow
    console.error('[AUDIT] Failed to write audit log:', err);
  }
}

// ─── Convenience shortcuts ────────────────────────────────────────────────────

export const auditAuth = (action: string, payload: Omit<AuditPayload, 'category'>) =>
  audit({ ...payload, action, category: 'AUTH' });

export const auditSecurity = (action: string, payload: Omit<AuditPayload, 'category'>, severity: AuditSeverity = 'WARN') =>
  audit({ ...payload, action, category: 'SECURITY', severity });

export const auditFairUsage = (action: string, payload: Omit<AuditPayload, 'category'>) =>
  audit({ ...payload, action, category: 'FAIR_USAGE', severity: 'WARN' });

export const auditModeration = (action: string, payload: Omit<AuditPayload, 'category'>) =>
  audit({ ...payload, action, category: 'MODERATION', severity: 'WARN' });

export const auditAccess = (action: string, payload: Omit<AuditPayload, 'category'>) =>
  audit({ ...payload, action, category: 'ACCESS', severity: 'WARN' });

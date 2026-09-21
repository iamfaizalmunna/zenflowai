/**
 * ZenFlowAI — Database Seed
 * Phase 1: Foundation & Auth
 *
 * Seeds: 5 users (one per role), teams, categories, SLA policies, routing rules
 */

import { PrismaClient, Role, TicketPriority, RoutingRuleType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const HASH_ROUNDS = 10;
const DEFAULT_PASSWORD = 'password123';

async function main() {
  console.log('🌱 Seeding ZenFlowAI database...\n');

  const hash = await bcrypt.hash(DEFAULT_PASSWORD, HASH_ROUNDS);

  // ── Users (one per role) ──────────────────────────────────────────────────
  const users = await Promise.all([
    upsertUser({ email: 'superadmin@zenflowai.com', name: 'Super Admin',  role: Role.SUPER_ADMIN, hash }),
    upsertUser({ email: 'admin@zenflowai.com',      name: 'Alex Admin',   role: Role.ADMIN,       hash }),
    upsertUser({ email: 'supervisor@zenflowai.com', name: 'Sam Supervisor', role: Role.SUPERVISOR, hash }),
    upsertUser({ email: 'agent@zenflowai.com',      name: 'Sarah Agent',  role: Role.AGENT,       hash }),
    upsertUser({ email: 'customer@zenflowai.com',   name: 'Chris Customer', role: Role.CUSTOMER,  hash }),
  ]);
  console.log(`✅ Users: ${users.length} created/updated`);

  // ── Teams ─────────────────────────────────────────────────────────────────
  const [generalTeam, itTeam, billingTeam, tier2Team] = await Promise.all([
    upsertTeam({ name: 'General Support', description: 'Default team for unmatched tickets', isDefault: true }),
    upsertTeam({ name: 'IT Support',      description: 'Technical issues and bugs' }),
    upsertTeam({ name: 'Billing',         description: 'Payment and subscription issues' }),
    upsertTeam({ name: 'Tier-2 Support',  description: 'Escalated and critical issues' }),
  ]);
  console.log('✅ Teams: 4 created/updated');

  // ── Add agent + supervisor to teams ──────────────────────────────────────
  const [, , supervisor, agent] = users;
  await Promise.all([
    upsertTeamMember({ teamId: itTeam.id,      userId: agent.id,      isLead: false }),
    upsertTeamMember({ teamId: billingTeam.id,  userId: agent.id,      isLead: false }),
    upsertTeamMember({ teamId: tier2Team.id,    userId: supervisor.id, isLead: true }),
    upsertTeamMember({ teamId: generalTeam.id,  userId: agent.id,      isLead: true }),
  ]);
  console.log('✅ Team members assigned');

  // ── Categories ────────────────────────────────────────────────────────────
  const [techCat, billingCat, generalCat, incidentCat] = await Promise.all([
    upsertCategory({ name: 'Technical',  color: '#6366f1', defaultPriority: TicketPriority.MEDIUM, defaultTeamId: itTeam.id }),
    upsertCategory({ name: 'Billing',    color: '#f59e0b', defaultPriority: TicketPriority.HIGH,   defaultTeamId: billingTeam.id }),
    upsertCategory({ name: 'General',    color: '#10b981', defaultPriority: TicketPriority.LOW,    defaultTeamId: generalTeam.id }),
    upsertCategory({ name: 'Incident',   color: '#ef4444', defaultPriority: TicketPriority.URGENT, defaultTeamId: tier2Team.id }),
  ]);
  console.log('✅ Categories: 4 created/updated');

  // ── SLA Policies ──────────────────────────────────────────────────────────
  await Promise.all([
    upsertSla({ priority: TicketPriority.LOW,    responseHours: 24, resolutionHours: 72 }),
    upsertSla({ priority: TicketPriority.MEDIUM, responseHours: 8,  resolutionHours: 24 }),
    upsertSla({ priority: TicketPriority.HIGH,   responseHours: 2,  resolutionHours: 8  }),
    upsertSla({ priority: TicketPriority.URGENT, responseHours: 0.5, resolutionHours: 4 }),
  ]);
  console.log('✅ SLA Policies: 4 created/updated');

  // ── Routing Rules (evaluated in order) ───────────────────────────────────
  // Delete old rules and re-create cleanly
  await prisma.routingRule.deleteMany({});
  await prisma.routingRule.createMany({
    data: [
      // 1. Keywords → Tier-2 (critical issues)
      { type: RoutingRuleType.KEYWORD, keyword: 'outage',      targetTeamId: tier2Team.id,    priorityOverride: TicketPriority.URGENT, order: 1 },
      { type: RoutingRuleType.KEYWORD, keyword: 'down',        targetTeamId: tier2Team.id,    priorityOverride: TicketPriority.URGENT, order: 2 },
      { type: RoutingRuleType.KEYWORD, keyword: 'urgent',      targetTeamId: tier2Team.id,    priorityOverride: TicketPriority.HIGH,   order: 3 },
      { type: RoutingRuleType.KEYWORD, keyword: 'critical',    targetTeamId: tier2Team.id,    priorityOverride: TicketPriority.URGENT, order: 4 },
      { type: RoutingRuleType.KEYWORD, keyword: 'not working', targetTeamId: itTeam.id,       priorityOverride: TicketPriority.HIGH,   order: 5 },
      // 2. Category-based routing
      { type: RoutingRuleType.CATEGORY, categoryId: techCat.id,     targetTeamId: itTeam.id,      order: 10 },
      { type: RoutingRuleType.CATEGORY, categoryId: billingCat.id,  targetTeamId: billingTeam.id,  order: 11 },
      { type: RoutingRuleType.CATEGORY, categoryId: incidentCat.id, targetTeamId: tier2Team.id,    order: 12 },
      { type: RoutingRuleType.CATEGORY, categoryId: generalCat.id,  targetTeamId: generalTeam.id,  order: 13 },
      // 3. Priority-based routing
      { type: RoutingRuleType.PRIORITY, priority: TicketPriority.URGENT, targetTeamId: tier2Team.id, order: 20 },
      // 4. Fallback
      { type: RoutingRuleType.FALLBACK, targetTeamId: generalTeam.id, order: 999 },
    ],
  });
  console.log('✅ Routing rules: 11 created');

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Seed complete! Demo credentials:

  Role          Email                         Password
  ────────────  ────────────────────────────  ────────────
  Super Admin   superadmin@zenflowai.com      password123
  Admin         admin@zenflowai.com           password123
  Supervisor    supervisor@zenflowai.com      password123
  Agent         agent@zenflowai.com           password123
  Customer      customer@zenflowai.com        password123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function upsertUser({ email, name, role, hash }: { email: string; name: string; role: Role; hash: string }) {
  return prisma.user.upsert({
    where: { email },
    update: { name, role },
    create: { email, name, password: hash, role, emailVerified: true },
  });
}

async function upsertTeam({ name, description, isDefault = false }: { name: string; description?: string; isDefault?: boolean }) {
  return prisma.team.upsert({
    where: { name },
    update: { description, isDefault },
    create: { name, description, isDefault },
  });
}

async function upsertTeamMember({ teamId, userId, isLead }: { teamId: number; userId: number; isLead: boolean }) {
  return prisma.teamMember.upsert({
    where: { teamId_userId: { teamId, userId } },
    update: { isLead },
    create: { teamId, userId, isLead },
  });
}

async function upsertCategory({ name, color, defaultPriority, defaultTeamId }: {
  name: string; color: string; defaultPriority: TicketPriority; defaultTeamId: number;
}) {
  return prisma.category.upsert({
    where: { name },
    update: { color, defaultPriority, defaultTeamId },
    create: { name, color, defaultPriority, defaultTeamId },
  });
}

async function upsertSla({ priority, responseHours, resolutionHours }: {
  priority: TicketPriority; responseHours: number; resolutionHours: number;
}) {
  return prisma.slaPolicy.upsert({
    where: { priority },
    update: { responseTimeHours: responseHours, resolutionTimeHours: resolutionHours },
    create: { priority, responseTimeHours: responseHours, resolutionTimeHours: resolutionHours },
  });
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

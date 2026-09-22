/**
 * ZenFlowAI — Database Seed
 * Phase 1: Foundation & Auth
 *
 * Seeds: demo users, 52 tickets, CSAT, spam queue, blocked IP, KB articles
 */

import { PrismaClient, Role, TicketPriority, TicketType, RoutingRuleType } from '@prisma/client';
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
  const jordan = await upsertUser({ email: 'jordan@zenflowai.com', name: 'Jordan Agent', role: Role.AGENT, hash });
  const priya = await upsertUser({ email: 'priya@zenflowai.com', name: 'Priya Patel', role: Role.AGENT, hash });
  const marcus = await upsertUser({ email: 'marcus@zenflowai.com', name: 'Marcus Chen', role: Role.AGENT, hash });
  const lina = await upsertUser({ email: 'lina@zenflowai.com', name: 'Lina Rossi', role: Role.AGENT, hash });
  await Promise.all([
    upsertTeamMember({ teamId: billingTeam.id, userId: jordan.id, isLead: false }),
    upsertTeamMember({ teamId: itTeam.id, userId: priya.id, isLead: false }),
    upsertTeamMember({ teamId: generalTeam.id, userId: marcus.id, isLead: false }),
    upsertTeamMember({ teamId: tier2Team.id, userId: lina.id, isLead: false }),
  ]);
  await prisma.user.updateMany({
    where: { email: { in: [
      'agent@zenflowai.com',
      'jordan@zenflowai.com',
      'priya@zenflowai.com',
      'marcus@zenflowai.com',
      'lina@zenflowai.com',
      'supervisor@zenflowai.com',
    ] } },
    data: { lastLoginAt: new Date() },
  });
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

  const customerUser = users[4];
  const sla = await prisma.slaPolicy.findUnique({ where: { priority: 'HIGH' } });
  const now = new Date();

  await prisma.ticket.deleteMany({ where: { ticketNumber: { startsWith: '#ZEN-' } } });
  await prisma.spamReport.deleteMany({});
  await prisma.blockedIp.deleteMany({ where: { ip: '203.0.113.50' } });

  const statusMix = ['NEW', 'OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'RESOLVED', 'CLOSED', 'CLOSED'] as const;
  const priorities = [TicketPriority.LOW, TicketPriority.MEDIUM, TicketPriority.HIGH, TicketPriority.URGENT];
  const types = [TicketType.BUG, TicketType.QUESTION, TicketType.INCIDENT, TicketType.TASK, TicketType.FEATURE];
  const cats = [techCat, billingCat, generalCat, incidentCat];
  const teams = [itTeam, billingTeam, generalTeam, tier2Team];
  const assignees = [agent, jordan, supervisor, priya, marcus, lina];
  const csatRatings = [5, 5, 4, 5, 3, 4, 5, 2, 4, 5];
  const titles = [
    'Cannot sign in on Safari',
    'Charged twice for last invoice',
    'VPN drops every hour',
    'Need refund for unused seats',
    'Dashboard empty after deploy',
    'Password reset never arrives',
    'SSO login loop',
    'Invoice PDF missing tax',
    'Mobile app crash on send',
    'Slow search on tickets',
    'Outage on billing portal',
    'Feature request: saved views',
  ];

  let spamTicketId = 0;
  for (let i = 1; i <= 96; i += 1) {
    const assignee = assignees[(i - 1) % assignees.length];
    const status = statusMix[Math.floor((i - 1) / assignees.length) % statusMix.length];
    const daysBack = 2 + ((i * 11) % 80);
    const createdAt = new Date(now.getTime() - daysBack * 86_400_000 - (i % 9) * 3_600_000);
    const cat = cats[(i - 1) % cats.length];
    const team = teams[(i - 1) % teams.length];
    const resolved = status === 'RESOLVED' || status === 'CLOSED';
    const firstRespondedAt = status === 'NEW' ? null : new Date(createdAt.getTime() + (2 + (i % 5)) * 3_600_000);
    const resolvedAt = resolved ? new Date(createdAt.getTime() + (18 + (i % 36)) * 3_600_000) : null;
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `#ZEN-${String(i).padStart(4, '0')}`,
        title: i <= titles.length ? titles[i - 1] : `${titles[(i - 1) % titles.length]} (${i})`,
        description: `Demo ticket ${i} for analytics, SLA, and consultant history.`,
        status,
        priority: priorities[(i - 1) % priorities.length],
        type: types[(i - 1) % types.length],
        customerId: customerUser.id,
        assignedToId: assignee.id,
        teamId: team.id,
        categoryId: cat.id,
        createdAt,
        firstRespondedAt,
        resolvedAt,
        closedAt: status === 'CLOSED' ? resolvedAt : null,
        slaResponseDueAt: new Date(createdAt.getTime() + (sla?.responseTimeHours ?? 2) * 3_600_000),
        slaResolutionDueAt: new Date(createdAt.getTime() + (sla?.resolutionTimeHours ?? 8) * 3_600_000),
        slaResponseBreached: i % 11 === 0,
        slaResolutionBreached: i % 13 === 0,
        isSpamFlagged: i >= 88,
        messages: {
          create: [
            { senderId: customerUser.id, body: `Customer update on ticket ${i}.`, type: 'REPLY' },
            ...(status !== 'NEW'
              ? [{ senderId: assignee.id, body: 'Thanks — I can reproduce this. Looking into it.', type: 'REPLY' as const }]
              : []),
          ],
        },
        ...(resolved
          ? {
              csatSurvey: {
                create: {
                  customerId: customerUser.id,
                  rating: csatRatings[i % csatRatings.length],
                  comment: [
                    'Fixed quickly — thank you.',
                    'Still a bit slow to first reply.',
                    'Clear update, issue is gone.',
                    'Did not fully solve it for me.',
                    'Loved the follow-through.',
                    'Please document the workaround.',
                  ][i % 6],
                  status: 'SUBMITTED',
                  submittedAt: resolvedAt,
                  expiresAt: new Date((resolvedAt ?? now).getTime() + 7 * 86_400_000),
                },
              },
            }
          : {}),
      },
    });
    if (i === 88) spamTicketId = ticket.id;
  }

  let extra = 97;
  for (let a = 0; a < assignees.length; a += 1) {
    for (let w = 0; w < 8; w += 1) {
      const createdAt = new Date(now.getTime() - (w * 7 + a) * 86_400_000);
      const resolvedAt = new Date(createdAt.getTime() + 10 * 3_600_000);
      const status = w % 2 === 0 ? 'RESOLVED' : 'CLOSED';
      await prisma.ticket.create({
        data: {
          ticketNumber: `#ZEN-${String(extra).padStart(4, '0')}`,
          title: `${titles[w % titles.length]} (follow-up ${extra})`,
          description: `Recent solved demo ticket ${extra}.`,
          status,
          priority: TicketPriority.MEDIUM,
          type: TicketType.QUESTION,
          customerId: customerUser.id,
          assignedToId: assignees[a].id,
          teamId: teams[a % teams.length].id,
          categoryId: cats[a % cats.length].id,
          createdAt,
          firstRespondedAt: new Date(createdAt.getTime() + 1 * 3_600_000),
          resolvedAt,
          closedAt: status === 'CLOSED' ? resolvedAt : null,
          slaResponseDueAt: new Date(createdAt.getTime() + 2 * 3_600_000),
          slaResolutionDueAt: new Date(createdAt.getTime() + 8 * 3_600_000),
          slaResponseBreached: a === 2 && w === 1,
          slaResolutionBreached: a === 2 && w === 3,
          messages: {
            create: [
              { senderId: customerUser.id, body: 'This is still happening this week.', type: 'REPLY' },
              { senderId: assignees[a].id, body: 'Shipped a fix on this thread.', type: 'REPLY' },
            ],
          },
          csatSurvey: {
            create: {
              customerId: customerUser.id,
              rating: [5, 5, 4, 2, 5, 4, 3, 5][w],
              comment: w === 3 ? 'Not resolved — I had to reopen.' : 'Recent case, rating captured.',
              status: 'SUBMITTED',
              submittedAt: resolvedAt,
              expiresAt: new Date(resolvedAt.getTime() + 7 * 86_400_000),
            },
          },
        },
      });
      extra += 1;
    }
  }

  await prisma.spamReport.create({
    data: {
      targetType: 'Ticket',
      targetId: spamTicketId,
      reason: 'SPAM_CONTENT',
      aiScore: 0.72,
      status: 'PENDING',
    },
  });
  await prisma.blockedIp.create({
    data: { ip: '203.0.113.50', reason: 'demo block' },
  });

  await prisma.knowledgeArticle.deleteMany({
    where: { title: { in: [
      'How to reset your password',
      'Cannot log in',
      'Duplicate charge or refund request',
      'How to create a support ticket',
      'When to escalate a ticket',
      'Writing a clear first response',
      'Draft: new refund FAQ',
    ] } },
  });

  await prisma.knowledgeArticle.createMany({
    data: [
      {
        title: 'How to reset your password',
        visibility: 'PUBLIC',
        isPublished: true,
        authorId: agent.id,
        categoryId: generalCat.id,
        body: '1. Open the login page.\n2. Select Forgot password.\n3. Enter your email.\n4. Open the reset link and choose a new password (8+ characters).',
      },
      {
        title: 'Cannot log in',
        visibility: 'PUBLIC',
        isPublished: true,
        authorId: agent.id,
        categoryId: techCat.id,
        body: 'Try another browser, clear cache, and confirm Caps Lock is off. If the account is locked after failed attempts, wait 15 minutes or contact support.',
      },
      {
        title: 'Duplicate charge or refund request',
        visibility: 'PUBLIC',
        isPublished: true,
        authorId: agent.id,
        categoryId: billingCat.id,
        body: 'If you were billed twice, create a Billing ticket with the invoice date and amount. Finance reviews duplicate charges within one business day.',
      },
      {
        title: 'How to create a support ticket',
        visibility: 'PUBLIC',
        isPublished: true,
        authorId: agent.id,
        categoryId: generalCat.id,
        body: 'Go to New Ticket, add a short title, describe what you expected vs what happened, pick a category, then submit. You will receive a #ZEN-XXXX number.',
      },
      {
        title: 'When to escalate a ticket',
        visibility: 'INTERNAL',
        isPublished: true,
        authorId: agent.id,
        categoryId: incidentCat.id,
        body: 'Escalate to Tier-2 when there is an outage, a security concern, or SLA is past 80%. Add an internal note with impact and the last customer update.',
      },
      {
        title: 'Writing a clear first response',
        visibility: 'INTERNAL',
        isPublished: true,
        authorId: agent.id,
        categoryId: generalCat.id,
        body: 'Acknowledge the issue, confirm the ticket number, set the next step, and give a time window. Do not promise refunds unless Billing policy allows it.',
      },
      {
        title: 'Draft: new refund FAQ',
        visibility: 'PUBLIC',
        isPublished: false,
        authorId: agent.id,
        categoryId: billingCat.id,
        body: 'Draft: explain when refunds apply. Review before publishing.',
      },
    ],
  });

  console.log('✅ Sample tickets: #ZEN-0001 through #ZEN-0144');
  console.log('✅ Knowledge articles: 4 public, 2 internal, 1 draft');

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Seed complete! Demo credentials:

  Role          Email                         Password
  ────────────  ────────────────────────────  ────────────
  Super Admin   superadmin@zenflowai.com      password123
  Admin         admin@zenflowai.com           password123
  Supervisor    supervisor@zenflowai.com      password123
  Agent         agent@zenflowai.com           password123
  Agent         jordan@zenflowai.com          password123
  Agent         priya@zenflowai.com           password123
  Agent         marcus@zenflowai.com          password123
  Agent         lina@zenflowai.com            password123
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

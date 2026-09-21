import { PrismaClient, Role, TicketStatus, TicketPriority, TicketType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@zenflowai.com' },
    update: {},
    create: {
      email: 'admin@zenflowai.com',
      name: 'Admin User',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: 'agent@zenflowai.com' },
    update: {},
    create: {
      email: 'agent@zenflowai.com',
      name: 'Support Agent',
      password: hashedPassword,
      role: Role.AGENT,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@zenflowai.com' },
    update: {},
    create: {
      email: 'customer@zenflowai.com',
      name: 'John Customer',
      password: hashedPassword,
      role: Role.CUSTOMER,
    },
  });

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Technical Support' },
      update: {},
      create: { name: 'Technical Support', color: '#6366f1', description: 'Technical issues and bugs' },
    }),
    prisma.category.upsert({
      where: { name: 'Billing' },
      update: {},
      create: { name: 'Billing', color: '#f59e0b', description: 'Payment and subscription issues' },
    }),
    prisma.category.upsert({
      where: { name: 'General' },
      update: {},
      create: { name: 'General', color: '#10b981', description: 'General questions' },
    }),
  ]);

  // Create tags
  const tags = await Promise.all([
    prisma.tag.upsert({ where: { name: 'urgent' }, update: {}, create: { name: 'urgent', color: '#ef4444' } }),
    prisma.tag.upsert({ where: { name: 'bug' }, update: {}, create: { name: 'bug', color: '#f97316' } }),
    prisma.tag.upsert({ where: { name: 'enhancement' }, update: {}, create: { name: 'enhancement', color: '#3b82f6' } }),
  ]);

  // Create a team
  const team = await prisma.team.create({
    data: { name: 'Support Team Alpha', description: 'Primary support team' },
  }).catch(() => prisma.team.findFirst({ where: { name: 'Support Team Alpha' } }));

  // Create sample tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      title: 'Login page throws 500 error on Safari',
      description: 'When users try to log in using Safari browser on macOS, they get an internal server error. This happens consistently on Safari 17+.',
      status: TicketStatus.OPEN,
      priority: TicketPriority.HIGH,
      type: TicketType.BUG,
      createdById: customer.id,
      assignedToId: agent.id,
      categoryId: categories[0].id,
      tags: {
        create: [
          { tag: { connect: { id: tags[0].id } } },
          { tag: { connect: { id: tags[1].id } } },
        ],
      },
      comments: {
        create: [
          {
            body: 'I can reproduce this issue. Looking into it now.',
            authorId: agent.id,
          },
        ],
      },
      activities: {
        create: [
          {
            action: 'created',
            description: 'Ticket created',
          },
          {
            action: 'assigned',
            description: `Ticket assigned to ${agent.name}`,
          },
        ],
      },
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      title: 'Feature request: Dark mode support',
      description: 'Would love to see a dark mode option in the dashboard. It would make it much easier to work at night.',
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.MEDIUM,
      type: TicketType.FEATURE_REQUEST,
      createdById: customer.id,
      categoryId: categories[2].id,
      tags: {
        create: [{ tag: { connect: { id: tags[2].id } } }],
      },
    },
  });

  // Create saved queries (GraphQL superpowers)
  await prisma.savedQuery.create({
    data: {
      name: 'Get All Open Tickets',
      description: 'Fetch all open tickets with assignee info',
      query: `query GetOpenTickets($status: TicketStatus) {
  tickets(filter: { status: $status }) {
    id
    title
    priority
    createdAt
    assignedTo {
      name
      email
    }
  }
}`,
      hash: 'sha256:abc123openTickets',
      variables: { status: 'OPEN' },
      isBookmarked: true,
      tags: 'tickets,open,dashboard',
      userId: admin.id,
    },
  });

  // Create bookmarked node
  await prisma.bookmarkedNode.create({
    data: {
      nodeType: 'Ticket',
      nodeId: ticket1.id,
      label: '⚡ High Priority Safari Bug',
      color: '#ef4444',
      userId: admin.id,
    },
  });

  console.log('✅ Seed complete!');
  console.log(`   👤 Admin: admin@zenflowai.com / password123`);
  console.log(`   👤 Agent: agent@zenflowai.com / password123`);
  console.log(`   👤 Customer: customer@zenflowai.com / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

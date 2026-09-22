import { NotificationType } from '@prisma/client';
import { prisma } from '../utils/prisma';

export async function notifyUser(
  userId: number,
  type: NotificationType,
  title: string,
  body: string,
  ticketId?: number
): Promise<void> {
  await prisma.notification
    .create({
      data: { userId, type, ticketId: ticketId ?? null, title, body },
    })
    .catch(() => undefined);
}

export async function listMyNotifications(userId: number, take = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(take, 50),
  });
}

export async function markNotificationRead(userId: number, id: number) {
  await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
  return true;
}

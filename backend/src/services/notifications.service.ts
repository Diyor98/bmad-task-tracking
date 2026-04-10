import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/AppError.js'
import { eventBus } from '../lib/eventBus.js'

export const notificationsService = {
  async create(data: { userId: string; type: string; message: string; taskId?: string }) {
    const notification = await prisma.notification.create({ data })
    // Emit with a special projectId that the SSE hook uses to invalidate notifications
    // We use the userId as the "projectId" channel so only the target user's SSE connection picks it up
    // The frontend useSSE hook also listens for notification:created globally
    if (data.taskId) {
      const task = await prisma.task.findUnique({ where: { id: data.taskId }, select: { projectId: true } })
      if (task) {
        eventBus.emitSSE({ type: 'notification:created', projectId: task.projectId, data: notification })
      }
    }
    return notification
  },

  async listByUser(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      include: { task: { select: { projectId: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  },

  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({ where: { id } })
    if (!notification) {
      throw new AppError('NOT_FOUND', 404, 'Notification not found')
    }
    if (notification.userId !== userId) {
      throw new AppError('FORBIDDEN', 403, 'Not your notification')
    }
    return prisma.notification.update({
      where: { id },
      data: { read: true },
    })
  },

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    })
  },
}

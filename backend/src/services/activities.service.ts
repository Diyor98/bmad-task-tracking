import { prisma } from '../lib/prisma.js'
import { eventBus } from '../lib/eventBus.js'

export const activitiesService = {
  async create(data: { taskId: string; userId: string; action: string; oldValue?: string | null; newValue?: string | null }, projectId: string) {
    const activity = await prisma.activity.create({
      data,
      include: { user: { select: { id: true, name: true } } },
    })
    eventBus.emitSSE({ type: 'activity:created', projectId, data: activity })
    return activity
  },

  async listByTask(taskId: string) {
    return prisma.activity.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  },
}

import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/AppError.js'
import { notificationsService } from './notifications.service.js'
import { eventBus } from '../lib/eventBus.js'

export const commentsService = {
  async listByTask(taskId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) {
      throw new AppError('NOT_FOUND', 404, 'Task not found')
    }
    return prisma.comment.findMany({
      where: { taskId },
      include: {
        author: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
  },

  async create(data: { body: string; taskId: string; authorId: string }) {
    const task = await prisma.task.findUnique({ where: { id: data.taskId } })
    if (!task) {
      throw new AppError('NOT_FOUND', 404, 'Task not found')
    }
    const comment = await prisma.comment.create({
      data,
      include: {
        author: { select: { id: true, name: true } },
      },
    })
    if (task.assigneeId && task.assigneeId !== data.authorId) {
      notificationsService.create({
        userId: task.assigneeId,
        type: 'comment_added',
        message: `New comment on '${task.title}'`,
        taskId: task.id,
      }).catch(() => {})
    }
    eventBus.emitSSE({ type: 'comment:created', projectId: task.projectId, data: comment })
    return comment
  },
}

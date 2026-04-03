import { prisma } from '../lib/prisma'
import { AppError } from '../lib/AppError'

export const commentsService = {
  async listByTask(taskId: string) {
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
    return prisma.comment.create({
      data,
      include: {
        author: { select: { id: true, name: true } },
      },
    })
  },
}

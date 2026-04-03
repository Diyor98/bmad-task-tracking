import { prisma } from '../lib/prisma'

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
    return prisma.comment.create({
      data,
      include: {
        author: { select: { id: true, name: true } },
      },
    })
  },
}

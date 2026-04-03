import { prisma } from '../lib/prisma'
import { AppError } from '../lib/AppError'

export const tasksService = {
  async listByProject(projectId: string) {
    return prisma.task.findMany({
      where: { projectId },
      include: {
        status: true,
        assignee: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
  },

  async getById(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        status: true,
        assignee: { select: { id: true, name: true, email: true } },
      },
    })
    if (!task) {
      throw new AppError('NOT_FOUND', 404, 'Task not found')
    }
    return task
  },

  async create(data: { title: string; description?: string; projectId: string; statusId: string }) {
    return prisma.task.create({
      data,
      include: {
        status: true,
        assignee: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true } },
      },
    })
  },

  async update(id: string, data: { title?: string; description?: string; statusId?: string; assigneeId?: string | null }) {
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) {
      throw new AppError('NOT_FOUND', 404, 'Task not found')
    }
    return prisma.task.update({
      where: { id },
      data,
      include: {
        status: true,
        assignee: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true } },
      },
    })
  },

  async delete(id: string) {
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) {
      throw new AppError('NOT_FOUND', 404, 'Task not found')
    }
    await prisma.task.delete({ where: { id } })
  },
}

import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/AppError.js'
import { attachmentsService } from './attachments.service.js'

const taskInclude = {
  status: true,
  assignee: { select: { id: true, name: true, email: true } },
  _count: { select: { comments: true, attachments: true } },
} as const

export const tasksService = {
  async listByProject(projectId: string) {
    return prisma.task.findMany({
      where: { projectId },
      include: taskInclude,
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
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

  async create(data: { title: string; description?: string; projectId: string; statusId: string; dueDate?: string | null; priority?: string | null }) {
    const status = await prisma.status.findUnique({ where: { id: data.statusId } })
    if (!status || status.projectId !== data.projectId) {
      throw new AppError('VALIDATION_ERROR', 400, 'Status does not belong to this project')
    }
    const maxPos = await prisma.task.aggregate({
      where: { projectId: data.projectId, statusId: data.statusId },
      _max: { position: true },
    })
    const position = (maxPos._max.position ?? -1) + 1
    return prisma.task.create({
      data: { ...data, position },
      include: taskInclude,
    })
  },

  async update(id: string, data: { title?: string; description?: string; statusId?: string; assigneeId?: string | null; dueDate?: string | null; priority?: string | null }) {
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) {
      throw new AppError('NOT_FOUND', 404, 'Task not found')
    }
    const updateData: Record<string, unknown> = { ...data }
    if (data.statusId && data.statusId !== task.statusId) {
      const status = await prisma.status.findUnique({ where: { id: data.statusId } })
      if (!status || status.projectId !== task.projectId) {
        throw new AppError('VALIDATION_ERROR', 400, 'Status does not belong to this project')
      }
      const maxPos = await prisma.task.aggregate({
        where: { projectId: task.projectId, statusId: data.statusId },
        _max: { position: true },
      })
      updateData.position = (maxPos._max.position ?? -1) + 1
    } else if (data.statusId) {
      const status = await prisma.status.findUnique({ where: { id: data.statusId } })
      if (!status || status.projectId !== task.projectId) {
        throw new AppError('VALIDATION_ERROR', 400, 'Status does not belong to this project')
      }
    }
    return prisma.task.update({
      where: { id },
      data: updateData,
      include: taskInclude,
    })
  },

  async reorder(id: string, newPosition: number) {
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) {
      throw new AppError('NOT_FOUND', 404, 'Task not found')
    }
    const siblings = await prisma.task.findMany({
      where: { projectId: task.projectId, statusId: task.statusId },
      orderBy: { position: 'asc' },
      select: { id: true },
    })
    const ids = siblings.map((s) => s.id).filter((sid) => sid !== id)
    const clampedPos = Math.max(0, Math.min(newPosition, ids.length))
    ids.splice(clampedPos, 0, id)
    await prisma.$transaction(
      ids.map((taskId, index) =>
        prisma.task.update({ where: { id: taskId }, data: { position: index } })
      )
    )
    const updated = await prisma.task.findUnique({ where: { id }, include: taskInclude })
    if (!updated) {
      throw new AppError('NOT_FOUND', 404, 'Task not found')
    }
    return updated
  },

  async delete(id: string) {
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) {
      throw new AppError('NOT_FOUND', 404, 'Task not found')
    }
    await attachmentsService.deleteAllForTask(id)
    await prisma.task.delete({ where: { id } })
  },
}

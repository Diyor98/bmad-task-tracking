import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/AppError.js'
import { attachmentsService } from './attachments.service.js'
import { notificationsService } from './notifications.service.js'
import { eventBus } from '../lib/eventBus.js'
import { activitiesService } from './activities.service.js'

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

  async create(data: { title: string; description?: string; projectId: string; statusId: string; dueDate?: string | null; priority?: string | null }, currentUserId?: string) {
    const status = await prisma.status.findUnique({ where: { id: data.statusId } })
    if (!status || status.projectId !== data.projectId) {
      throw new AppError('VALIDATION_ERROR', 400, 'Status does not belong to this project')
    }
    const maxPos = await prisma.task.aggregate({
      where: { projectId: data.projectId, statusId: data.statusId },
      _max: { position: true },
    })
    const position = (maxPos._max.position ?? -1) + 1
    const task = await prisma.task.create({
      data: { ...data, position },
      include: taskInclude,
    })
    eventBus.emitSSE({ type: 'task:created', projectId: data.projectId, data: task })
    if (currentUserId) {
      activitiesService.create({ taskId: task.id, userId: currentUserId, action: 'created' }, data.projectId).catch(() => {})
    }
    return task
  },

  async update(id: string, data: { title?: string; description?: string; statusId?: string; assigneeId?: string | null; dueDate?: string | null; priority?: string | null }, currentUserId?: string) {
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
    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
      include: taskInclude,
    })
    // Notification: task assigned
    if (data.assigneeId && data.assigneeId !== task.assigneeId && data.assigneeId !== currentUserId) {
      notificationsService.create({
        userId: data.assigneeId,
        type: 'task_assigned',
        message: `You were assigned to '${updated.title}'`,
        taskId: id,
      }).catch(() => {})
    }
    // Notification: status changed (notify current assignee after update)
    if (data.statusId && data.statusId !== task.statusId && updated.assigneeId && updated.assigneeId !== currentUserId) {
      const newStatus = updated.status
      notificationsService.create({
        userId: updated.assigneeId,
        type: 'task_status_changed',
        message: `'${updated.title}' was moved to ${newStatus.name}`,
        taskId: id,
      }).catch(() => {})
    }
    eventBus.emitSSE({ type: 'task:updated', projectId: task.projectId, data: updated })
    // Activity tracking
    if (currentUserId) {
      const changes: { action: string; oldValue: string | null; newValue: string | null }[] = []
      if (data.title !== undefined && data.title !== task.title) {
        changes.push({ action: 'title', oldValue: task.title, newValue: data.title })
      }
      if (data.description !== undefined && data.description !== task.description) {
        changes.push({ action: 'description', oldValue: task.description, newValue: data.description ?? null })
      }
      if (data.statusId && data.statusId !== task.statusId) {
        const oldStatus = await prisma.status.findUnique({ where: { id: task.statusId }, select: { name: true } })
        changes.push({ action: 'status', oldValue: oldStatus?.name ?? null, newValue: updated.status.name })
      }
      if (data.assigneeId !== undefined && data.assigneeId !== task.assigneeId) {
        const oldAssignee = task.assigneeId ? await prisma.user.findUnique({ where: { id: task.assigneeId }, select: { name: true } }) : null
        changes.push({ action: 'assignee', oldValue: oldAssignee?.name ?? null, newValue: updated.assignee?.name ?? null })
      }
      if (data.priority !== undefined && data.priority !== task.priority) {
        changes.push({ action: 'priority', oldValue: task.priority, newValue: data.priority ?? null })
      }
      if (data.dueDate !== undefined) {
        const oldDate = task.dueDate ? task.dueDate.toISOString().split('T')[0] : null
        const newDate = data.dueDate ? data.dueDate.split('T')[0] : null
        if (oldDate !== newDate) {
          changes.push({ action: 'dueDate', oldValue: oldDate, newValue: newDate })
        }
      }
      for (const change of changes) {
        activitiesService.create({ taskId: id, userId: currentUserId, ...change }, task.projectId).catch(() => {})
      }
    }
    return updated
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
    eventBus.emitSSE({ type: 'task:reordered', projectId: task.projectId, data: updated })
    return updated
  },

  async delete(id: string) {
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) {
      throw new AppError('NOT_FOUND', 404, 'Task not found')
    }
    await attachmentsService.deleteAllForTask(id)
    await prisma.task.delete({ where: { id } })
    eventBus.emitSSE({ type: 'task:deleted', projectId: task.projectId, data: { taskId: id, projectId: task.projectId } })
  },
}

import { prisma } from '../lib/prisma'
import { AppError } from '../lib/AppError'

export const statusesService = {
  async listByProject(projectId: string) {
    return prisma.status.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    })
  },

  async create(projectId: string, name: string, color: string) {
    const maxOrder = await prisma.status.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    return prisma.status.create({
      data: {
        name,
        color,
        order: (maxOrder?.order ?? -1) + 1,
        projectId,
      },
    })
  },

  async update(id: string, data: { name?: string; color?: string }) {
    const status = await prisma.status.findUnique({ where: { id } })
    if (!status) {
      throw new AppError('NOT_FOUND', 404, 'Status not found')
    }
    return prisma.status.update({ where: { id }, data })
  },

  async delete(id: string) {
    const status = await prisma.status.findUnique({
      where: { id },
      include: { project: { include: { statuses: { orderBy: { order: 'asc' } } } } },
    })
    if (!status) {
      throw new AppError('NOT_FOUND', 404, 'Status not found')
    }

    const defaultStatus = status.project.statuses.find((s) => s.name === 'To Do')
    if (!defaultStatus || defaultStatus.id === id) {
      throw new AppError('BAD_REQUEST', 400, 'Cannot delete the default "To Do" status')
    }

    await prisma.task.updateMany({
      where: { statusId: id },
      data: { statusId: defaultStatus.id },
    })

    await prisma.status.delete({ where: { id } })
  },
}

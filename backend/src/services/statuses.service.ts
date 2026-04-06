import { prisma } from '../lib/prisma'
import { AppError } from '../lib/AppError'

export const statusesService = {
  async listByProject(projectId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      throw new AppError('NOT_FOUND', 404, 'Project not found')
    }
    return prisma.status.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    })
  },

  async create(projectId: string, name: string, color: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      throw new AppError('NOT_FOUND', 404, 'Project not found')
    }
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

  async update(id: string, projectId: string, data: { name?: string; color?: string }) {
    const status = await prisma.status.findUnique({ where: { id } })
    if (!status) {
      throw new AppError('NOT_FOUND', 404, 'Status not found')
    }
    if (status.projectId !== projectId) {
      throw new AppError('NOT_FOUND', 404, 'Status not found')
    }
    return prisma.status.update({ where: { id }, data })
  },

  async delete(id: string, projectId: string) {
    const status = await prisma.status.findUnique({
      where: { id },
      include: { project: { include: { statuses: { orderBy: { order: 'asc' } } } } },
    })
    if (!status) {
      throw new AppError('NOT_FOUND', 404, 'Status not found')
    }
    if (status.projectId !== projectId) {
      throw new AppError('NOT_FOUND', 404, 'Status not found')
    }
    if (status.isDefault) {
      throw new AppError('BAD_REQUEST', 400, 'Cannot delete a default status')
    }

    const fallback = status.project.statuses.find((s) => s.isDefault && s.id !== id)
    if (!fallback) {
      throw new AppError('BAD_REQUEST', 400, 'No fallback status available')
    }

    await prisma.$transaction([
      prisma.task.updateMany({
        where: { statusId: id },
        data: { statusId: fallback.id },
      }),
      prisma.status.delete({ where: { id } }),
    ])
  },
}

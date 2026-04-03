import { prisma } from '../lib/prisma'
import { AppError } from '../lib/AppError'

const DEFAULT_STATUSES = [
  { name: 'To Do', color: 'zinc-400', order: 0 },
  { name: 'In Progress', color: 'blue-500', order: 1 },
  { name: 'In Review', color: 'amber-500', order: 2 },
  { name: 'Done', color: 'green-500', order: 3 },
]

export const projectsService = {
  async list() {
    return prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { tasks: true } } },
    })
  },

  async getById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        statuses: { orderBy: { order: 'asc' } },
      },
    })
    if (!project) {
      throw new AppError('NOT_FOUND', 404, 'Project not found')
    }
    return project
  },

  async create(name: string) {
    return prisma.project.create({
      data: {
        name,
        statuses: {
          create: DEFAULT_STATUSES,
        },
      },
      include: {
        statuses: { orderBy: { order: 'asc' } },
        _count: { select: { tasks: true } },
      },
    })
  },

  async update(id: string, name: string) {
    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) {
      throw new AppError('NOT_FOUND', 404, 'Project not found')
    }
    return prisma.project.update({
      where: { id },
      data: { name },
      include: { _count: { select: { tasks: true } } },
    })
  },

  async delete(id: string) {
    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) {
      throw new AppError('NOT_FOUND', 404, 'Project not found')
    }
    await prisma.project.delete({ where: { id } })
  },
}

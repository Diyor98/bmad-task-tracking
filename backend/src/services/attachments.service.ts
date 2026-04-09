import fs from 'fs'
import path from 'path'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/AppError.js'
import { UPLOADS_DIR } from '../middleware/upload.js'

export const attachmentsService = {
  async listByTask(taskId: string) {
    return prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    })
  },

  async getById(id: string) {
    const attachment = await prisma.attachment.findUnique({ where: { id } })
    if (!attachment) {
      throw new AppError('NOT_FOUND', 404, 'Attachment not found')
    }
    return attachment
  },

  async create(data: { filename: string; fileKey: string; fileSize: number; mimeType: string; taskId: string; uploaderId: string }) {
    const task = await prisma.task.findUnique({ where: { id: data.taskId } })
    if (!task) {
      throw new AppError('NOT_FOUND', 404, 'Task not found')
    }
    return prisma.attachment.create({ data })
  },

  async delete(id: string) {
    const attachment = await prisma.attachment.findUnique({ where: { id } })
    if (!attachment) {
      throw new AppError('NOT_FOUND', 404, 'Attachment not found')
    }
    const filePath = path.join(UPLOADS_DIR, attachment.fileKey)
    await fs.promises.unlink(filePath).catch(() => {})
    await prisma.attachment.delete({ where: { id } })
  },

  async deleteAllForTask(taskId: string) {
    const attachments = await prisma.attachment.findMany({ where: { taskId } })
    for (const att of attachments) {
      const filePath = path.join(UPLOADS_DIR, att.fileKey)
      await fs.promises.unlink(filePath).catch(() => {})
    }
  },
}

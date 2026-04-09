import { Router, Request, Response, NextFunction } from 'express'
import fs from 'fs'
import path from 'path'
import multer from 'multer'
import { requireAuth } from '../middleware/requireAuth.js'
import { upload, UPLOADS_DIR } from '../middleware/upload.js'
import { attachmentsService } from '../services/attachments.service.js'
import { AppError } from '../lib/AppError.js'

const router = Router()

router.use(requireAuth)

// POST /api/tasks/:taskId/attachments — upload file
router.post('/tasks/:taskId/attachments', (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('VALIDATION_ERROR', 400, 'File size exceeds 10MB limit'))
      }
      return next(new AppError('VALIDATION_ERROR', 400, err.message))
    }
    if (err) {
      return next(new AppError('VALIDATION_ERROR', 400, err.message))
    }
    next()
  })
}, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file
    if (!file) {
      return next(new AppError('VALIDATION_ERROR', 400, 'No file provided'))
    }
    const attachment = await attachmentsService.create({
      filename: file.originalname,
      fileKey: file.filename,
      fileSize: file.size,
      mimeType: file.mimetype,
      taskId: req.params.taskId as string,
      uploaderId: (req as unknown as { user: { userId: string } }).user.userId,
    })
    res.status(201).json({ data: attachment })
  } catch (err) {
    if (req.file) {
      fs.promises.unlink(req.file.path).catch(() => {})
    }
    next(err)
  }
})

// GET /api/tasks/:taskId/attachments — list attachments
router.get('/tasks/:taskId/attachments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attachments = await attachmentsService.listByTask(req.params.taskId as string)
    res.json({ data: attachments })
  } catch (err) {
    next(err)
  }
})

// GET /api/attachments/:id/download — download file
router.get('/attachments/:id/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attachment = await attachmentsService.getById(req.params.id as string)
    const filePath = path.join(UPLOADS_DIR, attachment.fileKey)
    if (!fs.existsSync(filePath)) {
      return next(new AppError('NOT_FOUND', 404, 'File not found on disk'))
    }
    const safeName = attachment.filename.replace(/["\r\n]/g, '_')
    res.setHeader('Content-Type', attachment.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`)
    fs.createReadStream(filePath).pipe(res)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/attachments/:id — delete attachment
router.delete('/attachments/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await attachmentsService.delete(req.params.id as string)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

export default router

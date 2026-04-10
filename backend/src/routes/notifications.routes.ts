import { Router, Request, Response, NextFunction } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { notificationsService } from '../services/notifications.service.js'

const router = Router()

router.use(requireAuth)

// GET /api/notifications — list for current user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as { user: { userId: string } }).user.userId
    const notifications = await notificationsService.listByUser(userId)
    res.json({ data: notifications })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as { user: { userId: string } }).user.userId
    await notificationsService.markAllAsRead(userId)
    res.json({ data: { success: true } })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/notifications/:id/read — mark single as read
router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown as { user: { userId: string } }).user.userId
    const notification = await notificationsService.markAsRead(req.params.id as string, userId)
    res.json({ data: notification })
  } catch (err) {
    next(err)
  }
})

export default router

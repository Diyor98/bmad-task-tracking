import { Router, Request, Response, NextFunction } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { activitiesService } from '../services/activities.service.js'

const router = Router()

router.use(requireAuth)

// GET /api/tasks/:taskId/activities — list activities for a task
router.get('/:taskId/activities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activities = await activitiesService.listByTask(req.params.taskId as string)
    res.json({ data: activities })
  } catch (err) {
    next(err)
  }
})

export default router

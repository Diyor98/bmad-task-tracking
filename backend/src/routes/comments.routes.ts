import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth'
import { validate } from '../middleware/validate'
import { commentsService } from '../services/comments.service'

const CreateCommentSchema = z.object({
  body: z.string().min(1, 'Comment body is required'),
})

const router = Router()

router.use(requireAuth)

router.get('/:taskId/comments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comments = await commentsService.listByTask(req.params.taskId as string)
    res.json({ data: comments })
  } catch (err) {
    next(err)
  }
})

router.post('/:taskId/comments', validate(CreateCommentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comment = await commentsService.create({
      body: req.body.body,
      taskId: req.params.taskId as string,
      authorId: req.user!.userId,
    })
    res.status(201).json({ data: comment })
  } catch (err) {
    next(err)
  }
})

export default router

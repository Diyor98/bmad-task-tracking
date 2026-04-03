import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth'
import { validate } from '../middleware/validate'
import { statusesService } from '../services/statuses.service'

const CreateStatusSchema = z.object({
  name: z.string().trim().min(1, 'Status name is required').max(100),
  color: z.string().trim().min(1, 'Status color is required').max(50),
})

const UpdateStatusSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  color: z.string().trim().min(1).max(50).optional(),
})

const router = Router()

router.use(requireAuth)

router.get('/:projectId/statuses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const statuses = await statusesService.listByProject(req.params.projectId as string)
    res.json({ data: statuses })
  } catch (err) {
    next(err)
  }
})

router.post('/:projectId/statuses', validate(CreateStatusSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await statusesService.create(req.params.projectId as string, req.body.name, req.body.color)
    res.status(201).json({ data: status })
  } catch (err) {
    next(err)
  }
})

router.patch('/:projectId/statuses/:id', validate(UpdateStatusSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await statusesService.update(req.params.id as string, req.body)
    res.json({ data: status })
  } catch (err) {
    next(err)
  }
})

router.delete('/:projectId/statuses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await statusesService.delete(req.params.id as string)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

export default router

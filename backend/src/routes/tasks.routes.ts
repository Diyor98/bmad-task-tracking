import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import { tasksService } from '../services/tasks.service.js'
import { AppError } from '../lib/AppError.js'

const CreateTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  description: z.string().trim().max(10000).optional(),
  projectId: z.string().min(1),
  statusId: z.string().min(1),
  dueDate: z.string().datetime().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).nullable().optional(),
})

const UpdateTaskSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(10000).optional().nullable(),
  statusId: z.string().min(1).optional(),
  assigneeId: z.string().min(1).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).nullable().optional(),
})

const ReorderTaskSchema = z.object({
  position: z.number().int().min(0),
})

const router = Router()

router.use(requireAuth)

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.query
    if (!projectId || typeof projectId !== 'string') {
      return next(new AppError('VALIDATION_ERROR', 400, 'projectId query param required'))
    }
    const tasks = await tasksService.listByProject(projectId)
    res.json({ data: tasks })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await tasksService.getById(req.params.id as string)
    res.json({ data: task })
  } catch (err) {
    next(err)
  }
})

router.post('/', validate(CreateTaskSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = (req as unknown as { user: { userId: string } }).user.userId
    const task = await tasksService.create(req.body, currentUserId)
    res.status(201).json({ data: task })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', validate(UpdateTaskSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = (req as unknown as { user: { userId: string } }).user.userId
    const task = await tasksService.update(req.params.id as string, req.body, currentUserId)
    res.json({ data: task })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/reorder', validate(ReorderTaskSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await tasksService.reorder(req.params.id as string, req.body.position)
    res.json({ data: task })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await tasksService.delete(req.params.id as string)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

export default router

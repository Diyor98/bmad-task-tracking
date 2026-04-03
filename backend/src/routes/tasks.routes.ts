import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth'
import { validate } from '../middleware/validate'
import { tasksService } from '../services/tasks.service'

const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  projectId: z.string().min(1),
  statusId: z.string().min(1),
})

const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  statusId: z.string().optional(),
  assigneeId: z.string().nullable().optional(),
})

const router = Router()

router.use(requireAuth)

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.query
    if (!projectId || typeof projectId !== 'string') {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'projectId query param required' } })
      return
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
    const task = await tasksService.create(req.body)
    res.status(201).json({ data: task })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', validate(UpdateTaskSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await tasksService.update(req.params.id as string, req.body)
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

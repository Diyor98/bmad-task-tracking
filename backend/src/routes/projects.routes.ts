import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth'
import { validate } from '../middleware/validate'
import { projectsService } from '../services/projects.service'

const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
})

const UpdateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
})

const router = Router()

router.use(requireAuth)

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await projectsService.list()
    res.json({ data: projects })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await projectsService.getById(req.params.id)
    res.json({ data: project })
  } catch (err) {
    next(err)
  }
})

router.post('/', validate(CreateProjectSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await projectsService.create(req.body.name)
    res.status(201).json({ data: project })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', validate(UpdateProjectSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await projectsService.update(req.params.id, req.body.name)
    res.json({ data: project })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await projectsService.delete(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

export default router

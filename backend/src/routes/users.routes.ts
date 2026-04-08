import { Router, Request, Response, NextFunction } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { prisma } from '../lib/prisma.js'

const router = Router()

router.get('/', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    })
    res.json({ data: users })
  } catch (err) {
    next(err)
  }
})

export default router

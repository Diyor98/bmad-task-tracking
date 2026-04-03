import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/requireAuth'
import { authService } from '../services/auth.service'
import { prisma } from '../lib/prisma'

const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

const router = Router()

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

router.post('/register', validate(RegisterSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, token } = await authService.register(req.body.name, req.body.email, req.body.password)
    const maxAge = parseDuration(process.env.JWT_EXPIRY || '7d')
    res.cookie('token', token, { ...COOKIE_OPTIONS, maxAge })
    res.status(201).json({ data: user })
  } catch (err) {
    next(err)
  }
})

router.post('/login', validate(LoginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, token } = await authService.login(req.body.email, req.body.password)
    const maxAge = parseDuration(process.env.JWT_EXPIRY || '7d')
    res.cookie('token', token, { ...COOKIE_OPTIONS, maxAge })
    res.json({ data: user })
  } catch (err) {
    next(err)
  }
})

router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true },
    })
    if (!user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } })
      return
    }
    res.json({ data: user })
  } catch (err) {
    next(err)
  }
})

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token', COOKIE_OPTIONS)
  res.status(204).end()
})

function parseDuration(dur: string): number {
  const match = dur.match(/^(\d+)([smhd])$/)
  if (!match) return 7 * 24 * 60 * 60 * 1000
  const val = parseInt(match[1])
  const unit = match[2]
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 }
  return val * (multipliers[unit] || 86400000)
}

export default router

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from '../lib/AppError.js'

interface JwtPayload {
  userId: string
  email: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET!

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.token

  if (!token) {
    return next(new AppError('UNAUTHORIZED', 401, 'Authentication required'))
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload
    req.user = payload
    next()
  } catch {
    next(new AppError('UNAUTHORIZED', 401, 'Invalid or expired token'))
  }
}

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from '../lib/AppError'

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

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.token

  if (!token) {
    return next(new AppError('UNAUTHORIZED', 401, 'Authentication required'))
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    req.user = payload
    next()
  } catch {
    next(new AppError('UNAUTHORIZED', 401, 'Invalid or expired token'))
  }
}

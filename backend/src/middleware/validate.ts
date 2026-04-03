import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { AppError } from '../lib/AppError'

export class ValidationError extends AppError {
  constructor(public details: Record<string, string[]>) {
    super('VALIDATION_ERROR', 400, 'Invalid input')
  }
}

export const validate = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    next(new ValidationError(result.error.flatten().fieldErrors as Record<string, string[]>))
    return
  }
  req.body = result.data
  next()
}

import express, { Request, Response, NextFunction } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import authRoutes from './routes/auth.routes'
import usersRoutes from './routes/users.routes'
import projectsRoutes from './routes/projects.routes'
import tasksRoutes from './routes/tasks.routes'
import commentsRoutes from './routes/comments.routes'
import statusesRoutes from './routes/statuses.routes'
import { AppError } from './lib/AppError'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  res.json({ data: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/projects', projectsRoutes)
app.use('/api/projects', statusesRoutes)
app.use('/api/tasks', tasksRoutes)
app.use('/api/tasks', commentsRoutes)

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    })
    return
  }
  console.error(err)
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  })
})

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})

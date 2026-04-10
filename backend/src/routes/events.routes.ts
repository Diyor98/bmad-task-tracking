import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { eventBus, type SSEEvent } from '../lib/eventBus.js'

const router = Router()

// GET /api/events?projectId=<id> — SSE stream
router.get('/events', requireAuth, (req: Request, res: Response) => {
  const projectId = req.query.projectId as string | undefined
  if (!projectId) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'projectId query param required' } })
    return
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no',
  })

  // Initial keepalive
  res.write(':ok\n\n')

  // Heartbeat every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(':heartbeat\n\n')
  }, 30_000)

  function onEvent(event: SSEEvent) {
    if (event.projectId === projectId) {
      try {
        res.write(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`)
      } catch {
        clearInterval(heartbeat)
        eventBus.off('sse', onEvent)
      }
    }
  }

  eventBus.on('sse', onEvent)

  req.on('close', () => {
    clearInterval(heartbeat)
    eventBus.off('sse', onEvent)
  })
})

export default router

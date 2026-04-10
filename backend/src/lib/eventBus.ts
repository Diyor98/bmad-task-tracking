import { EventEmitter } from 'events'

export interface SSEEvent {
  type: string
  projectId: string
  data: unknown
}

class AppEventBus extends EventEmitter {
  emitSSE(event: SSEEvent) {
    this.emit('sse', event)
  }
}

export const eventBus = new AppEventBus()
eventBus.setMaxListeners(0) // unlimited — each SSE client adds a listener

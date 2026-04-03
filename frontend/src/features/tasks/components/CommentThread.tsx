import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useComments, useCreateComment } from '../hooks/useComments'

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface Props {
  taskId: string
}

export function CommentThread({ taskId }: Props) {
  const { data: comments } = useComments(taskId)
  const createComment = useCreateComment(taskId)
  const [body, setBody] = useState('')

  function handleSubmit() {
    if (!body.trim()) return
    createComment.mutate(body.trim(), { onSuccess: () => setBody('') })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col">
      <h4 className="mb-3 text-sm font-medium text-zinc-700">Comments</h4>

      <div className="flex-1 space-y-3 overflow-auto">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-medium text-zinc-600">
                {getInitials(comment.author.name)}
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium text-zinc-900">{comment.author.name}</span>
                  <span className="text-[10px] text-zinc-400">{relativeTime(comment.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap text-xs text-zinc-600">{comment.body}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="py-4 text-center text-xs text-zinc-400">Be the first to comment</p>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <textarea
          className="flex-1 resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          placeholder="Add a comment..."
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          size="icon"
          className="h-auto self-end"
          disabled={!body.trim() || createComment.isPending}
          onClick={handleSubmit}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useCreateTask } from '../hooks/useTasks'

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
  statusId: string
}

export function CreateTaskDialog({ open, onClose, projectId, statusId }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('')
  const [dueDate, setDueDate] = useState('')
  const createTask = useCreateTask()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createTask.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        projectId,
        statusId,
        priority: priority || null,
        dueDate: dueDate ? `${dueDate}T00:00:00.000Z` : null,
      },
      {
        onSuccess: () => {
          setTitle('')
          setDescription('')
          setPriority('')
          setDueDate('')
          onClose()
        },
      },
    )
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setTitle('')
      setDescription('')
      setPriority('')
      setDueDate('')
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="task-title" className="mb-1 block text-sm font-medium text-zinc-700">Title</label>
            <input
              id="task-title"
              type="text"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="task-desc" className="mb-1 block text-sm font-medium text-zinc-700">Description (optional)</label>
            <textarea
              id="task-desc"
              className="w-full resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="task-priority" className="mb-1 block text-sm font-medium text-zinc-700">Priority (optional)</label>
              <select
                id="task-priority"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="task-duedate" className="mb-1 block text-sm font-medium text-zinc-700">Due date (optional)</label>
              <input
                id="task-duedate"
                type="date"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={!title.trim() || createTask.isPending}>
              {createTask.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

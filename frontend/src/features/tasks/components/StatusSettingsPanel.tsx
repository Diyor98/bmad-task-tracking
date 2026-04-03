import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/features/projects/components/ConfirmDialog'

interface Status {
  id: string
  name: string
  color: string
  order: number
}

const DEFAULT_NAMES = ['To Do', 'In Progress', 'In Review', 'Done']

interface Props {
  projectId: string
  statuses: Status[]
  onClose: () => void
}

export function StatusSettingsPanel({ projectId, statuses, onClose }: Props) {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Status | null>(null)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(projectId) })
  }

  const createStatus = useMutation({
    mutationFn: async (name: string) => {
      await apiClient.post(`/projects/${projectId}/statuses`, { name, color: 'zinc-400' })
    },
    onSuccess: () => { invalidate(); setNewName('') },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await apiClient.patch(`/projects/${projectId}/statuses/${id}`, { name })
    },
    onSuccess: () => { invalidate(); setEditingId(null) },
  })

  const deleteStatus = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/projects/${projectId}/statuses/${id}`)
    },
    onSuccess: () => { invalidate(); setDeleteTarget(null) },
  })

  function startEdit(status: Status) {
    setEditingId(status.id)
    setEditName(status.name)
  }

  function saveEdit(id: string) {
    if (editName.trim() && editName !== statuses.find((s) => s.id === id)?.name) {
      updateStatus.mutate({ id, name: editName.trim() })
    } else {
      setEditingId(null)
    }
  }

  return (
    <>
      <div className="flex h-full w-[320px] flex-col border-l border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <span className="text-sm font-medium text-zinc-900">Status Settings</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-2">
          {statuses.map((status) => (
            <div key={status.id} className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2">
              {editingId === status.id ? (
                <input
                  className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => saveEdit(status.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(status.id); if (e.key === 'Escape') setEditingId(null) }}
                  autoFocus
                />
              ) : (
                <span
                  className="flex-1 cursor-pointer text-sm text-zinc-700 hover:text-zinc-900"
                  onClick={() => startEdit(status)}
                >
                  {status.name}
                </span>
              )}
              {!DEFAULT_NAMES.includes(status.name) && editingId !== status.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-400 hover:text-red-500"
                  onClick={() => setDeleteTarget(status)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-200 p-4">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              placeholder="New status name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && newName.trim()) createStatus.mutate(newName.trim()) }}
            />
            <Button size="icon" disabled={!newName.trim() || createStatus.isPending} onClick={() => createStatus.mutate(newName.trim())}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteStatus.mutate(deleteTarget.id)}
        title="Delete this status?"
        description="Tasks will be moved to 'To Do'."
        isPending={deleteStatus.isPending}
      />
    </>
  )
}

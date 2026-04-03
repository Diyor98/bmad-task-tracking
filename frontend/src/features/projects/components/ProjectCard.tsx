import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUpdateProject, useDeleteProject } from '../hooks/useProjects'
import { ConfirmDialog } from './ConfirmDialog'

interface Props {
  project: { id: string; name: string; _count: { tasks: number } }
}

export function ProjectCard({ project }: Props) {
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(project.name)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

  function handleSaveEdit() {
    if (editName.trim() && editName !== project.name) {
      updateProject.mutate({ id: project.id, name: editName.trim() })
    }
    setEditing(false)
  }

  return (
    <>
      <div
        className="group relative cursor-pointer rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        onClick={() => { if (!editing) navigate(`/projects/${project.id}`) }}
      >
        <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditing(true) }}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {editing ? (
          <input
            className="w-full rounded-md border border-zinc-300 px-2 py-1 text-base font-medium text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditing(false) }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <h3 className="text-base font-medium text-zinc-900">{project.name}</h3>
        )}
        <p className="mt-1 text-sm text-zinc-500">{project._count.tasks} task{project._count.tasks !== 1 ? 's' : ''}</p>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteProject.mutate(project.id, { onSuccess: () => setConfirmDelete(false) })}
        title="Delete this project?"
        description="This cannot be undone. All tasks, statuses, and comments will be permanently deleted."
        isPending={deleteProject.isPending}
      />
    </>
  )
}

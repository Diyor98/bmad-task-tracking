import { useState, useMemo, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'
import { useTasks, useUpdateTask, useDeleteTask } from '../hooks/useTasks'
import { BoardColumn } from './BoardColumn'
import { TaskDetailPanel } from './TaskDetailPanel'
import { CreateTaskDialog } from './CreateTaskDialog'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChevronDown, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusSettingsPanel } from './StatusSettingsPanel'

interface Project {
  id: string
  name: string
  statuses: { id: string; name: string; color: string; order: number }[]
}

interface User {
  id: string
  name: string
  email: string
}

export function BoardPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedTaskId = searchParams.get('task')

  const navigate = useNavigate()
  const [createForStatus, setCreateForStatus] = useState<string | null>(null)
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null)
  const [showStatusSettings, setShowStatusSettings] = useState(false)

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: queryKeys.projects.detail(projectId!),
    queryFn: async () => {
      const res = await apiClient.get<{ data: Project }>(`/projects/${projectId}`)
      return res.data.data
    },
    enabled: !!projectId,
  })

  const { data: tasks, isLoading: tasksLoading } = useTasks(projectId!)
  const { data: users } = useQuery({
    queryKey: queryKeys.users.all,
    queryFn: async () => {
      const res = await apiClient.get<{ data: User[] }>('/users')
      return res.data.data
    },
  })

  const { data: allProjects } = useProjects()
  const updateTask = useUpdateTask(projectId!)
  const deleteTask = useDeleteTask(projectId!)

  const selectedTask = useMemo(
    () => tasks?.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  )

  const filteredTasks = useMemo(
    () => assigneeFilter ? tasks?.filter((t) => t.assigneeId === assigneeFilter) : tasks,
    [tasks, assigneeFilter],
  )

  const assigneesWithTasks = useMemo(() => {
    if (!tasks || !users) return []
    const ids = new Set(tasks.filter((t) => t.assigneeId).map((t) => t.assigneeId!))
    return users.filter((u) => ids.has(u.id))
  }, [tasks, users])

  useEffect(() => {
    if (selectedTaskId && !tasksLoading && tasks && !selectedTask) {
      setSearchParams({})
    }
  }, [selectedTaskId, tasksLoading, tasks, selectedTask, setSearchParams])

  function openTask(taskId: string) {
    setSearchParams({ task: taskId })
  }

  function closeTask() {
    setSearchParams({})
  }

  if (projectLoading || tasksLoading) {
    return (
      <div className="p-6">
        <div className="mb-6 h-7 w-48 animate-pulse rounded bg-zinc-200" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[240px] flex-1">
              <div className="mb-3 h-5 w-24 animate-pulse rounded bg-zinc-200" />
              <div className="space-y-2">
                {[1, 2].map((j) => (
                  <div key={j} className="h-20 animate-pulse rounded-lg bg-zinc-200" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-auto p-6">
        {/* Header with project switcher */}
        <div className="mb-4 flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 text-xl font-semibold text-zinc-900 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded">
              {project.name} <ChevronDown className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {allProjects?.map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className={p.id === projectId ? 'font-semibold' : ''}
                >
                  {p.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowStatusSettings(!showStatusSettings)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Assignee Filter Bar */}
        {assigneesWithTasks.length > 0 && (
          <div className="mb-4 flex gap-2">
            <button
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!assigneeFilter ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
              onClick={() => setAssigneeFilter(null)}
            >
              All
            </button>
            {assigneesWithTasks.map((u) => (
              <button
                key={u.id}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${assigneeFilter === u.id ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                onClick={() => setAssigneeFilter(assigneeFilter === u.id ? null : u.id)}
              >
                {u.name}
              </button>
            ))}
          </div>
        )}

        {/* Board Columns */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {project.statuses.map((status) => (
            <BoardColumn
              key={status.id}
              status={status}
              tasks={(filteredTasks || []).filter((t) => t.statusId === status.id)}
              allStatuses={project.statuses}
              onStatusChange={(taskId, statusId) => updateTask.mutate({ id: taskId, statusId })}
              onTaskClick={openTask}
              onTaskDelete={(taskId) => deleteTask.mutate(taskId)}
              onAddTask={(statusId) => setCreateForStatus(statusId)}
            />
          ))}
        </div>
      </div>

      {/* Task Detail Panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          statuses={project.statuses}
          users={users || []}
          onClose={closeTask}
          onUpdate={(data) => updateTask.mutate({ id: selectedTask.id, ...data })}
        />
      )}

      {/* Status Settings Panel */}
      {showStatusSettings && (
        <StatusSettingsPanel
          projectId={projectId!}
          statuses={project.statuses}
          onClose={() => setShowStatusSettings(false)}
        />
      )}

      {/* Create Task Dialog */}
      {createForStatus && (
        <CreateTaskDialog
          open={!!createForStatus}
          onClose={() => setCreateForStatus(null)}
          projectId={projectId!}
          statusId={createForStatus}
        />
      )}
    </div>
  )
}

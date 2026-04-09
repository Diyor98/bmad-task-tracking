import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragOverlay, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { apiClient } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'
import { useTasks, useUpdateTask, useDeleteTask, useReorderTask } from '../hooks/useTasks'
import type { Task } from '../hooks/useTasks'
import { BoardColumn } from './BoardColumn'
import { TaskCardOverlay } from './TaskCard'
import { TaskDetailPanel } from './TaskDetailPanel'
import { CreateTaskDialog } from './CreateTaskDialog'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChevronDown, Settings, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set())
  const [assigneeFilter, setAssigneeFilter] = useState<Set<string>>(new Set())
  const [priorityFilter, setPriorityFilter] = useState<Set<string>>(new Set())
  const [showStatusSettings, setShowStatusSettings] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

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
  const updateTask = useUpdateTask(projectId!, project?.statuses)
  const deleteTask = useDeleteTask(projectId!)
  const reorderTask = useReorderTask(projectId!)

  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const selectedTask = useMemo(
    () => tasks?.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  )

  const trimmedSearch = searchQuery.trim()
  const hasActiveFilters = trimmedSearch !== '' || statusFilter.size > 0 || assigneeFilter.size > 0 || priorityFilter.size > 0

  const filteredTasks = useMemo(() => {
    if (!tasks) return []
    const query = trimmedSearch.toLowerCase()
    return tasks.filter((t) => {
      if (query && !t.title.toLowerCase().includes(query)) return false
      if (statusFilter.size > 0 && !statusFilter.has(t.statusId)) return false
      if (assigneeFilter.size > 0 && !(t.assigneeId && assigneeFilter.has(t.assigneeId))) return false
      if (priorityFilter.size > 0 && !(priorityFilter.has(t.priority || 'none'))) return false
      return true
    })
  }, [tasks, trimmedSearch, statusFilter, assigneeFilter, priorityFilter])

  const allSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const noSensors = useSensors()
  const sensors = hasActiveFilters ? noSensors : allSensors

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasks?.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }, [tasks])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const draggedTask = tasks?.find((t) => t.id === active.id)
    if (!draggedTask) return
    const columnTasks = (tasks || [])
      .filter((t) => t.statusId === draggedTask.statusId)
      .sort((a, b) => a.position - b.position)
    const overIndex = columnTasks.findIndex((t) => t.id === over.id)
    if (overIndex === -1) return
    reorderTask.mutate({ id: draggedTask.id, position: overIndex }, {
      onError: () => setStatusError("Couldn't save — try again"),
    })
  }, [tasks, reorderTask])

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

  useEffect(() => {
    if (statusError) {
      const timer = setTimeout(() => setStatusError(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [statusError])

  const handleStatusChange = useCallback((taskId: string, statusId: string) => {
    updateTask.mutate({ id: taskId, statusId }, {
      onError: () => setStatusError("Couldn't save — try again"),
    })
  }, [updateTask])

  function toggleSetItem(setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) {
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearFilters() {
    setSearchQuery('')
    setStatusFilter(new Set())
    setAssigneeFilter(new Set())
    setPriorityFilter(new Set())
  }

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
      {statusError && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700 shadow-md">
          {statusError}
        </div>
      )}
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
                  onClick={() => { clearFilters(); navigate(`/projects/${p.id}`) }}
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

        {/* Search and Filter Bar */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-zinc-50"
              />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-700" onClick={clearFilters}>
                <X className="mr-1 h-3.5 w-3.5" /> Clear filters
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-zinc-500">Status:</span>
            {project.statuses.map((s) => (
              <button
                key={s.id}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter.has(s.id) ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                onClick={() => toggleSetItem(setStatusFilter, s.id)}
              >
                {s.name}
              </button>
            ))}

            <span className="ml-2 border-l border-zinc-200 pl-2 text-xs font-medium text-zinc-500">Priority:</span>
            {(['none', 'low', 'medium', 'high', 'urgent'] as const).map((p) => (
              <button
                key={p}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${priorityFilter.has(p) ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                onClick={() => toggleSetItem(setPriorityFilter, p)}
              >
                {p === 'none' ? 'None' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}

            {assigneesWithTasks.length > 0 && (
              <>
                <span className="ml-2 border-l border-zinc-200 pl-2 text-xs font-medium text-zinc-500">Assignee:</span>
                {assigneesWithTasks.map((u) => (
                  <button
                    key={u.id}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${assigneeFilter.has(u.id) ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                    onClick={() => toggleSetItem(setAssigneeFilter, u.id)}
                  >
                    {u.name}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Board Columns */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {project.statuses.map((status) => (
              <BoardColumn
                key={status.id}
                status={status}
                tasks={filteredTasks.filter((t) => t.statusId === status.id)}
                totalTaskCount={(tasks || []).filter((t) => t.statusId === status.id).length}
                allStatuses={project.statuses}
                onStatusChange={handleStatusChange}
                onTaskClick={openTask}
                onTaskDelete={(taskId) => deleteTask.mutate(taskId)}
                onAddTask={(statusId) => setCreateForStatus(statusId)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? (
              <TaskCardOverlay task={activeTask} />
            ) : null}
          </DragOverlay>
        </DndContext>
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

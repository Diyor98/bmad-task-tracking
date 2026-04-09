export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    detail: (id: string) => ['projects', id] as const,
  },
  tasks: {
    byProject: (projectId: string) => ['tasks', projectId] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
  },
  comments: {
    byTask: (taskId: string) => ['comments', taskId] as const,
  },
  users: {
    all: ['users'] as const,
  },
  attachments: {
    byTask: (taskId: string) => ['attachments', taskId] as const,
  },
  auth: {
    me: ['auth', 'me'] as const,
  },
}

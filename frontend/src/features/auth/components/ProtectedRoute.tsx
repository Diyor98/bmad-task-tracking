import { Navigate } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="flex h-screen bg-zinc-50">
        <div className="w-14 animate-pulse bg-zinc-200" />
        <div className="flex-1 p-6">
          <div className="mb-6 h-7 w-48 animate-pulse rounded bg-zinc-200" />
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-[240px] flex-1 space-y-2">
                <div className="h-5 w-24 animate-pulse rounded bg-zinc-200" />
                <div className="h-20 animate-pulse rounded-lg bg-zinc-200" />
                <div className="h-20 animate-pulse rounded-lg bg-zinc-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError || !user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppSidebar } from '@/components/AppSidebar'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { LoginPage } from '@/features/auth/components/LoginPage'
import { RegisterPage } from '@/features/auth/components/RegisterPage'
import { Dashboard } from '@/features/projects/components/Dashboard'
import { BoardPage } from '@/features/tasks/components/BoardPage'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-hidden bg-zinc-50">
        {children}
      </main>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/projects/:id" element={<BoardPage />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App

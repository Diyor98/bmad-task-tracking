import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppSidebar } from '@/components/AppSidebar'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { LoginPage } from '@/features/auth/components/LoginPage'
import { RegisterPage } from '@/features/auth/components/RegisterPage'

function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-auto bg-zinc-50">
        <div className="p-6">
          <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-500">Your projects will appear here.</p>
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App

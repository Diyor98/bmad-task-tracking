import { AppSidebar } from '@/components/AppSidebar'

function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-auto bg-zinc-50">
        {/* Main content area */}
      </main>
    </div>
  )
}

export default App

import { LayoutDashboard, LogOut } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import { useLogout } from '@/features/auth/hooks/useAuth'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
]

export function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useLogout()

  return (
    <TooltipPrimitive.Provider>
      <aside className="w-14 bg-zinc-900 h-full flex flex-col items-center py-4 gap-2 shrink-0">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path
          return (
            <TooltipPrimitive.Root key={label}>
              <TooltipPrimitive.Trigger
                aria-label={label}
                className={`p-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isActive ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                onClick={() => navigate(path)}
              >
                <Icon size={20} />
              </TooltipPrimitive.Trigger>
              <TooltipPrimitive.Portal>
                <TooltipPrimitive.Positioner side="right" sideOffset={8}>
                  <TooltipPrimitive.Popup className="z-50 rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-white shadow-md">
                    {label}
                  </TooltipPrimitive.Popup>
                </TooltipPrimitive.Positioner>
              </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
          )
        })}

        <div className="mt-auto">
          <TooltipPrimitive.Root>
            <TooltipPrimitive.Trigger
              aria-label="Log out"
              className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              onClick={() => logout.mutate()}
            >
              <LogOut size={20} />
            </TooltipPrimitive.Trigger>
            <TooltipPrimitive.Portal>
              <TooltipPrimitive.Positioner side="right" sideOffset={8}>
                <TooltipPrimitive.Popup className="z-50 rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-white shadow-md">
                  Log out
                </TooltipPrimitive.Popup>
              </TooltipPrimitive.Positioner>
            </TooltipPrimitive.Portal>
          </TooltipPrimitive.Root>
        </div>
      </aside>
    </TooltipPrimitive.Provider>
  )
}

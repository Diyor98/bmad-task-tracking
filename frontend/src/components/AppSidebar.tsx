import { useState } from 'react'
import { LayoutDashboard, LogOut, Bell } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import { useLogout } from '@/features/auth/hooks/useAuth'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { NotificationDropdown } from '@/features/notifications/components/NotificationDropdown'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
]

export function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useLogout()
  const { data: notifications } = useNotifications()
  const [notifOpen, setNotifOpen] = useState(false)
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0

  return (
    <TooltipPrimitive.Provider>
      <aside className="w-14 bg-zinc-900 h-full flex flex-col items-center py-4 gap-2 shrink-0">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path
          return (
            <TooltipPrimitive.Root key={label}>
              <TooltipPrimitive.Trigger
                aria-label={label}
                className={`p-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isActive ? 'text-white bg-indigo-600' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
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

        <div className="mt-auto flex flex-col items-center gap-2">
          <TooltipPrimitive.Root>
            <TooltipPrimitive.Trigger
              aria-label="Notifications"
              data-notification-bell
              className={`relative p-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${notifOpen ? 'text-white bg-indigo-600' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </TooltipPrimitive.Trigger>
            <TooltipPrimitive.Portal>
              <TooltipPrimitive.Positioner side="right" sideOffset={8}>
                <TooltipPrimitive.Popup className="z-50 rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-white shadow-md">
                  Notifications
                </TooltipPrimitive.Popup>
              </TooltipPrimitive.Positioner>
            </TooltipPrimitive.Portal>
          </TooltipPrimitive.Root>

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
      <NotificationDropdown open={notifOpen} onClose={() => setNotifOpen(false)} />
    </TooltipPrimitive.Provider>
  )
}

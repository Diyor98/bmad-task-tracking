import { LayoutDashboard, Settings } from 'lucide-react'
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Settings, label: 'Settings' },
]

export function AppSidebar() {
  return (
    <TooltipPrimitive.Provider>
      <aside className="w-14 bg-zinc-900 h-full flex flex-col items-center py-4 gap-2 shrink-0">
        {navItems.map(({ icon: Icon, label }) => (
          <TooltipPrimitive.Root key={label}>
            <TooltipPrimitive.Trigger
              aria-label={label}
              className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
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
        ))}
      </aside>
    </TooltipPrimitive.Provider>
  )
}

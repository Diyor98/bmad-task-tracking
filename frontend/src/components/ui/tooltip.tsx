import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { cn } from "@/lib/utils"

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <TooltipPrimitive.Provider>{children}</TooltipPrimitive.Provider>
}

function Tooltip({ children }: { children: React.ReactNode }) {
  return <TooltipPrimitive.Root>{children}</TooltipPrimitive.Root>
}

function TooltipTrigger({
  children,
  asChild: _asChild,
  ...props
}: {
  children: React.ReactNode
  asChild?: boolean
  [key: string]: unknown
}) {
  return (
    <TooltipPrimitive.Trigger render={_asChild ? (children as React.ReactElement) : undefined} {...props}>
      {_asChild ? null : children}
    </TooltipPrimitive.Trigger>
  )
}

function TooltipContent({
  className,
  children,
  ...props
}: {
  className?: string
  children: React.ReactNode
  [key: string]: unknown
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner side="right" sideOffset={8}>
        <TooltipPrimitive.Popup
          className={cn(
            "z-50 rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-md",
            className
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

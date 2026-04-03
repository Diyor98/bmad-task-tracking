import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Status {
  id: string
  name: string
  color: string
}

const colorMap: Record<string, string> = {
  'zinc-400': 'bg-zinc-400',
  'blue-500': 'bg-blue-500',
  'amber-500': 'bg-amber-500',
  'red-500': 'bg-red-500',
  'green-500': 'bg-green-500',
}

interface Props {
  status: Status
  statuses: Status[]
  onStatusChange: (statusId: string) => void
}

export function StatusChip({ status, statuses, onStatusChange }: Props) {
  const [updating, setUpdating] = useState(false)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-700 transition-opacity hover:border-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${updating ? 'opacity-60' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <span className={`h-2 w-2 rounded-full ${colorMap[status.color] || 'bg-zinc-400'}`} />
          {status.name}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        {statuses.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onClick={() => {
              if (s.id !== status.id) {
                setUpdating(true)
                onStatusChange(s.id)
                setTimeout(() => setUpdating(false), 300)
              }
            }}
          >
            <span className={`mr-2 h-2 w-2 rounded-full ${colorMap[s.color] || 'bg-zinc-400'}`} />
            {s.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

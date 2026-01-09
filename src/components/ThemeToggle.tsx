import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPositioner,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="p-1.5 rounded-md hover:bg-surface transition-colors"
        title="Toggle theme"
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4 text-secondary" />
        ) : (
          <Sun className="w-4 h-4 text-secondary" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuPositioner align="end">
        <DropdownMenuContent className="w-36">
          <DropdownMenuItem
            onClick={() => setTheme('light')}
            className={cn('gap-2', theme === 'light' && 'bg-surface')}
          >
            <Sun className="w-4 h-4" />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme('dark')}
            className={cn('gap-2', theme === 'dark' && 'bg-surface')}
          >
            <Moon className="w-4 h-4" />
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme('system')}
            className={cn('gap-2', theme === 'system' && 'bg-surface')}
          >
            <Monitor className="w-4 h-4" />
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPositioner>
    </DropdownMenu>
  )
}

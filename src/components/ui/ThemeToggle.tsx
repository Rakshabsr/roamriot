'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-200',
        'bg-sea-50 dark:bg-sea-900/40 border border-sea-100 dark:border-sea-800/50',
        'hover:bg-sea-100 dark:hover:bg-sea-900/70 hover:border-sea-200 dark:hover:border-sea-700',
        'text-sea-700 dark:text-sea-300',
        className
      )}
    >
      {theme === 'dark'
        ? <Sun size={15} className="text-sage-400" />
        : <Moon size={15} />
      }
    </button>
  )
}

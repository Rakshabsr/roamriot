'use client'

import { useEffect } from 'react'
import { Check, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ToastData {
  message: string
  type: 'success' | 'error'
}

interface ToastProps extends ToastData {
  onDismiss: () => void
}

export function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 rounded-2xl shadow-lift',
        'flex items-center gap-2.5 text-sm font-semibold animate-fade-up',
        type === 'success'
          ? 'bg-sage-500 text-white'
          : 'bg-red-500 text-white'
      )}
    >
      {type === 'success'
        ? <Check size={15} strokeWidth={2.5} />
        : <AlertCircle size={15} />
      }
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X size={13} />
      </button>
    </div>
  )
}

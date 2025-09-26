'use client'

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

type Toast = {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

type ToastCtx = {
  toasts: Toast[]
  show: (t: Omit<Toast, 'id'>) => string
  dismiss: (id: string) => void
}

const Ctx = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Record<string, any>>({})

  const dismiss = useCallback((id: string) => {
    setToasts((arr) => arr.filter((t) => t.id !== id))
    const tm = timers.current[id]
    if (tm) clearTimeout(tm)
    delete timers.current[id]
  }, [])

  const show = useCallback<ToastCtx['show']>(
    (t) => {
      const id = Math.random().toString(36).slice(2)
      const duration = t.duration ?? (t.variant === 'destructive' ? 6000 : 3500)
      setToasts((arr) => [...arr, { id, ...t, duration }])
      timers.current[id] = setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toasts, show, dismiss }), [toasts, show, dismiss])

  return (
    <Ctx.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onClose={dismiss} />
    </Ctx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

function ToastViewport({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-96 max-w-[calc(100vw-32px)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={
            'pointer-events-auto rounded-md border bg-background/95 p-3 shadow backdrop-blur ' +
            (t.variant === 'destructive' ? 'border-destructive/50 text-destructive-foreground' : '')
          }
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {t.title && <div className="font-medium leading-none">{t.title}</div>}
              {t.description && (
                <div className="mt-1 text-sm text-muted-foreground">{t.description}</div>
              )}
            </div>
            <button
              className="rounded p-1 text-sm text-muted-foreground hover:bg-accent"
              onClick={() => onClose(t.id)}
              aria-label="关闭通知"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

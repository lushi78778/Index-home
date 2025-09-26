'use client'

import React from 'react'

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
      {/* 提升可访问性：显式声明为对话框并设置 aria-modal */}
      <div
        className="relative z-10 w-[92vw] max-w-lg rounded-lg border bg-background p-4 shadow-lg"
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 space-y-1">{children}</div>
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold leading-none tracking-tight">{children}</h3>
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 flex justify-end gap-2">{children}</div>
}

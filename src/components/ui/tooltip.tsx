"use client"

import React, { useEffect, useRef, useState } from 'react'

export function Tooltip({ label, children }: { label: string; children: React.ReactElement }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <div role="tooltip" className="absolute left-1/2 top-full z-50 -translate-x-1/2 translate-y-2 rounded bg-foreground px-2 py-1 text-xs text-background shadow">
          {label}
        </div>
      )}
    </div>
  )}

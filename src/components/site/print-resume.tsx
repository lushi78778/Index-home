"use client"

import { Button } from '@/components/ui/button'

export function PrintResumeButton() {
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => window.print()}
      aria-label="打印 / 保存为 PDF"
    >
      打印 / 保存为 PDF
    </Button>
  )
}

'use client'

import { useEffect, useRef } from 'react'
import sanitizeHtml from 'sanitize-html'
import type { MindMapDiagram } from '@/lib/yuque'
import './mind-map.css'

const isServer = typeof window === 'undefined'

function toMindElixirNode(node: any) {
  const topic = sanitizeHtml(node?.html || '', { allowedTags: [], allowedAttributes: {} })
  const children = Array.isArray(node?.children) ? node.children.map(toMindElixirNode) : []
  return {
    id: node?.id || Math.random().toString(36).slice(2),
    topic: topic || '(未命名)',
    children,
  }
}

function makeMindElixirData(diagram: MindMapDiagram) {
  const root = Array.isArray(diagram?.body) ? diagram.body[0] : null
  if (!root) {
    return {
      nodeData: {
        id: 'root',
        topic: '(空白思维导图)',
      },
    }
  }
  const nodeData = toMindElixirNode(root)
  return { nodeData }
}

export function MindMapCanvas({ diagram }: { diagram: MindMapDiagram }) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (isServer) return
    const refEl = containerRef.current
    if (!refEl) return undefined
    const element = refEl as HTMLElement

    let mind: any = null
    let disposed = false

    async function renderMind() {
      const MindElixir = (await import('mind-elixir')).default
      if (disposed) return
      element.innerHTML = ''
      mind = new MindElixir({
        el: element,
        direction: MindElixir.RIGHT,
        editable: false,
        contextMenu: false,
        toolBar: false,
        draggable: false,
      })
      const data = makeMindElixirData(diagram)
      mind.init(data)
      mind.resize()
    }

    renderMind()

    return () => {
      disposed = true
      element.innerHTML = ''
      if (mind && typeof mind.destroy === 'function') mind.destroy()
    }
  }, [diagram])

  if (isServer) {
    return <div className="mind-map-placeholder">思维导图加载中…</div>
  }

  return <div ref={containerRef} className="mind-map-canvas" />
}

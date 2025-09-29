/**
 * @file 搜索页（服务端入口）
 * @description 包裹客户端搜索组件，并提供 Suspense 兜底。
 */
import { Suspense } from 'react'
import { SearchClient } from './search-client'

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">加载中…</div>}>
      <SearchClient />
    </Suspense>
  )
}

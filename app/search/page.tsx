import { Suspense } from 'react'
import { SearchClient } from './search-client'

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">加载中…</div>}>
      <SearchClient />
    </Suspense>
  )
}

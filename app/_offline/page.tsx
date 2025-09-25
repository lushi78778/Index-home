export const runtime = 'edge'

export default function OfflinePage() {
  return (
    <main className="container mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold">离线模式</h1>
      <p className="mt-2 text-muted-foreground">当前网络不可用，展示离线页面。稍后将自动恢复。</p>
    </main>
  )
}

export default function Head({ params }: { params: { page: string } }) {
  const n = Math.max(1, Number(params.page || '1'))
  return (
    <>
      {n > 1 ? <link rel="prev" href={`/blog/page/${n - 1}`} /> : null}
      <link rel="next" href={`/blog/page/${n + 1}`} />
      {/* 分页页保留可索引；若使用筛选参数请在 /blog 中 noindex */}
    </>
  )
}

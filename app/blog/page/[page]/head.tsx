export default function Head({ params }: { params: { page: string } }) {
  const n = Math.max(1, Number(params.page || '1'))
  return (
    <>
      {n > 1 ? <link rel="prev" href={`/blog/page/${n - 1}`} /> : null}
      <link rel="next" href={`/blog/page/${n + 1}`} />
    </>
  )
}

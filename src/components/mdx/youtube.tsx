export function YouTube({ id, title }: { id: string; title?: string }) {
  return (
    <div className="my-4 aspect-video w-full overflow-hidden rounded-md border">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube.com/embed/${id}`}
        title={title || 'YouTube video player'}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  )
}

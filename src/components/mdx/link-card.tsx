import Link from 'next/link'

export function LinkCard({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description?: string
}) {
  const isExternal = /^https?:/i.test(href)
  const content = (
    <div className="rounded-lg border p-3 transition-colors hover:bg-accent">
      <div className="font-medium">{title}</div>
      {description && <div className="text-sm text-muted-foreground">{description}</div>}
      <div className="mt-1 text-xs text-muted-foreground break-all">{href}</div>
    </div>
  )
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="no-underline">
        {content}
      </a>
    )
  }
  return (
    <Link href={href as any} className="no-underline">
      {content}
    </Link>
  )
}

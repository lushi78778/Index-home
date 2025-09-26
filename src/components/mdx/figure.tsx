import Image from 'next/image'

export function Figure({
  src,
  alt,
  width,
  height,
  caption,
}: {
  src: string
  alt?: string
  width?: number
  height?: number
  caption?: string
}) {
  return (
    <figure className="my-4">
      {width && height ? (
        <Image src={src} alt={alt || ''} width={width} height={height} className="rounded-md" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt || ''} className="rounded-md" />
      )}
      {caption && (
        <figcaption className="mt-2 text-center text-xs text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

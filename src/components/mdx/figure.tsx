/**
 * @file Figure 图片与说明
 * @description 优先使用 next/image，缺失宽高时退化为 16:9 容器 + fill，自适应展示；可选图注。
 */
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
        <Image
          src={src}
          alt={alt || ''}
          width={width}
          height={height}
          className="rounded-md"
          sizes="(max-width: 768px) 100vw, 768px"
        />
      ) : (
        <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
          <Image
            src={src}
            alt={alt || ''}
            fill
            className="rounded-md object-contain"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}
      {caption && (
        <figcaption className="mt-2 text-center text-xs text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

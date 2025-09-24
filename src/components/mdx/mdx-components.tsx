import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'

// 自定义 MDX 组件映射：用于控制文章内元素的样式与行为
export const mdxComponents = {
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const href = props.href || '#'
    // 外链新窗口打开，内链使用 next/link
    const isExternal = /^https?:/i.test(href)
    if (isExternal) {
      return (
        <a
          {...props}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-4"
        />
      )
    }
    return (
      <Link href={href as any} className="text-primary underline underline-offset-4">
        {props.children as React.ReactNode}
      </Link>
    )
  },
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // 优先使用 next/image；若未提供宽高，回退到原生 img
    if (props.width && props.height) {
      // eslint-disable-next-line @next/next/no-img-element
      return (
        <Image
          src={props.src || ''}
          alt={props.alt || ''}
          width={Number(props.width)}
          height={Number(props.height)}
          className="rounded-md"
        />
      )
    }
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} className="rounded-md" />
  },
}

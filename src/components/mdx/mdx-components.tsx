import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Pre } from './pre'
import { Callout } from './callout'
import { Figure } from './figure'
import { LinkCard } from './link-card'
import { Aside } from './aside'
import { Kbd } from './kbd'
import { YouTube } from './youtube'

// 自定义 MDX 组件映射：用于控制文章内元素的样式与行为
export const mdxComponents = {
  // 行为增强：代码块复制
  pre: Pre,
  // 常用内容组件
  Callout,
  Figure,
  LinkCard,
  Aside,
  Kbd,
  YouTube,
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
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote {...props} className="border-l-4 pl-4 italic text-muted-foreground" />
  ),
  // 说明：为了兼容老内容或不方便标注尺寸的图片，当 width/height 缺失时允许回退到原生 <img>
  // 我们优先使用 next/image；下方在必要处显式关闭相关 ESLint 规则。
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
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMScgaGVpZ2h0PScxJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLz4="
          sizes="(max-width: 768px) 100vw, 768px"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      )
    }
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        {...props}
        alt={props.alt || ''}
        className="rounded-md"
        loading={props.loading || 'lazy'}
        decoding={(props as any).decoding || 'async'}
        referrerPolicy={(props as any).referrerPolicy || 'no-referrer'}
      />
    )
  },
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-4 w-full overflow-x-auto">
      <table
        {...props}
        className="w-full text-left text-sm [&_th]:border-b [&_td]:border-b [&_th]:py-2 [&_td]:py-2"
      />
    </div>
  ),
}

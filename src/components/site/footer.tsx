/**
 * @file 页脚
 * @description 展示版权信息、联系入口、备案信息；可选显示悬浮备案条目。
 */
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export function Footer() {
  const icp = siteConfig.record?.icp
  const police = siteConfig.record?.police
  const hasFooterRecord = !!(icp || police)
  const hasFloatingICP = !!(icp?.url && icp?.number)
  const hasFloatingPolice = !!(police?.url && police?.number)
  const showFloating = hasFloatingICP || hasFloatingPolice
  return (
    <footer className="relative border-t py-8 text-center text-sm text-muted-foreground">
      <div className="container mx-auto px-4 space-y-2">
        <div>
          © {new Date().getFullYear()} {siteConfig.name} · 保留所有权利
        </div>
        {/* 联系入口放在底部 */}
        <div>
          <Link href="/contact" className="underline">
            联系
          </Link>
          {siteConfig.social?.email && (
            <span className="ml-2">
              · 邮箱：
              <a className="underline" href={`mailto:${siteConfig.social.email}`}>
                {siteConfig.social.email}
              </a>
            </span>
          )}
          <span className="ml-2">
            ·{' '}
            <Link href="/policies" className="underline">
              合规与使用说明
            </Link>
          </span>
        </div>
        {hasFooterRecord && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {icp?.number && icp?.url && (
              <a href={icp.url} target="_blank" rel="noreferrer" className="hover:text-foreground">
                {icp.number}
              </a>
            )}
            {police?.number && police?.url && (
              <a
                href={police.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-foreground"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2l7 3v6c0 5-3.5 9.74-7 11-3.5-1.26-7-6-7-11V5l7-3z" />
                </svg>
                <span>{police.number}</span>
              </a>
            )}
          </div>
        )}
      </div>
      {/* 悬挂式公安备案（可选） */}
      {showFloating && (
        <div className="fixed bottom-4 right-4 space-y-2 text-xs">
          {hasFloatingICP && (
            <a
              href={icp!.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded bg-background/70 px-2 py-1 shadow hover:bg-background"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M4 4h16v2H4zm0 6h16v2H4zm0 6h16v2H4z" />
              </svg>
              <span>{icp!.number}</span>
            </a>
          )}
          {hasFloatingPolice && (
            <a
              href={police!.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded bg-background/70 px-2 py-1 shadow hover:bg-background"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2l7 3v6c0 5-3.5 9.74-7 11-3.5-1.26-7-6-7-11V5l7-3z" />
              </svg>
              <span>{police!.number}</span>
            </a>
          )}
        </div>
      )}
    </footer>
  )
}

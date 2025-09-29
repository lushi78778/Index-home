/**
 * @file Kbd 键盘标记
 * @description 以等宽字体与高亮背景展示按键提示（如 ⌘/Ctrl）。
 */
export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[0.8em] font-mono">{children}</kbd>
  )
}

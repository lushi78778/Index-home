/**
 * 工具方法集合
 */

// Tailwind 类名合并：用于条件拼接 className
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

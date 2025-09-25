/**
 * @file 工具函数集合
 * @description 提供项目中常用的辅助函数。
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合并 Tailwind CSS 类名，并处理潜在的样式冲突。
 *
 * @example
 * cn("p-4", "bg-red-500", "bg-blue-500") // => "p-4 bg-blue-500"
 * cn("text-lg", { "font-bold": true, "text-red-500": false }) // => "text-lg font-bold"
 *
 * @param {...ClassValue[]} inputs - 一系列类名。可以是字符串、对象或数组。
 * @returns {string} - 合并和优化后的最终类名字符串。
 */
export function cn(...inputs: ClassValue[]) {
  // `clsx` 用于将各种形式的类名输入（字符串、对象、数组）转换为一个单一的字符串。
  // `twMerge` 则负责解析这个字符串，移除因 Tailwind CSS 优先级规则而冗余的类。
  // 例如，`twMerge('px-2 py-1 p-3')` 会返回 `'p-3'`，因为它覆盖了更具体的 `px-2` 和 `py-1`。
  return twMerge(clsx(inputs))
}

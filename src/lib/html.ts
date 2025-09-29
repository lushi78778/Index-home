/**
 * @file HTML 消毒（Sanitize）工具
 * @description 提供统一的 HTML 消毒配置，保留常见语义标签并限制危险属性与协议，
 * 以避免 XSS（跨站脚本）与样式注入。可通过 overrides 定制。
 */
import sanitize, { type IOptions } from 'sanitize-html'

const HEX_COLOR_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const RGB_COLOR_RE = /^rgb\(\s*(?:[0-9]{1,3})\s*,\s*(?:[0-9]{1,3})\s*,\s*(?:[0-9]{1,3})\s*\)$/i
const RGBA_COLOR_RE = /^rgba\(\s*(?:[0-9]{1,3})\s*,\s*(?:[0-9]{1,3})\s*,\s*(?:[0-9]{1,3})\s*,\s*(?:0|0?\.\d+|1)\s*\)$/i
const HSL_COLOR_RE = /^hsl\(\s*-?\d+(?:\.\d+)?\s*,\s*\d+(?:\.\d+)?%\s*,\s*\d+(?:\.\d+)?%\s*\)$/i
const HSLA_COLOR_RE = /^hsla\(\s*-?\d+(?:\.\d+)?\s*,\s*\d+(?:\.\d+)?%\s*,\s*\d+(?:\.\d+)?%\s*,\s*(?:0|0?\.\d+|1)\s*\)$/i

const ALLOWED_COLOR_VALUES = [
  HEX_COLOR_RE,
  RGB_COLOR_RE,
  RGBA_COLOR_RE,
  HSL_COLOR_RE,
  HSLA_COLOR_RE,
]

// 统一的 HTML 消毒配置：在保留常见语义标签的同时，阻断脚本/内联事件等危险内容。
const baseConfig: IOptions = {
  allowedTags: sanitize.defaults.allowedTags.concat([
    'img',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'pre',
    'code',
    'iframe',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
  ]),
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding', 'referrerpolicy'],
    iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'referrerpolicy'],
    code: ['class'],
    pre: ['class'],
    '*': ['id', 'class', 'style'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'data'],
  allowedSchemesByTag: {
    iframe: ['https'], // 仅允许 https 的 iframe 源
    img: ['http', 'https', 'data'],
    // 超链接严格限制为 http/https/mailto，不允许 data: 以避免通过 data:text/html 等载入恶意内容
    a: ['http', 'https', 'mailto'],
  },
  // 仅允许有限的内联样式属性，且使用安全的值模式
  allowedStyles: {
    '*': {
      // 颜色与背景色：仅允许安全的纯色值，禁止附带额外的表达式或 URL。
      color: ALLOWED_COLOR_VALUES,
      background: [/^transparent$/i, /^none$/i, ...ALLOWED_COLOR_VALUES],
      'background-color': [/^transparent$/i, /^none$/i, ...ALLOWED_COLOR_VALUES],
      // 尺寸与布局（仅数值或百分比）
      width: [/^\d+(px|%)$/i, /^auto$/i],
      height: [/^\d+(px|%)$/i, /^auto$/i],
      'max-width': [/^\d+(px|%)$/i],
      'max-height': [/^\d+(px|%)$/i],
      'min-width': [/^\d+(px|%)$/i],
      'min-height': [/^\d+(px|%)$/i],
      // 文本装饰
      'text-align': [/^(left|right|center|justify)$/i],
      'font-weight': [/^(normal|bold|bolder|lighter|\d{3})$/],
      'font-style': [/^(normal|italic|oblique)$/i],
      'text-decoration': [/^(none|underline|line-through|overline)(\s+.*)?$/i],
      // 边距与内边距
      margin: [/^\d+(px|%)?(\s+\d+(px|%)?){0,3}$/i],
      padding: [/^\d+(px|%)?(\s+\d+(px|%)?){0,3}$/i],
      // 边框（仅允许简单像素边框）
      border: [/^\d+px\s+(solid|dashed|dotted)\s+#[0-9a-fA-F]{3,8}$/i],
      'border-radius': [/^\d+px$/i],
    },
  },
}

export function sanitizeHtml(input: string, overrides?: IOptions) {
  if (!overrides) return sanitize(input, baseConfig)
  const config: IOptions = { ...baseConfig, ...overrides }
  if (overrides.allowedTags) config.allowedTags = overrides.allowedTags
  if (overrides.allowedAttributes) config.allowedAttributes = overrides.allowedAttributes
  if (overrides.allowedSchemes) config.allowedSchemes = overrides.allowedSchemes
  return sanitize(input, config)
}

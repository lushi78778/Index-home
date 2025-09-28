import sanitize, { type IOptions } from 'sanitize-html'

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
    img: ['src', 'alt', 'title', 'width', 'height'],
    iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder'],
    code: ['class'],
    pre: ['class'],
    '*': ['id', 'class', 'style'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'data'],
}

export function sanitizeHtml(input: string, overrides?: IOptions) {
  if (!overrides) return sanitize(input, baseConfig)
  const config: IOptions = { ...baseConfig, ...overrides }
  if (overrides.allowedTags) config.allowedTags = overrides.allowedTags
  if (overrides.allowedAttributes) config.allowedAttributes = overrides.allowedAttributes
  if (overrides.allowedSchemes) config.allowedSchemes = overrides.allowedSchemes
  return sanitize(input, config)
}

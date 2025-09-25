/**
 * @file 全局站点配置
 * @description
 * 本文件集中管理整个站点的元信息、社交链接、国际化配置以及备案信息。
 * 通过单一文件进行管理，方便后续的统一修改和维护。
 */
export const siteConfig = {
  // 站点名称，将用于标题、OG 图等
  name: 'xray.top 透视实验室',
  // 站点的简称，可用于 Logo 或导航栏
  shortName: 'xray.top',
  // 站点描述，用于 SEO meta 标签
  description:
    '一个现代化、内容驱动的个人主页，集成了博客、项目展示、笔记等功能。',
  // 站点的线上 URL，请务必替换为你的实际域名
  url: 'https://example.com',

  // 作者信息
  author: {
    name: 'XRAY',
    url: 'https://example.com/about',
  },

  // 社交媒体链接
  social: {
    github: 'https://github.com/yourname',
    twitter: 'https://x.com/yourname',
    email: 'me@example.com',
  },

  // 国际化 (i18n) 配置
  locales: ['zh', 'en'], // 支持的语言列表
  defaultLocale: 'zh', // 默认语言

  // 备案信息（如果你的网站部署在中国大陆，需要填写此项）
  // 请替换为你的真实备案号
  record: {
    icp: {
      number: '粤ICP备12345678号-1',
      url: 'https://beian.miit.gov.cn',
    },
    police: {
      number: '粤公网安备 44030502000000号',
      url: 'https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=44030502000000',
    },
  },
}

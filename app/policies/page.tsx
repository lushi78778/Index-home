import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: '合规与使用说明',
  description: '本站在中国大陆运营的合规与使用说明。',
  alternates: { canonical: `${siteConfig.url}/policies` },
}

export default function PoliciesPage() {
  return (
    <div className="prose dark:prose-invert">
      <h1>合规与使用说明</h1>
      <p>
        本页说明本站在中国大陆运营时与您相关的关键信息与使用约定，旨在保护用户权益并确保符合法律法规。
      </p>

      <h2>1. 站点信息</h2>
      <ul>
        <li>站点名称：{siteConfig.name}</li>
        <li>站点域名：{siteConfig.url}</li>
        {siteConfig.record?.icp?.number ? (
          <li>
            ICP 备案号：
            <a
              href={siteConfig.record.icp.url}
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              {siteConfig.record.icp.number}
            </a>
          </li>
        ) : null}
        {siteConfig.record?.police?.number && siteConfig.record?.police?.url ? (
          <li>
            公安网安备案号：
            <a
              href={siteConfig.record.police.url}
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              {siteConfig.record.police.number}
            </a>
          </li>
        ) : null}
      </ul>

      <h2>2. 适用范围</h2>
      <p>除非另有明确约定，本说明适用于您访问、浏览及使用本站提供的公开页面与互动功能。</p>

      <h2>3. 内容与版权</h2>
      <ul>
        <li>本站发布的文章、项目说明与素材，除特别声明外，均为站长原创或整理。</li>
        <li>转载、引用请注明原文链接与作者信息；商业使用请先取得书面授权。</li>
        <li>引用第三方平台（如语雀）内容时，遵守相应平台的版权与使用条款。</li>
      </ul>

      <h2>4. 用户行为规范</h2>
      <p>您承诺遵守中国大陆现行法律法规及公序良俗，不得发布、传播或存储以下内容：</p>
      <ul>
        <li>危害国家安全、泄露国家秘密、颠覆国家政权、破坏国家统一的内容；</li>
        <li>损害国家荣誉和利益、煽动民族仇恨、民族歧视、破坏民族团结的内容；</li>
        <li>破坏国家宗教政策、宣扬邪教和封建迷信的内容；</li>
        <li>散布谣言、扰乱社会秩序、破坏社会稳定的内容；</li>
        <li>传播淫秽、色情、赌博、暴力、凶杀、恐怖或教唆犯罪的内容；</li>
        <li>侮辱或诽谤他人，侵害他人合法权益的内容；</li>
        <li>法律、行政法规禁止的其他内容。</li>
      </ul>

      <h2>5. 个人信息与 Cookie</h2>
      <ul>
        <li>本站不主动收集身份证件号码等敏感个人信息。</li>
        <li>为保证基本功能，本站可能使用必要的 Cookie；不开展跨站跟踪。</li>
        <li>
          如使用第三方统计/嵌入（例如评论、搜索、字体、CDN
          等），其数据处理以第三方说明为准。以下为目前实际使用的第三方服务清单：
        </li>
        <li>
          <strong>Plausible Analytics</strong>（可选，当前以{' '}
          {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ? '启用' : '未启用'} 为准）： 纯净、无 Cookie
          的站点访问统计，用于了解页面访问量与来源。详见其隐私说明：
          <a
            className="underline"
            href="https://plausible.io/data-policy"
            target="_blank"
            rel="noreferrer"
          >
            Data Policy
          </a>
          。
        </li>
        {/* 已移除 Giscus 评论系统 */}
        <li>
          <strong>Resend</strong>
          （邮件发送）：用于联系表单与订阅确认邮件，处理邮箱地址、邮件内容等。详见其隐私与合规说明：
          <a
            className="underline"
            href="https://resend.com/legal/privacy-policy"
            target="_blank"
            rel="noreferrer"
          >
            Privacy Policy
          </a>
          。
        </li>
        <li>
          <strong>Upstash Redis</strong>（限流/缓存）：用于接口的速率限制和临时存储，请求中可能包含
          IP（用于限流键），不用于画像。详见：
          <a className="underline" href="https://upstash.com/" target="_blank" rel="noreferrer">
            upstash.com
          </a>
          。
        </li>
        <li>
          <strong>语雀 Yuque API</strong>（内容来源）：文章内容与搜索结果来源于语雀公开知识库
          API，涉及文档标题、摘要、更新时间等公开信息。详见：
          <a
            className="underline"
            href="https://www.yuque.com/yuque/developer/api"
            target="_blank"
            rel="noreferrer"
          >
            开发者文档
          </a>
          。
        </li>
        <li>如需撤回 Cookie 或第三方追踪，您可通过浏览器设置或相关扩展进行管理。</li>
        <li>未成年人使用本站应在监护人指导下进行。</li>
      </ul>

      <h2>6. 投诉与处理机制</h2>
      <p>如您认为本站内容存在侵权、违法或不当之处，请通过下述方式与我们联系：</p>
      <ul>
        <li>
          邮箱：
          <a className="underline" href={`mailto:${siteConfig.social.email}`}>
            {siteConfig.social.email}
          </a>
        </li>
        <li>请尽量提供相关链接、截图与说明，以便核查。</li>
        <li>一般情况下，我们将在收到有效通知后的 3–5 个工作日内处理。</li>
      </ul>

      <h2>7. 免责声明</h2>
      <ul>
        <li>本站内容仅用于学习与交流，不构成投资、医疗或法律等专业建议。</li>
        <li>因使用或依赖本站信息而造成的直接或间接损失，本站不承担相应责任。</li>
      </ul>

      <h2>8. 服务可用性与安全</h2>
      <ul>
        <li>我们采取合理措施保障站点安全，但无法保证绝对安全或持续可用。</li>
        <li>因维护、升级或不可抗力，服务可能暂时中断或变更。</li>
      </ul>

      <h2>9. 变更与生效</h2>
      <ul>
        <li>本站可根据需要不定期更新本说明；重要变更将以页面更新方式提示。</li>
        <li>您继续使用本站即视为接受更新后的条款。</li>
      </ul>

      <h2>10. 适用法律与争议解决</h2>
      <p>
        本说明受中华人民共和国法律管辖。因本说明产生的争议，优先友好协商解决；协商不成的，提交本站运营者所在地有管辖权的人民法院诉讼解决。
      </p>

      <p className="text-sm text-muted-foreground">
        生效日期：{new Date().toLocaleDateString()} · 最后更新：{new Date().toLocaleDateString()}
      </p>
    </div>
  )
}

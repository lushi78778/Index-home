import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: '合规与使用说明',
  description: '本站在中国大陆运营的合规与使用说明。',
  alternates: { canonical: `${siteConfig.url}/policies` },
}

export default function PoliciesPage() {
  // 统一以中国上海时区格式化为 YYYY-MM-DD，避免水合不一致
  const today = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace(/\//g, '-')

  return (
    <div className="prose dark:prose-invert mx-auto max-w-none md:max-w-3xl xl:max-w-4xl">
      <h1>合规与使用说明</h1>
      <p>
        本页系{siteConfig.name}（“本站”）在中国大陆地区运营时的合规与使用说明，旨在清晰告知您的权利与义务，
        降低法律与合规风险，保障信息安全与个人信息权益。请您在使用前仔细阅读并充分理解。
      </p>
      <p>
        使用即同意：您访问或继续使用本站，即表示您已阅读并同意本说明以及其中关于个人信息、第三方服务与跨境数据传输的规则；
        如您不同意任一条款，请立即停止访问或使用本站。
      </p>

      <h2>1. 站点与运营信息</h2>
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
        <li>
          服务对象：本站主要面向中国大陆互联网用户提供内容与互动功能，不以欧盟/英国/美国等境外地区居民为特定目标受众。
        </li>
      </ul>

      <h2>2. 适用范围与法律适用</h2>
      <ul>
        <li>除非另有明确约定，本说明适用于您访问、浏览及使用本站提供的公开页面、接口与相关互动功能。</li>
        <li>
          法律适用：优先适用中华人民共和国现行有效的法律法规与强制性国家标准，包括但不限于《网络安全法》《数据安全法》《个人信息保护法（PIPL）》及其配套规定。
        </li>
        <li>
          若您位于境外且因当地法律（如 GDPR/CCPA 等）对数据处理提出额外要求，原则上以中国大陆法律为主；如冲突以不可放弃的属地强制性规定为准，您应确保合规使用并理解可能发生的跨境传输。
        </li>
        <li>
          无额外弹窗或开关：为减少打扰与运营负担，本站采用“使用即同意”的默认机制，不设置额外的同意弹窗或偏好开关。
          如您不同意相关处理，可通过停止使用相应功能、在浏览器中屏蔽脚本/Cookie，或离开本站来实现选择。
        </li>
      </ul>

      <h2>3. 内容与知识产权</h2>
      <ul>
        <li>本站发布的文章、项目说明与素材，除特别声明外，均为站长原创或基于授权素材进行整理。</li>
        <li>转载、引用请注明原文链接与作者信息；商业使用请先取得明确书面授权。</li>
        <li>引用第三方平台（如语雀）内容时，需遵守相应平台的版权与使用条款；相关权利归原权利人所有。</li>
        <li>
          侵权投诉：如认为本站内容涉嫌侵权，请按本页“投诉与处理机制”说明提交权属证明与线索链接，我们将在合理期限内处理。
        </li>
      </ul>

      <h2>4. 用户行为规范</h2>
      <p>您承诺遵守中国大陆现行法律法规及公序良俗，且不得利用本站从事以下行为：</p>
      <ul>
        <li>发布、传播、存储法律法规禁止的内容（包括但不限于危害国家安全、淫秽色情、暴力恐怖、赌博诈骗、侮辱诽谤等）。</li>
        <li>破坏网络安全与秩序的行为（包括但不限于 DDoS、恶意爬虫、注入攻击、绕过限流/认证、探测内网等）。</li>
        <li>未经许可抓取、复制或镜像本站数据，或用于模型训练、商业再分发等超出合理使用范围的行为。</li>
        <li>冒用他人身份、提供虚假信息或侵害他人合法权益的行为。</li>
      </ul>

  <h2 id="cookies" className="scroll-mt-24">5. 个人信息处理与 Cookie</h2>
      <ul>
        <li>最小化原则：本站不主动收集与服务无关的敏感个人信息（如身份证件号等）。</li>
        <li>用途限制：收集与处理的个人信息仅用于实现相应功能（如联系反馈、邮件订阅确认等），并在达成目的后尽量删除或匿名化。</li>
        <li>Cookie 使用：为保证站点基本功能，本站可能使用必要的 Cookie；不开展跨站追踪，不用于用户画像。</li>
        <li>退出方式：您可在浏览器中清除或禁用 Cookie、屏蔽第三方脚本域名（如 plausible.io），以及使用拦截扩展进行限制；
          如相关服务支持“请勿追踪”（Do Not Track），我们将尽力在服务能力范围内予以尊重。</li>
        <li>您的权利：在法律允许范围内，您有权申请查阅、更正、删除相关个人信息或撤回同意；可发送邮件与我们联系。</li>
      </ul>

      <h2>6. 第三方服务与跨境数据传输</h2>
      <p>
        为实现邮件发送、统计分析、缓存与内容提供等功能，本站在必要且经过评估的场景下使用第三方服务。部分第三方服务可能位于境外，
        在您使用相关功能或勾选同意后，可能发生跨境数据传输（例如 IP、邮箱、时间戳、页面信息、邮件元数据等）。我们将遵循最小必要、
        目的限定与安全保障原则，并尽力与第三方签署或采用其合规条款与安全措施。
      </p>
      <ul>
        <li>
          <strong>Plausible Analytics</strong>（当前以{' '}
          {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ? '启用' : '未启用'} 为准）：无 Cookie 的基础访问统计，
          了解页面访问量与来源，不用于个体画像。
          <a className="underline" href="https://plausible.io/data-policy" target="_blank" rel="noreferrer">隐私说明</a>。
        </li>
        <li>
          <strong>Resend</strong>（邮件发送，可能位于境外）：用于联系表单与订阅确认邮件，处理邮箱地址、邮件内容与必要元数据；
          仅在您主动提交或确认订阅的前提下发送。
          <a className="underline" href="https://resend.com/legal/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</a>。
        </li>
        <li>
          <strong>Upstash Redis</strong>（限流/缓存）：用于接口速率限制和临时存储，请求中可能包含 IP（用于限流键），不用于画像。
          <a className="underline" href="https://upstash.com/" target="_blank" rel="noreferrer">upstash.com</a>。
        </li>
        <li>
          <strong>语雀 Yuque API</strong>（内容来源）：文章与搜索结果来源于语雀公开知识库的公开信息（如标题、摘要、更新时间等）。
          <a className="underline" href="https://www.yuque.com/yuque/developer/api" target="_blank" rel="noreferrer">开发者文档</a>。
        </li>
        <li>
          可能的托管/CDN/日志服务（如云服务商）：为保障可用性与安全性，网络日志可能记录 IP、User-Agent、时间戳与错误信息，
          仅用于安全审计与故障排查。
        </li>
      </ul>
      <p className="text-sm">
        使用即同意提示：继续浏览本站页面或触发相应功能，即表示您同意前述第三方对必要数据的处理以及可能发生的跨境数据传输；
        如不同意，请通过浏览器屏蔽相关脚本/功能或停止使用本站。
      </p>
      <p className="text-sm">
        境外监管提示：本站不以欧盟/英国/加州等境外地区居民为特定目标，但若属地法律对您适用且不可放弃，
        请在使用前审慎评估并理解可能发生的跨境数据传输与合规要求；继续使用即表示您授权我们按本说明进行处理。
      </p>

      <h2>7. 数据留存与删除</h2>
      <ul>
        <li>留存期限遵循“实现目的所必需”的原则；功能完成后尽量删除或匿名化处理。</li>
        <li>若因法律、监管、合规或安全审计需要，我们可能在合理期限内留存相关日志。</li>
        <li>您可通过邮件申请删除与导出（在技术可行与法律允许范围内）与您相关的可识别信息。</li>
      </ul>

      <h2>8. 未成年人保护</h2>
      <ul>
        <li>未成年人使用本站应在监护人指导与同意下进行，并在必要时由监护人代为行使相关个人信息权利。</li>
      </ul>

      <h2>9. 安全与可用性</h2>
      <ul>
        <li>我们采取合理且业界通行的技术与管理措施保障安全，但无法保证绝对安全或持续可用。</li>
        <li>因维护、升级、不可抗力或第三方服务异常，服务可能临时中断、延迟或变更。</li>
      </ul>

      <h2>10. 免责声明与责任限制</h2>
      <ul>
        <li>本站内容仅用于学习与交流，不构成投资、医疗、法律或其他专业建议，您应自行判断与承担使用风险。</li>
        <li>在法律允许范围内，因使用或依赖本站信息、或因第三方服务导致的直接或间接损失，本站不承担相应责任。</li>
        <li>本站可能包含第三方链接，对其内容、隐私与安全不作明示或默示担保。</li>
      </ul>

      <h2>11. 监管与执法配合</h2>
      <ul>
        <li>我们将依法配合有权机关的监管检查、执法调查与取证工作，并在符合法律程序的前提下提供必要协助。</li>
      </ul>

      <h2>12. 投诉与处理机制</h2>
      <p>如您认为本站内容或数据处理存在侵权、违法或不当之处，请通过下述方式与我们联系：</p>
      <ul>
        <li>
          邮箱：
          <a className="underline" href={`mailto:${siteConfig.social.email}`}>
            {siteConfig.social.email}
          </a>
        </li>
        <li>请尽量提供相关链接、截图、说明与权属证明（如适用），以便核查。</li>
        <li>一般情况下，我们将在收到有效通知后的 3–5 个工作日内处理或回复。</li>
      </ul>

      <h2>13. 变更与生效</h2>
      <ul>
        <li>本站可根据法律政策或服务变化不定期更新本说明；重要变更将以页面更新等合理方式提示。</li>
        <li>您继续使用本站即视为已阅读、理解并同意更新后的条款。</li>
      </ul>

      <p className="text-sm text-muted-foreground">
        生效日期：{today} · 最后更新：{today}
      </p>
    </div>
  )
}

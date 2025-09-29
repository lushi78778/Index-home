/**
 * 页面再验证接口（GET /api/revalidate?path=/xxx&secret=TOKEN）
 * - 功能：触发指定路径的 ISR 再验证（需页面使用 revalidate 或相关缓存 API）
 * - 访问控制：
 *   - 设置 REVALIDATE_SECRET 时，需携带同值的 secret 参数
 *   - 未设置时仅在开发环境允许调用（生产环境默认拒绝）
 */
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// 按需增量更新（示例）：GET /api/revalidate?path=/blog/hello-world&secret=TOKEN
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  // 环境变量密钥：用于校验调用方身份
  const secret = process.env.REVALIDATE_SECRET

  // 缺省时的安全默认：未设置密钥则仅在开发环境允许，否则拒绝
  if (!secret && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ revalidated: false, message: 'Forbidden' }, { status: 403 })
  }

  if (secret && searchParams.get('secret') !== secret) {
    return NextResponse.json({ revalidated: false, message: 'Invalid token' }, { status: 401 })
  }

  const path = (searchParams.get('path') || '/').trim()
  if (!path.startsWith('/')) {
    return NextResponse.json({ revalidated: false, message: 'Invalid path' }, { status: 400 })
  }

  try {
    // 触发指定路径的再验证（页面/段落需配置了 revalidate 或使用了缓存 API）
    revalidatePath(path)
    return NextResponse.json({ revalidated: true, path })
  } catch (e) {
    return NextResponse.json({ revalidated: false }, { status: 500 })
  }
}

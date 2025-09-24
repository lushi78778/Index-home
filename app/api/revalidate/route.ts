import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// 按需增量更新（示例）：GET /api/revalidate?path=/blog/hello-world&secret=TOKEN
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = process.env.REVALIDATE_SECRET
  if (secret && searchParams.get('secret') !== secret) {
    return NextResponse.json({ revalidated: false, message: 'Invalid token' }, { status: 401 })
  }
  const path = searchParams.get('path') || '/'
  try {
    // 触发指定路径的再验证（需要页面/段落配置了 revalidate 或使用了缓存 API）
    revalidatePath(path)
    return NextResponse.json({ revalidated: true, path })
  } catch (e) {
    return NextResponse.json({ revalidated: false }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { listUserPublicRepos, listUserGroups } from '@/lib/yuque'

export const revalidate = 60 * 10

export async function GET() {
  const login = process.env.YUQUE_LOGIN || ''
  if (!login) return NextResponse.json({ repos: [], groups: [] })
  try {
    const [repos, groups] = await Promise.all([
      listUserPublicRepos(login),
      listUserGroups(login),
    ])
    const reposOut = (repos || []).map((r: any) => ({
      namespace: r.namespace,
      name: r.name || r.slug,
      login: String(r.namespace || '').split('/')[0] || login,
    }))
    const groupsOut = (groups || []).map((g: any) => ({
      login: g.login,
      name: g.name || g.login,
    }))
    return NextResponse.json({ repos: reposOut, groups: groupsOut })
  } catch (e: any) {
    return NextResponse.json({ repos: [], groups: [], error: e?.message || String(e) })
  }
}

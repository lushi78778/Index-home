import { NextResponse } from 'next/server'
import { listUserPublicRepos } from '@/lib/yuque'

const BASE = process.env.YUQUE_BASE || 'https://www.yuque.com/api/v2'
const TOKEN = process.env.YUQUE_TOKEN || ''

export const revalidate = 0

async function rawFetch(path: string) {
  const url = `${BASE}${path}`
  const headers: Record<string, string> = {
    'User-Agent': 'index-home-yuque-debug',
    Accept: 'application/json',
  }
  if (TOKEN) headers['X-Auth-Token'] = TOKEN
  const res = await fetch(url, { headers, cache: 'no-store' })
  const text = await res.text()
  return { status: res.status, statusText: res.statusText, text }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ns = searchParams.get('repo') || ''
  const useId = searchParams.get('by') === 'id'
  if (!ns) return NextResponse.json({ error: 'missing repo' }, { status: 400 })
  try {
    if (useId) {
      const [login] = ns.split('/')
      const repos = await listUserPublicRepos(login)
      const id = (Array.isArray(repos) ? repos : []).find((r) => r.namespace === ns)?.id
      if (!id) return NextResponse.json({ error: 'no id for ns' }, { status: 404 })
      const raw = await rawFetch(`/repos/${id}/toc`)
      return NextResponse.json({ by: 'id', id, raw })
    }
    const raw = await rawFetch(`/repos/${encodeURIComponent(ns)}/toc`)
    return NextResponse.json({ by: 'namespace', raw })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

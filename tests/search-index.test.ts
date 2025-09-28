import { GET as getIndex } from '@/app/api/search-index/route'
import { describe, it, expect } from 'vitest'

// 仅验证基础行为：返回 200/JSON，以及包含 post: 标识

describe('search-index api', async () => {
  it('should return json with entries', async () => {
    const res = await getIndex(new Request('http://localhost/api/search-index'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
    expect(json.length).toBeGreaterThanOrEqual(0)
  })

  it('should return 304 when If-None-Match matches', async () => {
    const res1 = await getIndex(new Request('http://localhost/api/search-index'))
    const etag = res1.headers.get('ETag')
    expect(etag).toBeTruthy()
    const res2 = await getIndex(
      new Request('http://localhost/api/search-index', { headers: { 'If-None-Match': etag! } }),
    )
    expect(res2.status).toBe(304)
  })
})

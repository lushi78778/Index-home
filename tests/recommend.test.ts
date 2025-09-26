import { describe, it, expect } from 'vitest'
import { relatedByTags } from '@/lib/recommend'

describe('relatedByTags', () => {
  const all = [
    { slug: 'a', tags: ['x', 'y'], date: '2024-01-01' },
    { slug: 'b', tags: ['y', 'z'], date: '2024-02-01' },
    { slug: 'c', tags: ['x'], date: '2024-03-01' },
    { slug: 'd', tags: ['m'], date: '2024-04-01' },
    { slug: 'e', tags: ['x', 'y', 'z'], date: '2024-05-01' },
  ]

  it('excludes self and ranks by shared tags, then date desc', () => {
    const target = { slug: 'a', tags: ['x', 'y'], date: '2024-06-01' }
    const res = relatedByTags(target, all, 4).map((r) => r.slug)
    // e shares x,y (2); b shares y (1); c shares x (1); d shares none (0)
    expect(res).toEqual(['e', 'c', 'b'])
  })

  it('respects limit and returns empty when no overlap', () => {
    const target = { slug: 'd', tags: ['m'], date: '2024-04-01' }
    const res = relatedByTags(target, all, 1)
    // others have no 'm' except self
    expect(res).toEqual([])
  })
})

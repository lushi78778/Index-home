import { describe, it, expect } from 'vitest'
import { getAllPosts, getAllProjects } from '@/lib/content'

describe('content loaders', () => {
  it('should load demo posts', () => {
    const posts = getAllPosts({ includeDraft: true })
    expect(Array.isArray(posts)).toBe(true)
    // demo file exists
    expect(posts.some(p => p.slug === 'hello-world')).toBe(true)
  })

  it('should load demo projects', () => {
    const projects = getAllProjects()
    expect(Array.isArray(projects)).toBe(true)
    expect(projects.some(p => p.slug === 'demo-project')).toBe(true)
  })
})

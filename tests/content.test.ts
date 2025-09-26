import { describe, it, expect } from 'vitest'
import { getAllPosts, getAllProjects } from '@/lib/content'

describe('content loaders', () => {
  it('should load demo posts', () => {
    const posts = getAllPosts({ includeDraft: true })
    expect(Array.isArray(posts)).toBe(true)
    // demo file exists
    expect(posts.some((p) => p.slug === 'hello-world')).toBe(true)
  })

  it('should load demo projects', () => {
    const projects = getAllProjects()
    expect(Array.isArray(projects)).toBe(true)
    expect(projects.some((p) => p.slug === 'demo-project')).toBe(true)
  })

  it('should exclude draft and future posts in prod mode', () => {
    // Simulate production behavior by calling without includeDraft and filtering by date
    const now = Date.now()
    const posts = getAllPosts({ includeDraft: false })
    // none should be future-dated
    expect(posts.every((p) => new Date(p.date).getTime() <= now)).toBe(true)
    // and none with draft: true
    expect(posts.every((p) => !p.draft)).toBe(true)
  })
})

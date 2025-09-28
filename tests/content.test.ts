import { describe, it, expect } from 'vitest'
import { getAllProjects } from '@/lib/content'

describe('content loaders', () => {
  it('should load projects without throwing', () => {
    const projects = getAllProjects()
    expect(Array.isArray(projects)).toBe(true)
  })

  it('projects are sorted by date desc', () => {
    const projects = getAllProjects()
    const timestamps = projects.map((p) => new Date(p.date).getTime())
    const sorted = [...timestamps].sort((a, b) => b - a)
    expect(timestamps).toEqual(sorted)
  })
})

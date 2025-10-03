import { MeiliSearch } from 'meilisearch'

let client: MeiliSearch | null = null

export function getMeiliClient() {
  const host = process.env.MEILI_HOST || ''
  const apiKey = process.env.MEILI_MASTER_KEY || process.env.MEILI_API_KEY || ''
  if (!host) return null
  if (client) return client
  client = new MeiliSearch({ host, apiKey })
  return client
}

export type MeiliDoc = {
  id: string
  title: string
  slug: string
  type: 'post' | 'project'
  namespace?: string
  excerpt?: string
  content?: string
  tags?: string[]
  createdAt?: string
  updatedAt?: string
}

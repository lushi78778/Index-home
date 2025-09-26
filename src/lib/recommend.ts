export type HasTags = { slug: string; tags: string[]; date?: string }

/**
 * 基于标签交集的简单相关推荐。
 * - 排除自身
 * - score = 交集数量
 * - 先按 score 降序；score 相同按日期（新→旧）降序；最后按 slug 升序稳定排序
 */
export function relatedByTags<T extends HasTags>(target: T, all: readonly T[], limit = 4): T[] {
  const base = new Set((target.tags || []).filter(Boolean))
  return all
    .filter((it) => it.slug !== target.slug)
    .map((it) => ({
      it,
      score: (it.tags || []).reduce((acc, t) => acc + (base.has(t) ? 1 : 0), 0),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const ad = a.it.date ? +new Date(a.it.date) : 0
      const bd = b.it.date ? +new Date(b.it.date) : 0
      if (bd !== ad) return bd - ad
      return a.it.slug.localeCompare(b.it.slug)
    })
    .slice(0, Math.max(0, limit))
    .map((x) => x.it)
}

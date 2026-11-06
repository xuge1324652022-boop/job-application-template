import metadata from '../数据/路由元数据.json'

// The static HTML builder and client navigation share the same legacy-path registry.
const legacyPaths = new Map<string, string>(Object.entries(metadata.legacyPaths))
const chapterPaths = new Set(legacyPaths.values())

/** Preserve the public jump helper's fallback for unknown card IDs. */
export function jumpPathFor(id: string): string {
  const legacy = `/card/${id}`
  return legacyPaths.get(legacy) ?? legacy
}

/** Exact page membership; titles, component loading and route state stay separate. */
export function isChapterPath(path: string): boolean {
  return chapterPaths.has(path)
}

export function needsInitialCurtain(path: string): boolean {
  const section = `/${path.split('/')[1] ?? ''}`
  return isChapterPath(section) || section === '/cards' || path.startsWith('/card/')
}

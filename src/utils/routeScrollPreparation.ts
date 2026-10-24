import type { RouterScrollBehavior } from 'vue-router'

type RouteScrollPreparation = (hash: string, saved: Parameters<RouterScrollBehavior>[2]) => Promise<boolean>
const preparations = new Map<string, RouteScrollPreparation>()

/** Register only the currently mounted page; cleanup cannot remove a newer owner. */
export function registerRouteScrollPreparation(path: string, prepare: RouteScrollPreparation): () => void {
  preparations.set(path, prepare)
  return () => {
    if (preparations.get(path) === prepare) preparations.delete(path)
  }
}

export function getRouteScrollPreparation(path: string): RouteScrollPreparation | undefined {
  return preparations.get(path)
}

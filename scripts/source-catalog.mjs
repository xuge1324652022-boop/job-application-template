/** Validate the release catalog against its definitions, without a fixed effect count. */
export function validateEffectCatalog(catalog, definitions) {
  const ids = definitions.map((definition) => definition?.id)
  const registered = new Set(ids)
  if (
    !ids.length || ids.some((id) => typeof id !== 'string' || !id) ||
    registered.size !== ids.length || !Array.isArray(catalog?.effects) ||
    catalog.effectCount !== ids.length || catalog.effects.length !== ids.length ||
    new Set(catalog.effects.map((effect) => effect?.id)).size !== ids.length ||
    catalog.effects.some((effect) => !registered.has(effect?.id))
  ) throw new Error('组件索引的效果集合与定义不一致')
}

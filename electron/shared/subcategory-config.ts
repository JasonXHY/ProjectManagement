// 子分类配置管理（前后端共用，纯逻辑，无副作用）
// 持久化为 settings 的 custom_subcategories（JSON：{ 阶段名: 子分类[] }）

import { STAGE_DEFINITIONS } from './stages'

export type SubcategoryMap = Record<string, string[]>

/** 默认子分类 map（来自 STAGE_DEFINITIONS 单一数据源） */
export function getDefaultSubcategoryMap(): SubcategoryMap {
  const map: SubcategoryMap = {}
  for (const s of STAGE_DEFINITIONS) {
    map[s.name] = [...s.subcategories]
  }
  return map
}

/** 解析存储的子分类配置；null/非法时回退默认，存储值按阶段覆盖默认 */
export function parseSubcategoryConfig(stored: string | null | undefined): SubcategoryMap {
  const defaults = getDefaultSubcategoryMap()
  if (!stored) return defaults
  try {
    const parsed = JSON.parse(stored)
    if (parsed && typeof parsed === 'object') {
      const merged: SubcategoryMap = { ...defaults }
      for (const [stage, subs] of Object.entries(parsed)) {
        if (Array.isArray(subs)) {
          merged[stage] = subs.filter((s): s is string => typeof s === 'string')
        }
      }
      return merged
    }
    return defaults
  } catch {
    return defaults
  }
}

/** 序列化子分类配置为存储字符串 */
export function serializeSubcategoryConfig(map: SubcategoryMap): string {
  return JSON.stringify(map)
}

/** 是否为某阶段的默认子分类（默认项不可删除） */
export function isDefaultSubcategory(stage: string, subcategory: string): boolean {
  return STAGE_DEFINITIONS.find((s) => s.name === stage)?.subcategories.includes(subcategory) ?? false
}

/** 向阶段追加子分类（不可变；重复则忽略） */
export function addSubcategory(map: SubcategoryMap, stage: string, subcategory: string): SubcategoryMap {
  const current = map[stage] ?? []
  if (current.includes(subcategory)) return map
  return { ...map, [stage]: [...current, subcategory] }
}

/** 从阶段移除子分类（不可变；默认子分类不可删除） */
export function removeSubcategory(map: SubcategoryMap, stage: string, subcategory: string): SubcategoryMap {
  if (isDefaultSubcategory(stage, subcategory)) return map
  const current = map[stage] ?? []
  return { ...map, [stage]: current.filter((s) => s !== subcategory) }
}

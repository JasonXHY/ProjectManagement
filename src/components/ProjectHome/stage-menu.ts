import { STAGE_DEFINITIONS } from '../../../electron/shared/stages'

/** 分类下拉菜单项（含可选二级子分类） */
export interface StageMenuItem {
  key: string
  label: string
  children?: StageMenuItem[]
}

const SEP = '::'

/** 构建分类菜单 key：阶段[::子分类] */
function makeKey(stage: string, subcategory: string | null): string {
  return subcategory ? `${stage}${SEP}${subcategory}` : stage
}

/** 解析菜单 key 为 { stage, subcategory } */
export function parseStageMenuKey(key: string): { stage: string; subcategory: string | null } {
  const idx = key.indexOf(SEP)
  if (idx === -1) return { stage: key, subcategory: null }
  return { stage: key.slice(0, idx), subcategory: key.slice(idx + SEP.length) }
}

/**
 * 构建手动分类下拉菜单：10 个文件分类阶段（每个含子分类二级菜单）+「未分类」。
 * 选择阶段本身 → 仅设置阶段；选择子分类 → 设置阶段 + 子分类。
 */
export function buildStageMenuItems(): StageMenuItem[] {
  const items: StageMenuItem[] = STAGE_DEFINITIONS.map((s) => ({
    key: makeKey(s.name, null),
    label: s.name,
    children: s.subcategories.length
      ? s.subcategories.map((sub) => ({ key: makeKey(s.name, sub), label: sub }))
      : undefined,
  }))
  items.push({ key: makeKey('未分类', null), label: '未分类' })
  return items
}

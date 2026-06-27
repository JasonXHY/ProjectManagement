import { FILE_CLASSIFICATION_STAGES, DEFAULT_STAGES } from '../shared/stages'

const VALID_CATEGORIES = [...FILE_CLASSIFICATION_STAGES, '未分类']

export function sanitizeCategory(category: string): string {
  if (!category) return '未分类'
  const trimmed = category.trim()
  if (VALID_CATEGORIES.includes(trimmed)) return trimmed
  const sanitized = trimmed.replace(/[<>:"/\\|?*]/g, '').substring(0, 50)
  return sanitized || '未分类'
}

export function sanitizeStage(stage: string | null): string | null {
  if (!stage) return null
  const trimmed = stage.trim()
  if (DEFAULT_STAGES.includes(trimmed)) return trimmed
  if (FILE_CLASSIFICATION_STAGES.includes(trimmed)) return trimmed
  return null
}

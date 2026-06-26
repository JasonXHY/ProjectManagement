export interface Milestone {
  date: string
  title: string
  type: 'milestone' | 'key_node' | 'payment'
  category?: string
  amount?: number
  confirmed?: boolean
  id?: string
  manuallyEdited?: boolean
}

/** 安全解析里程碑JSON，返回空数组 if 无效 */
export function parseMilestones(milestones: string | null): Milestone[] {
  if (!milestones) return []
  try {
    const parsed = JSON.parse(milestones)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

interface StructuredData {
  requirements?: Array<{ name: string; detail?: string; status?: string; source?: string; [key: string]: unknown }>
  key_issues?: Array<{ text: string; priority?: string; status?: string; source?: string; [key: string]: unknown }>
  opportunities?: Array<{ name: string; description?: string; status?: string; source?: string; [key: string]: unknown }>
  [key: string]: unknown
}

/** 模糊匹配：名称包含关系或高度相似 */
function fuzzyNameMatch(a: string, b: string): boolean {
  const la = a.toLowerCase().trim()
  const lb = b.toLowerCase().trim()
  if (la === lb) return true
  if (la.includes(lb) || lb.includes(la)) return true
  // 只对较短名称（>=4字符）做相似度检查，避免"需求A"和"需求B"被误匹配
  const shorter = la.length < lb.length ? la : lb
  const longer = la.length < lb.length ? lb : la
  if (shorter.length < 4) return false
  let matches = 0
  for (const char of shorter) {
    if (longer.includes(char)) matches++
  }
  return matches / longer.length > 0.7
}

/** 合并结构化数据（需求/问题/商机），按规则去重 */
export function mergeStructuredData(
  existingMetadata: Record<string, unknown>,
  newData: StructuredData,
): Record<string, unknown> {
  const merged = { ...existingMetadata }

  // 合并 requirements：按name模糊匹配
  if (newData.requirements && newData.requirements.length > 0) {
    const existingReqs = (merged.requirements as StructuredData['requirements']) || []
    const mergedReqs = [...existingReqs]

    for (const newReq of newData.requirements) {
      const matchIdx = mergedReqs.findIndex(r => fuzzyNameMatch(r.name, newReq.name))
      if (matchIdx >= 0) {
        const existing = mergedReqs[matchIdx]
        for (const [key, value] of Object.entries(newReq)) {
          if (key === 'name') continue
          if (value && !(existing as Record<string, unknown>)[key]) {
            ;(existing as Record<string, unknown>)[key] = value
          }
        }
      } else {
        mergedReqs.push(newReq)
      }
    }
    merged.requirements = mergedReqs
  }

  // 合并 key_issues：按text精确匹配
  if (newData.key_issues && newData.key_issues.length > 0) {
    const existingIssues = (merged.key_issues as StructuredData['key_issues']) || []
    const mergedIssues = [...existingIssues]

    for (const newIssue of newData.key_issues) {
      const exists = mergedIssues.some(i => i.text === newIssue.text)
      if (!exists) {
        mergedIssues.push(newIssue)
      }
    }
    merged.key_issues = mergedIssues
  }

  // 合并 opportunities：按name模糊匹配
  if (newData.opportunities && newData.opportunities.length > 0) {
    const existingOpps = (merged.opportunities as StructuredData['opportunities']) || []
    const mergedOpps = [...existingOpps]

    for (const newOpp of newData.opportunities) {
      const matchIdx = mergedOpps.findIndex(o => fuzzyNameMatch(o.name, newOpp.name))
      if (matchIdx >= 0) {
        const existing = mergedOpps[matchIdx]
        for (const [key, value] of Object.entries(newOpp)) {
          if (key === 'name') continue
          if (value && !(existing as Record<string, unknown>)[key]) {
            ;(existing as Record<string, unknown>)[key] = value
          }
        }
      } else {
        mergedOpps.push(newOpp)
      }
    }
    merged.opportunities = mergedOpps
  }

  return merged
}

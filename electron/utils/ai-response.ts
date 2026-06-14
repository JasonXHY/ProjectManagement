/** 解析AI分类响应，提取category/stage/summary/key_info */
export function parseClassifyResponse(content: string): {
  category: string
  stage: string | null
  summary: string | null
  keyInfo: Record<string, string> | null
} {
  const defaults = {
    category: content.trim() || '未分类',
    stage: null,
    summary: null,
    keyInfo: null,
  }

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return defaults

    const parsed = JSON.parse(jsonMatch[0])
    return {
      category: parsed.category || defaults.category,
      stage: parsed.stage || null,
      summary: parsed.summary || null,
      keyInfo: parsed.key_info || null,
    }
  } catch {
    return defaults
  }
}

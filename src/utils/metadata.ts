/** 安全解析项目metadata JSON，解析失败时打日志并返回空对象 */
export function parseMetadata(metadata: string | null): Record<string, unknown> {
  if (!metadata) return {}
  try {
    return JSON.parse(metadata)
  } catch (e) {
    console.warn('[parseMetadata] JSON 解析失败，返回空对象:', (e as Error).message)
    return {}
  }
}

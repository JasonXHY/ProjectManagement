function toDate(date: string): Date {
  if (!date) return new Date(NaN)
  // 已含T或Z的ISO格式直接解析，否则补T和Z
  const s = date.includes('T') || date.includes('Z') ? date : date.replace(' ', 'T') + 'Z'
  return new Date(s)
}

/** 格式化时间（相对时间） */
export function formatTime(date: string) {
  if (!date) return ''
  const d = toDate(date)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

/** 格式化会话时间（相对时间） */
export function formatSessionTime(date: string) {
  if (!date) return ''
  const d = toDate(date)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
}

/** 格式化时间戳为相对时间（用于项目列表） */
export function formatTimeRelative(date: string) {
  if (!date) return 'N/A'
  const d = toDate(date)
  if (isNaN(d.getTime())) return 'N/A'
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  return d.toLocaleDateString()
}

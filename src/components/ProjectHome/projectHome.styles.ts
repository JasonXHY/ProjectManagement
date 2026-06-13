/** 文件分类阶段样式映射（11个分类阶段 + 辅助项） */
export const STAGE_STYLE: Record<string, { color: string; bg: string }> = {
  '所有文件': { color: '#4F46E5', bg: '#EEF2FF' },
  '售前': { color: '#92400E', bg: '#FEF3C7' },
  '启动': { color: '#065F46', bg: '#D1FAE5' },
  '需求': { color: '#1E40AF', bg: '#DBEAFE' },
  '方案': { color: '#92400E', bg: '#FEF3C7' },
  '构建': { color: '#5B21B6', bg: '#EDE9FE' },
  '测试': { color: '#9D174D', bg: '#FCE7F3' },
  '上线': { color: '#065F46', bg: '#D1FAE5' },
  '验收': { color: '#9D174D', bg: '#FCE7F3' },
  '转客户成功': { color: '#374151', bg: '#F3F4F6' },
  '关闭': { color: '#374151', bg: '#F3F4F6' },
  '未分类': { color: '#6B7280', bg: '#F9FAFB' },
}

/** 项目阶段样式映射（3个项目阶段） */
export const PROJECT_STAGE_STYLE: Record<string, { color: string; bg: string }> = {
  '售前': { color: '#92400E', bg: '#FEF3C7' },
  '进行中': { color: '#553c9a', bg: '#e9d8fd' },
  '关闭': { color: '#374151', bg: '#F3F4F6' },
}

/** 获取阶段样式 */
export const getStageStyle = (stage: string) => {
  return STAGE_STYLE[stage] || { color: '#6B7280', bg: '#F9FAFB' }
}

/** 文件类型样式映射 */
export const FILE_TYPE_STYLE: Record<string, { color: string; bg: string }> = {
  'pdf': { color: '#DC2626', bg: '#FEE2E2' },
  'doc': { color: '#2563EB', bg: '#DBEAFE' },
  'docx': { color: '#2563EB', bg: '#DBEAFE' },
  'xls': { color: '#059669', bg: '#D1FAE5' },
  'xlsx': { color: '#059669', bg: '#D1FAE5' },
  'ppt': { color: '#D97706', bg: '#FEF3C7' },
  'pptx': { color: '#D97706', bg: '#FEF3C7' },
  'txt': { color: '#6B7280', bg: '#F3F4F6' },
  'md': { color: '#7C3AED', bg: '#EDE9FE' },
}

/** 获取文件类型样式 */
export const getFileTypeStyle = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return FILE_TYPE_STYLE[ext] || { color: '#6B7280', bg: '#F3F4F6' }
}

/** 获取文件类型标签 */
export const getFileTypeLabel = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const labels: Record<string, string> = {
    'pdf': 'PDF',
    'doc': 'DOC',
    'docx': 'DOC',
    'xls': 'XLS',
    'xlsx': 'XLS',
    'ppt': 'PPT',
    'pptx': 'PPT',
    'txt': 'TXT',
    'md': 'MD',
  }
  return labels[ext] || ext.toUpperCase()
}

/** 获取文件类型描述 */
export const getFileTypeDesc = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const descs: Record<string, string> = {
    'pdf': 'PDF 文档',
    'doc': 'Word 文档',
    'docx': 'Word 文档',
    'xls': 'Excel 表格',
    'xlsx': 'Excel 表格',
    'ppt': 'PowerPoint 演示',
    'pptx': 'PowerPoint 演示',
    'txt': '文本文件',
    'md': 'Markdown 文档',
  }
  return descs[ext] || '文件'
}
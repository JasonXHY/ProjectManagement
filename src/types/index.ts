// 项目分类方式
export type CategoryType = 'stage' | 'content'

// 用户角色
export type UserRole = 'pm' | 'developer' | 'pre_sales' | 'customer_success'

export const USER_ROLE_OPTIONS = [
  { value: 'pm', label: '项目经理' },
  { value: 'developer', label: '开发工程师' },
  { value: 'pre_sales', label: '售前解决方案' },
  { value: 'customer_success', label: '客户成功' },
]

// 项目里程碑
export interface Milestone {
  date: string
  title: string
  type: 'milestone' | 'key_node'
}

// 项目
export interface Project {
  id: number
  name: string
  category_type: CategoryType
  custom_stages: string | null
  current_stage: string
  folder_uuid: string | null
  metadata: string | null
  milestones: string | null
  created_at: string
  updated_at: string
}

// 文件记录
export interface FileRecord {
  id: number
  project_id: number
  filename: string
  original_path: string | null
  stored_path: string
  category: string | null
  subcategory: string | null
  stage: string | null
  file_type: string | null
  file_size: number | null
  content_extracted: string | null
  is_analyzed: boolean
  has_signature: boolean
  signature_status: 'unsigned' | 'pending' | 'signed' | 'rejected'
  ai_summary: string | null
  ai_key_info: string | null
  created_at: string
}

// 聊天消息（用于 API 请求/响应）
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// 单条对话消息（用于 UI 显示）
export interface ChatConversationMessage {
  id: number | string
  project_id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
  token_count: number | null
}

// AI模型供应商
export type AIProvider = 'xiaomi' | 'zhipu' | 'ali' | 'tencent' | 'baidu' | 'deepseek' | 'moonshot' | 'xunfei' | 'baichuan' | 'minimax' | 'custom'

// AI配置
export interface AIConfig {
  provider: AIProvider
  model: string
  apiKey: string
  baseUrl: string
}

// 文件提取配置
export type ExtractionMode = 'local' | 'cloud'

export interface ExtractionConfig {
  txt: ExtractionMode
  pdf_text: ExtractionMode
  pdf_scanned: 'cloud'  // 固定
  word: ExtractionMode
  excel: ExtractionMode
  image: 'cloud'  // 固定
}

// API响应
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// 阶段常量统一定义在 electron/shared/stages.ts（单一数据源），此处重导出供 renderer 使用
export {
  DEFAULT_STAGES,
  FILE_CLASSIFICATION_STAGES,
  STAGE_DEFINITIONS,
  getSubcategories,
  type StageDef,
} from '../../electron/shared/stages'

// Re-export stage progression from shared module (single source of truth)
export { STAGE_PROGRESSION_RULES, checkStageProgression } from '@shared/stages'

// 项目状态（简化为3种）
export const PROJECT_STATUS = [
  { value: '售前', label: '售前', color: '#975a16', bg: '#fefcbf' },
  { value: '进行中', label: '进行中', color: '#553c9a', bg: '#e9d8fd' },
  { value: '关闭', label: '关闭', color: '#4a5568', bg: '#e2e8f0' }
]

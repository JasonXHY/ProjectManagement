// 项目分类方式
export type CategoryType = 'stage' | 'content' | 'smart'

// 项目
export interface Project {
  id: number
  name: string
  category_type: CategoryType
  custom_stages: string | null
  current_stage: string
  ai_suggested_stage: string | null
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
  stage: string | null
  file_type: string | null
  file_size: number | null
  content_extracted: string | null
  is_analyzed: boolean
  created_at: string
}

// 对话
export interface Conversation {
  id: number
  project_id: number
  context_files: number[] | null
  messages: ChatMessage[]
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
export type AIProvider = 'zhipu' | 'mimo' | 'mimo_token' | 'custom'

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

// 默认阶段（11个阶段）
export const DEFAULT_STAGES = [
  '首页', '售前', '启动', '需求', '方案',
  '构建', '测试', '上线', '验收', '转客户成功', '关闭'
]

// 项目状态（简化为3种）
export const PROJECT_STATUS = [
  { value: '售前', label: '售前', color: '#975a16', bg: '#fefcbf' },
  { value: '进行中', label: '进行中', color: '#553c9a', bg: '#e9d8fd' },
  { value: '关闭', label: '关闭', color: '#4a5568', bg: '#e2e8f0' }
]

// 智谱AI供应商配置
export const ZHIPU_PROVIDER = {
  name: '智谱AI',
  models: ['glm-4-flash', 'glm-4.7-flash'],
  baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
}

// 小米MiMo供应商配置
export const MIMO_PROVIDER = {
  name: '小米MiMo',
  models: ['mimo-v2.5'],
  baseUrl: 'https://api.xiaomimimo.com',
  tokenPlanUrl: 'https://api.xiaomimimo.com'
}

// 默认文件分类Prompt（按阶段）
export const DEFAULT_CLASSIFY_PROMPT_STAGES = `你是一个专业的文档分类专家。请根据以下文档内容，判断它属于哪个阶段：

阶段：
- 首页：项目总览、导航页面
- 售前：销售资料、客户沟通、报价单
- 启动：项目启动会、章程、团队组建
- 需求：需求文档、用户故事、用例
- 方案：技术方案、架构设计、选型
- 构建：开发文档、代码规范、接口定义
- 测试：测试用例、测试报告、缺陷
- 上线：部署文档、发布说明、运维
- 验收：验收标准、验收报告、签字
- 转客户成功：交接文档、培训资料、FAQ
- 关闭：项目总结、复盘、归档

文档内容：
{content}

请严格返回以下JSON格式，不要包含任何其他文字：
{
  "category": "阶段名称",
  "confidence": 0.95,
  "summary": "文档内容摘要（50字以内）"
}`

// 默认文件分类Prompt（按内容）
export const DEFAULT_CLASSIFY_PROMPT_CONTENT = `你是一个专业的文档分类专家。请根据以下文档内容，判断它属于哪个类别（如：文档、代码、图片、表格、方案、报告、规范、工具等）：

文档内容：
{content}

请严格返回以下JSON格式，不要包含任何其他文字：
{
  "category": "类别名称",
  "confidence": 0.95,
  "summary": "文档内容摘要（50字以内）"
}`

// 默认项目分析Prompt
export const DEFAULT_ANALYZE_PROMPT = `你是一个项目分析助手。请根据提供的文件内容，生成或更新项目摘要。

{existingSummary}

请生成包含以下内容的Markdown格式摘要：
1. 项目概述（名称、创建时间、当前阶段、文件数量）
2. 文件清单（表格形式）
3. 当前进展
4. 关键问题
5. 建议和风险`

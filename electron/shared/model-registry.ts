export interface AIModel {
  id: string
  name: string
  isFree: boolean
  pricing?: { input: number; output: number }
  contextWindow?: number
  deprecated?: boolean
  deprecationDate?: string
  replacement?: string
}

export interface AIProviderConfig {
  id: string
  name: string
  baseUrl: string
  chatPath: string
  models: AIModel[]
  tokenPlanBaseUrl?: string
  codingPlanBaseUrl?: string
  apiKeyHint?: string
}

export const PROVIDER_ORDER = [
  'xiaomi', 'zhipu', 'ali', 'tencent', 'baidu',
  'deepseek', 'moonshot', 'lingyiwanwu', 'xunfei', 'baichuan', 'minimax',
]

export const MODEL_REGISTRY: Record<string, AIProviderConfig> = {
  xiaomi: {
    id: 'xiaomi',
    name: '小米MiMo',
    baseUrl: 'https://api.xiaomimimo.com/v1',
    chatPath: '/chat/completions',
    tokenPlanBaseUrl: 'https://token-plan-cn.xiaomimimo.com/v1',
    apiKeyHint: '按量计费为普通 API Key；Token Plan 为 tp- 开头的订阅 Key',
    models: [
      { id: 'mimo-v2.5-pro', name: 'MiMo-V2.5-Pro', isFree: false, deprecated: true, deprecationDate: '2026-06-16', replacement: 'mimo-v2.5', pricing: { input: 3.0, output: 6.0 }, contextWindow: 128000 },
      { id: 'mimo-v2.5', name: 'MiMo-V2.5', isFree: false, pricing: { input: 1.0, output: 2.0 }, contextWindow: 128000 },
      { id: 'mimo-v2-flash', name: 'MiMo-V2-Flash', isFree: true, deprecated: true, deprecationDate: '2026-06-30', replacement: 'mimo-v2.5' },
    ],
  },
  zhipu: {
    id: 'zhipu',
    name: '智谱',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    chatPath: '/chat/completions',
    codingPlanBaseUrl: 'https://open.bigmodel.cn/api/coding/paas/v4',
    apiKeyHint: 'Coding Plan 使用相同 Key，但仅在支持的工具中可用',
    models: [
      { id: 'glm-4.7-flash', name: 'GLM-4.7-Flash', isFree: true, contextWindow: 128000 },
      { id: 'glm-5-turbo', name: 'GLM-5-Turbo', isFree: true, contextWindow: 128000 },
      { id: 'glm-5', name: 'GLM-5', isFree: false, contextWindow: 128000 },
      { id: 'glm-5.1', name: 'GLM-5.1', isFree: false, contextWindow: 128000 },
      { id: 'glm-4-flash', name: 'GLM-4-Flash', isFree: true, deprecated: true, replacement: 'glm-4.7-flash' },
      { id: 'glm-4-air', name: 'GLM-4-Air', isFree: false, deprecated: true, replacement: 'glm-5-turbo' },
      { id: 'glm-4-plus', name: 'GLM-4-Plus', isFree: false, deprecated: true, replacement: 'glm-5' },
    ],
  },
  ali: {
    id: 'ali',
    name: '阿里千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    chatPath: '/chat/completions',
    tokenPlanBaseUrl: 'https://token-plan.cn-beijing.maas.aliuncs.com/v1',
    codingPlanBaseUrl: 'https://coding.dashscope.aliyuncs.com/v1',
    apiKeyHint: '按量计费: sk-xxx；Token Plan: sk-xxx (在百炼控制台生成)；Coding Plan: sk-sp-xxx',
    models: [
      { id: 'qwen3.7-max', name: 'Qwen3.7-Max', isFree: false, contextWindow: 128000 },
      { id: 'qwen3.7-plus', name: 'Qwen3.7-Plus', isFree: false, contextWindow: 128000 },
      { id: 'qwen3.5-plus', name: 'Qwen3.5-Plus', isFree: false, contextWindow: 128000 },
      { id: 'qwen3.5-flash', name: 'Qwen3.5-Flash', isFree: false, contextWindow: 128000 },
      { id: 'qwen-turbo', name: 'Qwen-Turbo', isFree: true, deprecated: true, replacement: 'qwen3.5-flash' },
      { id: 'qwen-plus', name: 'Qwen-Plus', isFree: false, deprecated: true, replacement: 'qwen3.5-plus' },
      { id: 'qwen-max', name: 'Qwen-Max', isFree: false, deprecated: true, replacement: 'qwen3.7-max' },
    ],
  },
  tencent: {
    id: 'tencent',
    name: '腾讯',
    baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1',
    chatPath: '/chat/completions',
    tokenPlanBaseUrl: 'https://api.lkeap.cloud.tencent.com/plan/v1',
    apiKeyHint: 'Token Plan Key 在腾讯云 TokenHub 控制台生成，与按量计费 Key 不同',
    models: [
      { id: 'hunyuan-turbos', name: 'Hunyuan-TurboS', isFree: false, pricing: { input: 0.8, output: 2.0 }, contextWindow: 256000 },
      { id: 'hunyuan-t1', name: 'Hunyuan-T1', isFree: false, pricing: { input: 1.0, output: 4.0 }, contextWindow: 256000 },
      { id: 'hunyuan-t1-vision', name: 'Hunyuan-T1-Vision', isFree: false, pricing: { input: 3.0, output: 9.0 }, contextWindow: 256000 },
      { id: 'hunyuan-lite', name: 'Hunyuan-Lite', isFree: false, deprecated: true, replacement: 'hunyuan-turbos' },
      { id: 'hunyuan-standard', name: 'Hunyuan-Standard', isFree: false, deprecated: true, replacement: 'hunyuan-turbos' },
    ],
  },
  baidu: {
    id: 'baidu',
    name: '百度',
    baseUrl: 'https://qianfan.baidubce.com/v2',
    chatPath: '/chat/completions',
    apiKeyHint: 'Token 福利包使用不同的 API Key（在千帆控制台购买后生成）',
    models: [
      { id: 'ernie-5.0', name: 'ERNIE-5.0', isFree: false, pricing: { input: 6.0, output: 24.0 }, contextWindow: 128000 },
      { id: 'ernie-4.5-turbo-128k-preview', name: 'ERNIE-4.5-Turbo', isFree: false, pricing: { input: 0.8, output: 3.2 }, contextWindow: 128000 },
      { id: 'ernie-x1.1', name: 'ERNIE-X1.1', isFree: false, pricing: { input: 1.0, output: 4.0 }, contextWindow: 128000 },
      { id: 'ernie-speed-8k', name: 'ERNIE-Speed-8K', isFree: true, deprecated: true, replacement: 'ernie-4.5-turbo-128k-preview' },
      { id: 'ernie-3.5-8k', name: 'ERNIE-3.5-8K', isFree: false, deprecated: true, replacement: 'ernie-4.5-turbo-128k-preview' },
      { id: 'ernie-4.0-turbo-8k', name: 'ERNIE-4.0-Turbo-8K', isFree: false, deprecated: true, replacement: 'ernie-5.0' },
    ],
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    chatPath: '/chat/completions',
    apiKeyHint: 'DeepSeek 无独立 Token Plan，按量计费 URL 即可',
    models: [
      { id: 'deepseek-v4-pro', name: 'DeepSeek-V4-Pro', isFree: false, pricing: { input: 4.0, output: 18.0 }, contextWindow: 128000 },
      { id: 'deepseek-v4-flash', name: 'DeepSeek-V4-Flash', isFree: false, pricing: { input: 1.0, output: 4.0 }, contextWindow: 128000 },
      { id: 'deepseek-chat', name: 'DeepSeek-Chat', isFree: true, deprecated: true, deprecationDate: '2026-07-24', replacement: 'deepseek-v4-flash' },
      { id: 'deepseek-reasoner', name: 'DeepSeek-Reasoner', isFree: false, deprecated: true, deprecationDate: '2026-07-24', replacement: 'deepseek-v4-pro' },
    ],
  },
  moonshot: {
    id: 'moonshot',
    name: '月之暗面',
    baseUrl: 'https://api.moonshot.cn/v1',
    chatPath: '/chat/completions',
    codingPlanBaseUrl: 'https://api.kimi.com/coding/v1',
    apiKeyHint: 'Coding Plan 使用独立 Key，与按量计费 Key 不同',
    models: [
      { id: 'kimi-k2.6', name: 'Kimi-K2.6', isFree: false, contextWindow: 256000 },
      { id: 'kimi-k2.7-code', name: 'Kimi-K2.7-Code', isFree: false, contextWindow: 256000 },
      { id: 'moonshot-v1-8k', name: 'Moonshot-V1-8K', isFree: false, deprecated: true, replacement: 'kimi-k2.6' },
      { id: 'moonshot-v1-32k', name: 'Moonshot-V1-32K', isFree: false, deprecated: true, replacement: 'kimi-k2.6' },
      { id: 'moonshot-v1-128k', name: 'Moonshot-V1-128K', isFree: false, deprecated: true, replacement: 'kimi-k2.6' },
    ],
  },
  lingyiwanwu: {
    id: 'lingyiwanwu',
    name: '零一万物',
    baseUrl: 'https://api.lingyiwanwu.com/v1',
    chatPath: '/chat/completions',
    apiKeyHint: '零一万物开放平台 API Key（在 platform.lingyiwanwu.com 生成）',
    models: [
      { id: 'yi-lightning', name: 'Yi-Lightning', isFree: false, contextWindow: 16000 },
      { id: 'yi-large', name: 'Yi-Large', isFree: false, contextWindow: 32000 },
      { id: 'yi-medium', name: 'Yi-Medium', isFree: false, contextWindow: 16000 },
      { id: 'yi-vision', name: 'Yi-Vision', isFree: false, contextWindow: 16000 },
    ],
  },
  xunfei: {
    id: 'xunfei',
    name: '讯飞',
    baseUrl: 'https://spark-api-open.xf-yun.com/v1',
    chatPath: '/chat/completions',
    tokenPlanBaseUrl: 'https://maas-token-api.cn-huabei-1.xf-yun.com/v2',
    apiKeyHint: '两种模式使用不同的 API Key',
    models: [
      { id: 'spark-lite', name: 'Spark-Lite', isFree: true, contextWindow: 8000 },
      { id: 'spark-max', name: 'Spark-Max', isFree: false, contextWindow: 8000 },
      { id: 'spark-4.0-ultra', name: 'Spark-X1.5', isFree: false, contextWindow: 8000 },
      { id: 'generalv3', name: 'General-V3', isFree: false, deprecated: true, replacement: 'spark-max' },
      { id: 'generalv3.5', name: 'General-V3.5', isFree: false, deprecated: true, replacement: 'spark-max' },
    ],
  },
  baichuan: {
    id: 'baichuan',
    name: '百川',
    baseUrl: 'https://api.baichuan-ai.com/v1',
    chatPath: '/chat/completions',
    apiKeyHint: '百川无独立 Token Plan，按量计费 URL 即可',
    models: [
      { id: 'Baichuan-M3-Plus', name: 'Baichuan-M3-Plus', isFree: true, contextWindow: 128000 },
      { id: 'Baichuan-M3', name: 'Baichuan-M3', isFree: false, contextWindow: 128000 },
      { id: 'Baichuan2-Turbo', name: 'Baichuan2-Turbo', isFree: false, deprecated: true, replacement: 'Baichuan-M3-Plus' },
      { id: 'Baichuan3-Turbo', name: 'Baichuan3-Turbo', isFree: false, deprecated: true, replacement: 'Baichuan-M3-Plus' },
      { id: 'Baichuan4', name: 'Baichuan4', isFree: false, deprecated: true, replacement: 'Baichuan-M3' },
    ],
  },
  minimax: {
    id: 'minimax',
    name: 'MiniMax',
    baseUrl: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
    chatPath: '',
    apiKeyHint: 'Token Plan 使用「订阅 Key」，按量计费使用「普通开放平台 API Key」，两者不同',
    models: [
      { id: 'MiniMax-M3', name: 'MiniMax-M3', isFree: false, pricing: { input: 2.1, output: 8.4 }, contextWindow: 512000 },
      { id: 'abab7-chat', name: 'MiniMax-M2.7', isFree: false, pricing: { input: 2.1, output: 8.4 }, contextWindow: 1000000 },
      { id: 'abab5.5-chat', name: 'abab5.5-chat', isFree: false, deprecated: true, replacement: 'MiniMax-M3' },
      { id: 'abab6.5s-chat', name: 'abab6.5s-chat', isFree: false, deprecated: true, replacement: 'abab7-chat' },
    ],
  },
}

export function getProviderList(): AIProviderConfig[] {
  return PROVIDER_ORDER.map((id) => MODEL_REGISTRY[id]).filter(Boolean)
}

export function getProviderById(id: string): AIProviderConfig | undefined {
  return MODEL_REGISTRY[id]
}

export function getFullApiUrl(providerId: string, mode: 'paygo' | 'token_plan' | 'coding_plan' = 'paygo'): string {
  const provider = MODEL_REGISTRY[providerId]
  if (!provider) return ''
  
  let baseUrl = provider.baseUrl
  if (mode === 'token_plan' && provider.tokenPlanBaseUrl) {
    baseUrl = provider.tokenPlanBaseUrl
  } else if (mode === 'coding_plan' && provider.codingPlanBaseUrl) {
    baseUrl = provider.codingPlanBaseUrl
  }
  
  return `${baseUrl}${provider.chatPath}`
}

export function getModelById(providerId: string, modelId: string): AIModel | undefined {
  const provider = MODEL_REGISTRY[providerId]
  if (!provider) return undefined
  return provider.models.find(m => m.id === modelId)
}

export interface AIModel {
  id: string
  name: string
  isFree: boolean
}

export interface AIProviderConfig {
  id: string
  name: string
  baseUrl: string
  chatPath: string
  models: AIModel[]
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
    models: [
      { id: 'mimo-v2-flash', name: 'MiMo-v2-flash', isFree: true },
      { id: 'mimo-v2.5', name: 'MiMo-v2.5', isFree: false },
      { id: 'mimo-v2.5-pro', name: 'MiMo-v2.5-pro', isFree: false },
    ],
  },
  zhipu: {
    id: 'zhipu',
    name: '智谱',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    chatPath: '/chat/completions',
    models: [
      { id: 'glm-4-flash', name: 'GLM-4-flash', isFree: true },
      { id: 'glm-4-air', name: 'GLM-4-air', isFree: false },
      { id: 'glm-4-plus', name: 'GLM-4-plus', isFree: false },
    ],
  },
  ali: {
    id: 'ali',
    name: '阿里千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    chatPath: '/chat/completions',
    models: [
      { id: 'qwen-turbo', name: 'Qwen-turbo', isFree: true },
      { id: 'qwen-plus', name: 'Qwen-plus', isFree: false },
      { id: 'qwen-max', name: 'Qwen-max', isFree: false },
    ],
  },
  tencent: {
    id: 'tencent',
    name: '腾讯',
    baseUrl: 'https://api.lkeap.cloud.tencent.com/v1',
    chatPath: '/chat/completions',
    models: [
      { id: 'hunyuan-lite', name: 'Hunyuan-lite', isFree: false },
      { id: 'hunyuan-standard', name: 'Hunyuan-standard', isFree: false },
      { id: 'hunyuan-pro', name: 'Hunyuan-pro', isFree: false },
    ],
  },
  baidu: {
    id: 'baidu',
    name: '百度',
    baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop',
    chatPath: '/chat/completions',
    models: [
      { id: 'ernie-speed-8k', name: 'ERNIE-speed-8k', isFree: true },
      { id: 'ernie-3.5-8k', name: 'ERNIE-3.5-8k', isFree: false },
      { id: 'ernie-4.0-turbo-8k', name: 'ERNIE-4.0-turbo-8k', isFree: false },
    ],
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    chatPath: '/chat/completions',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek-chat', isFree: true },
      { id: 'deepseek-reasoner', name: 'DeepSeek-reasoner', isFree: false },
    ],
  },
  moonshot: {
    id: 'moonshot',
    name: '月之暗面',
    baseUrl: 'https://api.moonshot.cn/v1',
    chatPath: '/chat/completions',
    models: [
      { id: 'moonshot-v1-8k', name: 'Moonshot-v1-8k', isFree: false },
      { id: 'moonshot-v1-32k', name: 'Moonshot-v1-32k', isFree: false },
      { id: 'moonshot-v1-128k', name: 'Moonshot-v1-128k', isFree: false },
    ],
  },
  lingyiwanwu: {
    id: 'lingyiwanwu',
    name: '零一万物',
    baseUrl: 'https://api.lingyiwanwu.com/v1',
    chatPath: '/chat/completions',
    models: [
      { id: 'yi-lightning', name: 'Yi-lightning', isFree: true },
      { id: 'yi-medium', name: 'Yi-medium', isFree: false },
      { id: 'yi-large', name: 'Yi-large', isFree: false },
    ],
  },
  xunfei: {
    id: 'xunfei',
    name: '讯飞',
    baseUrl: 'https://spark-api-open.xf-yun.com/v1',
    chatPath: '/chat/completions',
    models: [
      { id: 'generalv3', name: 'General-v3', isFree: false },
      { id: 'generalv3.5', name: 'General-v3.5', isFree: false },
      { id: '4.0Ultra', name: '4.0Ultra', isFree: false },
    ],
  },
  baichuan: {
    id: 'baichuan',
    name: '百川',
    baseUrl: 'https://api.baichuan-ai.com/v1',
    chatPath: '/chat/completions',
    models: [
      { id: 'Baichuan2-Turbo', name: 'Baichuan2-Turbo', isFree: false },
      { id: 'Baichuan3-Turbo', name: 'Baichuan3-Turbo', isFree: false },
      { id: 'Baichuan4', name: 'Baichuan4', isFree: false },
    ],
  },
  minimax: {
    id: 'minimax',
    name: 'MiniMax',
    baseUrl: 'https://api.minimax.chat/v1',
    chatPath: '/chat/completions',
    models: [
      { id: 'abab5.5-chat', name: 'abab5.5-chat', isFree: false },
      { id: 'abab6.5s-chat', name: 'abab6.5s-chat', isFree: false },
      { id: 'MiniMax-Text-01', name: 'MiniMax-Text-01', isFree: false },
    ],
  },
}

export function getProviderList(): AIProviderConfig[] {
  return PROVIDER_ORDER.map((id) => MODEL_REGISTRY[id]).filter(Boolean)
}

export function getProviderById(id: string): AIProviderConfig | undefined {
  return MODEL_REGISTRY[id]
}

export function getFullApiUrl(providerId: string): string {
  const provider = MODEL_REGISTRY[providerId]
  if (!provider) return ''
  return `${provider.baseUrl}${provider.chatPath}`
}
import { AIProviderInterface, AIMessage, AIResponse, OpenAIResponse } from './ai-providers/base'
import { ZhipuProvider } from './ai-providers/zhipu'
import { MiMoProvider } from './ai-providers/mimo'
import { getSetting, getDecryptedApiKey } from '../database/settings'
import { getProviderById, getFullApiUrl } from '../shared/model-registry'

// AI模型供应商类型（与 src/types 中的 AIProvider 保持一致）
export type AIProvider = 'xiaomi' | 'zhipu' | 'ali' | 'tencent' | 'baidu' | 'deepseek' | 'moonshot' | 'xunfei' | 'baichuan' | 'minimax' | 'custom'

// 通用OpenAI兼容供应商实现
class OpenAICompatibleProvider implements AIProviderInterface {
  private apiKey: string
  private apiUrl: string

  constructor(apiKey: string, apiUrl: string) {
    this.apiKey = apiKey
    this.apiUrl = apiUrl
  }

  async chat(messages: AIMessage[], model: string = 'deepseek-v4-flash'): Promise<AIResponse> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    })

    if (!response.ok) {
      throw new Error(`AI请求失败: ${response.statusText}`)
    }

    const data = await response.json() as OpenAIResponse

    return {
      content: data.choices[0].message.content,
      usage: data.usage,
    }
  }
}

// AI服务统一接口
export class AIService {
  private providers: Map<string, AIProviderInterface> = new Map()

  constructor() {
    this.initProviders()
  }

  /** 初始化所有已配置的AI供应商 */
  private initProviders() {
    const currentProvider = getSetting('ai_provider') || 'zhipu'
    const apiKey = getDecryptedApiKey('ai_api_key')
    const baseUrl = getSetting('ai_base_url') || ''

    // 根据当前选择的供应商初始化
    if (currentProvider === 'zhipu' && apiKey) {
      const url = baseUrl || 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
      this.providers.set('zhipu', new ZhipuProvider(apiKey, url))
    } else if (currentProvider === 'xiaomi' && apiKey) {
      const url = baseUrl || 'https://api.xiaomimimo.com'
      this.providers.set('xiaomi', new MiMoProvider(apiKey, url, url, 'api'))
    } else if (apiKey) {
      // 通用OpenAI兼容供应商
      const providerConfig = getProviderById(currentProvider)
      const apiUrl = baseUrl || (providerConfig ? getFullApiUrl(currentProvider) : '')
      if (apiUrl) {
        this.providers.set(currentProvider, new OpenAICompatibleProvider(apiKey, apiUrl))
      }
    }

    // 也初始化其他已配置的供应商（备用）
    const zhipuKey = getDecryptedApiKey('zhipu_api_key')
    const zhipuUrl = getSetting('zhipu_api_url') || 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
    if (zhipuKey && !this.providers.has('zhipu')) {
      this.providers.set('zhipu', new ZhipuProvider(zhipuKey, zhipuUrl))
    }

    const mimoKey = getDecryptedApiKey('mimo_api_key')
    const mimoUrl = getSetting('mimo_api_url') || 'https://api.xiaomimimo.com'
    if (mimoKey && !this.providers.has('xiaomi')) {
      this.providers.set('xiaomi', new MiMoProvider(mimoKey, mimoUrl, mimoUrl, 'api'))
    }
  }

  /** 发送聊天消息到指定AI供应商 */
  async chat(messages: AIMessage[], provider?: AIProvider, model?: string): Promise<AIResponse> {
    const providerName = provider || (getSetting('ai_provider') as AIProvider) || 'zhipu'
    const aiProvider = this.providers.get(providerName)

    if (!aiProvider) {
      // 提供更详细的错误信息
      const availableProviders = Array.from(this.providers.keys())
      if (availableProviders.length === 0) {
        throw new Error('未配置任何AI供应商。请在设置页面配置API Key。')
      }
      throw new Error(`AI供应商 "${providerName}" 未配置。可用的供应商: ${availableProviders.join(', ')}`)
    }

    return aiProvider.chat(messages, model)
  }

  /** 检查是否有可用的AI供应商 */
  hasProviders(): boolean {
    return this.providers.size > 0
  }

  /** 刷新供应商配置（设置变更后调用） */
  refreshProviders() {
    this.providers.clear()
    this.initProviders()
  }
}

/** 获取AI服务单例（延迟初始化） */
let _aiService: AIService | null = null

export function getAIService(): AIService {
  if (!_aiService) {
    _aiService = new AIService()
  }
  return _aiService
}

// 兼容旧代码的导出
export const aiService = {
  chat: (messages: AIMessage[], provider?: AIProvider, model?: string) =>
    getAIService().chat(messages, provider, model),
  refreshProviders: () => getAIService().refreshProviders()
}

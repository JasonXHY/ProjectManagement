import { AIProviderInterface, AIMessage, AIResponse } from './ai-providers/base'
import { ZhipuProvider } from './ai-providers/zhipu'
import { MiMoProvider, MiMoMode } from './ai-providers/mimo'
import { getSetting } from '../database/settings'

// AI模型供应商类型（与 src/types 中的 AIProvider 保持一致）
export type AIProvider = 'zhipu' | 'mimo' | 'mimo_token' | 'custom'

// AI服务统一接口
export class AIService {
  private providers: Map<string, AIProviderInterface> = new Map()

  constructor() {
    this.initProviders()
  }

  // 初始化所有已配置的供应商
  private initProviders() {
    const currentProvider = getSetting('ai_provider') || 'zhipu'
    const apiKey = getSetting('ai_api_key') || ''
    const baseUrl = getSetting('ai_base_url') || ''

    // 根据当前选择的供应商初始化
    if (currentProvider === 'zhipu' && apiKey) {
      const url = baseUrl || 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
      this.providers.set('zhipu', new ZhipuProvider(apiKey, url))
    } else if (currentProvider === 'mimo' && apiKey) {
      const url = baseUrl || 'https://api.xiaomimimo.com'
      this.providers.set('mimo', new MiMoProvider(apiKey, url, url, 'api'))
    }

    // 也初始化其他已配置的供应商（备用）
    const zhipuKey = getSetting('zhipu_api_key') || ''
    const zhipuUrl = getSetting('zhipu_api_url') || 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
    if (zhipuKey && !this.providers.has('zhipu')) {
      this.providers.set('zhipu', new ZhipuProvider(zhipuKey, zhipuUrl))
    }

    const mimoKey = getSetting('mimo_api_key') || ''
    const mimoUrl = getSetting('mimo_api_url') || 'https://api.xiaomimimo.com'
    if (mimoKey && !this.providers.has('mimo')) {
      this.providers.set('mimo', new MiMoProvider(mimoKey, mimoUrl, mimoUrl, 'api'))
    }
  }

  // 发送聊天消息
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

  // 刷新供应商配置（设置变更后调用）
  refreshProviders() {
    this.providers.clear()
    this.initProviders()
  }
}

// 延迟初始化单例（避免在数据库初始化前加载）
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

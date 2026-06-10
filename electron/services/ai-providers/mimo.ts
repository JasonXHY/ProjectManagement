import { AIProviderInterface, AIMessage, AIResponse, OpenAIResponse } from './base'

// MiMo调用模式
export type MiMoMode = 'api' | 'token'

// 小米MiMo供应商实现
export class MiMoProvider implements AIProviderInterface {
  private apiKey: string
  private apiUrl: string
  private tokenPlanUrl: string
  private mode: MiMoMode

  constructor(apiKey: string, apiUrl: string, tokenPlanUrl: string, mode: MiMoMode = 'api') {
    this.apiKey = apiKey
    this.apiUrl = apiUrl
    this.tokenPlanUrl = tokenPlanUrl
    this.mode = mode
  }

  async chat(messages: AIMessage[], model: string = 'mimo-v2.5'): Promise<AIResponse> {
    const baseUrl = this.mode === 'api' ? this.apiUrl : this.tokenPlanUrl

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey
      },
      body: JSON.stringify({
        model,
        messages
      })
    })

    if (!response.ok) {
      throw new Error(`小米MiMo请求失败: ${response.statusText}`)
    }

    const data = await response.json() as OpenAIResponse

    return {
      content: data.choices[0].message.content,
      usage: data.usage
    }
  }
}

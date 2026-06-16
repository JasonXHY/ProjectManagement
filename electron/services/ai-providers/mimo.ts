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
    const url = `${baseUrl}/v1/chat/completions`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify({
          model,
          messages
        }),
        signal: controller.signal
      })

      if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new Error(`小米MiMo请求失败 (${response.status}): ${response.statusText} ${body}`)
      }

      const data = await response.json() as OpenAIResponse

      if (!data.choices || data.choices.length === 0) {
        throw new Error('小米MiMo返回空响应')
      }

      return {
        content: data.choices[0].message.content,
        usage: data.usage
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('小米MiMo请求超时（60秒），请检查网络连接或稍后重试')
      }
      throw err
    } finally {
      clearTimeout(timeout)
    }
  }

  async vision(imageBase64: string, prompt: string, model: string = 'mimo-vision'): Promise<AIResponse> {
    const messages: AIMessage[] = [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: imageBase64
            }
          },
          {
            type: 'text',
            text: prompt
          }
        ]
      }
    ]

    return this.chat(messages, model)
  }
}

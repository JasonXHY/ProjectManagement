import { AIProviderInterface, AIMessage, AIResponse, OpenAIResponse } from './base'

// 智谱AI供应商实现
export class ZhipuProvider implements AIProviderInterface {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  async chat(messages: AIMessage[], model: string = 'glm-4.7-flash'): Promise<AIResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages
      })
    })

    if (!response.ok) {
      throw new Error(`智谱AI请求失败: ${response.statusText}`)
    }

    const data = await response.json() as OpenAIResponse

    return {
      content: data.choices[0].message.content,
      usage: data.usage
    }
  }

  async vision(imageBase64: string, prompt: string, model: string = 'glm-4v-flash'): Promise<AIResponse> {
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

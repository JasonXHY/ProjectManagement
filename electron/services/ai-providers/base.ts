// AI消息接口
export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
}

// AI响应接口
export interface AIResponse {
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// OpenAI兼容的API响应格式（智谱、MiMo均使用此格式）
export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// AI供应商统一接口
export interface AIProviderInterface {
  chat(messages: AIMessage[], model?: string): Promise<AIResponse>
  vision?(imageBase64: string, prompt: string, model?: string): Promise<AIResponse>
}

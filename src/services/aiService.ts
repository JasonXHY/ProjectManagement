import '../types/windowApi'

export const aiService = {
  async chat(projectId: number, message: string, contextFileIds: number[]) {
    return window.api.ai.chat(projectId, message, contextFileIds)
  },

  async classify(fileId: number) {
    return window.api.ai.classify(fileId)
  },

  async analyze(projectId: number) {
    return window.api.ai.analyze(projectId)
  },

  async getHistory(projectId: number) {
    return window.api.ai.getHistory(projectId)
  },

  async clearHistory(projectId: number) {
    return window.api.ai.clearHistory(projectId)
  }
}

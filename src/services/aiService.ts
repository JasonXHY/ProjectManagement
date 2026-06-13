import '../types/windowApi'

export const aiService = {
  async chat(projectId: number, message: string, contextFileIds: number[], sessionId: string) {
    return window.api.ai.chat(projectId, message, contextFileIds, sessionId)
  },

  async classify(fileId: number) {
    return window.api.ai.classify(fileId)
  },

  async analyze(projectId: number) {
    return window.api.ai.analyze(projectId)
  },

  async getHistory(projectId: number, sessionId?: string) {
    return window.api.ai.getHistory(projectId, sessionId)
  },

  async getSessions(projectId: number) {
    return window.api.ai.getSessions(projectId)
  },

  async clearHistory(projectId: number, sessionId?: string) {
    return window.api.ai.clearHistory(projectId, sessionId)
  }
}

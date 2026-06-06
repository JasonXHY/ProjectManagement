import '../types/windowApi'

export const fileService = {
  async upload(projectId: number, file: File) {
    const arrayBuffer = await file.arrayBuffer()
    return window.api.file.upload(projectId, {
      name: file.name,
      content: arrayBuffer,
      type: file.type
    })
  },

  async list(projectId: number) {
    return window.api.file.list(projectId)
  },

  async listByCategory(projectId: number, category: string) {
    return window.api.file.listByCategory(projectId, category)
  },

  async delete(id: number) {
    return window.api.file.delete(id)
  }
}

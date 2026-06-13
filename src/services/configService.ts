import '../types/windowApi'

export const configService = {
  async get() {
    return window.api.settings.get()
  },

  async update(settings: Record<string, string>) {
    return window.api.settings.update(settings)
  },

  async getPrompts() {
    return window.api.settings.getPrompts()
  }
}

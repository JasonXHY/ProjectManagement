import { Project, CategoryType } from '../types'
import '../types/windowApi'

export const projectService = {
  async create(name: string, categoryType: CategoryType, customStages?: string[]) {
    return window.api.project.create(name, categoryType, customStages)
  },

  async list() {
    return window.api.project.list()
  },

  async get(id: number) {
    return window.api.project.get(id)
  },

  async update(id: number, data: Partial<Project>) {
    return window.api.project.update(id, data)
  },

  async delete(id: number) {
    return window.api.project.delete(id)
  },

  async checkFolder(id: number) {
    return window.api.project.checkFolder(id)
  }
}

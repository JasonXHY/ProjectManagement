import { Project, FileRecord } from './index'

declare global {
  interface Window {
    api: {
      project: {
        create: (name: string, categoryType: string, customStages?: string[]) => Promise<{ success: boolean, data?: number, error?: string }>
        list: () => Promise<{ success: boolean, data?: Project[], error?: string }>
        get: (id: number) => Promise<{ success: boolean, data?: Project, error?: string }>
        update: (id: number, data: Partial<Project>) => Promise<{ success: boolean, error?: string }>
        delete: (id: number) => Promise<{ success: boolean, error?: string }>
      }
      file: {
        upload: (projectId: number, fileData: any) => Promise<{ success: boolean, data?: number, error?: string }>
        list: (projectId: number) => Promise<{ success: boolean, data?: FileRecord[], error?: string }>
        listByCategory: (projectId: number, category: string) => Promise<{ success: boolean, data?: FileRecord[], error?: string }>
        delete: (id: number) => Promise<{ success: boolean, error?: string }>
      }
      ai: {
        chat: (projectId: number, message: string, contextFileIds: number[]) => Promise<{ success: boolean, data?: string, error?: string }>
        classify: (fileId: number) => Promise<{ success: boolean, data?: string, error?: string }>
        analyze: (projectId: number) => Promise<{ success: boolean, data?: string, error?: string }>
      }
      settings: {
        get: () => Promise<{ success: boolean, data?: Record<string, string>, error?: string }>
        update: (settings: Record<string, string>) => Promise<{ success: boolean, error?: string }>
      }
    }
  }
}

export {}

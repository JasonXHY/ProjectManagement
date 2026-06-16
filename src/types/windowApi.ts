import { Project, FileRecord } from './index'

export interface FileUploadData {
  name: string
  content: ArrayBuffer
  type: string
}

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
        upload: (projectId: number, fileData: FileUploadData) => Promise<{ success: boolean, data?: number, error?: string }>
        list: (projectId: number) => Promise<{ success: boolean, data?: FileRecord[], error?: string }>
        listByCategory: (projectId: number, category: string) => Promise<{ success: boolean, data?: FileRecord[], error?: string }>
        delete: (id: number) => Promise<{ success: boolean, error?: string }>
        updateCategory: (id: number, category: string, subcategory?: string | null) => Promise<{ success: boolean, error?: string }>
        getSummary: (projectId: number) => Promise<{ success: boolean; data?: string; error?: string }>
        openFolder: (projectId: number) => Promise<{ success: boolean; error?: string }>
        open: (fileId: number) => Promise<{ success: boolean; error?: string }>
      }
      ai: {
        chat: (projectId: number, message: string, contextFileIds: number[], sessionId: string) => Promise<{ success: boolean, data?: string, error?: string }>
        classify: (fileId: number, categoryType?: 'stage' | 'content') => Promise<{ success: boolean, data?: { category: string, subcategory: string | null, stage: string | null, summary: string | null } | string, error?: string }>
        analyze: (projectId: number) => Promise<{ success: boolean, data?: string, error?: string }>
        getHistory: (projectId: number, sessionId?: string) => Promise<{ success: boolean, data?: Array<{ id: number, project_id: number, session_id: string, role: string, content: string, token_count: number, created_at: string }>, error?: string }>
        getSessions: (projectId: number) => Promise<{ success: boolean, data?: Array<{ session_id: string, first_message: string, message_count: number, created_at: string, updated_at: string }>, error?: string }>
        clearHistory: (projectId: number, sessionId?: string) => Promise<{ success: boolean, error?: string }>
        /** Reserved for future batch progress UI */
        onClassifyProgress: (callback: (data: { current: number, total: number }) => void) => void
        /** Reserved for future batch progress UI */
        removeClassifyProgressListener: () => void
      }
      settings: {
        get: () => Promise<{ success: boolean, data?: Record<string, string>, error?: string }>
        update: (settings: Record<string, string>) => Promise<{ success: boolean, error?: string }>
        getModelList: () => Promise<{ success: boolean, data?: any[], error?: string }>
        getPrompts: () => Promise<{ success: boolean, data?: Record<string, string>, error?: string }>
        browseFolder: () => Promise<{ success: boolean, data?: string, error?: string }>
      }
    }
  }
}

export {}

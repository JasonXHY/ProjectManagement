import { contextBridge, ipcRenderer } from 'electron'

interface FileUploadData {
  name: string
  content: ArrayBuffer
  type: string
}

contextBridge.exposeInMainWorld('api', {
  project: {
    create: (name: string, categoryType: string, customStages?: string[]) =>
      ipcRenderer.invoke('project:create', name, categoryType, customStages),
    list: () => ipcRenderer.invoke('project:list'),
    get: (id: number) => ipcRenderer.invoke('project:get', id),
    update: (id: number, data: Record<string, unknown>) => ipcRenderer.invoke('project:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('project:delete', id),
    checkFolder: (id: number) => ipcRenderer.invoke('project:checkFolder', id),
    onStageProgressionNeeded: (callback: (data: { projectId: number, targetStage: string, detectedType: string }) => void) => {
      ipcRenderer.on('project:stage-progression-needed', (_event, data) => callback(data))
    },
    removeStageProgressionListener: () => {
      ipcRenderer.removeAllListeners('project:stage-progression-needed')
    },
  },
  file: {
    upload: (projectId: number, fileData: FileUploadData) => ipcRenderer.invoke('file:upload', projectId, fileData),
    list: (projectId: number) => ipcRenderer.invoke('file:list', projectId),
    listByCategory: (projectId: number, category: string) => ipcRenderer.invoke('file:listByCategory', projectId, category),
    delete: (id: number) => ipcRenderer.invoke('file:delete', id),
    updateCategory: (id: number, category: string, subcategory?: string | null) => ipcRenderer.invoke('file:updateCategory', id, category, subcategory),
    getSummary: (projectId: number) => ipcRenderer.invoke('file:getSummary', projectId),
    openFolder: (projectId: number) => ipcRenderer.invoke('file:openFolder', projectId),
    open: (fileId: number) => ipcRenderer.invoke('file:open', fileId),
  },
  ai: {
    chat: (projectId: number, message: string, contextFileIds: number[], sessionId: string) =>
      ipcRenderer.invoke('ai:chat', projectId, message, contextFileIds, sessionId),
    classify: (fileId: number, categoryType?: 'stage' | 'content') => ipcRenderer.invoke('ai:classify', fileId, categoryType),
    analyze: (projectId: number) => ipcRenderer.invoke('ai:analyze', projectId),
    getHistory: (projectId: number, sessionId?: string) => ipcRenderer.invoke('ai:get-history', projectId, sessionId),
    getSessions: (projectId: number) => ipcRenderer.invoke('ai:get-sessions', projectId),
    clearHistory: (projectId: number, sessionId?: string) => ipcRenderer.invoke('ai:clear-history', projectId, sessionId),
    onClassifyProgress: (callback: (data: { current: number, total: number }) => void) => {
      ipcRenderer.on('ai:classifyProgress', (_event, data) => callback(data))
    },
    removeClassifyProgressListener: () => {
      ipcRenderer.removeAllListeners('ai:classifyProgress')
    },
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (settings: Record<string, string>) => ipcRenderer.invoke('settings:update', settings),
    getModelList: () => ipcRenderer.invoke('settings:getModelList'),
    getPrompts: () => ipcRenderer.invoke('settings:getPrompts'),
    resetPrompts: () => ipcRenderer.invoke('settings:resetPrompts'),
    browseFolder: () => ipcRenderer.invoke('settings:browseFolder'),
  },
  handover: {
    export: (params: { projectId: number, mode: 'full' | 'selective', selectedFiles?: string[], handoverNote?: string }) =>
      ipcRenderer.invoke('handover:export', params),
    import: (params: { zipPath: string, projectName?: string }) =>
      ipcRenderer.invoke('handover:import', params),
    preview: (zipPath: string) => ipcRenderer.invoke('handover:preview', { zipPath }),
    aiSelect: (projectId: number, description: string) =>
      ipcRenderer.invoke('handover:ai-select', { projectId, description }),
  },
  clipboard: {
    writeText: (text: string) => ipcRenderer.invoke('clipboard:writeText', text),
  },
})

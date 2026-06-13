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
  },
  file: {
    upload: (projectId: number, fileData: FileUploadData) => ipcRenderer.invoke('file:upload', projectId, fileData),
    list: (projectId: number) => ipcRenderer.invoke('file:list', projectId),
    listByCategory: (projectId: number, category: string) => ipcRenderer.invoke('file:listByCategory', projectId, category),
    delete: (id: number) => ipcRenderer.invoke('file:delete', id),
    updateCategory: (id: number, category: string) => ipcRenderer.invoke('file:updateCategory', id, category),
    getSummary: (projectId: number) => ipcRenderer.invoke('file:getSummary', projectId),
    openFolder: (projectId: number) => ipcRenderer.invoke('file:openFolder', projectId),
    open: (fileId: number) => ipcRenderer.invoke('file:open', fileId),
  },
  ai: {
    chat: (projectId: number, message: string, contextFileIds: number[], sessionId: string) =>
      ipcRenderer.invoke('ai:chat', projectId, message, contextFileIds, sessionId),
    classify: (fileId: number) => ipcRenderer.invoke('ai:classify', fileId),
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
  },
})

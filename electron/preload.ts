import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  project: {
    create: (name: string, categoryType: string, customStages?: string[]) =>
      ipcRenderer.invoke('project:create', name, categoryType, customStages),
    list: () => ipcRenderer.invoke('project:list'),
    get: (id: number) => ipcRenderer.invoke('project:get', id),
    update: (id: number, data: any) => ipcRenderer.invoke('project:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('project:delete', id),
  },
  file: {
    upload: (projectId: number, fileData: any) => ipcRenderer.invoke('file:upload', projectId, fileData),
    list: (projectId: number) => ipcRenderer.invoke('file:list', projectId),
    listByCategory: (projectId: number, category: string) => ipcRenderer.invoke('file:listByCategory', projectId, category),
    delete: (id: number) => ipcRenderer.invoke('file:delete', id),
  },
  ai: {
    chat: (projectId: number, message: string, contextFileIds: number[]) =>
      ipcRenderer.invoke('ai:chat', projectId, message, contextFileIds),
    classify: (fileId: number) => ipcRenderer.invoke('ai:classify', fileId),
    analyze: (projectId: number) => ipcRenderer.invoke('ai:analyze', projectId),
    getHistory: (projectId: number) => ipcRenderer.invoke('ai:get-history', projectId),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (settings: Record<string, string>) => ipcRenderer.invoke('settings:update', settings),
  },
})

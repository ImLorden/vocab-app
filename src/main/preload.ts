import { contextBridge, ipcRenderer } from 'electron';
import { WordWithTranslations, AppSettings } from '@/shared/types';

const api = {
  words: {
    getAll: (): Promise<WordWithTranslations[]> => ipcRenderer.invoke('get-all-words'),
    getByTag: (tagName: string): Promise<WordWithTranslations[]> => ipcRenderer.invoke('get-words-by-tag', tagName),
    add: (originalText: string, sourceLanguage: string, targetLanguage?: string): Promise<WordWithTranslations | null> => 
      ipcRenderer.invoke('add-word', originalText, sourceLanguage, targetLanguage),
    delete: (wordId: number): Promise<boolean> => ipcRenderer.invoke('delete-word', wordId),
  },
  tags: {
    getAll: (): Promise<any[]> => ipcRenderer.invoke('get-all-tags'),
  },
  settings: {
    get: (): Promise<Partial<AppSettings>> => ipcRenderer.invoke('get-settings'),
    set: (value: any): Promise<boolean> => ipcRenderer.invoke('set-claude-api-key', value),
  },
  getOCRText: (): Promise<string> => ipcRenderer.invoke('get-ocr-text'),
  openMainWindow: (route?: string): Promise<boolean> => ipcRenderer.invoke('open-main-window', route),
  developer: {
    getLogs: (filter?: any): Promise<any[]> => ipcRenderer.invoke('dev-get-logs', filter),
    executeSQL: (query: string): Promise<any> => ipcRenderer.invoke('dev-execute-sql', query),
    getSchema: (): Promise<any[]> => ipcRenderer.invoke('dev-get-schema'),
    clearLogs: (): Promise<boolean> => ipcRenderer.invoke('dev-clear-logs'),
    exportLogs: (): Promise<string> => ipcRenderer.invoke('dev-export-logs'),
    isEnabled: (): Promise<boolean> => ipcRenderer.invoke('get-developer-mode'),
    setEnabled: (enabled: boolean): Promise<boolean> => ipcRenderer.invoke('set-developer-mode', enabled),
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
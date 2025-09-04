declare global {
  interface Window {
    electronAPI: {
      words: {
        getAll: () => Promise<any[]>;
        getByTag: (tagName: string) => Promise<any[]>;
        add: (originalText: string, sourceLanguage: string, targetLanguage?: string) => Promise<any>;
        delete: (wordId: number) => Promise<boolean>;
      };
      tags: {
        getAll: () => Promise<any[]>;
      };
      settings: {
        get: () => Promise<any>;
        set: (value: any) => Promise<boolean>;
      };
      getOCRText: () => Promise<string>;
      openMainWindow: (route?: string) => Promise<boolean>;
      developer: {
        getLogs: (filter?: any) => Promise<any[]>;
        executeSQL: (query: string) => Promise<any>;
        getSchema: () => Promise<any[]>;
        clearLogs: () => Promise<boolean>;
        exportLogs: () => Promise<string>;
        isEnabled: () => Promise<boolean>;
        setEnabled: (enabled: boolean) => Promise<boolean>;
      };
    };
  }
}

export {};
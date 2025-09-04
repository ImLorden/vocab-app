export interface Word {
  id: number;
  originalText: string;
  sourceLanguage: string;
  createdAt: string;
  updatedAt: string;
}

export interface Translation {
  id: number;
  wordId: number;
  targetLanguage: string;
  translation: string;
  definition?: string;
  pronunciation?: string;
  partOfSpeech?: string;
  examples: string[];
  usageNotes?: string;
}

export interface Tag {
  id: number;
  wordId: number;
  tagName: string;
  tagType: 'auto_date' | 'auto_language' | 'custom';
  createdAt: string;
}

export interface WordWithTranslations {
  word: Word;
  translations: Translation[];
  tags: Tag[];
}

export interface ClaudeTranslationResponse {
  translation: string;
  definition: string;
  pronunciation?: string;
  partOfSpeech?: string;
  examples: string[];
  usageNotes?: string;
}

export interface AppSettings {
  claudeApiKey: string;
  defaultTargetLanguage: string;
  theme: 'light' | 'dark' | 'auto';
  developerMode?: boolean;
  shortcuts: {
    quickInput: string;
    ocrCapture: string;
  };
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  source: 'main' | 'renderer' | 'database' | 'claude-api' | 'ocr';
  message: string;
  data?: any;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  indexes: string[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: any;
  primaryKey: boolean;
}

export interface QueryResult {
  columns: string[];
  rows: any[];
  error?: string;
  affectedRows?: number;
}
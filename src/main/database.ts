import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { Word, Translation, Tag, WordWithTranslations } from '@/shared/types';
import { logger } from './logger';

export class VocabDatabase {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'vocab.db');
    this.db = new Database(dbPath);
    this.initializeSchema();
  }

  private initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_text TEXT NOT NULL,
        source_language TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(original_text, source_language)
      );

      CREATE TABLE IF NOT EXISTS translations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word_id INTEGER NOT NULL,
        target_language TEXT NOT NULL,
        translation TEXT NOT NULL,
        definition TEXT,
        pronunciation TEXT,
        part_of_speech TEXT,
        examples TEXT,
        usage_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word_id INTEGER NOT NULL,
        tag_name TEXT NOT NULL,
        tag_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
        UNIQUE(word_id, tag_name)
      );

      CREATE INDEX IF NOT EXISTS idx_words_created_at ON words(created_at);
      CREATE INDEX IF NOT EXISTS idx_words_source_lang ON words(source_language);
      CREATE INDEX IF NOT EXISTS idx_translations_word_id ON translations(word_id);
      CREATE INDEX IF NOT EXISTS idx_tags_word_id ON tags(word_id);
      CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(tag_name);
    `);
  }

  addWord(originalText: string, sourceLanguage: string): Word | null {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO words (original_text, source_language)
        VALUES (?, ?)
        ON CONFLICT(original_text, source_language) DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `);
      
      const result = stmt.get(originalText, sourceLanguage) as any;
      return this.mapRowToWord(result);
    } catch (error) {
      console.error('Error adding word:', error);
      return null;
    }
  }

  addTranslation(wordId: number, targetLanguage: string, translationData: Partial<Translation>): Translation | null {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO translations (
          word_id, target_language, translation, definition,
          pronunciation, part_of_speech, examples, usage_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        wordId,
        targetLanguage,
        translationData.translation,
        translationData.definition,
        translationData.pronunciation,
        translationData.partOfSpeech,
        JSON.stringify(translationData.examples || []),
        translationData.usageNotes
      );

      return this.getTranslation(result.lastInsertRowid as number);
    } catch (error) {
      console.error('Error adding translation:', error);
      return null;
    }
  }

  addTags(wordId: number, tags: { name: string; type: 'auto_date' | 'auto_language' | 'custom' }[]) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO tags (word_id, tag_name, tag_type)
      VALUES (?, ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      for (const tag of tags) {
        stmt.run(wordId, tag.name, tag.type);
      }
    });

    transaction();
  }

  deleteWord(wordId: number): boolean {
    try {
      const stmt = this.db.prepare('DELETE FROM words WHERE id = ?');
      const result = stmt.run(wordId);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting word:', error);
      return false;
    }
  }

  getWordWithTranslations(wordId: number): WordWithTranslations | null {
    const word = this.getWord(wordId);
    if (!word) return null;

    const translations = this.getTranslationsForWord(wordId);
    const tags = this.getTagsForWord(wordId);

    return { word, translations, tags };
  }

  getAllWords(): WordWithTranslations[] {
    const words = this.db.prepare('SELECT * FROM words ORDER BY created_at DESC').all() as any[];
    
    return words.map(wordRow => {
      const word = this.mapRowToWord(wordRow);
      const translations = this.getTranslationsForWord(word.id);
      const tags = this.getTagsForWord(word.id);
      return { word, translations, tags };
    });
  }

  getWordsByTag(tagName: string): WordWithTranslations[] {
    const stmt = this.db.prepare(`
      SELECT w.* FROM words w
      JOIN tags t ON w.id = t.word_id
      WHERE t.tag_name = ?
      ORDER BY w.created_at DESC
    `);
    
    const words = stmt.all(tagName) as any[];
    
    return words.map(wordRow => {
      const word = this.mapRowToWord(wordRow);
      const translations = this.getTranslationsForWord(word.id);
      const tags = this.getTagsForWord(word.id);
      return { word, translations, tags };
    });
  }

  getAllTags(): Array<{ name: string; type: string; count: number }> {
    const stmt = this.db.prepare(`
      SELECT DISTINCT tag_name, tag_type, COUNT(*) as count
      FROM tags
      GROUP BY tag_name, tag_type
      ORDER BY tag_type, tag_name
    `);
    
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      name: row.tag_name,
      type: row.tag_type,
      count: row.count
    }));
  }

  private getWord(id: number): Word | null {
    const stmt = this.db.prepare('SELECT * FROM words WHERE id = ?');
    const result = stmt.get(id) as any;
    return result ? this.mapRowToWord(result) : null;
  }

  private getTranslation(id: number): Translation | null {
    const stmt = this.db.prepare('SELECT * FROM translations WHERE id = ?');
    const result = stmt.get(id) as any;
    return result ? this.mapRowToTranslation(result) : null;
  }

  private getTranslationsForWord(wordId: number): Translation[] {
    const stmt = this.db.prepare('SELECT * FROM translations WHERE word_id = ?');
    const results = stmt.all(wordId) as any[];
    return results.map(row => this.mapRowToTranslation(row));
  }

  private getTagsForWord(wordId: number): Tag[] {
    const stmt = this.db.prepare('SELECT * FROM tags WHERE word_id = ?');
    const results = stmt.all(wordId) as any[];
    return results.map(row => this.mapRowToTag(row));
  }

  private mapRowToWord(row: any): Word {
    return {
      id: row.id,
      originalText: row.original_text,
      sourceLanguage: row.source_language,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRowToTranslation(row: any): Translation {
    let examples: string[] = [];
    try {
      examples = row.examples ? JSON.parse(row.examples) : [];
    } catch (error) {
      console.error('Failed to parse examples JSON:', row.examples, error);
      examples = [];
    }

    return {
      id: row.id,
      wordId: row.word_id,
      targetLanguage: row.target_language,
      translation: row.translation,
      definition: row.definition,
      pronunciation: row.pronunciation,
      partOfSpeech: row.part_of_speech,
      examples: examples,
      usageNotes: row.usage_notes,
    };
  }

  private mapRowToTag(row: any): Tag {
    return {
      id: row.id,
      wordId: row.word_id,
      tagName: row.tag_name,
      tagType: row.tag_type as 'auto_date' | 'auto_language' | 'custom',
      createdAt: row.created_at,
    };
  }

  executeSQL(query: string): { columns: string[], rows: any[], error?: string, affectedRows?: number } {
    try {
      logger.info('database', 'Executing developer SQL query', { query: query.substring(0, 100) + '...' });
      
      const trimmedQuery = query.trim();
      const isSelect = trimmedQuery.toLowerCase().startsWith('select');
      
      if (isSelect) {
        const stmt = this.db.prepare(query);
        const rows = stmt.all();
        const columns = rows.length > 0 ? Object.keys(rows[0] as object) : [];
        
        logger.info('database', 'SQL query executed successfully', { 
          type: 'SELECT', 
          rowCount: rows.length,
          columns: columns.length 
        });
        
        return { columns, rows };
      } else {
        const result = this.db.prepare(query).run();
        
        logger.info('database', 'SQL statement executed successfully', { 
          type: 'WRITE', 
          affectedRows: result.changes 
        });
        
        return { 
          columns: ['Result'], 
          rows: [{ Result: `${result.changes} rows affected` }],
          affectedRows: result.changes
        };
      }
    } catch (error: any) {
      logger.error('database', 'SQL execution failed', { query: query.substring(0, 100) + '...', error: error.message });
      return { 
        columns: [], 
        rows: [], 
        error: error.message 
      };
    }
  }

  getSchema(): TableInfo[] {
    try {
      logger.debug('database', 'Fetching database schema');
      
      const tablesQuery = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'";
      const tables = this.db.prepare(tablesQuery).all() as { name: string }[];

      const schema: TableInfo[] = tables.map(table => {
        const columnsQuery = `PRAGMA table_info(${table.name})`;
        const columnsResult = this.db.prepare(columnsQuery).all() as any[];
        
        const columns: ColumnInfo[] = columnsResult.map(col => ({
          name: col.name,
          type: col.type,
          nullable: !col.notnull,
          defaultValue: col.dflt_value,
          primaryKey: !!col.pk
        }));

        const indexesQuery = `PRAGMA index_list(${table.name})`;
        const indexesResult = this.db.prepare(indexesQuery).all() as any[];
        const indexes = indexesResult.map(idx => idx.name);

        return {
          name: table.name,
          columns,
          indexes
        };
      });

      logger.info('database', 'Schema fetched successfully', { tableCount: schema.length });
      return schema;
    } catch (error: any) {
      logger.error('database', 'Failed to fetch schema', { error: error.message });
      return [];
    }
  }

  validateQuery(query: string): { isValid: boolean, isDangerous: boolean, message?: string } {
    const trimmedQuery = query.trim().toLowerCase();
    
    if (!trimmedQuery) {
      return { isValid: false, isDangerous: false, message: 'Query cannot be empty' };
    }

    const dangerousKeywords = ['delete', 'drop', 'update', 'insert', 'alter', 'create', 'truncate'];
    const isDangerous = dangerousKeywords.some(keyword => trimmedQuery.includes(keyword));
    
    try {
      this.db.prepare(query);
      return { isValid: true, isDangerous };
    } catch (error: any) {
      return { isValid: false, isDangerous: false, message: error.message };
    }
  }

  close() {
    this.db.close();
  }
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
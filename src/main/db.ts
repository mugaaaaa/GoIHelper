import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';

export interface Prompt {
  id: number;
  name: string;
  content: string;
}

export interface VocabularyBook {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface VocabularyWord {
  id: number;
  book_id: number;
  word: string;
  reading?: string;
  meaning?: string;
  note?: string;
  created_at: string;
}

export interface GrammarBook {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface GrammarItem {
  id: number;
  book_id: number;
  grammar: string;
  reading?: string;
  structure?: string;
  meaning?: string;
  context?: string;
  examples?: string;
  note?: string;
  created_at: string;
}

export interface AnalysisSet {
  id: number;
  name: string;
  type: 'image' | 'text';
  created_at: string;
}

export interface AnalysisRecord {
  id: number;
  set_id: number;
  title: string;
  original_content: string;
  ai_result: string;
  created_at: string;
}

export class DBManager {
  private db: Database.Database;

  constructor() {
    const dbPath = join(app.getPath('userData'), 'database.sqlite');
    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        content TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS vocabulary_books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS vocabulary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        word TEXT NOT NULL,
        reading TEXT,
        meaning TEXT,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (book_id) REFERENCES vocabulary_books(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS grammar_books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS grammar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        grammar TEXT NOT NULL,
        reading TEXT,
        structure TEXT,
        meaning TEXT,
        context TEXT,
        examples TEXT,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (book_id) REFERENCES grammar_books(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS analysis_sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT CHECK(type IN ('image', 'text')) NOT NULL, 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS analysis_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        set_id INTEGER NOT NULL,
        title TEXT DEFAULT 'New Record',
        original_content TEXT NOT NULL, 
        ai_result TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (set_id) REFERENCES analysis_sets(id) ON DELETE CASCADE
      );
    `);

    // Migration: Check if 'title' column exists in 'analysis_records'
    try {
      const tableInfo = this.db.pragma('table_info(analysis_records)') as { name: string }[];
      const hasTitle = tableInfo.some(col => col.name === 'title');

      if (!hasTitle) {
        this.db.exec("ALTER TABLE analysis_records ADD COLUMN title TEXT DEFAULT 'New Record'");
      }
    } catch (error) {
      console.error('Migration failed:', error);
    }

    // Migration: Check if 'context' column exists in 'vocabulary' and rename to 'note' if needed
    try {
      const tableInfo = this.db.pragma('table_info(vocabulary)') as { name: string }[];
      const hasContext = tableInfo.some(col => col.name === 'context');
      const hasNote = tableInfo.some(col => col.name === 'note');

      if (hasContext && !hasNote) {
        this.db.exec('ALTER TABLE vocabulary RENAME COLUMN context TO note');
      }
    } catch (error) {
      console.error('Migration failed:', error);
    }
    
    // Insert default prompt if empty
    const count = this.db.prepare('SELECT COUNT(*) as count FROM prompts').get() as { count: number };
    if (count.count === 0) {
      this.addPrompt('Default Japanese Analysis', `
        Please analyze this image. 
        If it contains Japanese text, please:
        1. Transcribe the Japanese text.
        2. Provide a translation.
        3. Break down the sentence structure and explain key vocabulary.
      `.trim());

      this.addPrompt('日语分析', `
        请担任我的日语学习助手。仔细分析图片中的日语文本：
        1. 提供地道、准确的中文翻译。
        2. 逐句解析句子结构，特别是复杂的从句或修饰关系。
        3. 解释关键的语法点和词汇在上下文中的具体用法和细微差别。
        4. 指出任何体现日本文化或特定语境的表达方式。
      `.trim());
    }

    // Insert default vocabulary book if empty
    const bookCount = this.db.prepare('SELECT COUNT(*) as count FROM vocabulary_books').get() as { count: number };
    if (bookCount.count === 0) {
      this.createBook('Default Book', 'My first vocabulary book');
    }

    // Insert default grammar book if empty
    const grammarBookCount = this.db.prepare('SELECT COUNT(*) as count FROM grammar_books').get() as { count: number };
    if (grammarBookCount.count === 0) {
      this.createGrammarBook('Default Grammar Book', 'My first grammar book');
    }
  }

  getAllPrompts(): Prompt[] {
    return this.db.prepare('SELECT * FROM prompts').all() as Prompt[];
  }

  addPrompt(name: string, content: string): number {
    const stmt = this.db.prepare('INSERT INTO prompts (name, content) VALUES (?, ?)');
    const info = stmt.run(name, content);
    return info.lastInsertRowid as number;
  }

  updatePrompt(id: number, name: string, content: string): void {
    const stmt = this.db.prepare('UPDATE prompts SET name = ?, content = ? WHERE id = ?');
    stmt.run(name, content, id);
  }

  deletePrompt(id: number): void {
    const stmt = this.db.prepare('DELETE FROM prompts WHERE id = ?');
    stmt.run(id);
  }

  // Vocabulary Book Methods
  getBooks(): VocabularyBook[] {
    return this.db.prepare('SELECT * FROM vocabulary_books ORDER BY created_at DESC').all() as VocabularyBook[];
  }

  createBook(name: string, description?: string): number {
    const stmt = this.db.prepare('INSERT INTO vocabulary_books (name, description) VALUES (?, ?)');
    const info = stmt.run(name, description || null);
    return info.lastInsertRowid as number;
  }

  deleteBook(id: number): void {
    const stmt = this.db.prepare('DELETE FROM vocabulary_books WHERE id = ?');
    stmt.run(id);
  }

  // Analysis Set Methods
  getAnalysisSets(type: 'image' | 'text'): AnalysisSet[] {
    return this.db.prepare('SELECT * FROM analysis_sets WHERE type = ? ORDER BY created_at DESC').all(type) as AnalysisSet[];
  }

  createAnalysisSet(name: string, type: 'image' | 'text'): number {
    const stmt = this.db.prepare('INSERT INTO analysis_sets (name, type) VALUES (?, ?)');
    const info = stmt.run(name, type);
    return info.lastInsertRowid as number;
  }

  deleteAnalysisSet(id: number): void {
    const stmt = this.db.prepare('DELETE FROM analysis_sets WHERE id = ?');
    stmt.run(id);
  }

  // Analysis Record Methods
  getAnalysisRecords(setId: number): AnalysisRecord[] {
    return this.db.prepare('SELECT * FROM analysis_records WHERE set_id = ? ORDER BY created_at DESC').all(setId) as AnalysisRecord[];
  }

  addAnalysisRecord(setId: number, title: string, originalContent: string, aiResult: string): number {
    const stmt = this.db.prepare('INSERT INTO analysis_records (set_id, title, original_content, ai_result) VALUES (?, ?, ?, ?)');
    const info = stmt.run(setId, title, originalContent, aiResult);
    return info.lastInsertRowid as number;
  }

  deleteAnalysisRecord(id: number): void {
    const stmt = this.db.prepare('DELETE FROM analysis_records WHERE id = ?');
    stmt.run(id);
  }

  // Vocabulary Word Methods
  getWords(bookId: number): VocabularyWord[] {
    return this.db.prepare('SELECT * FROM vocabulary WHERE book_id = ? ORDER BY created_at DESC').all(bookId) as VocabularyWord[];
  }

  addWord(bookId: number, word: string, reading?: string, meaning?: string, note?: string): number {
    const stmt = this.db.prepare('INSERT INTO vocabulary (book_id, word, reading, meaning, note) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(bookId, word, reading || null, meaning || null, note || null);
    return info.lastInsertRowid as number;
  }

  updateWord(id: number, word: string, reading?: string, meaning?: string, note?: string): void {
    const stmt = this.db.prepare('UPDATE vocabulary SET word = ?, reading = ?, meaning = ?, note = ? WHERE id = ?');
    stmt.run(word, reading || null, meaning || null, note || null, id);
  }

  deleteWord(id: number): void {
    const stmt = this.db.prepare('DELETE FROM vocabulary WHERE id = ?');
    stmt.run(id);
  }

  // Grammar Book Methods
  getGrammarBooks(): GrammarBook[] {
    return this.db.prepare('SELECT * FROM grammar_books ORDER BY created_at DESC').all() as GrammarBook[];
  }

  createGrammarBook(name: string, description?: string): number {
    const stmt = this.db.prepare('INSERT INTO grammar_books (name, description) VALUES (?, ?)');
    const info = stmt.run(name, description || null);
    return info.lastInsertRowid as number;
  }

  deleteGrammarBook(id: number): void {
    const stmt = this.db.prepare('DELETE FROM grammar_books WHERE id = ?');
    stmt.run(id);
  }

  // Grammar Item Methods
  getGrammarItems(bookId: number): GrammarItem[] {
    return this.db.prepare('SELECT * FROM grammar WHERE book_id = ? ORDER BY created_at DESC').all(bookId) as GrammarItem[];
  }

  addGrammarItem(bookId: number, grammar: string, reading?: string, structure?: string, meaning?: string, context?: string, examples?: string, note?: string): number {
    const stmt = this.db.prepare('INSERT INTO grammar (book_id, grammar, reading, structure, meaning, context, examples, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(bookId, grammar, reading || null, structure || null, meaning || null, context || null, examples || null, note || null);
    return info.lastInsertRowid as number;
  }

  updateGrammarItem(id: number, grammar: string, reading?: string, structure?: string, meaning?: string, context?: string, examples?: string, note?: string): void {
    const stmt = this.db.prepare('UPDATE grammar SET grammar = ?, reading = ?, structure = ?, meaning = ?, context = ?, examples = ?, note = ? WHERE id = ?');
    stmt.run(grammar, reading || null, structure || null, meaning || null, context || null, examples || null, note || null, id);
  }

  deleteGrammarItem(id: number): void {
    const stmt = this.db.prepare('DELETE FROM grammar WHERE id = ?');
    stmt.run(id);
  }
}

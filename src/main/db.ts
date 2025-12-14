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
    `);

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
    }

    // Insert default vocabulary book if empty
    const bookCount = this.db.prepare('SELECT COUNT(*) as count FROM vocabulary_books').get() as { count: number };
    if (bookCount.count === 0) {
      this.createBook('Default Book', 'My first vocabulary book');
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

  // Vocabulary Word Methods
  getWords(bookId: number): VocabularyWord[] {
    return this.db.prepare('SELECT * FROM vocabulary WHERE book_id = ? ORDER BY created_at DESC').all(bookId) as VocabularyWord[];
  }

  addWord(bookId: number, word: string, reading?: string, meaning?: string, note?: string): number {
    const stmt = this.db.prepare('INSERT INTO vocabulary (book_id, word, reading, meaning, note) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(bookId, word, reading || null, meaning || null, note || null);
    return info.lastInsertRowid as number;
  }

  deleteWord(id: number): void {
    const stmt = this.db.prepare('DELETE FROM vocabulary WHERE id = ?');
    stmt.run(id);
  }
}

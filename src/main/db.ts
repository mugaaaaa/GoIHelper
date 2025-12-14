import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';

export interface Prompt {
  id: number;
  name: string;
  content: string;
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
      )
    `);
    
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
}

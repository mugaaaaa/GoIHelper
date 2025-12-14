export interface VocabularyItem {
  word: string;
  reading: string;
  meaning: string;
  context: string;
}

export class VocabularyService {
  async addWord(item: VocabularyItem): Promise<void> {
    // TODO: Implement storage (e.g., IndexedDB, local file)
    console.log('Adding word:', item);
  }

  async exportToAnki(): Promise<void> {
    // TODO: Implement Anki export logic (CSV or AnkiConnect)
    console.log('Exporting to Anki...');
  }
}

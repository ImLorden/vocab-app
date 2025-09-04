export class TagGenerator {
  static generateAutoTags(sourceLanguage: string, createdAt: Date = new Date()) {
    const tags: { name: string; type: 'auto_date' | 'auto_language' | 'custom' }[] = [];

    const year = createdAt.getFullYear();
    const month = createdAt.getMonth() + 1;
    const day = createdAt.getDate();

    tags.push(
      { name: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`, type: 'auto_date' },
      { name: `${year}-${month.toString().padStart(2, '0')}`, type: 'auto_date' },
      { name: `${year}`, type: 'auto_date' }
    );

    const languageNames: Record<string, string> = {
      'en': 'english',
      'ja': 'japanese', 
      'it': 'italian',
      'zh': 'chinese',
    };

    if (languageNames[sourceLanguage]) {
      tags.push({ name: languageNames[sourceLanguage], type: 'auto_language' });
    }

    return tags;
  }
}
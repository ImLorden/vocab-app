import { create } from 'zustand';
import { WordWithTranslations } from '@/shared/types';

interface VocabStore {
  words: WordWithTranslations[];
  tags: Array<{ name: string; type: string; count: number }>;
  selectedTag: string | null;
  selectedWord: WordWithTranslations | null;
  isLoading: boolean;
  searchQuery: string;
  expandedNodes: Set<string>;
  
  loadWords: () => Promise<void>;
  loadWordsByTag: (tagName: string) => Promise<void>;
  loadTags: () => Promise<void>;
  addWord: (originalText: string, sourceLanguage: string, targetLanguage?: string) => Promise<void>;
  setSelectedTag: (tag: string | null) => void;
  setSelectedWord: (word: WordWithTranslations | null) => void;
  setSearchQuery: (query: string) => void;
  getFilteredWords: () => WordWithTranslations[];
  toggleExpandedNode: (nodeId: string) => void;
  isNodeExpanded: (nodeId: string) => boolean;
}

export const useVocabStore = create<VocabStore>((set, get) => ({
  words: [],
  tags: [],
  selectedTag: null,
  selectedWord: null,
  isLoading: false,
  searchQuery: '',
  expandedNodes: new Set(['languages', 'timeline']),

  loadWords: async () => {
    set({ isLoading: true });
    try {
      const words = await window.electronAPI.words.getAll();
      set({ words, selectedTag: null });
    } catch (error) {
      console.error('Error loading words:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadWordsByTag: async (tagName: string) => {
    set({ isLoading: true });
    try {
      const words = await window.electronAPI.words.getByTag(tagName);
      set({ words, selectedTag: tagName });
    } catch (error) {
      console.error('Error loading words by tag:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadTags: async () => {
    try {
      const tags = await window.electronAPI.tags.getAll();
      set({ tags });
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  },

  addWord: async (originalText: string, sourceLanguage: string, targetLanguage?: string) => {
    set({ isLoading: true });
    try {
      const newWord = await window.electronAPI.words.add(originalText, sourceLanguage, targetLanguage);
      if (newWord) {
        const { words } = get();
        set({ words: [newWord, ...words] });
        await get().loadTags();
      }
    } catch (error) {
      console.error('Error adding word:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedTag: (tag: string | null) => {
    set({ selectedTag: tag });
  },

  setSelectedWord: (word: WordWithTranslations | null) => {
    set({ selectedWord: word });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  getFilteredWords: () => {
    const { words, searchQuery } = get();
    if (!searchQuery.trim()) return words;
    
    return words.filter(wordData => 
      wordData.word.originalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wordData.translations.some(t => 
        t.translation.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  },

  toggleExpandedNode: (nodeId: string) => {
    const { expandedNodes } = get();
    const newExpandedNodes = new Set(expandedNodes);
    if (newExpandedNodes.has(nodeId)) {
      newExpandedNodes.delete(nodeId);
    } else {
      newExpandedNodes.add(nodeId);
    }
    set({ expandedNodes: newExpandedNodes });
  },

  isNodeExpanded: (nodeId: string) => {
    return get().expandedNodes.has(nodeId);
  },
}));
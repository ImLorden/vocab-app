import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Globe } from 'lucide-react';
import { useVocabStore } from '../stores/vocab-store';

const WordList: React.FC = () => {
  const { isLoading, selectedWord, setSelectedWord, getFilteredWords } = useVocabStore();
  const words = getFilteredWords();

  const handleWordClick = (wordData: any) => {
    console.log('Word clicked:', wordData);
    setSelectedWord(wordData);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLanguageLabel = (langCode: string) => {
    const labels: Record<string, string> = {
      'en': '英语',
      'ja': '日语',
      'it': '意大利语',
      'zh': '中文',
    };
    return labels[langCode] || langCode;
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <AnimatePresence>
        {words.map((wordData, index) => (
          <motion.div
            key={wordData.word.id}
            className="mb-3 glass-panel rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleWordClick(wordData)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">
                {wordData.word.originalText}
              </h3>
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                <Globe className="w-3 h-3" />
                <span>{getLanguageLabel(wordData.word.sourceLanguage)}</span>
              </div>
            </div>
            
            {wordData.translations.length > 0 && (
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                {wordData.translations[0].translation}
              </p>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{formatDate(wordData.word.createdAt)}</span>
              </div>
              
              <div className="flex space-x-1">
                {wordData.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  >
                    {tag.tagName}
                  </span>
                ))}
                {wordData.tags.length > 2 && (
                  <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    +{wordData.tags.length - 2}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {words.length === 0 && !isLoading && (
        <motion.div
          className="h-full flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg">暂无单词</p>
            <p className="text-sm mt-1">使用快捷键添加第一个单词</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default WordList;
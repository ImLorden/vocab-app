import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, BookOpen, MessageSquare, Lightbulb } from 'lucide-react';
import { WordWithTranslations } from '@/shared/types';
import { useVocabStore } from '../stores/vocab-store';

interface WordCardProps {
  word: WordWithTranslations;
}

const WordCard: React.FC<WordCardProps> = ({ word }) => {
  const { setSelectedTag, loadWordsByTag, loadWords, selectedTag } = useVocabStore();
  const primaryTranslation = word.translations[0];

  const handleTagClick = async (tagName: string) => {
    if (selectedTag === tagName) {
      setSelectedTag(null);
      await loadWords();
    } else {
      setSelectedTag(tagName);
      await loadWordsByTag(tagName);
    }
  };

  return (
    <motion.div 
      className="h-full p-6 overflow-y-auto"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Word Header */}
        <motion.div 
          className="glass-panel rounded-2xl p-6 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
              {word.word.originalText}
            </h1>
            {primaryTranslation?.pronunciation && (
              <button className="mac-button-secondary p-2">
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {primaryTranslation?.pronunciation && (
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              /{primaryTranslation.pronunciation}/
            </p>
          )}

          {primaryTranslation?.partOfSpeech && (
            <span className="inline-block px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              {primaryTranslation.partOfSpeech}
            </span>
          )}
        </motion.div>

        {/* Translations */}
        {word.translations.map((translation, index) => (
          <motion.div
            key={translation.id}
            className="glass-panel rounded-2xl p-6 mb-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <div className="flex items-center space-x-2 mb-3">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                翻译
              </h3>
            </div>

            <p className="text-xl text-gray-700 dark:text-gray-200 mb-4">
              {translation.translation}
            </p>

            {translation.definition && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  定义
                </h4>
                <p className="text-gray-700 dark:text-gray-300">
                  {translation.definition}
                </p>
              </div>
            )}

            {/* Examples */}
            {translation.examples && translation.examples.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    例句
                  </h4>
                </div>
                <div className="space-y-2">
                  {translation.examples.map((example, exampleIndex) => (
                    <motion.div
                      key={exampleIndex}
                      className="p-3 rounded-lg bg-green-50/50 dark:bg-green-900/20 border-l-2 border-green-500"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + exampleIndex * 0.1 }}
                    >
                      <p className="text-gray-700 dark:text-gray-300 italic">
                        "{example}"
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Usage Notes */}
            {translation.usageNotes && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    用法说明
                  </h4>
                </div>
                <motion.div
                  className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-900/20 border-l-2 border-amber-500"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-gray-700 dark:text-gray-300">
                    {translation.usageNotes}
                  </p>
                </motion.div>
              </div>
            )}
          </motion.div>
        ))}

        {/* Tags */}
        <motion.div
          className="glass-panel rounded-2xl p-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
            标签
          </h3>
          <div className="flex flex-wrap gap-2">
            {word.tags.map((tag) => (
              <motion.button
                key={tag.id}
                onClick={() => handleTagClick(tag.tagName)}
                className="px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                         hover:bg-blue-100 dark:hover:bg-blue-800/30 hover:text-blue-700 dark:hover:text-blue-300
                         transition-colors duration-200 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tag.tagName}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WordCard;
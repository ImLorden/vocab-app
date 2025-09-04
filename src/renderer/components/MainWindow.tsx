import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Settings, BookOpen } from 'lucide-react';
import { useVocabStore } from '../stores/vocab-store';
import WordList from './WordList';
import TagSidebar from './TagSidebar';
import WordCard from './WordCard';

const MainWindow: React.FC = () => {
  const { loadWords, loadTags, words, selectedWord, searchQuery, setSearchQuery } = useVocabStore();

  useEffect(() => {
    loadWords();
    loadTags();
  }, [loadWords, loadTags]);

  return (
    <div className="h-screen flex bg-gradient-to-br from-blue-50/30 to-indigo-100/30 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <motion.div 
        className="absolute top-0 left-0 right-0 z-10 glass-panel rounded-none border-0 border-b border-white/20"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Vocab App
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索单词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 rounded-lg border border-gray-200/50 bg-white/50 backdrop-blur-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         dark:border-gray-600/50 dark:bg-gray-700/50 dark:text-gray-100"
              />
            </div>
            
            <button 
              onClick={() => window.location.hash = 'quick-input'}
              className="mac-button flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>添加单词</span>
            </button>
            
            <button 
              onClick={() => window.location.hash = 'settings'}
              className="mac-button-secondary p-2"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex pt-20">
        {/* Sidebar */}
        <motion.div 
          className="w-64 glass-panel rounded-none border-0 border-r border-white/20"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <TagSidebar />
        </motion.div>

        {/* Content Area */}
        <div className="flex-1 flex">
          {/* Word List */}
          <motion.div 
            className="w-96 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm border-r border-white/20 dark:border-gray-700/30"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <WordList />
          </motion.div>

          {/* Word Detail */}
          <motion.div 
            className="flex-1 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {selectedWord ? (
              <WordCard word={selectedWord} />
            ) : words.length > 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">选择一个单词</p>
                  <p className="text-sm">点击左侧单词查看详情</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">暂无单词</p>
                  <p className="text-sm">使用 Cmd+1 快速添加单词</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MainWindow;
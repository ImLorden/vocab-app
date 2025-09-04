import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Send, X, Copy } from 'lucide-react';
import { useVocabStore } from '../stores/vocab-store';

const OCRResult: React.FC = () => {
  const [recognizedText, setRecognizedText] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { addWord } = useVocabStore();

  useEffect(() => {
    const loadOCRText = async () => {
      try {
        const text = await window.electronAPI.getOCRText();
        setRecognizedText(text);
        setSelectedText(text.trim());
      } catch (error) {
        console.error('Error loading OCR text:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOCRText();
  }, []);

  const handleTranslate = async () => {
    if (!selectedText.trim() || isTranslating) return;

    setIsTranslating(true);
    try {
      await addWord(selectedText.trim(), sourceLanguage);
      window.close();
    } catch (error) {
      console.error('Error translating text:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(recognizedText);
  };

  const handleTextSelection = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      setSelectedText(recognizedText.substring(start, end));
    } else {
      setSelectedText(recognizedText);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-lg glass-panel rounded-2xl p-6 shadow-xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            OCR 识别结果
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyText}
              className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="复制全部文本"
            >
              <Copy className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => window.close()}
              className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Recognized Text */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              识别的文本（选择要翻译的部分）
            </label>
            <textarea
              value={recognizedText}
              onChange={() => {}}
              onSelect={handleTextSelection}
              className="w-full px-4 py-3 rounded-lg border border-gray-200/50 bg-white/70 backdrop-blur-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       dark:border-gray-600/50 dark:bg-gray-700/70 dark:text-gray-100
                       text-sm resize-none"
              rows={4}
              readOnly
            />
          </div>

          {/* Selected Text */}
          {selectedText && selectedText !== recognizedText && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                选择的文本
              </label>
              <input
                type="text"
                value={selectedText}
                onChange={(e) => setSelectedText(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200/50 bg-white/70 backdrop-blur-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         dark:border-gray-600/50 dark:bg-gray-700/70 dark:text-gray-100"
              />
            </div>
          )}

          {/* Source Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              源语言
            </label>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200/50 bg-white/70 backdrop-blur-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       dark:border-gray-600/50 dark:bg-gray-700/70 dark:text-gray-100"
              disabled={isTranslating}
            >
              <option value="en">English</option>
              <option value="ja">Japanese</option>
              <option value="it">Italian</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <motion.button
              onClick={handleTranslate}
              disabled={!selectedText.trim() || isTranslating}
              className="flex-1 mac-button flex items-center justify-center space-x-2 py-3
                       disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: isTranslating ? 1 : 1.02 }}
              whileTap={{ scale: isTranslating ? 1 : 0.98 }}
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>翻译中...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>翻译并保存</span>
                </>
              )}
            </motion.button>

            <button
              onClick={() => window.close()}
              className="px-6 py-3 rounded-lg border border-gray-200/50 bg-white/70 backdrop-blur-sm
                       hover:bg-gray-50/70 dark:border-gray-600/50 dark:bg-gray-700/70 
                       dark:hover:bg-gray-600/70 text-gray-700 dark:text-gray-300
                       transition-colors"
            >
              取消
            </button>
          </div>
        </div>

        {/* Instructions */}
        <motion.div 
          className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 提示：在文本框中选择要翻译的文字，或直接翻译全部内容
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OCRResult;
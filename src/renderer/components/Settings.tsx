import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Save, Moon, Sun, Monitor, Loader2, Terminal, Code } from 'lucide-react';
import { useThemeStore } from '../stores/theme-store';

const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [defaultTargetLang, setDefaultTargetLang] = useState('zh');
  const [isSaving, setIsSaving] = useState(false);
  const [developerMode, setDeveloperMode] = useState(false);
  const [isDeveloperSaving, setIsDeveloperSaving] = useState(false);
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await window.electronAPI.settings.get();
      setApiKey(settings.claudeApiKey || '');
      setDefaultTargetLang(settings.defaultTargetLanguage || 'zh');
      
      const devMode = await window.electronAPI.developer.isEnabled();
      setDeveloperMode(devMode);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    
    setIsSaving(true);
    try {
      await window.electronAPI.settings.set(apiKey);
      // Show success feedback
    } catch (error) {
      console.error('Error saving API key:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDeveloperMode = async () => {
    setIsDeveloperSaving(true);
    try {
      await window.electronAPI.developer.setEnabled(!developerMode);
      setDeveloperMode(!developerMode);
    } catch (error) {
      console.error('Error toggling developer mode:', error);
    } finally {
      setIsDeveloperSaving(false);
    }
  };

  const themeOptions = [
    { value: 'light', label: '浅色', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', label: '深色', icon: <Moon className="w-4 h-4" /> },
    { value: 'auto', label: '跟随系统', icon: <Monitor className="w-4 h-4" /> },
  ];

  return (
    <div className="h-screen p-6 overflow-y-auto">
      <motion.div
        className="max-w-lg mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <motion.div 
          className="glass-panel rounded-2xl p-6 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            设置
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            配置应用参数和偏好设置
          </p>
        </motion.div>

        {/* Claude API Key */}
        <motion.div
          className="glass-panel rounded-2xl p-6 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center space-x-2 mb-4">
            <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Claude API Key
            </h3>
          </div>

          <div className="space-y-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200/50 bg-white/70 backdrop-blur-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       dark:border-gray-600/50 dark:bg-gray-700/70 dark:text-gray-100"
              placeholder="sk-ant-api03-..."
            />
            
            <button
              onClick={handleSaveApiKey}
              disabled={!apiKey.trim() || isSaving}
              className="mac-button flex items-center space-x-2 disabled:opacity-50"
            >
              {isSaving ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-4 h-4" />
                </motion.div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? '保存中...' : '保存'}</span>
            </button>
          </div>
        </motion.div>

        {/* Theme Settings */}
        <motion.div
          className="glass-panel rounded-2xl p-6 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            主题设置
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => (
              <motion.button
                key={option.value}
                onClick={() => setTheme(option.value as any)}
                className={`p-3 rounded-lg border transition-all duration-200 flex flex-col items-center space-y-2
                  ${theme === option.value
                    ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                    : 'bg-white/50 hover:bg-white/70 text-gray-700 border-gray-200/50 dark:bg-gray-700/50 dark:hover:bg-gray-700/70 dark:text-gray-200 dark:border-gray-600/50'
                  }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {option.icon}
                <span className="text-sm font-medium">{option.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Default Target Language */}
        <motion.div
          className="glass-panel rounded-2xl p-6 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            默认目标语言
          </h3>

          <select
            value={defaultTargetLang}
            onChange={(e) => setDefaultTargetLang(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200/50 bg-white/70 backdrop-blur-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     dark:border-gray-600/50 dark:bg-gray-700/70 dark:text-gray-100"
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
            <option value="ja">Japanese</option>
            <option value="it">Italian</option>
          </select>
        </motion.div>

        {/* Developer Mode */}
        <motion.div
          className="glass-panel rounded-2xl p-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center space-x-2 mb-4">
            <Code className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              开发者模式
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  启用调试工具和数据库控制台
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  包含日志查看器和SQL控制台功能
                </p>
              </div>
              
              <motion.button
                onClick={handleToggleDeveloperMode}
                disabled={isDeveloperSaving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  developerMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.span
                  className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform"
                  animate={{ x: developerMode ? 24 : 4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>

            {developerMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-4 border-t border-gray-200/30 dark:border-gray-700/30"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Terminal className="w-4 h-4" />
                    <span>快捷键: Cmd+4</span>
                  </div>
                  
                  <button
                    onClick={() => window.location.hash = 'developer'}
                    className="text-sm px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    打开开发者工具
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Settings;
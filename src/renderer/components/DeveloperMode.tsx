import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Database, RefreshCw, Download, Trash2 } from 'lucide-react';
import LogViewer from './LogViewer';
import SQLConsole from './SQLConsole';

const DeveloperMode: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'logs' | 'sql'>('logs');
  const [developerMode, setDeveloperMode] = useState(false);

  useEffect(() => {
    loadDeveloperMode();
  }, []);

  const loadDeveloperMode = async () => {
    try {
      const enabled = await window.electronAPI.developer.isEnabled();
      setDeveloperMode(enabled);
    } catch (error) {
      console.error('Error loading developer mode status:', error);
    }
  };

  const handleClearLogs = async () => {
    try {
      await window.electronAPI.developer.clearLogs();
      window.location.reload();
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  const handleExportLogs = async () => {
    try {
      const logData = await window.electronAPI.developer.exportLogs();
      const blob = new Blob([logData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vocab-app-logs-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  if (!developerMode) {
    return (
      <div className="h-screen p-6 overflow-y-auto">
        <motion.div
          className="max-w-lg mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="glass-panel rounded-2xl p-8 text-center">
            <Terminal className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
              开发者模式未启用
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              请在设置中启用开发者模式以访问调试工具
            </p>
            <button
              onClick={() => window.location.hash = 'settings'}
              className="mac-button"
            >
              前往设置
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: 'logs', label: '日志查看器', icon: <Terminal className="w-4 h-4" /> },
    { id: 'sql', label: 'SQL控制台', icon: <Database className="w-4 h-4" /> }
  ];

  return (
    <div className="h-screen flex flex-col">
      <motion.div
        className="p-6 border-b border-gray-200/50 dark:border-gray-700/50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            开发者模式
          </h1>
          <div className="flex space-x-2">
            <motion.button
              onClick={() => window.location.reload()}
              className="p-2 rounded-lg bg-white/50 hover:bg-white/70 dark:bg-gray-700/50 dark:hover:bg-gray-700/70 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </motion.button>
            <motion.button
              onClick={handleExportLogs}
              className="p-2 rounded-lg bg-white/50 hover:bg-white/70 dark:bg-gray-700/50 dark:hover:bg-gray-700/70 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </motion.button>
            <motion.button
              onClick={handleClearLogs}
              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 dark:bg-red-500/20 dark:hover:bg-red-500/30 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </motion.button>
          </div>
        </div>

        <div className="flex space-x-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-1">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'logs' | 'sql')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 flex-1 justify-center
                ${activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'logs' && <LogViewer />}
        {activeTab === 'sql' && <SQLConsole />}
      </div>
    </div>
  );
};

export default DeveloperMode;
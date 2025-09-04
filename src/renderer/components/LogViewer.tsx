import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Clock, Info, AlertTriangle, AlertCircle, Bug, RefreshCw } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  source: 'main' | 'renderer' | 'database' | 'claude-api' | 'ocr';
  message: string;
  data?: any;
}

const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');

  useEffect(() => {
    loadLogs();
    // 移除自动刷新，改为手动刷新
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, searchTerm, levelFilter, sourceFilter]);

  const loadLogs = async () => {
    try {
      const logData = await window.electronAPI.developer.getLogs();
      setLogs(logData);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const applyFilters = () => {
    let filtered = logs;

    if (levelFilter) {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    if (sourceFilter) {
      filtered = filtered.filter(log => log.source === sourceFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(term) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(term))
      );
    }

    setFilteredLogs(filtered);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'debug': return <Bug className="w-4 h-4 text-gray-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-blue-600 dark:text-blue-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'debug': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'main': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'renderer': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'database': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'claude-api': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'ocr': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Filters */}
      <motion.div
        className="glass-panel rounded-xl p-4 mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200/50 bg-white/70 backdrop-blur-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       dark:border-gray-600/50 dark:bg-gray-700/70 dark:text-gray-100"
              placeholder="搜索日志..."
            />
          </div>

          <button
            onClick={loadLogs}
            className="p-2 rounded-lg bg-white/50 hover:bg-white/70 dark:bg-gray-700/50 dark:hover:bg-gray-700/70 transition-colors"
            title="刷新日志"
          >
            <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200/50 bg-white/70 backdrop-blur-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     dark:border-gray-600/50 dark:bg-gray-700/70 dark:text-gray-100"
          >
            <option value="">所有级别</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200/50 bg-white/70 backdrop-blur-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     dark:border-gray-600/50 dark:bg-gray-700/70 dark:text-gray-100"
          >
            <option value="">所有来源</option>
            <option value="main">Main</option>
            <option value="renderer">Renderer</option>
            <option value="database">Database</option>
            <option value="claude-api">Claude API</option>
            <option value="ocr">OCR</option>
          </select>
        </div>
      </motion.div>

      {/* Logs List */}
      <motion.div
        className="flex-1 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="h-full overflow-y-auto space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="glass-panel rounded-xl p-8 text-center">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                {logs.length === 0 ? '暂无日志记录' : '没有匹配的日志'}
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                className="glass-panel rounded-lg p-4 hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getLevelIcon(log.level)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-sm font-mono ${getLevelColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSourceColor(log.source)}`}>
                        {log.source}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">
                      {log.message}
                    </p>
                    
                    {log.data && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                          查看数据
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300 overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        显示 {filteredLogs.length} / {logs.length} 条日志
      </div>
    </div>
  );
};

export default LogViewer;
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Table, Clock, CheckCircle, XCircle, Database } from 'lucide-react';

interface QueryResult {
  columns: string[];
  rows: any[];
  error?: string;
  affectedRows?: number;
}

interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  indexes: string[];
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: any;
  primaryKey: boolean;
}

const SQLConsole: React.FC = () => {
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [schema, setSchema] = useState<TableInfo[]>([]);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);

  useEffect(() => {
    loadSchema();
    loadQueryHistory();
  }, []);

  const loadSchema = async () => {
    try {
      const schemaData = await window.electronAPI.developer.getSchema();
      setSchema(schemaData);
    } catch (error) {
      console.error('Error loading schema:', error);
    }
  };

  const loadQueryHistory = () => {
    const saved = localStorage.getItem('sql-query-history');
    if (saved) {
      setQueryHistory(JSON.parse(saved));
    }
  };

  const saveQueryHistory = (newQuery: string) => {
    const updated = [newQuery, ...queryHistory.filter(q => q !== newQuery)].slice(0, 10);
    setQueryHistory(updated);
    localStorage.setItem('sql-query-history', JSON.stringify(updated));
  };

  const executeQuery = async () => {
    if (!query.trim()) return;

    setIsExecuting(true);
    setQueryResult(null);

    try {
      const isDangerous = /\b(delete|drop|update|insert|alter|create|truncate)\b/i.test(query.trim());
      
      if (isDangerous) {
        const confirmed = await showDangerousQueryConfirmation(query);
        if (!confirmed) {
          setIsExecuting(false);
          return;
        }
      }

      const result = await window.electronAPI.developer.executeSQL(query);
      setQueryResult(result);
      
      if (!result.error) {
        saveQueryHistory(query);
      }
    } catch (error: any) {
      setQueryResult({
        columns: [],
        rows: [],
        error: error.message || 'Unknown error occurred'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const showDangerousQueryConfirmation = (queryText: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4 shadow-xl">
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">危险操作确认</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">此查询包含可能修改数据的操作</p>
            </div>
          </div>
          <div class="mb-4">
            <pre class="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded text-gray-800 dark:text-gray-200 overflow-x-auto">${queryText}</pre>
          </div>
          <div class="flex space-x-3">
            <button class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors" onclick="window.sqlConfirmResult = false; this.parentElement.parentElement.parentElement.remove()">
              取消
            </button>
            <button class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors" onclick="window.sqlConfirmResult = true; this.parentElement.parentElement.parentElement.remove()">
              确认执行
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const checkResult = () => {
        if ((window as any).sqlConfirmResult !== undefined) {
          const result = (window as any).sqlConfirmResult;
          (window as any).sqlConfirmResult = undefined;
          resolve(result);
        } else {
          setTimeout(checkResult, 100);
        }
      };
      checkResult();
    });
  };

  const insertSampleQuery = (table: string) => {
    const sampleQueries = {
      'words': 'SELECT * FROM words ORDER BY created_at DESC LIMIT 10;',
      'translations': 'SELECT * FROM translations JOIN words ON translations.word_id = words.id LIMIT 10;',
      'tags': 'SELECT * FROM tags JOIN words ON tags.word_id = words.id LIMIT 10;'
    };
    setQuery(sampleQueries[table as keyof typeof sampleQueries] || `SELECT * FROM ${table} LIMIT 10;`);
  };

  return (
    <div className="h-full flex">
      {/* Schema Sidebar */}
      <motion.div
        className="w-80 border-r border-gray-200/50 dark:border-gray-700/50 p-4 overflow-y-auto"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center space-x-2">
          <Table className="w-5 h-5" />
          <span>数据库Schema</span>
        </h3>

        <div className="space-y-3">
          {schema.map((table) => (
            <motion.div
              key={table.name}
              className="glass-panel rounded-lg p-3 hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                  {table.name}
                </h4>
                <button
                  onClick={() => insertSampleQuery(table.name)}
                  className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded"
                >
                  查询
                </button>
              </div>
              
              <div className="space-y-1">
                {table.columns.map((column) => (
                  <div key={column.name} className="flex items-center space-x-2 text-xs">
                    <span className={`font-mono ${column.primaryKey ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      {column.name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-500">
                      {column.type}
                    </span>
                    {column.primaryKey && (
                      <span className="px-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs">
                        PK
                      </span>
                    )}
                  </div>
                ))}
              </div>
              
              {table.indexes.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200/30 dark:border-gray-700/30">
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    索引: {table.indexes.join(', ')}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Query Interface */}
      <div className="flex-1 flex flex-col">
        {/* Query Input */}
        <motion.div
          className="p-4 border-b border-gray-200/50 dark:border-gray-700/50"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="space-y-3">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-32 px-4 py-3 rounded-lg border border-gray-200/50 bg-white/70 backdrop-blur-sm
                       font-mono text-sm resize-none
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       dark:border-gray-600/50 dark:bg-gray-700/70 dark:text-gray-100"
              placeholder="输入SQL查询语句...&#10;例如: SELECT * FROM words LIMIT 10;"
            />
            
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={executeQuery}
                  disabled={!query.trim() || isExecuting}
                  className="mac-button flex items-center space-x-2 disabled:opacity-50"
                >
                  {isExecuting ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Clock className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>{isExecuting ? '执行中...' : '执行查询'}</span>
                </button>
              </div>

              {queryHistory.length > 0 && (
                <select
                  onChange={(e) => e.target.value && setQuery(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-200/50 bg-white/70 backdrop-blur-sm
                           dark:border-gray-600/50 dark:bg-gray-700/70 dark:text-gray-100"
                >
                  <option value="">查询历史</option>
                  {queryHistory.map((historyQuery, index) => (
                    <option key={index} value={historyQuery}>
                      {historyQuery.length > 50 ? historyQuery.substring(0, 50) + '...' : historyQuery}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </motion.div>

        {/* Query Results */}
        <motion.div
          className="flex-1 p-4 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {queryResult ? (
            <div className="h-full flex flex-col">
              {queryResult.error ? (
                <div className="glass-panel rounded-xl p-6 flex items-center space-x-3 border border-red-200/50 bg-red-50/50 dark:border-red-800/50 dark:bg-red-900/20">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-800 dark:text-red-300 mb-1">
                      查询执行失败
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-400 font-mono">
                      {queryResult.error}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">查询成功</span>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {queryResult.rows.length > 0 ? (
                        `返回 ${queryResult.rows.length} 行记录`
                      ) : queryResult.affectedRows !== undefined ? (
                        `影响 ${queryResult.affectedRows} 行`
                      ) : (
                        '查询完成'
                      )}
                    </div>
                  </div>

                  {queryResult.rows.length > 0 && (
                    <motion.div
                      className="flex-1 overflow-hidden"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="h-full overflow-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
                              {queryResult.columns.map((column) => (
                                <th key={column} className="text-left p-3 font-semibold text-gray-800 dark:text-gray-100 bg-gray-50/50 dark:bg-gray-800/50">
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {queryResult.rows.map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-b border-gray-100/50 dark:border-gray-800/50 hover:bg-gray-50/30 dark:hover:bg-gray-800/30">
                                {queryResult.columns.map((column) => (
                                  <td key={column} className="p-3 text-gray-700 dark:text-gray-300 font-mono text-xs">
                                    {row[column] === null ? (
                                      <span className="text-gray-400 italic">NULL</span>
                                    ) : typeof row[column] === 'object' ? (
                                      JSON.stringify(row[column])
                                    ) : (
                                      String(row[column])
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>输入SQL查询并点击执行以查看结果</p>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="font-medium">常用查询示例：</p>
                  <button
                    onClick={() => setQuery('SELECT * FROM words ORDER BY created_at DESC LIMIT 10;')}
                    className="block w-full text-left px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    查看最新的10个词汇
                  </button>
                  <button
                    onClick={() => setQuery('SELECT tag_name, COUNT(*) as count FROM tags GROUP BY tag_name ORDER BY count DESC;')}
                    className="block w-full text-left px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    标签使用统计
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SQLConsole;
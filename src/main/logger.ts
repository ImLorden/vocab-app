export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  source: 'main' | 'renderer' | 'database' | 'claude-api' | 'ocr';
  message: string;
  data?: any;
}

export class LoggerService {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  log(level: LogEntry['level'], source: LogEntry['source'], message: string, data?: any) {
    const entry: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      data
    };

    this.logs.unshift(entry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    console.log(`[${source.toUpperCase()}] ${level.toUpperCase()}: ${message}`, data ? data : '');
  }

  info(source: LogEntry['source'], message: string, data?: any) {
    this.log('info', source, message, data);
  }

  warning(source: LogEntry['source'], message: string, data?: any) {
    this.log('warning', source, message, data);
  }

  error(source: LogEntry['source'], message: string, data?: any) {
    this.log('error', source, message, data);
  }

  debug(source: LogEntry['source'], message: string, data?: any) {
    this.log('debug', source, message, data);
  }

  getLogs(filter?: { level?: string; source?: string; search?: string }): LogEntry[] {
    let filteredLogs = this.logs;

    if (filter?.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filter.level);
    }

    if (filter?.source) {
      filteredLogs = filteredLogs.filter(log => log.source === filter.source);
    }

    if (filter?.search) {
      const searchTerm = filter.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(searchTerm))
      );
    }

    return filteredLogs;
  }

  clearLogs(): void {
    this.logs = [];
    this.info('main', 'Logs cleared by user');
  }

  exportLogs(): string {
    const logText = this.logs.map(log => 
      `[${log.timestamp}] [${log.source.toUpperCase()}] ${log.level.toUpperCase()}: ${log.message}${
        log.data ? '\n  Data: ' + JSON.stringify(log.data, null, 2) : ''
      }`
    ).join('\n\n');

    return logText;
  }

  getLogCount(): number {
    return this.logs.length;
  }
}

export const logger = new LoggerService();
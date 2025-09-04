import { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, dialog } from 'electron';
import { spawn, execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import path from 'path';
import { VocabDatabase } from './database';
import { ClaudeService } from './claude-service';
import { TagGenerator } from './tag-generator';
import { logger } from './logger';
import Store from 'electron-store';


class VocabApp {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private database: VocabDatabase;
  private translationService: ClaudeService;
  private store: Store;

  constructor() {
    this.database = new VocabDatabase();
    this.store = new Store();
    
    // 初始化Claude翻译服务
    this.translationService = new ClaudeService();
    
    logger.info('main', 'VocabApp starting up', { version: '1.1.1' });
    this.initializeApp();
  }

  private initializeApp() {
    app.whenReady().then(() => {
      // 关闭所有可能存在的窗口
      BrowserWindow.getAllWindows().forEach(window => {
        console.log('[MAIN] Closing existing window:', window.getTitle());
        window.close();
      });
      
      this.createTray();
      this.registerShortcuts();
      this.setupIPC();
      this.initializeClaudeService();
    });

    app.on('window-all-closed', () => {
      // Prevent app from quitting on macOS
    });

    app.on('before-quit', () => {
      this.database.close();
    });
  }


  private initializeClaudeService() {
    // 从存储中获取API密钥并配置Claude服务
    const apiKey = (this.store as any).get('claudeApiKey');
    if (apiKey) {
      this.translationService.setApiKey(apiKey);
      console.log('Claude翻译服务已初始化');
    } else {
      console.log('Claude API密钥未配置，请在设置中配置');
    }
  }

  private createTray() {
    const trayIconPath = path.join(__dirname, '../../assets/tray-icon.png');
    console.log('[TRAY] Loading tray icon from:', trayIconPath);
    this.tray = new Tray(trayIconPath);
    
    console.log('[TRAY] Creating tray menu - VERSION 2.0');
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '打开主窗口',
        click: () => {
          console.log('[TRAY] 打开主窗口 clicked');
          this.showMainWindow();
        },
      },
      {
        label: '设置',
        click: () => {
          console.log('[TRAY] 设置 clicked - SHOULD OPEN MAIN WINDOW');
          this.showMainWindow();
          if (this.mainWindow) {
            // 等待窗口完全加载后再导航
            setTimeout(() => {
              console.log('[TRAY] Navigating to settings in main window');
              this.mainWindow?.webContents.executeJavaScript(`
                console.log('[TRAY] Setting hash to settings in main window');
                window.location.hash = 'settings';
              `).catch(err => console.error('[TRAY] Settings navigation error:', err));
            }, 300);
          }
        },
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => app.quit(),
      },
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('Vocab App - 新版本');
    console.log('[TRAY] Context menu set successfully');
    console.log('[TRAY] Menu items count:', contextMenu.items.length);
    
    this.tray.on('double-click', () => {
      console.log('[TRAY] Double-click detected');
      this.showMainWindow();
    });
  }

  private registerShortcuts() {
    globalShortcut.register('CommandOrControl+1', () => {
      this.showQuickInputDialog();
    });

    globalShortcut.register('CommandOrControl+2', () => {
      this.startOCRCapture();
    });

    globalShortcut.register('CommandOrControl+3', () => {
      this.showMainWindow();
    });

    globalShortcut.register('CommandOrControl+4', () => {
      logger.info('main', 'Developer mode shortcut triggered');
      this.showMainWindow();
      if (this.mainWindow) {
        setTimeout(() => {
          this.mainWindow?.webContents.executeJavaScript(`
            console.log('[DEVELOPER] Setting hash to developer mode');
            window.location.hash = 'developer';
          `).catch(err => console.error('[DEVELOPER] Navigation error:', err));
        }, 300);
      }
    });
  }

  private setupIPC() {
    ipcMain.handle('get-all-words', () => {
      return this.database.getAllWords();
    });

    ipcMain.handle('get-words-by-tag', (_, tagName: string) => {
      return this.database.getWordsByTag(tagName);
    });

    ipcMain.handle('get-all-tags', () => {
      return this.database.getAllTags();
    });

    ipcMain.handle('add-word', async (_, originalText: string, sourceLanguage: string, targetLanguage?: string) => {
      const word = this.database.addWord(originalText, sourceLanguage);
      if (!word) return null;

      const translation = await this.translationService.translateWord(
        originalText, 
        sourceLanguage, 
        targetLanguage || 'zh'
      );

      if (translation) {
        this.database.addTranslation(word.id, targetLanguage || 'zh', translation);
      }

      const autoTags = TagGenerator.generateAutoTags(sourceLanguage);
      this.database.addTags(word.id, autoTags);

      return this.database.getWordWithTranslations(word.id);
    });

    ipcMain.handle('delete-word', (_, wordId: number) => {
      return this.database.deleteWord(wordId);
    });

    // API key no longer needed for native translation

    ipcMain.handle('get-settings', () => {
      return {
        defaultTargetLanguage: (this.store as any).get('defaultTargetLanguage', 'zh'),
        theme: (this.store as any).get('theme', 'auto'),
      };
    });
    
    ipcMain.handle('set-claude-api-key', (_, apiKey: string) => {
      (this.store as any).set('claudeApiKey', apiKey);
      this.translationService.setApiKey(apiKey);
      return true;
    });

    ipcMain.handle('get-ocr-text', () => {
      return (global as any).ocrText || '';
    });

    ipcMain.handle('open-main-window', (_, route?: string) => {
      console.log('[IPC] open-main-window called with route:', route);
      return new Promise((resolve) => {
        const wasExisting = !!this.mainWindow;
        console.log('[IPC] Main window exists:', wasExisting);
        
        this.showMainWindow();
        
        // 如果指定了路由，导航到该路由
        if (route && this.mainWindow) {
          console.log('[IPC] Navigating to route:', route);
          this.mainWindow.webContents.executeJavaScript(`
            console.log('[ROUTER] Navigating to: ${route}');
            window.location.hash = '${route === '/' ? '' : route}';
          `).catch(err => console.error('[IPC] Navigation error:', err));
        }
        
        if (wasExisting) {
          console.log('[IPC] Using existing window, resolving after delay');
          setTimeout(() => {
            console.log('[IPC] Resolving for existing window');
            resolve(true);
          }, 200);
        } else {
          console.log('[IPC] Creating new window, waiting for ready-to-show');
          this.mainWindow?.once('ready-to-show', () => {
            console.log('[IPC] New window ready-to-show event fired');
            setTimeout(() => {
              console.log('[IPC] Resolving for new window');
              resolve(true);
            }, 200);
          });
        }
      });
    });

    // Developer mode IPC handlers
    ipcMain.handle('dev-get-logs', (_, filter?: any) => {
      logger.debug('main', 'Developer logs requested', { filter });
      return logger.getLogs(filter);
    });

    ipcMain.handle('dev-execute-sql', async (_, query: string) => {
      logger.info('main', 'Developer SQL execution requested', { queryLength: query.length });
      const validation = this.database.validateQuery(query);
      
      if (!validation.isValid) {
        logger.warning('main', 'Invalid SQL query rejected', { error: validation.message });
        return { columns: [], rows: [], error: validation.message };
      }

      return this.database.executeSQL(query);
    });

    ipcMain.handle('dev-get-schema', () => {
      logger.debug('main', 'Database schema requested');
      return this.database.getSchema();
    });

    ipcMain.handle('dev-clear-logs', () => {
      logger.info('main', 'Logs cleared by developer');
      logger.clearLogs();
      return true;
    });

    ipcMain.handle('dev-export-logs', () => {
      logger.info('main', 'Logs export requested');
      return logger.exportLogs();
    });

    ipcMain.handle('get-developer-mode', () => {
      return (this.store as any).get('developerMode', false);
    });

    ipcMain.handle('set-developer-mode', (_, enabled: boolean) => {
      logger.info('main', 'Developer mode setting changed', { enabled });
      (this.store as any).set('developerMode', enabled);
      return true;
    });
  }

  // No longer needed for native translation

  private showMainWindow() {
    console.log('[MAIN] showMainWindow called, existing window:', !!this.mainWindow);
    if (this.mainWindow) {
      console.log('[MAIN] Using existing window');
      // 强制窗口置前和聚焦
      if (this.mainWindow.isMinimized()) {
        console.log('[MAIN] Restoring minimized window');
        this.mainWindow.restore();
      }
      console.log('[MAIN] Showing and focusing existing window');
      this.mainWindow.show();
      this.mainWindow.focus();
      this.mainWindow.moveTop();
      this.mainWindow.setAlwaysOnTop(true);
      setTimeout(() => {
        this.mainWindow?.setAlwaysOnTop(false);
        console.log('[MAIN] Existing window setup complete');
      }, 100);
      return;
    }
    console.log('[MAIN] Creating new BrowserWindow');
    this.mainWindow = new BrowserWindow({
      width: 1000,
      height: 700,
      minWidth: 800,
      minHeight: 600,
      resizable: true,
      show: false,
      titleBarStyle: 'default',
      vibrancy: 'window',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    const htmlPath = path.join(__dirname, '../renderer/index.html');
    console.log('[MAIN] Loading file:', htmlPath);
    console.log('[MAIN] NODE_ENV:', process.env.NODE_ENV);

    if (process.env.NODE_ENV === 'development') {
      console.log('[MAIN] Loading development URL');
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      console.log('[MAIN] Loading production file');
      this.mainWindow.loadFile(htmlPath);
    }

    this.mainWindow.once('ready-to-show', () => {
      console.log('[MAIN] Window ready-to-show event fired');
      this.mainWindow?.show();
      this.mainWindow?.focus();
      const bounds = this.mainWindow?.getBounds();
      console.log('[MAIN] Window shown and focused, bounds:', bounds);
      console.log('[MAIN] Window visible:', this.mainWindow?.isVisible());
      console.log('[MAIN] Window minimized:', this.mainWindow?.isMinimized());
    });

    this.mainWindow.on('closed', () => {
      console.log('[MAIN] Main window closed');
      this.mainWindow = null;
    });
  }

  // Settings now open in main window via navigation

  private showQuickInputDialog() {
    console.log('Showing quick input dialog...');
    
    const quickInputWindow = new BrowserWindow({
      width: 450,
      height: 350,
      resizable: false,
      alwaysOnTop: true,
      show: false,
      titleBarStyle: 'hiddenInset',
      vibrancy: 'window',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    // 窗口居中显示
    quickInputWindow.center();

    if (process.env.NODE_ENV === 'development') {
      quickInputWindow.loadURL('http://localhost:3000#/quick-input');
    } else {
      quickInputWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
        hash: 'quick-input'
      });
    }

    quickInputWindow.once('ready-to-show', () => {
      quickInputWindow.show();
    });

    quickInputWindow.on('closed', () => {
      // 窗口关闭时不需要特殊处理
    });
  }

  private async startOCRCapture() {
    try {
      logger.info('ocr', 'Starting OCR capture process');
      console.log('Starting OCR capture...');
      // 使用macOS screencapture工具进行区域截图
      
      const tempFile = path.join(os.tmpdir(), `vocab-ocr-${Date.now()}.png`);
      console.log('Temp file path:', tempFile);
      
      // 启动交互式截图
      const screencapture = spawn('screencapture', ['-i', tempFile]);
      console.log('Screencapture started');
      
      screencapture.on('close', async (code: number) => {
        console.log('Screencapture closed with code:', code);
        console.log('File exists:', fs.existsSync(tempFile));
        
        if (code === 0 && fs.existsSync(tempFile)) {
          // 截图成功，进行OCR识别
          console.log('Screenshot successful, performing OCR...');
          const recognizedText = await this.performTesseractOCR(tempFile);
          console.log('OCR result:', recognizedText);
          
          if (recognizedText && recognizedText.length > 0) {
            logger.info('ocr', 'OCR recognition successful', { text: recognizedText.substring(0, 50) + '...' });
            // 显示OCR结果界面让用户选择
            this.showOCRResultWindow(recognizedText);
          } else {
            logger.warning('ocr', 'No text recognized from screenshot');
            console.log('No text recognized, opening input dialog');
            this.showQuickInputDialog();
          }
          
          // 清理临时文件
          fs.unlinkSync(tempFile);
        } else if (code === 1) {
          console.log('User cancelled screenshot');
        } else {
          console.log('Screenshot failed with code:', code);
        }
      });
      
      screencapture.on('error', (error: any) => {
        console.error('Screencapture error:', error);
      });
      
    } catch (error) {
      console.error('OCR capture error:', error);
    }
  }

  private async performTesseractOCR(imagePath: string): Promise<string | null> {
    try {
      
      // 使用tesseract进行OCR识别
      const result = execSync(`tesseract "${imagePath}" stdout`, { 
        encoding: 'utf8',
        timeout: 10000
      });
      
      // 清理识别结果，只保留英文单词
      const cleanText = result
        .replace(/[^\w\s]/g, '') // 移除标点符号
        .trim()
        .split(/\s+/) // 按空格分割
        .filter((word: string) => word.length > 2) // 过滤太短的词
        .join(' ');
      
      return cleanText || null;
      
    } catch (error) {
      console.error('Tesseract OCR error:', error);
      return null;
    }
  }

  private async autoTranslateWord(recognizedText: string) {
    try {
      console.log('Auto-translating recognized text:', recognizedText);
      
      // 取第一个识别到的单词
      const firstWord = recognizedText.split(/\s+/)[0];
      if (!firstWord) return;
      
      // 添加到数据库并翻译
      const word = this.database.addWord(firstWord, 'en');
      if (!word) {
        console.log('Failed to add word to database');
        return;
      }

      const translation = await this.translationService.translateWord(firstWord, 'en', 'zh');
      console.log('Auto translation result:', translation);

      if (translation) {
        this.database.addTranslation(word.id, 'zh', translation);
        const autoTags = TagGenerator.generateAutoTags('en');
        this.database.addTags(word.id, autoTags);
        
        // 显示成功通知
        await dialog.showMessageBox({
          type: 'info',
          title: 'OCR翻译成功',
          message: `识别文字: ${firstWord}`,
          detail: `翻译结果: ${translation.translation}`,
          buttons: ['确定']
        });
        
        console.log('OCR word added successfully:', firstWord);
      } else {
        console.log('Translation failed for OCR word:', firstWord);
        
        // 翻译失败，询问用户是否手动处理
        const result = await dialog.showMessageBox({
          type: 'question',
          title: 'OCR识别完成',
          message: `识别到文字: ${firstWord}`,
          detail: '但翻译失败，是否手动添加？',
          buttons: ['取消', '手动添加']
        });
        
        if (result.response === 1) {
          this.showMainWindow();
        }
      }
      
    } catch (error) {
      console.error('Auto translation error:', error);
    }
  }

  private showOCRResultWindow(recognizedText: string) {
    const ocrWindow = new BrowserWindow({
      width: 550,
      height: 500,
      resizable: false,
      alwaysOnTop: true,
      show: false,
      titleBarStyle: 'default',
      vibrancy: 'window',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    // 窗口居中显示
    ocrWindow.center();

    // 存储识别的文本，供渲染进程使用
    (global as any).ocrText = recognizedText;

    if (process.env.NODE_ENV === 'development') {
      ocrWindow.loadURL('http://localhost:3000#/ocr-result');
    } else {
      ocrWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
        hash: 'ocr-result'
      });
    }

    ocrWindow.once('ready-to-show', () => {
      ocrWindow.show();
    });

    ocrWindow.on('closed', () => {
      // 窗口关闭时清理全局变量
      (global as any).ocrText = null;
    });
  }
}

new VocabApp();
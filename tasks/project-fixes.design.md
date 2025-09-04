# Design project-fixes - 修复项目问题

## Requirements

经过项目检查，发现以下需要修复的问题：

### 高优先级问题：
1. **better-sqlite3 模块版本不匹配**
   - 错误信息：MODULE_VERSION 127 vs 125 不匹配
   - 导致应用无法启动
   - 需要重新编译原生模块

### 中优先级问题：
2. **代码质量警告**
   - WordList.tsx:7 中 `selectedWord` 变量定义但未使用
   - ESLint 警告需要清理

### 验证要求：
3. **应用功能验证**
   - 确保修复后应用能正常启动
   - 验证核心功能（快捷键、翻译、数据库）工作正常
   - 确保构建和打包流程无问题

## Solution

### 1. 修复 better-sqlite3 版本问题
```bash
# 方案1: 重新编译原生模块
npm rebuild better-sqlite3

# 方案2: 清除并重新安装 (如果rebuild失败)
rm -rf node_modules
npm install
```

### 2. 修复代码警告
- 移除 WordList.tsx 中未使用的 `selectedWord` 变量导入
- 保持功能不变，只清理不必要的代码

### 3. 验证测试
- 运行 `npm run typecheck` 确保类型正确
- 运行 `npm run lint` 确保无警告
- 运行 `npm run build` 确保构建成功  
- 运行 `npm run start` 确保应用启动
- 手动测试快捷键功能

## Tests

### 自动化测试
- `npm run typecheck` 无错误
- `npm run lint` 无警告
- `npm run build` 构建成功
- `npm run start` 应用启动成功

### 手动功能测试
- Cmd+1: 快速输入窗口正常工作
- Cmd+2: OCR截图翻译功能正常
- Cmd+3: 主界面打开正常
- 托盘菜单功能正常
- 词汇添加/删除/查询功能正常
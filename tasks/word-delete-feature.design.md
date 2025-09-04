# Design Word-Delete-Feature

## Requirements

用户需要在生词表中添加删除单词的功能，能够删除不需要的生词。

### 功能需求：
1. 在生词列表的WordCard组件上添加删除按钮
2. 点击删除按钮时显示确认对话框，防止误删
3. 确认删除后从数据库中完全移除单词及其相关数据（翻译、标签）
4. 删除后立即更新界面，移除该单词卡片
5. 提供用户反馈（删除成功/失败消息）

### 技术分析：
- 数据库已经配置了CASCADE删除（database.ts:37,46行）
- 需要添加数据库删除方法
- 需要添加IPC通信接口
- 需要更新preload.ts暴露删除API
- 需要在WordCard组件添加删除按钮和确认逻辑
- 需要更新生词列表组件的状态管理

### 涉及文件：
- `src/main/database.ts` - 添加deleteWord方法
- `src/main/main.ts` - 添加IPC处理器  
- `src/main/preload.ts` - 暴露删除API
- `src/renderer/App.tsx` - 更新WordCard组件和WordList状态

## Solution

### 1. 数据库层实现 (database.ts)
在VocabDatabase类中添加deleteWord方法：
```typescript
deleteWord(wordId: number): boolean {
  try {
    const stmt = this.db.prepare('DELETE FROM words WHERE id = ?');
    const result = stmt.run(wordId);
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting word:', error);
    return false;
  }
}
```
由于已配置CASCADE删除，删除words记录时会自动删除关联的translations和tags。

### 2. IPC通信层 (main.ts)
在setupIPC方法中添加delete-word处理器：
```typescript
ipcMain.handle('delete-word', (_, wordId: number) => {
  return this.database.deleteWord(wordId);
});
```

### 3. 前端API层 (preload.ts)  
在words API对象中添加delete方法：
```typescript
words: {
  // ... 现有方法
  delete: (wordId: number): Promise<boolean> => ipcRenderer.invoke('delete-word', wordId),
}
```

### 4. UI组件实现 (App.tsx)
在WordCard组件中添加：
- 删除按钮（垃圾桶图标）
- 确认删除对话框
- 删除成功/失败状态处理

在WordList组件中添加：
- 删除后刷新列表逻辑
- onDelete回调函数传递

### 5. 用户交互流程
1. 用户在WordCard上看到删除按钮（垃圾桶图标）
2. 点击删除按钮弹出确认对话框："确定要删除单词 '[word]' 吗？此操作不可撤销。"
3. 用户确认后调用删除API
4. 删除成功后从列表中移除该卡片
5. 显示成功消息："单词已删除"

## Tests

### 数据库测试
1. 测试deleteWord方法能正确删除单词记录
2. 验证CASCADE删除正确清除关联的translations和tags记录
3. 测试删除不存在的wordId返回false

### IPC通信测试  
1. 测试delete-word IPC调用返回正确的boolean结果
2. 验证错误处理机制

### UI功能测试
1. 验证删除按钮在WordCard上正确显示
2. 测试确认对话框正确弹出并显示单词名称
3. 测试取消删除操作不执行删除
4. 测试确认删除后WordCard从列表消失
5. 验证删除成功/失败消息正确显示

### 边界情况测试
1. 测试删除最后一个单词后列表显示"还没有保存任何生词"
2. 验证删除后总数统计正确更新
3. 测试网络问题或数据库锁定时的错误处理

### 用户体验测试
1. 确保删除按钮位置合理，不会误触
2. 验证确认对话框文案清晰
3. 测试删除动画流畅自然
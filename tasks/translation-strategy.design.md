# Design: 混合翻译策略

## Requirements
- 实现三层翻译策略，确保高覆盖率和快速响应
- 优先使用离线方案，在线方案作为备选
- 支持所有常见英文单词的翻译
- 保持现有OCR和快捷键功能

## Solution

### 翻译优先级策略
1. **第一层：macOS系统词典** (离线、最快)
   - 使用 `open dict://` URL scheme 或命令行工具
   - 或调用系统Dictionary.app的底层功能
   - 响应时间: ~10ms

2. **第二层：Google翻译API** (在线、全面覆盖)
   - 使用Google Translate API v2
   - 支持所有语言和词汇
   - 响应时间: ~200-500ms

3. **第三层：本地词典** (离线、备选)
   - 当前的内置词典作为最后备选
   - 用于网络不可用时的基本词汇

### 实现架构
```typescript
class HybridTranslationService {
  async translateWord(word, sourceLang, targetLang) {
    // 1. 尝试macOS系统词典
    const systemResult = await this.trySystemDictionary(word);
    if (systemResult) return systemResult;
    
    // 2. 尝试Google翻译API
    const googleResult = await this.tryGoogleTranslate(word, sourceLang, targetLang);
    if (googleResult) return googleResult;
    
    // 3. 最后尝试本地词典
    return this.tryLocalDictionary(word, sourceLang, targetLang);
  }
}
```

### macOS系统词典集成方案
- 方案A: 使用命令行 `open dict://word` 并解析返回
- 方案B: 调用系统脚本访问Dictionary.app数据
- 方案C: 读取系统词典文件 `/System/Library/Assets/com_apple_MobileAsset_DictionaryServices`

### Google翻译API集成
- 使用官方Google Cloud Translation API
- 需要API密钥配置
- 实现错误处理和重试机制
- 添加请求缓存减少API调用

## Tests
1. **系统词典测试**
   - 测试常用单词如"hello", "world", "computer"
   - 验证离线状态下的响应速度
   - 测试不存在词汇的处理

2. **Google API测试**  
   - 测试API密钥配置
   - 测试网络异常情况
   - 验证翻译质量和格式

3. **集成测试**
   - 测试三层策略的优先级顺序
   - 验证OCR + 混合翻译的完整流程
   - 测试各种边界情况（网络断开、API限额等）

4. **性能测试**
   - 系统词典响应时间 < 50ms
   - Google API备选响应时间 < 1s
   - 整体翻译成功率 > 95%
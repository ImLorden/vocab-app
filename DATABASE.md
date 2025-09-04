# Vocab App 数据库说明文档

## 概述
Vocab App 使用 SQLite 数据库存储词汇、翻译和标签信息。数据库采用关系型设计，支持多语言词汇管理和灵活的标签系统。

## 数据库位置
- **开发模式**: `~/Library/Application Support/Electron/vocab.db`
- **生产模式**: `~/Library/Application Support/vocab-app/vocab.db`

## 表结构

### 1. words 表 (主表)
存储原始词汇信息。

```sql
CREATE TABLE words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_text TEXT NOT NULL,           -- 原始单词/短语
    source_language TEXT NOT NULL,         -- 源语言代码 (en/ja/it)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(original_text, source_language) -- 防止重复
);
```

**字段说明:**
- `id`: 主键，自增
- `original_text`: 原始文本，如 "hello", "それ"
- `source_language`: 语言代码 (en=英语, ja=日语, it=意大利语)
- `created_at/updated_at`: 时间戳
- **唯一约束**: 相同语言下的相同文本不能重复

### 2. translations 表
存储翻译结果和语言学习信息。

```sql
CREATE TABLE translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER NOT NULL,              -- 关联words表
    target_language TEXT NOT NULL,         -- 目标语言 (通常为zh)
    translation TEXT NOT NULL,             -- 翻译文本
    definition TEXT,                       -- 详细定义
    pronunciation TEXT,                    -- 发音标注
    part_of_speech TEXT,                   -- 词性 (noun/verb/adj等)
    examples TEXT,                         -- JSON格式的例句数组
    usage_notes TEXT,                      -- 使用说明/语法注释
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);
```

**字段说明:**
- `word_id`: 外键，关联words.id，CASCADE删除
- `target_language`: 目标语言，默认zh(中文)
- `translation`: 主要翻译，如 "快的，迅速的"
- `definition`: 详细释义和用法说明
- `pronunciation`: 音标，如 "/kwɪk/"
- `part_of_speech`: 词性标注
- `examples`: JSON数组，存储例句
- `usage_notes`: 语法说明和使用注意事项

### 3. tags 表
支持自动标签和自定义标签系统。

```sql
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER NOT NULL,              -- 关联words表
    tag_name TEXT NOT NULL,                -- 标签名称
    tag_type TEXT NOT NULL,                -- 标签类型
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
    UNIQUE(word_id, tag_name)              -- 同一单词不能有重复标签
);
```

**标签类型 (tag_type):**
- `auto_date`: 自动日期标签 (2025-09-03, 2025-09, 2025)
- `auto_language`: 自动语言标签 (english, japanese, italian)
- `custom`: 用户自定义标签

## 索引设计

### 性能优化索引
```sql
-- 时间排序优化
CREATE INDEX idx_words_created_at ON words(created_at);

-- 语言筛选优化
CREATE INDEX idx_words_source_lang ON words(source_language);

-- 关联查询优化
CREATE INDEX idx_translations_word_id ON translations(word_id);
CREATE INDEX idx_tags_word_id ON tags(word_id);

-- 标签筛选优化
CREATE INDEX idx_tags_name ON tags(tag_name);
```

## 数据关系

```
words (1) -----> (N) translations
  |
  └-----> (N) tags
```

- 一个词汇可以有多个翻译 (不同目标语言)
- 一个词汇可以有多个标签
- 删除词汇时，相关翻译和标签会自动清理 (CASCADE)

## 数据样例

### words 表样例
```
id | original_text | source_language | created_at
48 | daunt         | en             | 2025-09-03 08:46:51
49 | それ          | ja             | 2025-09-03 08:49:01
50 | quick         | en             | 2025-09-03 08:50:06
```

### translations 表样例
```
id | word_id | target_language | translation      | pronunciation
21 | 48      | zh             | 使气馁，威吓，使胆怯 | /dɔːnt/
22 | 49      | zh             | 那个              | そ-れ (so-re)
```

### tags 表样例
```
id  | word_id | tag_name    | tag_type
105 | 48      | 2025-09-03  | auto_date
108 | 48      | english     | auto_language
```

## API 调用方法

### 渲染进程调用
```typescript
// 获取所有词汇
const words = await window.electronAPI.words.getAll();

// 按标签筛选
const taggedWords = await window.electronAPI.words.getByTag('2025-09-03');

// 添加新词汇 (自动翻译和标签)
const newWord = await window.electronAPI.words.add('hello', 'en', 'zh');

// 删除词汇
const success = await window.electronAPI.words.delete(wordId);

// 获取所有标签
const tags = await window.electronAPI.tags.getAll();
```

### 主进程直接调用
```typescript
// 实例化数据库
const database = new VocabDatabase();

// CRUD操作
const word = database.addWord('hello', 'en');
const translation = database.addTranslation(word.id, 'zh', {
    translation: '你好',
    definition: '问候用语',
    pronunciation: '/həˈloʊ/'
});
database.addTags(word.id, [
    {name: '2025-09-03', type: 'auto_date'},
    {name: 'english', type: 'auto_language'}
]);
```

## 常用查询

### 基础查询
```sql
-- 获取所有词汇及翻译
SELECT w.original_text, w.source_language, t.translation, w.created_at
FROM words w
LEFT JOIN translations t ON w.id = t.word_id
ORDER BY w.created_at DESC;

-- 按标签筛选
SELECT w.original_text, t.translation
FROM words w
JOIN tags tg ON w.id = tg.word_id
LEFT JOIN translations t ON w.id = t.word_id
WHERE tg.tag_name = '2025-09-03';

-- 标签统计
SELECT tag_name, tag_type, COUNT(*) as count
FROM tags
GROUP BY tag_name, tag_type
ORDER BY tag_type, count DESC;
```

### 高级查询
```sql
-- 语言学习进度统计
SELECT 
    source_language,
    COUNT(*) as total_words,
    COUNT(t.id) as translated_words
FROM words w
LEFT JOIN translations t ON w.id = t.word_id
GROUP BY source_language;

-- 每日学习统计
SELECT 
    DATE(created_at) as date,
    COUNT(*) as words_learned
FROM words
WHERE created_at >= date('now', '-30 days')
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## 数据导出

### 使用提供的脚本
```bash
# 导出指定标签的词汇
./export_vocab.sh "2025-09-03"

# 导出到指定文件
./export_vocab.sh "english" "~/Desktop/english_words.csv"
```

### 手动导出
```bash
# 导出为CSV
sqlite3 -header -csv "$HOME/Library/Application Support/Electron/vocab.db" "
SELECT w.original_text, w.source_language, t.translation, t.definition 
FROM words w
LEFT JOIN translations t ON w.id = t.word_id
ORDER BY w.created_at DESC;
" > vocab_export.csv
```

## 备份和维护

### 数据备份
```bash
# 备份数据库
cp "$HOME/Library/Application Support/Electron/vocab.db" ~/vocab_backup_$(date +%Y%m%d).db

# 恢复备份
cp ~/vocab_backup_20250903.db "$HOME/Library/Application Support/Electron/vocab.db"
```

### 数据库优化
```sql
-- 分析查询计划
EXPLAIN QUERY PLAN SELECT * FROM words WHERE source_language = 'en';

-- 重建索引
REINDEX;

-- 清理数据库
VACUUM;
```

## 数据完整性

### 约束设计
1. **唯一性**: 同一语言下的相同文本不能重复
2. **引用完整性**: translations和tags必须关联有效的word_id
3. **级联删除**: 删除单词时自动清理相关翻译和标签
4. **标签唯一性**: 同一单词不能有相同的标签

### 数据验证
```sql
-- 检查孤立的翻译记录
SELECT * FROM translations t 
WHERE NOT EXISTS (SELECT 1 FROM words w WHERE w.id = t.word_id);

-- 检查孤立的标签记录  
SELECT * FROM tags t
WHERE NOT EXISTS (SELECT 1 FROM words w WHERE w.id = t.word_id);

-- 检查重复词汇
SELECT original_text, source_language, COUNT(*) 
FROM words 
GROUP BY original_text, source_language 
HAVING COUNT(*) > 1;
```

## 性能特点

- **快速查询**: 所有常用查询路径都有索引支持
- **高效关联**: 外键和索引确保JOIN操作性能
- **自动清理**: CASCADE删除避免孤立数据
- **灵活标签**: 支持多层级时间标签和语言分类

## 开发注意事项

1. **examples字段**: 存储JSON格式，读取时需要解析
2. **标签系统**: 自动生成多层级日期标签 (年/月/日)
3. **字符编码**: 支持多语言字符 (中日韩字符)
4. **事务安全**: 复杂操作使用事务确保数据一致性

---

*最后更新: 2025-09-04*  
*数据库版本: SQLite 3.43.2*  
*应用版本: Vocab App v1.0*
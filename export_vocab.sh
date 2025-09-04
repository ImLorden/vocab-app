#!/bin/bash

# Vocab App 数据导出脚本
# 用法: ./export_vocab.sh [标签名] [输出文件名]

# 设置默认值
TAG_NAME="${1:-2025-09-03}"
OUTPUT_FILE="${2:-$HOME/Desktop/vocab_export_$(date +%Y%m%d_%H%M%S).csv}"

# 数据库路径 (开发模式)
DB_PATH="$HOME/Library/Application Support/Electron/vocab.db"

# 检查数据库是否存在
if [ ! -f "$DB_PATH" ]; then
    echo "❌ 数据库文件不存在: $DB_PATH"
    echo "   请确保应用正在运行 (npm run start)"
    exit 1
fi

echo "📊 正在导出标签为 '$TAG_NAME' 的词汇数据..."
echo "📁 输出文件: $OUTPUT_FILE"

# 执行导出
sqlite3 -header -csv "$DB_PATH" "
SELECT 
    w.original_text as '原文',
    t.part_of_speech as '词性',
    t.pronunciation as '发音',
    t.translation as '翻译'
FROM words w
JOIN tags tg ON w.id = tg.word_id
LEFT JOIN translations t ON w.id = t.word_id
WHERE tg.tag_name = '$TAG_NAME'
ORDER BY w.created_at DESC;
" > "$OUTPUT_FILE"

# 检查导出结果
if [ -f "$OUTPUT_FILE" ]; then
    WORD_COUNT=$(tail -n +2 "$OUTPUT_FILE" | wc -l | tr -d ' ')
    echo "✅ 导出成功! 共 $WORD_COUNT 个单词"
    echo "📂 文件位置: $OUTPUT_FILE"
    
    # 显示前几行预览
    echo ""
    echo "📋 预览前3行:"
    head -4 "$OUTPUT_FILE"
else
    echo "❌ 导出失败"
    exit 1
fi